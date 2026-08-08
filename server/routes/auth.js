import express from 'express';
import { randomUUID, timingSafeEqual, createHash } from 'node:crypto';
import { queryOne, run } from '../db/index.js';
import { envoyerCourriel, envoiConfigure } from '../lib/courriel.js';
import {
  normaliserEmail, retourSur, tropDeDemandes, creerLien, consommerLien,
  purgerLiensPerimes, ouvrirCompte, messageDeConnexion, VALIDITE_MS,
} from '../lib/lien-connexion.js';

/**
 * Deux façons d'entrer, et une seule pour chaque rôle.
 *
 * ── Les joueurs : un lien envoyé par e-mail ──
 * Jusqu'au 2026-08-07, une session s'ouvrait sur la simple saisie d'une adresse :
 * taper celle de quelqu'un d'autre suffisait à jouer sous son nom. On s'en
 * accommodait tant que le site n'était pas diffusé et que l'enjeu d'usurper un
 * joueur paraissait faible. Il ne l'est plus dès lors qu'on ouvre les portes : le
 * classement est public, le scrutin est polarisé, et une capture d'écran montrant
 * un nom connu associé à un pronostic n'a pas besoin d'être vraie pour circuler.
 * Le lien rétablit ce qui manquait — la preuve qu'on lit la boîte dont on se
 * réclame — sans réintroduire de mot de passe à retenir.
 *
 * ── Les admins : ADMIN_KEY, et surtout pas le lien ──
 * Le rôle admin déclenche le scoring, résout le Premier ministre et ouvre les
 * marchés. Il reste derrière un secret qui ne vit que côté serveur, et NON
 * derrière l'e-mail : faire dépendre l'accès admin d'un envoi SMTP reviendrait à
 * confier la clé du site à un compte de messagerie ordinaire, et à s'enfermer
 * dehors le soir du scrutin si l'envoi tombe. C'est aussi pourquoi POST /login
 * survit — il ne sert plus qu'à ça.
 */

const router = express.Router();
const IS_PROD = process.env.NODE_ENV === 'production';

function getAdminEmails() {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);
}

function safeEqual(a, b) {
  const A = Buffer.from(String(a), 'utf8');
  const B = Buffer.from(String(b), 'utf8');
  if (A.length !== B.length) return false;
  return timingSafeEqual(A, B);
}

/**
 * Sans ADMIN_KEY configurée, on refuse la promotion admin en production plutôt
 * que de laisser passer : mieux vaut un admin temporairement inaccessible
 * qu'un admin ouvert à tous.
 */
function adminKeyOk(provided) {
  const expected = process.env.ADMIN_KEY;
  if (!expected) return !IS_PROD;
  return typeof provided === 'string' && provided.length > 0 && safeEqual(provided, expected);
}

// Limiteur mémoire simple : la clé admin est la dernière ligne de défense,
// on ne la laisse pas deviner par répétition. Réinitialisé à chaque redéploiement,
// ce qui est acceptable ici.
const FAILURE_WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;
const failures = new Map();

function tooManyFailures(ip) {
  const entry = failures.get(ip);
  if (!entry) return false;
  if (Date.now() - entry.first > FAILURE_WINDOW_MS) { failures.delete(ip); return false; }
  return entry.count >= MAX_FAILURES;
}

function recordFailure(ip) {
  const entry = failures.get(ip);
  if (!entry || Date.now() - entry.first > FAILURE_WINDOW_MS) {
    failures.set(ip, { count: 1, first: Date.now() });
  } else {
    entry.count++;
  }
}

router.post('/login', async (req, res, next) => {
  try {
    const email = (req.body?.email || '').trim().toLowerCase();
    const full_name = (req.body?.full_name || '').trim();
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Email invalide.' });
    }

    let user = await queryOne('SELECT * FROM users WHERE email = ?', [email]);

    // Toute connexion qui aboutirait à un rôle admin — compte admin existant ou
    // promotion à la création — doit présenter ADMIN_KEY.
    const isListedAdmin = getAdminEmails().includes(email);
    let isFirstUser = false;
    if (!user) {
      // COUNT(*) revient en BIGINT côté Postgres, donc en string via pg — Number() nécessaire.
      const { n } = await queryOne('SELECT COUNT(*) as n FROM users');
      // L'auto-promotion du premier compte est un confort de dev : en production
      // elle offrirait le rôle admin au premier visiteur si la table était vide.
      isFirstUser = Number(n) === 0 && !IS_PROD;
    }

    const wouldBeAdmin = user ? user.role === 'admin' : (isFirstUser || isListedAdmin);

    // Cette route n'ouvre plus de session joueur. C'est LE changement qui donne
    // sa valeur au lien magique : le durcir en laissant à côté une porte qui
    // ouvre une session sur simple saisie d'adresse n'aurait rien protégé du
    // tout — un usurpateur aurait pris la porte restée ouverte.
    if (!wouldBeAdmin) {
      return res.status(403).json({
        error: 'La connexion se fait par un lien envoyé à ton adresse e-mail.',
        code: 'lien_requis',
      });
    }

    const ip = req.ip || req.socket?.remoteAddress || 'inconnu';
    if (tooManyFailures(ip)) {
      return res.status(429).json({ error: 'Trop de tentatives. Réessayez dans quelques minutes.' });
    }
    if (!adminKeyOk(req.body?.admin_key)) {
      recordFailure(ip);
      return res.status(403).json({ error: 'Clé admin requise ou invalide.' });
    }

    if (!user) {
      // On n'arrive ici qu'avec ADMIN_KEY validée et un rôle admin attendu :
      // le rôle est donc constant, il n'y a plus de branche à évaluer.
      const id = randomUUID();
      await run(
        'INSERT INTO users (id, email, full_name, role) VALUES (?, ?, ?, ?)',
        [id, email, full_name || email.split('@')[0], 'admin']
      );
      user = await queryOne('SELECT * FROM users WHERE id = ?', [id]);

      // Initialise la progression utilisateur (équivalent ensureUserProgress).
      // display_name est le SEUL nom exposé publiquement dans le classement :
      // on part du nom réellement saisi, jamais de user.full_name, qui vaut la
      // partie avant l'arobase quand le champ est laissé vide.
      const display_name = full_name || `Joueur ${createHash('md5').update(email).digest('hex').slice(0, 4)}`;
      await run(
        'INSERT INTO user_progress (id, user_email, display_name) VALUES (?, ?, ?) ON CONFLICT (user_email) DO NOTHING',
        [randomUUID(), email, display_name]
      );
    }

    req.session.user_email = user.email;
    res.json({ id: user.id, email: user.email, full_name: user.full_name, role: user.role });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/auth/demander-lien — envoie un lien de connexion.
 *
 * Créer un compte et se reconnecter sont ici le MÊME geste : on saisit son
 * adresse, on reçoit un lien. Il n'y a donc rien à dissimuler sur l'existence
 * d'un compte — la réponse serait identique dans les deux cas de toute façon.
 * C'est ce qui permet de dire franchement qu'un envoi a échoué au lieu de
 * laisser quelqu'un guetter un message qui ne viendra jamais.
 */
router.post('/demander-lien', async (req, res, next) => {
  try {
    const email = normaliserEmail(req.body?.email);
    if (!email) return res.status(400).json({ error: 'Adresse e-mail invalide.' });

    // Un compte admin ne se rejoint pas par ce chemin : son rôle vaut le
    // scoring et l'ouverture des marchés, et il reste derrière ADMIN_KEY.
    // Sans cette garde, obtenir l'accès admin ne demanderait plus que l'accès à
    // une boîte mail — c'est-à-dire précisément ce que le secret serveur évite.
    const existant = await queryOne('SELECT role FROM users WHERE email = ?', [email]);
    if (existant?.role === 'admin') {
      return res.status(403).json({
        error: 'Ce compte est administrateur : il se connecte avec sa clé, pas par lien.',
        code: 'compte_admin',
      });
    }

    if (await tropDeDemandes(email)) {
      return res.status(429).json({
        error: 'Plusieurs liens viennent d\'être envoyés à cette adresse. Regarde ta boîte, y compris les indésirables, puis réessaie dans un quart d\'heure.',
      });
    }

    if (!envoiConfigure() && IS_PROD) {
      // Explicite plutôt que silencieux : sans cela, le site répondrait « regarde
      // ta boîte » à quelqu'un à qui rien n'a été envoyé, et l'incident ne se
      // verrait qu'en lisant les journaux.
      console.error('[auth] demande de lien alors que SMTP n\'est pas configuré.');
      return res.status(503).json({
        error: "L'envoi d'e-mails n'est pas disponible pour l'instant. Réessaie un peu plus tard.",
      });
    }

    const token = await creerLien({
      email,
      full_name: req.body?.full_name,
      return_to: req.body?.return_to,
    });

    const url = `${req.protocol}://${req.get('host')}/api/auth/lien?token=${encodeURIComponent(token)}`;
    const { objet, texte, html } = messageDeConnexion(url);

    try {
      await envoyerCourriel({ a: email, objet, texte, html });
    } catch (e) {
      console.error('[auth] envoi du lien impossible :', e.message);
      return res.status(502).json({
        error: "Le lien n'a pas pu être envoyé. Réessaie dans un instant.",
      });
    }

    // Après coup : la personne attend sa réponse, pas notre ménage.
    purgerLiensPerimes().catch(e => console.error('[auth] purge des liens :', e.message));

    res.json({ ok: true, minutes: Math.round(VALIDITE_MS / 60000) });
  } catch (e) {
    next(e);
  }
});

/**
 * GET /api/auth/lien?token=… — le retour depuis l'e-mail.
 *
 * Répond par une REDIRECTION, pas par du JSON : ce qui arrive ici est un clic
 * dans un client de messagerie, pas un appel de l'application. On ouvre la
 * session puis on renvoie la personne dans le site, à l'endroit qu'elle avait
 * demandé — endroit fixé au moment de la demande, jamais lu dans cette URL-ci.
 */
router.get('/lien', async (req, res, next) => {
  try {
    const lien = await consommerLien(req.query?.token);
    if (!lien) {
      // Un seul message pour « expiré », « déjà utilisé » et « inconnu ». Les
      // distinguer renseignerait un tiers sur la validité d'un jeton trouvé
      // ailleurs, et ne changerait rien pour la personne concernée : dans les
      // trois cas, il faut en redemander un.
      return res.redirect(302, '/login?lien=invalide');
    }

    const user = await ouvrirCompte({ email: lien.email, full_name: lien.full_name });

    // Régénérer la session avant d'y écrire l'identité : sans cela, un
    // identifiant de session choisi par un tiers et déposé dans le navigateur
    // avant la connexion resterait valable après elle (fixation de session).
    req.session.regenerate(err => {
      if (err) return next(err);
      req.session.user_email = user.email;
      req.session.save(err2 => {
        if (err2) return next(err2);
        res.redirect(302, retourSur(lien.return_to));
      });
    });
  } catch (e) {
    next(e);
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

router.get('/me', async (req, res, next) => {
  try {
    const email = req.session?.user_email;
    if (!email) return res.status(401).json({ error: 'Non connecté' });
    const user = await queryOne('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) return res.status(401).json({ error: 'Non connecté' });
    res.json({ id: user.id, email: user.email, full_name: user.full_name, role: user.role });
  } catch (e) {
    next(e);
  }
});

export default router;
