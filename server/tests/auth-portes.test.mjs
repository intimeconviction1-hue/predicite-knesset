/**
 * Les deux portes d'entree du site (routes/auth.js).
 *
 * Pourquoi ce test existe. Durcir la connexion des joueurs par un lien envoye
 * par e-mail ne protege RIEN tant qu'une autre route ouvre une session sur
 * simple saisie d'adresse : un usurpateur prend la porte restee ouverte, et le
 * travail sur les jetons ne sert qu'a se rassurer. C'est exactement l'etat du
 * site avant le 2026-08-07, et c'est le genre de regression qu'on reintroduit
 * sans y penser en « reparant » un formulaire de connexion.
 *
 * Deux proprietes, donc, et elles sont solidaires :
 *   • POST /login n'ouvre plus de session joueur ;
 *   • le lien magique ne fabrique jamais d'admin, et un compte admin ne se
 *     rejoint pas par ce chemin -- sinon le role admin ne vaudrait plus que
 *     l'acces a une boite mail, alors qu'il est garde par un secret serveur.
 *
 * Aucune base n'est touchee ; l'envoi d'e-mails est simule.
 *
 * Lancer :  node --test server/tests/
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { mock } from 'node:test';
import express from 'express';
import { optionsMock } from './helpers/option-mock.mjs';

process.env.DATABASE_URL = 'postgres://test:test@127.0.0.1:1/fake';
process.env.ADMIN_KEY = 'cle-de-test-suffisamment-longue';
delete process.env.NODE_ENV;

/** Ce que la base est censee contenir, par adresse. */
const COMPTES = {
  'joueuse@exemple.fr': { id: 'u1', email: 'joueuse@exemple.fr', role: 'user', full_name: 'Joueuse' },
  'chef@exemple.fr': { id: 'u2', email: 'chef@exemple.fr', role: 'admin', full_name: 'Chef' },
};

const courriels = [];
const ecritures = [];

mock.module('../db/index.js', optionsMock({
  run: async (sql, params) => { ecritures.push({ sql, params }); },
  queryAll: async () => [],
  queryOne: async (sql, params) => {
    if (/COUNT\(\*\) as n FROM users/i.test(sql)) return { n: '2' };
    if (/COUNT\(\*\) AS n FROM liens_connexion/i.test(sql)) return { n: 0 };
    if (/FROM users WHERE email/i.test(sql)) return COMPTES[params[0]] || null;
    return null;
  },
  pool: { query: async () => ({ rows: [], rowCount: 0 }) },
}));

mock.module('../lib/courriel.js', optionsMock({
  envoiConfigure: () => true,
  envoyerCourriel: async (m) => { courriels.push(m); return { simule: true }; },
  verifierEnvoi: async () => true,
}));

const { default: authRouter } = await import('../routes/auth.js');

const app = express();
app.use(express.json());
app.use((req, _res, next) => { req.session = {}; next(); });
app.use('/api/auth', authRouter);
const server = app.listen(0);
const BASE = `http://127.0.0.1:${server.address().port}/api/auth`;

const poster = (chemin, corps) => fetch(BASE + chemin, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corps),
});

test('les deux portes d\'entree', async (t) => {
  t.after(() => server.close());

  await t.test('POST /login n\'ouvre plus de session joueur', async () => {
    // LE test du fichier. Sans lui, tout le reste est decoratif.
    const res = await poster('/login', { email: 'joueuse@exemple.fr' });
    assert.equal(res.status, 403);
    assert.equal((await res.json()).code, 'lien_requis');
  });

  await t.test('meme avec une adresse inconnue, aucun compte n\'est cree', async () => {
    ecritures.length = 0;
    const res = await poster('/login', { email: 'inconnue@exemple.fr', full_name: 'X' });
    assert.equal(res.status, 403);
    assert.equal(ecritures.length, 0, 'un refus ne doit rien ecrire');
  });

  await t.test('POST /login reste ouverte a l\'admin avec sa cle', async () => {
    // La voie admin doit survivre : la faire dependre d'un envoi SMTP
    // reviendrait a s'enfermer dehors le soir du scrutin si l'envoi tombe.
    const res = await poster('/login', { email: 'chef@exemple.fr', admin_key: 'cle-de-test-suffisamment-longue' });
    assert.equal(res.status, 200);
    assert.equal((await res.json()).role, 'admin');
  });

  await t.test('POST /login refuse l\'admin sans la bonne cle', async () => {
    const res = await poster('/login', { email: 'chef@exemple.fr', admin_key: 'mauvaise' });
    assert.equal(res.status, 403);
    assert.match((await res.json()).error, /[Cc]l/);
  });

  await t.test('un compte admin ne se rejoint pas par lien magique', async () => {
    // Sinon obtenir le role admin ne demanderait plus que l'acces a une boite
    // mail -- precisement ce que le secret serveur evite.
    courriels.length = 0;
    const res = await poster('/demander-lien', { email: 'chef@exemple.fr' });
    assert.equal(res.status, 403);
    assert.equal((await res.json()).code, 'compte_admin');
    assert.equal(courriels.length, 0, 'aucun lien ne doit partir vers un compte admin');
  });

  await t.test('une joueuse recoit un lien, et le jeton n\'est pas dans la reponse', async () => {
    courriels.length = 0;
    const res = await poster('/demander-lien', { email: 'joueuse@exemple.fr', return_to: '/Boussole' });
    assert.equal(res.status, 200);
    const corps = await res.text();
    assert.equal(courriels.length, 1);
    assert.equal(courriels[0].a, 'joueuse@exemple.fr');
    // Le jeton ne vit que dans l'e-mail : le renvoyer ici annulerait la preuve
    // qu'on lit bien la boite dont on se reclame.
    const jeton = courriels[0].texte.match(/token=([A-Za-z0-9_-]+)/)[1];
    assert.ok(jeton.length >= 43);
    assert.ok(!corps.includes(jeton), 'le jeton a fuite dans la reponse HTTP');
  });

  await t.test('une adresse inconnue recoit un lien aussi -- s\'inscrire et se connecter sont le meme geste', async () => {
    courriels.length = 0;
    const res = await poster('/demander-lien', { email: 'nouvelle@exemple.fr' });
    assert.equal(res.status, 200);
    assert.equal(courriels.length, 1);
  });

  await t.test('une adresse invalide est refusee avant tout envoi', async () => {
    courriels.length = 0;
    for (const mauvaise of ['', 'sansarobase', 'a@b']) {
      assert.equal((await poster('/demander-lien', { email: mauvaise })).status, 400);
    }
    assert.equal(courriels.length, 0);
  });

  await t.test('un lien invalide renvoie vers la connexion, sans detail', async () => {
    // « expire », « deja utilise » et « inconnu » donnent le meme message :
    // les distinguer renseignerait un tiers sur la validite d'un jeton trouve
    // ailleurs, et ne changerait rien pour la personne concernee.
    const res = await fetch(`${BASE}/lien?token=jeton-invente-mais-assez-long-pour-passer`, { redirect: 'manual' });
    assert.equal(res.status, 302);
    assert.equal(res.headers.get('location'), '/login?lien=invalide');
  });

  await t.test('/lien sans jeton du tout ne plante pas', async () => {
    const res = await fetch(`${BASE}/lien`, { redirect: 'manual' });
    assert.equal(res.status, 302);
    assert.equal(res.headers.get('location'), '/login?lien=invalide');
  });
});
