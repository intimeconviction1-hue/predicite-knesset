/**
 * Le collecteur Kan ne doit viser que des listes du SEED.
 *
 * Pourquoi ce test existe : jusqu'au 2026-08-04, la règle « ביחד|בנט » pointait
 * vers le slug 'yachad-bennett'. Ce slug ne figure dans aucun seed du dépôt,
 * mais une liste du même nom survivait en base de production (reliquat Base44).
 * Il RÉSOLVAIT donc à l'exécution : aucune erreur, aucune garde déclenchée, et
 * 146 des 156 sondages se sont accumulés sur une liste fantôme pendant que la
 * vraie ('ensemble-bennett-lapid') en recevait 10.
 *
 * La leçon : vérifier qu'un slug résout EN BASE ne prouve rien, puisque la base
 * contient des lignes que le dépôt ne connaît pas. Il faut le confronter au seed,
 * qui est la seule source de vérité versionnée. Ce test ne touche aucune base.
 *
 * Lancer :  node --test server/tests/
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

process.env.DATABASE_URL = 'postgres://test:test@127.0.0.1:1/fake';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const seedPath = path.join(__dirname, '..', '..', 'docs', 'KNESSET_SEED_LISTES.json');

// Copie conforme de slugify() dans scripts/seed-listes.js : c'est cette fonction
// qui décide du slug réellement écrit en base, donc c'est elle qui fait foi.
function slugify(str) {
  return str
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

const seed = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
const slugsDuSeed = new Set((seed.listes || []).map(l => l.slug || slugify(l.name_fr)));

test('chaque slug du collecteur Kan correspond à une liste du seed', async () => {
  const { MAPPED_RULES } = await import('../functions/kanSheetCollector.js');
  const inconnus = MAPPED_RULES
    .map(([, slug]) => slug)
    .filter(slug => !slugsDuSeed.has(slug));

  assert.deepEqual(
    inconnus, [],
    `Slug(s) visé(s) par le collecteur mais absent(s) de KNESSET_SEED_LISTES.json : ${inconnus.join(', ')}. ` +
    `S'ils existent en base, c'est un reliquat : corriger la règle, pas le seed.`,
  );
});

test('le seed ne contient pas deux listes de même slug', () => {
  const vus = new Set();
  const doublons = [];
  for (const l of seed.listes || []) {
    const s = l.slug || slugify(l.name_fr);
    if (vus.has(s)) doublons.push(s);
    vus.add(s);
  }
  assert.deepEqual(doublons, [], `Slugs en double dans le seed : ${doublons.join(', ')}`);
});
