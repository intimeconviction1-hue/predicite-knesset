/**
 * Résolution du pronostic « Premier ministre ».
 *
 * Deux bugs signalés par un audit externe le 2026-08-07, et qui avaient en
 * commun d'être SILENCIEUX — chacun rendait un compte rendu d'apparence
 * normale :
 *
 *  1. la lecture des pronostics se faisait en `limit: 5000` SANS tri, donc sur
 *     un sous-ensemble arbitraire choisi par Postgres ;
 *  2. `autoResolveIfExpired` écrivait `points_earned` sur la ligne du pronostic
 *     sans jamais incrémenter `total_points`. Or `total_points` n'est recalculé
 *     nulle part dans le projet : il n'est qu'incrémenté. Les points non
 *     crédités à la résolution étaient perdus définitivement.
 *
 * Tout tourne sur la base en mémoire : aucune connexion Postgres n'est ouverte,
 * la base de production reste hors d'atteinte.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { mock } from 'node:test';
import { createMemoryDb } from './helpers/memory-db.mjs';
import { optionsMock } from './helpers/option-mock.mjs';

let db = createMemoryDb();

mock.module('../db/index.js', optionsMock({
  filterEntity: (...a) => db.filterEntity(...a),
  listEntity: (...a) => db.listEntity(...a),
  createEntity: (...a) => db.createEntity(...a),
  updateEntity: (...a) => db.updateEntity(...a),
}));

const { resolvePremierMinistre, autoResolveIfExpired } =
  await import('../functions/resolvePremierMinistre.js');

const PM_POINTS = 100;
const HIER = new Date(Date.now() - 86400000).toISOString();
const DEMAIN = new Date(Date.now() + 86400000).toISOString();

// Un jeu de départ : trois joueurs, trois paris différents.
function poser({ deadline } = {}) {
  db = createMemoryDb({
    CampaignSettings: deadline ? [{ id: 'global', key: 'global', pm_resolution_deadline_utc: deadline }] : [],
    UserProgress: [
      { id: 'up-a', user_email: 'a@x.fr', total_points: 40 },
      { id: 'up-b', user_email: 'b@x.fr', total_points: 0 },
      { id: 'up-c', user_email: 'c@x.fr', total_points: 7 },
    ],
    PronosticPM: [
      { id: 'p-a', user_email: 'a@x.fr', candidat_pm_id: 'autre' },
      { id: 'p-b', user_email: 'b@x.fr', candidat_pm_id: 'cand-netanyahou' },
      { id: 'p-c', user_email: 'c@x.fr', candidat_pm_id: 'autre' },
    ],
  });
}

const points = (email) => db._rows('UserProgress').find(u => u.user_email === email).total_points;
const pronostic = (id) => db._rows('PronosticPM').find(p => p.id === id);

test('une résolution par deadline crédite bien le CLASSEMENT, pas seulement la ligne du pronostic', async () => {
  poser({ deadline: HIER });
  const res = await autoResolveIfExpired();

  assert.equal(res.resolved, 3);
  assert.equal(res.resolution, 'autre (deadline expirée sans investiture connue)');

  // Le cœur du bug : les points existaient sur la ligne du pronostic…
  assert.equal(pronostic('p-a').points_earned, PM_POINTS);
  assert.equal(pronostic('p-c').points_earned, PM_POINTS);
  // …mais n'atteignaient jamais total_points, qui n'est recalculé nulle part.
  assert.equal(points('a@x.fr'), 40 + PM_POINTS, 'le joueur « autre » doit être crédité au classement');
  assert.equal(points('c@x.fr'), 7 + PM_POINTS, 'idem pour le second joueur « autre »');
  // Celui qui s'est trompé n'est pas crédité, et sa ligne le dit.
  assert.equal(pronostic('p-b').points_earned, 0);
  assert.equal(points('b@x.fr'), 0);

  assert.equal(res.users_awarded, 2);
});

test('la deadline non atteinte ne résout rien', async () => {
  poser({ deadline: DEMAIN });
  const res = await autoResolveIfExpired();
  assert.equal(res.resolved, undefined);
  assert.equal(pronostic('p-a').resolved_at, undefined);
  assert.equal(points('a@x.fr'), 40);
});

test('sans deadline configurée, rien ne se déclenche', async () => {
  poser();
  const res = await autoResolveIfExpired();
  assert.match(res.message, /non défini/);
  assert.equal(points('a@x.fr'), 40);
});

test('une résolution nominale crédite le bon candidat et un seul', async () => {
  poser();
  const res = await resolvePremierMinistre('cand-netanyahou');
  assert.equal(res.resolved, 3);
  assert.equal(res.users_awarded, 1);
  assert.equal(points('b@x.fr'), PM_POINTS);
  assert.equal(points('a@x.fr'), 40, 'un mauvais pronostic ne rapporte rien');
  assert.equal(pronostic('p-a').resolved_value, 'cand-netanyahou');
});

test('un pronostic déjà résolu n’est jamais recrédité', async () => {
  poser();
  await resolvePremierMinistre('autre');
  const apres1 = points('a@x.fr');
  await resolvePremierMinistre('autre');
  assert.equal(points('a@x.fr'), apres1, 'rejouer la résolution ne doit pas doubler les points');
});

test('la lecture est paginée : au-delà de 1000 pronostics, aucun joueur n’est oublié', async () => {
  // 1500 lignes : l'ancienne lecture en une page de 5000 SANS tri renvoyait un
  // sous-ensemble arbitraire. La pagination triée sur `id` les parcourt toutes.
  const N = 1500;
  db = createMemoryDb({
    CampaignSettings: [{ id: 'global', key: 'global', pm_resolution_deadline_utc: HIER }],
    UserProgress: Array.from({ length: N }, (_, i) => ({
      id: `up-${String(i).padStart(5, '0')}`, user_email: `j${i}@x.fr`, total_points: 0,
    })),
    PronosticPM: Array.from({ length: N }, (_, i) => ({
      id: `p-${String(i).padStart(5, '0')}`, user_email: `j${i}@x.fr`, candidat_pm_id: 'autre',
    })),
  });

  const res = await autoResolveIfExpired();
  assert.equal(res.resolved, N, 'les 1500 pronostics doivent être résolus');
  assert.equal(res.users_awarded, N);

  const oublies = db._rows('PronosticPM').filter(p => !p.resolved_at);
  assert.equal(oublies.length, 0, 'aucun pronostic ne doit rester en attente');

  const nonCredites = db._rows('UserProgress').filter(u => u.total_points !== PM_POINTS);
  assert.equal(nonCredites.length, 0, 'aucun joueur ne doit rester à zéro point');
});
