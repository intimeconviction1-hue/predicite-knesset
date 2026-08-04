/**
 * Intégrité du RÉFÉRENTIEL des listes.
 *
 * Le collecteur vérifie déjà que chaque sondage totalise ~120 sièges, et le seed
 * historique que chacune des 25 élections en totalise exactement 120. Le
 * référentiel lui-même, lui, n'était contrôlé par rien : sa somme valait 119
 * depuis l'origine, parce que Noam (Avi Maoz, 1 siège) — troisième faction issue
 * de la liste commune de 2022 avec Otzma Yehudit et le Sionisme religieux —
 * n'y figurait pas. Ajouté le 2026-08-04, en même temps que ce test.
 *
 * Ne touche aucune base : lecture du seed versionné uniquement.
 *
 * Lancer :  node --test server/tests/
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const seed = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', '..', 'docs', 'KNESSET_SEED_LISTES.json'), 'utf8'),
);
const listes = seed.listes || [];
const CHAMBRE = 120;

test('les sièges sortants du référentiel totalisent exactement 120', () => {
  const detail = listes
    .filter(l => l.current_knesset_seats != null)
    .map(l => `${l.name_fr}=${l.current_knesset_seats}`)
    .join(', ');
  const somme = listes.reduce((n, l) => n + (l.current_knesset_seats ?? 0), 0);

  assert.equal(
    somme, CHAMBRE,
    `Somme des current_knesset_seats = ${somme}, attendu ${CHAMBRE}. ` +
    `Une faction de la 25e Knesset manque au référentiel (ou un chiffre est faux). Détail : ${detail}`,
  );
});

test('aucune liste ne déclare un nombre de sièges aberrant', () => {
  for (const l of listes) {
    const s = l.current_knesset_seats;
    if (s == null) continue;                       // null = volontaire (liste neuve, non élue en 2022)
    assert.ok(Number.isInteger(s) && s > 0 && s <= CHAMBRE,
      `${l.name_fr} : current_knesset_seats = ${JSON.stringify(s)} n'est pas un entier de 1 à ${CHAMBRE}`);
  }
});

test('toute liste sans siège sortant s\'explique dans founded_or_merged_note', () => {
  // Une liste à null n'existait pas à la 25e Knesset : le référentiel doit dire
  // pourquoi, sinon on ne distingue plus « nouvelle liste » de « chiffre oublié ».
  const muettes = listes
    .filter(l => l.current_knesset_seats == null && !l.founded_or_merged_note)
    .map(l => l.name_fr);
  assert.deepEqual(muettes, [], `Sièges à null sans explication : ${muettes.join(', ')}`);
});
