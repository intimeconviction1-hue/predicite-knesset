import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { initDb, filterEntity, queryEntity } from './db/index.js';
import { creerInjecteurMeta, metaListe, pagePour } from './lib/meta-html.js';
import { robotsTxt, sitemapXml } from './lib/sitemap.js';
import { metaPour } from '../client/src/lib/titres.js';
import { startPollTracker } from './functions/pollTracker.js';
import { verifierEnvoi } from './lib/courriel.js';
import authRouter from './routes/auth.js';
import entitiesRouter from './routes/entities.js';
import functionsRouter from './routes/functions.js';
import actuRouter from './routes/actu.js';
import parisRouter from './routes/paris.js';
import audienceRouter from './routes/audience.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 8788;

// Le secret de session ne doit jamais avoir de valeur par défaut : le dépôt
// est public, donc un secret en dur dans le code permettrait à quiconque de
// forger un cookie de session — y compris celui d'un admin. On refuse de
// démarrer en production plutôt que de retomber silencieusement dessus.
const SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET && process.env.NODE_ENV === 'production') {
  console.error('[config] SESSION_SECRET manquant : refus de démarrer en production.');
  process.exit(1);
}

const app = express();

// Render (comme tout PaaS) place un proxy devant l'app : sans ceci, req.ip
// renvoie l'IP du proxy — ce qui fausserait le limiteur de tentatives du login
// admin — et le cookie "secure" serait refusé.
if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1);

app.use(express.json());

app.use(session({
  secret: SESSION_SECRET || 'secret-de-developpement-local-uniquement',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production' && process.env.COOKIE_SECURE === 'true',
    maxAge: 1000 * 60 * 60 * 24 * 30, // 30 jours
  },
}));

app.use('/api/auth', authRouter);
app.use('/api/entities', entitiesRouter);
app.use('/api/functions', functionsRouter);
app.use('/api/actu', actuRouter);
app.use('/api/paris', parisRouter);
app.use('/api/audience', audienceRouter);

app.get('/api/health', (req, res) => res.json({ ok: true, now: new Date().toISOString() }));

// ── Ce par quoi un moteur découvre le site ────────────────────────────────────
// Servis dynamiquement plutôt que déposés dans client/public : le sitemap doit
// énumérer les fiches de liste, qui vivent en base, et les deux fichiers doivent
// annoncer l'origine de la requête pour suivre un changement de domaine sans
// repasser dans le code. Déclarés AVANT le catch-all, sinon celui-ci leur
// répondrait du HTML. Voir lib/sitemap.js.
const origineDe = req => `${req.protocol}://${req.get('host')}`;

app.get('/robots.txt', (req, res) => {
  res.type('text/plain').set('Cache-Control', 'public, max-age=86400').send(robotsTxt(origineDe(req)));
});

app.get('/sitemap.xml', async (req, res) => {
  // Une base injoignable ne doit pas produire une 500 : un moteur qui reçoit une
  // erreur sur le sitemap espace ses visites suivantes, et on perdrait plus que
  // les treize fiches de liste absentes.
  let listes = [];
  try {
    listes = await queryEntity('Liste', { where: { is_active: true }, sort: 'slug' });
  } catch (e) {
    console.error('[sitemap] listes illisibles, sitemap réduit aux pages statiques :', e.message);
  }
  res.type('application/xml').set('Cache-Control', 'public, max-age=3600').send(sitemapXml(origineDe(req), listes));
});

// En production, servir le build Vite (client/dist) directement depuis Express.
// En dev, le frontend tourne séparément (vite) et proxy /api vers ce serveur —
// voir client/vite.config.js.
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientDist, { index: false }));

  // index.html n'est plus renvoyé tel quel : on y injecte le titre, la
  // description et les balises Open Graph de la page demandée. Un aperçu de lien
  // (WhatsApp, X, Slack…) n'exécute aucun JavaScript — sans cela, les vingt-et-une
  // pages partagent le même aperçu. Voir lib/meta-html.js.
  // `index: false` sur express.static est indispensable : sinon la statique sert
  // elle-même index.html sur « / » et l'injection ne s'appliquerait jamais à la
  // page d'accueil, c'est-à-dire à l'URL la plus partagée du site.
  let htmlPour;
  try {
    htmlPour = creerInjecteurMeta(clientDist);
  } catch (e) {
    // Un build absent ou un gabarit inattendu ne doit pas empêcher le serveur de
    // démarrer : on sert le fichier brut, avec l'aperçu générique d'avant.
    console.error('[meta] injection désactivée :', e.message);
  }

  app.get('*', async (req, res) => {
    if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Not found' });
    if (!htmlPour) return res.sendFile(path.join(clientDist, 'index.html'));
    const origine = `${req.protocol}://${req.get('host')}`;

    // Seule exception au « même document pour tout le monde » : une fiche de
    // liste. /Liste?slug=likoud doit annoncer « Likoud », pas « Fiche de liste »
    // — c'est le lien qu'on envoie le plus naturellement (« regarde le Likoud »).
    // Une seule lecture, sur un slug indexé, et seulement pour cette route.
    // En cas d'échec on sert l'aperçu générique : un partage moins précis vaut
    // mieux qu'une page en erreur.
    let surcharge = null;
    if (pagePour(req.path) === 'Liste' && req.query.slug) {
      try {
        const [liste] = await filterEntity('Liste', { slug: String(req.query.slug) });
        surcharge = metaListe(liste);
      } catch (e) {
        console.error('[meta] fiche de liste illisible :', e.message);
      }
    }

    // Le code de statut d'une URL qui n'existe pas. Le client affiche déjà
    // PageNotFound pour une route inconnue (voir App.jsx), mais le serveur, lui,
    // répondait 200 : pour un moteur, une adresse inventée était donc une page
    // valide de plus. C'est le « soft 404 », et il coûte double au moment où l'on
    // diffuse — les URL fautives qui circulent (une lettre en trop dans un
    // message, un lien tronqué par un client mail) entrent dans l'index comme des
    // pages vides et diluent le site. Le HTML reste le même : c'est bien la page
    // « introuvable » qu'on veut afficher, on cesse seulement de prétendre
    // qu'elle a été trouvée.
    if (!metaPour(pagePour(req.path)).connue) res.status(404);

    res.type('html').send(htmlPour(req.path, origine, surcharge));
  });
}

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`PrédiCité (Knesset) — serveur sur http://localhost:${PORT}`);
      // Traque les sondages en continu (LLM + web_search), throttlé.
      startPollTracker();
      // Le SMTP est vérifié au démarrage : depuis que la connexion des joueurs
      // passe par un lien envoyé par e-mail, un mot de passe d'application
      // expiré ou un port bloqué empêche toute inscription — et cela ne se voit
      // nulle part sur le site. Autant l'apprendre dans les journaux de
      // déploiement plutôt que par quelqu'un qui n'arrive pas à entrer.
      verifierEnvoi();
    });
  })
  .catch(e => {
    console.error('[db] Échec de connexion/initialisation Postgres :', e.message);
    process.exit(1);
  });
