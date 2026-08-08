/**
 * Une panne n'est pas une faute du client.
 *
 * Le 2026-08-07, la console d'un visiteur montrait des 400 sur
 * /api/entities/SondageSieges et un 500 sur /api/paris. Tout répondait 200
 * quelques minutes plus tard : la base avait toussé. Mais le code renvoyé
 * disait « ta requête est fautive », donc le navigateur n'a pas retenté et les
 * logs n'ont rien signalé d'anormal.
 *
 * Ces tests tiennent trois promesses :
 *   1. une indisponibilité de base ressort en 503 + Retry-After ;
 *   2. une requête réellement fautive ressort en 400, avec NOTRE message ;
 *   3. rien d'autre ne fuit vers le navigateur — un message d'erreur Postgres
 *      contient du SQL, des noms de tables et de colonnes.
 *
 * Aucune base n'est jamais atteinte : les cas unitaires sont des exceptions
 * fabriquées, et le cas de bout en bout pointe volontairement sur un port mort.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';

import { classer, repondreErreur, RequeteInvalide } from '../lib/erreur-http.js';

process.env.DATABASE_URL = 'postgres://test:test@127.0.0.1:1/fake';
delete process.env.NODE_ENV;

const { default: entitiesRouter } = await import('../routes/entities.js');

/** Erreur telle que `pg` la remonte : un code, pas un type. */
function erreurPg(code, message = 'echec') {
  const e = new Error(message);
  e.code = code;
  return e;
}

function resFactice() {
  const vu = { status: null, corps: null, entetes: {} };
  const res = {
    set(cle, valeur) { vu.entetes[cle] = valeur; return res; },
    status(code) { vu.status = code; return res; },
    json(corps) { vu.corps = corps; return res; },
  };
  return { res, vu };
}

test('classer distingue la panne, la faute du client et le bug', async (t) => {
  await t.test('une requête invalide garde notre message', () => {
    const r = classer(new RequeteInvalide('Nom de colonne invalide : (SELECT 1)'));
    assert.deepEqual(r, { status: 400, message: 'Nom de colonne invalide : (SELECT 1)' });
  });

  await t.test('les échecs de connexion réseau donnent 503', () => {
    for (const code of ['ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND']) {
      assert.equal(classer(erreurPg(code)).status, 503, code);
    }
  });

  await t.test('les SQLSTATE d’indisponibilité donnent 503', () => {
    // 08006 connexion rompue, 53300 trop de connexions, 57P01 arrêt du serveur
    // — c'est ce que renvoie Neon quand il se réveille ou bascule.
    for (const code of ['08006', '08003', '53300', '57P01', '57P03']) {
      assert.equal(classer(erreurPg(code)).status, 503, code);
    }
  });

  await t.test('l’attente épuisée du pool donne 503 même sans code', () => {
    const e = new Error('timeout exceeded when trying to connect');
    assert.equal(classer(e).status, 503);
  });

  await t.test('une donnée invalide reste une faute du client', () => {
    // 22P02 : « invalid input syntax for type uuid ». C'est bien l'appelant.
    assert.equal(classer(erreurPg('22P02')).status, 400);
  });

  await t.test('le reste est un bug de notre côté', () => {
    assert.equal(classer(new TypeError('x is not a function')).status, 500);
  });
});

test('rien du moteur ne part vers le navigateur', async (t) => {
  await t.test('le message d’une erreur Postgres ne fuit pas', () => {
    const secret = 'relation "users" does not exist — SELECT email FROM users';
    for (const e of [erreurPg('42P01', secret), erreurPg('08006', secret), new Error(secret)]) {
      assert.equal(classer(e).message.includes('users'), false);
    }
  });

  await t.test('un 503 porte Retry-After, et le 400 garde son texte', (t) => {
    // Une panne se signale en UNE ligne : pendant un réveil de base, toutes les
    // requêtes en vol échouent, et autant de piles n'apprendraient rien.
    const alerte = t.mock.method(console, 'warn', () => {});
    const pile = t.mock.method(console, 'error', () => {});

    const panne = resFactice();
    repondreErreur(panne.res, erreurPg('ECONNREFUSED'), 'test');
    assert.equal(panne.vu.status, 503);
    assert.equal(panne.vu.entetes['Retry-After'], '5');
    assert.equal(alerte.mock.callCount(), 1);
    assert.equal(pile.mock.callCount(), 0);

    const faute = resFactice();
    repondreErreur(faute.res, new RequeteInvalide('limit invalide : abc'), 'test');
    assert.equal(faute.vu.status, 400);
    assert.equal(faute.vu.corps.error, 'limit invalide : abc');
    assert.equal(faute.vu.entetes['Retry-After'], undefined);
  });

  await t.test('un 500 est journalisé côté serveur, pas renvoyé', (t) => {
    const journal = t.mock.method(console, 'error', () => {});
    const { res, vu } = resFactice();
    repondreErreur(res, new TypeError('detail interne'), 'test');
    assert.equal(vu.status, 500);
    assert.equal(vu.corps.error.includes('detail interne'), false);
    assert.equal(journal.mock.callCount(), 1);
  });
});

test('la route /api/entities applique la distinction', async (t) => {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => { req.session = {}; next(); }); // visiteur anonyme
  app.use('/api/entities', entitiesRouter);
  const server = app.listen(0);
  t.after(() => server.close());
  const base = `http://127.0.0.1:${server.address().port}/api/entities`;

  await t.test('une limite non entière est refusée avant tout SQL', async () => {
    // Avant : `LIMIT NaN` partait à Postgres et revenait en erreur de syntaxe.
    const res = await fetch(`${base}/Liste?_limit=abc`);
    assert.equal(res.status, 400);
    assert.match((await res.json()).error, /limit invalide/);
  });

  await t.test('une base injoignable donne 503, pas 400', async (t) => {
    // DATABASE_URL pointe le port 1 : la connexion est refusée pour de bon.
    const alerte = t.mock.method(console, 'warn', () => {});
    const res = await fetch(`${base}/Liste`);
    assert.equal(res.status, 503);
    assert.equal(res.headers.get('retry-after'), '5');
    assert.equal((await res.json()).error.includes('ECONNREFUSED'), false);
    assert.equal(alerte.mock.callCount(), 1);
  });
});
