/**
 * Intégrité des données de la Boussole.
 *
 * Pourquoi ce test existe : le 2026-08-04, la Boussole a été trouvée citant un
 * slug — « yachad-bennett » — qui ne correspondait à aucune liste du seed. Il
 * désignait une ligne héritée de Base44, bien présente en base, si bien qu'à
 * l'exécution rien n'échouait. « Yachad » (ביחד) étant le nom hébreu de la liste
 * Bennett-Lapid, c'était en réalité un DOUBLON du même parti sous son autre nom :
 * deux entités pour une seule liste, dont l'une captait 146 des 156 sondages.
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
import { fileURLToPath, pathToFileURL } from 'node:url';

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

// Ce test lisait Boussole.jsx et découpait le littéral STATEMENTS à la main
// (indexOf sur un commentaire). Le 2026-08-04 les données sont sorties dans
// client/src/lib/boussole-data.js : le repère a disparu, l'assertion de garde a
// sauté et `npm test` est resté rouge — donc plus personne ne le lisait, et le
// seul rempart contre un slug fantôme était éteint. On importe désormais le
// module, qui est du JS pur sans JSX ni dépendance : rien à découper, rien à
// re-casser au prochain refactor de la page.
const { STATEMENTS } = await import(
  pathToFileURL(path.join(racine, 'client', 'src', 'lib', 'boussole-data.js')).href
);

test('le tableau STATEMENTS est bien exporté par boussole-data', () => {
  assert.ok(Array.isArray(STATEMENTS) && STATEMENTS.length >= 10,
    `Import douteux : ${STATEMENTS?.length} affirmation(s)`);
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
