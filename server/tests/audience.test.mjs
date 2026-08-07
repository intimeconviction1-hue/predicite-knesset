/**
 * Le compteur d'audience (routes/audience.js).
 *
 * Pourquoi ce test existe. Ce point d'entrée est ouvert à tout le monde, sans
 * session, et il ÉCRIT en base à chaque page vue. C'est la seule route du site
 * dans ce cas. Deux propriétés le rendent tenable, et ce sont exactement les
 * deux que ce fichier vérifie :
 *
 *   • `page` et `via` sont validés contre des listes fermées. Sans cela,
 *     n'importe qui peut faire grossir sans limite une table dont la clé
 *     primaire contient ces deux champs — la base est un tier gratuit, et ce
 *     serait le moyen le plus simple de la remplir.
 *   • rien de ce qui identifie un visiteur ne doit atteindre la requête SQL.
 *     La page /Mentions affirme qu'aucune adresse IP n'est conservée ; si ce
 *     n'était plus vrai, le site mentirait dans le document qui engage
 *     justement à ne pas mentir.
 *
 * La base est simulée : le test lit les paramètres SQL qu'on lui passe, ce qui
 * est plus sûr qu'une vraie base — celle du .env est celle de PRODUCTION.
 *
 * Lancer :  node --test server/tests/
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { mock } from 'node:test';
import express from 'express';
import { optionsMock } from './helpers/option-mock.mjs';

process.env.DATABASE_URL = 'postgres://test:test@127.0.0.1:1/fake';
delete process.env.NODE_ENV;

/** Les écritures interceptées : [{ sql, params }] */
const ecritures = [];

// `queryOne` sert au middleware d'authentification, que la route de lecture
// traverse : un mock de module remplace TOUS les exports, donc en oublier un
// fait mourir le fichier à l'import — sans qu'aucun test n'apparaisse en échec.
mock.module('../db/index.js', optionsMock({
  run: async (sql, params) => { ecritures.push({ sql, params }); },
  queryAll: async () => [],
  queryOne: async () => null,
  pool: { query: async () => ({ rows: [], rowCount: 0 }) },
}));

const { default: audienceRouter } = await import('../routes/audience.js');

function serveur() {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => { req.session = {}; next(); }); // visiteur anonyme
  app.use('/api/audience', audienceRouter);
  const server = app.listen(0);
  return { server, base: `http://127.0.0.1:${server.address().port}/api/audience` };
}

/** Compte une vue et rend la ligne écrite, ou null si rien n'a été écrit. */
async function compter(base, corps) {
  ecritures.length = 0;
  const res = await fetch(base, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(corps),
  });
  // L'écriture a lieu APRÈS la réponse (le visiteur n'attend pas la mesure) :
  // on laisse la boucle d'événements la produire.
  await new Promise(r => setTimeout(r, 20));
  return { statut: res.status, ligne: ecritures[0] || null };
}

test('le compteur d\'audience', async (t) => {
  const { server, base } = serveur();
  t.after(() => server.close());

  await t.test('compte une vue sur une page connue', async () => {
    const { statut, ligne } = await compter(base, { page: 'Boussole', via: 'boussole' });
    assert.equal(statut, 204);
    assert.ok(ligne, 'aucune écriture');
    const [jour, page, via] = ligne.params;
    assert.match(jour, /^\d{4}-\d{2}-\d{2}$/);
    assert.equal(page, 'Boussole');
    assert.equal(via, 'boussole');
  });

  await t.test('une page inventée n\'écrit rien', async () => {
    // Le mode de panne visé : une table qui grossit d'une ligne par chaîne
    // arbitraire envoyée depuis n'importe quel navigateur.
    for (const page of ['NimporteQuoi', '', null, 'DROP TABLE', '../../etc/passwd', 'x'.repeat(500)]) {
      const { statut, ligne } = await compter(base, { page, via: '' });
      assert.equal(statut, 204, 'la réponse reste 204 : une mesure refusée n\'est pas une erreur pour le visiteur');
      assert.equal(ligne, null, `« ${String(page).slice(0, 20)} » n'aurait pas dû être écrite`);
    }
  });

  await t.test('une provenance inconnue est comptée comme visite directe', async () => {
    // On ne perd pas la vue — on refuse seulement de croire son étiquette.
    const { ligne } = await compter(base, { page: 'Home', via: 'campagne-inventee' });
    assert.ok(ligne);
    assert.equal(ligne.params[1], 'Home');
    assert.equal(ligne.params[2], '', 'la provenance non reconnue doit retomber sur la chaîne vide');
  });

  await t.test('les provenances des cartes de partage sont toutes acceptées', async () => {
    // Si une carte change son `via` sans que cette liste suive, son trafic
    // devient invisible — et l'invisibilité ressemble à « personne n'a cliqué ».
    for (const via of ['projection', 'boussole', 'coalition', 'sens-du-vent', 'vrai-ou-fake', 'ligue']) {
      const { ligne } = await compter(base, { page: 'Home', via });
      assert.equal(ligne?.params[2], via, `provenance « ${via} » rejetée`);
    }
  });

  await t.test('rien de ce qui identifie un visiteur n\'atteint la base', async () => {
    const { ligne } = await compter(base, {
      page: 'Home', via: 'ligue',
      // Des champs qu'un client mal intentionné — ou une future version trop
      // zélée du hook client — pourrait ajouter au corps de la requête.
      ip: '203.0.113.7', user_email: 'quelqu-un@exemple.fr', session: 'abc', user_agent: 'Firefox',
    });
    assert.equal(ligne.params.length, 3, 'la requête ne doit porter que jour, page, provenance');
    const serialise = JSON.stringify(ligne);
    for (const fuite of ['203.0.113.7', 'quelqu-un@exemple.fr', 'abc', 'Firefox']) {
      assert.doesNotMatch(serialise, new RegExp(fuite), `« ${fuite} » ne doit pas atteindre la base`);
    }
  });

  await t.test('la lecture est fermée aux visiteurs', async () => {
    // Le détail de fréquentation d'un site politique n'a pas à être public.
    const res = await fetch(base);
    assert.equal(res.status, 401);
  });
});
