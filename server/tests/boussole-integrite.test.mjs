/**
 * Intégrité des données de la Boussole.
 *
 * Pourquoi ce test existe : le 2026-08-03, la Boussole a été trouvée citant un
 * slug — « yachad-bennett » — qui ne correspondait à aucune liste du seed. Il
 * désignait une liste fantôme héritée de Base44, bien présente en base, si bien
 * qu'à l'exécution rien n'échouait : une liste disparue depuis avril pouvait
 * sortir en tête du résultat.
 *
 * Une garde existe côté client (console.error en dev), mais elle suppose qu'un
 * développeur ouvre la console au bon moment. Ce test-ci échoue en CI.
 *
 * Il confronte les slugs au SEED VERSIONNÉ, pas à la base : c'est la même leçon
 * que tests/collecteur-slugs.test.mjs. Vérifier qu'un identifiant existe en base
 * ne prouve rien, puisque la base contient des lignes que le dépôt ignore.
 *
 * Ne touche aucune base : lecture de deux fichiers du dépôt.
 *
 * Lancer :  node --test server/tests/
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const racine = path.join(__dirname, '..', '..');

function slugify(str) {
  return str
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

const seed = JSON.parse(fs.readFileSync(path.join(racine, 'docs', 'KNESSET_SEED_LISTES.json'), 'utf8'));
const slugsDuSeed = new Set((seed.listes || []).map(l => l.slug || slugify(l.name_fr)));

// STATEMENTS est un littéral JS pur (aucun JSX) : on l'extrait et on l'évalue.
// Fragile par nature, d'où l'assertion de garde juste après.
const jsx = fs.readFileSync(path.join(racine, 'client', 'src', 'pages', 'Boussole.jsx'), 'utf8');
const debut = jsx.indexOf('const STATEMENTS =');
const fin = jsx.indexOf('// Nombre d', debut);
assert.ok(debut !== -1 && fin > debut,
  "Impossible de localiser le tableau STATEMENTS dans Boussole.jsx — si le fichier a été " +
  'restructuré, corriger ce test plutôt que le supprimer.');
const STATEMENTS = new Function(
  `${jsx.slice(debut, fin).trim().replace(/;\s*$/, '')}; return STATEMENTS;`,
)();

test('le tableau STATEMENTS a bien été extrait', () => {
  assert.ok(Array.isArray(STATEMENTS) && STATEMENTS.length >= 10,
    `Extraction douteuse : ${STATEMENTS?.length} affirmation(s)`);
  for (const s of STATEMENTS) {
    assert.ok(typeof s.text === 'string' && Array.isArray(s.pour) && Array.isArray(s.contre),
      `Affirmation malformée : ${JSON.stringify(s).slice(0, 80)}`);
  }
});

test('chaque parti cité par la Boussole existe dans le seed', () => {
  const cites = new Set(STATEMENTS.flatMap(s => [...s.pour, ...s.contre]));
  const orphelins = [...cites].filter(s => !slugsDuSeed.has(s));
  assert.deepEqual(
    orphelins, [],
    `Slug(s) cité(s) par la Boussole mais absent(s) de KNESSET_SEED_LISTES.json : ${orphelins.join(', ')}. ` +
    "S'ils existent en base, c'est un reliquat : corriger la Boussole, pas le seed.",
  );
});

test('aucun parti n\'est à la fois pour et contre la même affirmation', () => {
  const fautes = [];
  STATEMENTS.forEach((s, i) => {
    for (const p of s.pour) if (s.contre.includes(p)) fautes.push(`${i + 1}. ${p}`);
  });
  assert.deepEqual(fautes, [], `Positions contradictoires : ${fautes.join(', ')}`);
});

test('aucun parti n\'est cité deux fois dans le même camp', () => {
  const fautes = [];
  STATEMENTS.forEach((s, i) => {
    for (const camp of ['pour', 'contre']) {
      const vus = new Set();
      for (const p of s[camp]) {
        if (vus.has(p)) fautes.push(`${i + 1}. ${camp} : ${p}`);
        vus.add(p);
      }
    }
  });
  assert.deepEqual(fautes, [], `Doublons : ${fautes.join(', ')}`);
});

test('chaque affirmation oppose au moins deux partis', () => {
  // Une affirmation où personne ne s'oppose ne discrimine rien : elle allonge le
  // questionnaire sans rien apprendre. Seuil volontairement bas — certaines
  // affirmations n'ont que 3 positions, et c'est assumé quand les sources
  // manquent (voir docs/BOUSSOLE_SOURCES.md).
  const steriles = STATEMENTS
    .map((s, i) => ({ n: i + 1, s }))
    .filter(({ s }) => s.pour.length === 0 || s.contre.length === 0)
    .map(({ n, s }) => `${n}. « ${s.text.slice(0, 50)}… »`);
  assert.deepEqual(steriles, [], `Affirmation(s) sans opposition : ${steriles.join(' | ')}`);
});
