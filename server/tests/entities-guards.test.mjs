/**
 * Contrôle d'accès de /api/entities — premier test du dépôt.
 *
 * Il ne touche AUCUNE base : les gardes d'authentification répondent avant que
 * la moindre requête SQL soit émise, et DATABASE_URL est forcée sur une valeur
 * factice avant l'import du module db (aucun .env n'est chargé dans cette
 * chaîne d'imports, donc la base de production reste hors d'atteinte).
 *
 * Lancer :  node --test server/tests/
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';

process.env.DATABASE_URL = 'postgres://test:test@127.0.0.1:1/fake';
delete process.env.NODE_ENV;

const { default: entitiesRouter } = await import('../routes/entities.js');

function startAnonymousServer() {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => { req.session = {}; next(); }); // visiteur non connecté
  app.use('/api/entities', entitiesRouter);
  const server = app.listen(0);
  const port = server.address().port;
  return { server, base: `http://127.0.0.1:${port}/api/entities` };
}

async function status(base, method, path, body) {
  const res = await fetch(base + path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.status;
}

test('un visiteur anonyme ne peut pas écrire ni lire les données personnelles', async (t) => {
  const { server, base } = startAnonymousServer();
  t.after(() => server.close());

  await t.test('ne peut pas se hisser en tête du classement', async () => {
    assert.equal(await status(base, 'PUT', '/UserProgress/un-id', { total_points: 999999 }), 401);
  });

  await t.test('ne peut pas injecter un faux sondage', async () => {
    assert.equal(await status(base, 'POST', '/SondageSieges', { seats_by_liste: [] }), 401);
  });

  await t.test('ne peut pas supprimer une liste', async () => {
    assert.equal(await status(base, 'DELETE', '/Liste/un-id'), 401);
  });

  await t.test('ne peut pas lire les pronostics d’autrui', async () => {
    assert.equal(await status(base, 'GET', '/PronosticSieges?user_email=autre@exemple.com'), 401);
  });

  await t.test('ne peut pas sonder si une adresse est inscrite', async () => {
    // Le classement reste public, mais filtrer sur l'e-mail d'autrui ferait de
    // la route un oracle d'inscription. Refusé avant toute requête SQL.
    const path = '/UserProgress?user_email=' + encodeURIComponent('autre@exemple.fr');
    assert.equal(await status(base, 'GET', path), 403);
  });

  await t.test('conserve l’accès en lecture aux données de référence (mode invité)', async () => {
    // Le garde laisse passer ; la requête échoue ensuite faute de vraie base,
    // ce qui suffit à prouver qu'elle n'a pas été bloquée par l'authentification.
    assert.notEqual(await status(base, 'GET', '/Liste'), 401);
  });

  await t.test('rejette une colonne de tri malveillante', async () => {
    const path = '/Liste?_sort=' + encodeURIComponent('(SELECT email FROM users LIMIT 1)');
    assert.equal(await status(base, 'GET', path), 400);
  });

  await t.test('rejette une entité inconnue', async () => {
    assert.equal(await status(base, 'GET', '/EntiteInexistante'), 404);
  });
});
