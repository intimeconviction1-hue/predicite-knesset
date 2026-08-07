/**
 * La cote et la probabilité sont la MÊME grandeur.
 *
 * Depuis le 2026-08-07, l'interface affiche « 65 % » au-dessus de « ×1,54 », et
 * la page explique au lecteur qu'il peut le vérifier lui-même : 1 ÷ 1,54 = 65 %.
 * C'est une promesse faite à l'écran ; ces tests la tiennent côté serveur.
 *
 * Trois propriétés qu'aucun refactor de `coteFor` ne doit casser :
 *   1. à l'ouverture (aucune mise), la cote est exactement l'inverse de la
 *      probabilité issue des sondages ;
 *   2. les probabilités des issues d'un marché somment à 100 % ;
 *   3. miser sur une issue fait MONTER sa probabilité et baisser celle des
 *      autres — c'est le sens même d'un pari-mutuel, et c'est ce que la courbe
 *      d'historique donne à lire.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { mock } from 'node:test';
import { optionsMock } from './helpers/option-mock.mjs';

// `coteFor` est une fonction pure, mais son module importe db/index.js — qui
// refuse de se charger sans DATABASE_URL, et n'en connaît qu'une : celle de
// PRODUCTION. Le mock coupe la dépendance avant l'import, comme les autres
// tests du dossier : aucune connexion n'est jamais ouverte.
mock.module('../db/index.js', optionsMock({
  pool: { query: async () => ({ rows: [], rowCount: 0 }) },
  filterEntity: async () => [],
  listEntity: async () => [],
  createEntity: async () => ({}),
  updateEntity: async () => ({}),
}));

const { coteFor } = await import('../functions/parisSondages.js');

const K = 800;
const proba = (cote) => 1 / cote;
// Les cotes sont arrondies au centième : une probabilité en est donc connue à
// ~0,5 point près sur les petites cotes. C'est la seule tolérance admise.
const PRES = 0.006;

test('à l’ouverture, la cote est l’inverse de la probabilité du sondage', () => {
  for (const p of [0.05, 0.2, 0.35, 0.5, 0.65, 0.8, 0.95]) {
    const cote = coteFor(p, 0, 0, K);
    assert.ok(
      Math.abs(proba(cote) - p) < PRES,
      `P=${p} → cote ${cote} → ${proba(cote).toFixed(4)} (écart trop grand)`,
    );
  }
});

test('les probabilités d’un marché somment à 100 %', () => {
  const marches = [
    [0.65, 0.35],
    [0.5, 0.5],
    [0.8, 0.2],
    [0.45, 0.3, 0.25],
    [0.4, 0.25, 0.2, 0.15],
  ];
  for (const probs of marches) {
    // Sans mise, puis avec des pools quelconques : la somme tient dans les deux
    // cas, c'est ce qui rend le pourcentage affichable en toute circonstance.
    for (const pools of [probs.map(() => 0), probs.map((_, i) => (i + 1) * 120)]) {
      const total = pools.reduce((s, x) => s + x, 0);
      const somme = probs
        .map((p, i) => proba(coteFor(p, pools[i], total, K)))
        .reduce((s, x) => s + x, 0);
      assert.ok(
        Math.abs(somme - 1) < 0.01,
        `somme des probabilités = ${somme.toFixed(4)} pour ${JSON.stringify(probs)} / pools ${JSON.stringify(pools)}`,
      );
    }
  }
});

test('miser sur une issue fait monter sa probabilité, et baisser celle de l’autre', () => {
  const [pA, pB] = [0.5, 0.5];
  const avantA = proba(coteFor(pA, 0, 0, K));
  const avantB = proba(coteFor(pB, 0, 0, K));

  // Un joueur mise 400 jetons sur A.
  const apresA = proba(coteFor(pA, 400, 400, K));
  const apresB = proba(coteFor(pB, 0, 400, K));

  assert.ok(apresA > avantA, `A devrait monter : ${avantA.toFixed(3)} → ${apresA.toFixed(3)}`);
  assert.ok(apresB < avantB, `B devrait baisser : ${avantB.toFixed(3)} → ${apresB.toFixed(3)}`);
  assert.ok(Math.abs(apresA + apresB - 1) < 0.01, 'la somme reste à 100 %');
});

test('les bornes de cote ne cassent pas la lecture en pourcentage', () => {
  // Une issue quasi impossible est plafonnée à ×25, soit 4 % : le pourcentage
  // affiché reste un nombre sensé, jamais un 0 % ni un NaN.
  const cote = coteFor(0.0001, 0, 0, K);
  assert.equal(cote, 25);
  assert.ok(proba(cote) > 0 && proba(cote) < 0.05);

  // Et une issue quasi certaine ne descend pas sous ×1,01, soit 99 %.
  const sure = coteFor(0.999, 0, 0, K);
  assert.ok(sure >= 1.01 && proba(sure) <= 1);
});
