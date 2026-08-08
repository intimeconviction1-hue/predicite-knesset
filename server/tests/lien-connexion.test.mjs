/**
 * Les liens de connexion (lib/lien-connexion.js).
 *
 * Pourquoi ce test existe : ce module décide qui entre. Ses défaillances sont
 * silencieuses par nature — un jeton qui vaudrait deux fois, une expiration qui
 * ne s'applique pas, une redirection qui sort du site : rien de tout cela ne
 * produit d'erreur, ni dans les journaux, ni à l'écran. On ne l'apprendrait que
 * par quelqu'un qui en profite.
 *
 * La base est simulée : le test lit le SQL et ses paramètres. C'est plus sûr
 * qu'une vraie base — celle du .env est celle de PRODUCTION.
 *
 * Lancer :  node --test server/tests/
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { mock } from 'node:test';
import { createHash } from 'node:crypto';
import { optionsMock } from './helpers/option-mock.mjs';

process.env.DATABASE_URL = 'postgres://test:test@127.0.0.1:1/fake';
delete process.env.NODE_ENV;

/** Requêtes interceptées, et ce que la base doit répondre. */
const vues = [];
let reponseUpdate = [];
let compteDemandes = 0;

mock.module('../db/index.js', optionsMock({
  run: async (sql, params) => { vues.push({ sql, params }); },
  queryAll: async (sql, params) => {
    vues.push({ sql, params });
    if (/UPDATE liens_connexion/.test(sql)) return reponseUpdate;
    return [];
  },
  queryOne: async (sql, params) => {
    vues.push({ sql, params });
    if (/COUNT\(\*\) AS n FROM liens_connexion/.test(sql)) return { n: compteDemandes };
    return null;
  },
  pool: { query: async () => ({ rows: [], rowCount: 0 }) },
}));

const {
  empreinte, normaliserEmail, retourSur, tropDeDemandes, creerLien,
  consommerLien, messageDeConnexion, VALIDITE_MS, MAX_DEMANDES,
} = await import('../lib/lien-connexion.js');

test('le jeton n\'est jamais stocke en clair', async () => {
  // Le point le plus important du fichier. Un jeton en clair en base est une
  // session ouverte pour quiconque lit la table : sauvegarde, journal de
  // requetes, capture d'ecran d'un client SQL.
  vues.length = 0;
  const token = await creerLien({ email: 'a@b.fr', full_name: 'A', return_to: '/Boussole' });
  const insert = vues.find(v => /INSERT INTO liens_connexion/.test(v.sql));
  assert.ok(insert, 'aucun INSERT');
  const serialise = JSON.stringify(insert.params);
  assert.ok(!serialise.includes(token), 'le jeton en clair a atteint la base');
  assert.ok(serialise.includes(createHash('sha256').update(token).digest('hex')));
});

test('le jeton est assez long pour ne pas se deviner', async () => {
  const t1 = await creerLien({ email: 'a@b.fr' });
  const t2 = await creerLien({ email: 'a@b.fr' });
  assert.notEqual(t1, t2);
  // 32 octets en base64url = 43 caracteres.
  assert.ok(t1.length >= 43, `jeton trop court : ${t1.length}`);
  assert.match(t1, /^[A-Za-z0-9_-]+$/, 'doit passer dans une URL sans encodage');
});

test('l\'expiration est ecrite a la creation, pas verifiee apres coup', async () => {
  vues.length = 0;
  const avant = Date.now();
  await creerLien({ email: 'a@b.fr' });
  const insert = vues.find(v => /INSERT INTO liens_connexion/.test(v.sql));
  const expire = new Date(insert.params[4]).getTime();
  assert.ok(expire >= avant + VALIDITE_MS - 2000 && expire <= Date.now() + VALIDITE_MS + 2000,
    `expiration hors de la fenetre attendue : ${insert.params[4]}`);
});

test('consommer un jeton est UNE seule ecriture', async () => {
  // Lire puis ecrire laisserait une fenetre pendant laquelle le jeton vaut deux
  // fois : deux clics simultanes, ou un client mail qui precharge les URL d'un
  // message avant que la personne ne clique.
  vues.length = 0;
  reponseUpdate = [{ email: 'a@b.fr', full_name: null, return_to: '/' }];
  const lien = await consommerLien('un-jeton-suffisamment-long-pour-passer');
  assert.ok(lien);
  const req = vues.filter(v => /liens_connexion/.test(v.sql));
  assert.equal(req.length, 1, 'la verification doit etre la consommation');
  assert.match(req[0].sql, /UPDATE liens_connexion/);
  assert.match(req[0].sql, /utilise_le IS NULL/, 'sans quoi un jeton ressert');
  assert.match(req[0].sql, /expire_le >/, 'sans quoi un jeton perime marche encore');
});

test('un jeton deja utilise ou perime ne rend rien', async () => {
  // La garde vit dans le WHERE : si aucune ligne n'est mise a jour, c'est que le
  // jeton etait consomme, expire, ou inconnu.
  reponseUpdate = [];
  assert.equal(await consommerLien('un-jeton-suffisamment-long-pour-passer'), null);
});

test('un jeton absent ou grotesque est refuse sans toucher la base', async () => {
  vues.length = 0;
  for (const mauvais of [undefined, null, '', 'court', 42, {}, []]) {
    assert.equal(await consommerLien(mauvais), null, `accepte : ${JSON.stringify(mauvais)}`);
  }
  assert.equal(vues.length, 0, 'une valeur manifestement invalide ne doit pas produire de requete');
});

test('la destination de retour ne peut pas sortir du site', async (t) => {
  // Une redirection ouverte sur une page de connexion est un cadeau au
  // hameconnage : le lien part de notre domaine, donc il inspire confiance, et
  // atterrit ailleurs.
  await t.test('les URL absolues sont refusees', () => {
    assert.equal(retourSur('https://ailleurs.example/piege'), '/');
    assert.equal(retourSur('http://ailleurs.example'), '/');
    assert.equal(retourSur('javascript:alert(1)'), '/');
  });

  await t.test('les chemins protocol-relative aussi', () => {
    // « //ailleurs.example » commence bien par une barre, et le navigateur le
    // traite pourtant comme un autre site : le piege classique.
    assert.equal(retourSur('//ailleurs.example'), '/');
    assert.equal(retourSur('//ailleurs.example/x'), '/');
  });

  await t.test('les antislashs aussi', () => {
    // Certains navigateurs normalisent \ en / : «/\ailleurs.example » sortirait.
    assert.equal(retourSur('/\\ailleurs.example'), '/');
    assert.equal(retourSur('\\\\ailleurs.example'), '/');
  });

  await t.test('les sauts de ligne aussi', () => {
    assert.equal(retourSur('/ok\r\nLocation: https://ailleurs.example'), '/');
  });

  await t.test('un chemin interne passe, avec sa query', () => {
    assert.equal(retourSur('/Boussole'), '/Boussole');
    assert.equal(retourSur('/Liste?slug=likoud'), '/Liste?slug=likoud');
    assert.equal(retourSur(undefined), '/');
  });
});

test('la limite de demandes protege la boite d\'en face', async () => {
  // Sans limite, le formulaire devient un moyen d'inonder l'adresse de quelqu'un
  // d'autre -- on ne lui demande pas son avis, puisque c'est le principe meme de
  // l'inscription -- et quelques centaines d'envois suffisent a faire plafonner
  // la journee d'un compte SMTP ordinaire.
  compteDemandes = MAX_DEMANDES - 1;
  assert.equal(await tropDeDemandes('a@b.fr'), false);
  compteDemandes = MAX_DEMANDES;
  assert.equal(await tropDeDemandes('a@b.fr'), true);
});

test('les adresses invalides sont ecartees, les valides normalisees', () => {
  assert.equal(normaliserEmail('  DAVID@Exemple.FR '), 'david@exemple.fr');
  assert.equal(normaliserEmail('a+etiquette@exemple.co.uk'), 'a+etiquette@exemple.co.uk');
  for (const mauvais of ['', 'sansarobase', 'a@b', 'a@@b.fr', 'a b@c.fr', null, 'a@b.', 'x'.repeat(300) + '@b.fr']) {
    assert.equal(normaliserEmail(mauvais), null, `accepte a tort : ${mauvais}`);
  }
});

test('le message porte le lien en clair et en HTML', () => {
  // Un message qui n'a qu'une version HTML est un signal de spam classique, et
  // un lien seulement cliquable est perdu des qu'un client mail desactive le
  // HTML. Or ici, un message qui n'arrive pas est une inscription perdue.
  const url = 'https://predicite-knesset.onrender.com/api/auth/lien?token=abc';
  const { objet, texte, html } = messageDeConnexion(url);
  assert.ok(objet.length > 0 && objet.length < 80);
  assert.doesNotMatch(objet, /[A-Z]{4,}|!{2,}/, 'un objet en capitales ou ponctue fort part en indesirables');
  assert.ok(texte.includes(url), 'le lien doit etre lisible sans HTML');
  assert.ok(html.includes(url));
  assert.match(texte, /20 minutes/);
  assert.match(texte, /une fois/);
});

test('l\'empreinte est stable et ne rend pas le jeton', () => {
  assert.equal(empreinte('abc'), empreinte('abc'));
  assert.notEqual(empreinte('abc'), empreinte('abd'));
  assert.match(empreinte('abc'), /^[a-f0-9]{64}$/);
});
