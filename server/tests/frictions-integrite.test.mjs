/**
 * Intégrité des frictions de « Forme ta coalition ».
 *
 * Jumeau de boussole-integrite.test.mjs, et pour la même raison. Le 2026-08-04,
 * la Boussole a été trouvée citant « yachad-bennett », un slug hérité de Base44
 * absent de tout seed : rien n'échouait à l'exécution, la position ne pesait
 * simplement jamais. La table des frictions portait EXACTEMENT le même slug, et
 * la paire likoud/yachad-bennett n'a donc jamais retiré un seul point.
 *
 * Une garde existe côté client (verifierFrictions, console.error en dev), mais
 * elle suppose qu'un développeur ouvre la console au bon moment — c'est
 * précisément ce qui n'est pas arrivé pendant des mois. Ce test-ci échoue en CI.
 *
 * Il confronte les slugs au SEED VERSIONNÉ, pas à la base : vérifier qu'un
 * identifiant existe en base ne prouve rien, puisque la base contient des lignes
 * que le dépôt ignore (« yachad-bennett » y est encore, inactive).
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
// Les frictions ne valent que pour les listes EN LICE : une liste historique du
// seed (Yesh Atid, fondue dans Ensemble ; Noam, qu'aucun institut ne mesure) est
// conservée is_active = false pour que les vieux sondages totalisent 120, elle
// n'apparaît jamais sur le plateau. Lui prêter une friction serait du bruit.
const listesActives = (seed.listes || []).filter(l => l.is_active !== false);
const slugsActifs = new Set(listesActives.map(l => l.slug || slugify(l.name_fr)));

const { FRICTIONS } = await import(
  pathToFileURL(path.join(racine, 'client', 'src', 'lib', 'frictions.js')).href
);

// Échelle documentée dans docs/FRICTIONS_SOURCES.md. Les bornes sont larges à
// dessein : ce test protège contre la faute de frappe (un 3 au lieu de 30, un
// 420 au lieu de 42), pas contre un désaccord éditorial sur la pondération.
const POIDS_MIN = 5;
const POIDS_MAX = 50;

test('la table des frictions est bien exportée', () => {
  assert.ok(Array.isArray(FRICTIONS) && FRICTIONS.length >= 20,
    `Import douteux : ${FRICTIONS?.length} paire(s)`);
});

test('chaque friction est un quadruplet [slug, slug, poids, raison]', () => {
  const malformees = FRICTIONS
    .map((f, i) => ({ n: i + 1, f }))
    .filter(({ f }) => !Array.isArray(f) || f.length !== 4
      || typeof f[0] !== 'string' || typeof f[1] !== 'string'
      || !Number.isInteger(f[2]) || typeof f[3] !== 'string' || !f[3].trim())
    .map(({ n, f }) => `${n}. ${JSON.stringify(f)?.slice(0, 70)}`);
  assert.deepEqual(malformees, [], `Friction(s) malformée(s) : ${malformees.join(' | ')}`);
});

test('chaque liste citée par une friction est active dans le seed', () => {
  const cites = new Set(FRICTIONS.flatMap(([a, b]) => [a, b]));
  const orphelins = [...cites].filter(s => !slugsActifs.has(s));
  assert.deepEqual(
    orphelins, [],
    `Slug(s) cité(s) par les frictions mais absent(s) des listes actives de ` +
    `KNESSET_SEED_LISTES.json : ${orphelins.join(', ')}. Une friction sur une liste ` +
    "inactive ou inexistante ne se déclenche jamais : c'est le bug 'yachad-bennett'. " +
    'Corriger la table des frictions, pas le seed.',
  );
});

test('aucune paire n\'est déclarée deux fois', () => {
  // Le doublon est silencieux et coûteux : les deux poids s'additionnent, donc
  // la coalition est punie deux fois pour la même raison.
  const vues = new Map();
  const doublons = [];
  FRICTIONS.forEach(([a, b], i) => {
    const cle = [a, b].sort().join(' + ');
    if (vues.has(cle)) doublons.push(`${cle} (lignes ${vues.get(cle)} et ${i + 1})`);
    else vues.set(cle, i + 1);
  });
  assert.deepEqual(doublons, [], `Paire(s) en double : ${doublons.join(' | ')}`);
});

test('aucune liste n\'est en friction avec elle-même', () => {
  const auto = FRICTIONS.filter(([a, b]) => a === b).map(([a]) => a);
  assert.deepEqual(auto, [], `Auto-friction(s) : ${auto.join(', ')}`);
});

test('les poids restent dans l\'échelle documentée', () => {
  const hors = FRICTIONS
    .filter(([, , w]) => w < POIDS_MIN || w > POIDS_MAX)
    .map(([a, b, w]) => `${a} + ${b} = ${w}`);
  assert.deepEqual(hors, [],
    `Poids hors de l'échelle ${POIDS_MIN}–${POIDS_MAX} (voir docs/FRICTIONS_SOURCES.md) : ${hors.join(' | ')}`);
});

test('aucune coalition de deux listes ne peut tomber sous le plancher du score', () => {
  // plausibility() plafonne la pénalité à 97 (score plancher = 3). Si une seule
  // paire suffisait à atteindre ce plancher, toutes les coalitions qui la
  // contiennent seraient indistinguables — le jeu cesserait de discriminer.
  const saturantes = FRICTIONS.filter(([, , w]) => w >= 97).map(([a, b, w]) => `${a} + ${b} = ${w}`);
  assert.deepEqual(saturantes, [], `Paire(s) saturant le score à elles seules : ${saturantes.join(' | ')}`);
});

test('chaque liste active en lice porte au moins une friction', () => {
  // Une liste sans aucune friction est un joker : on peut la glisser dans
  // n'importe quelle coalition sans que le score bouge. C'est un choix
  // défendable (Les Démocrates n'ont volontairement aucune friction avec Ra'am),
  // mais ZÉRO friction sur une liste entière est presque toujours un oubli —
  // c'est ce qui faisait sortir « Otzma + Les Démocrates + Ensemble » à 100 %
  // avant le 2026-08-05.
  const cites = new Set(FRICTIONS.flatMap(([a, b]) => [a, b]));
  const jokers = [...slugsActifs].filter(s => !cites.has(s));
  assert.deepEqual(jokers, [],
    `Liste(s) active(s) sans aucune friction : ${jokers.join(', ')}. Si c'est voulu, ` +
    "documenter la raison dans docs/FRICTIONS_SOURCES.md et ajuster ce test.",
  );
});
