/**
 * repartirSieges() — transformer des scores continus en une Knesset possible.
 *
 * Pourquoi ce test existe : le 2026-08-06, le plateau de « Forme ta coalition »
 * est passé du dernier sondage à une moyenne des cinq derniers, pour cesser de
 * bouger d'un jour à l'autre. La moyenne a produit un plateau où Les Réservistes
 * avaient 2 sièges — un résultat que le scrutin ne peut pas rendre (seuil de
 * 3,25 %, donc 4 sièges ou zéro), et que le jeu refuse par ailleurs au joueur
 * dans /MaRepartition. Un arrondi n'est pas une répartition.
 *
 * Deux invariants, à tenir quoi qu'on lui donne en entrée : le total fait
 * exactement 120, et aucune liste n'est créditée de 1, 2 ou 3 sièges.
 *
 * Ne touche aucune base.
 *
 * Lancer :  node --test server/tests/
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const racine = path.join(__dirname, '..', '..');

const { repartirSieges, TOTAL_SIEGES, MIN_SIEGES_AU_SEUIL } = await import(
  pathToFileURL(path.join(racine, 'client', 'src', 'lib', 'knesset.js')).href
);

const parts = (...scores) => scores.map((exact, i) => ({ slug: `p${i}`, exact }));
const total = (r) => r.reduce((n, p) => n + p.seats, 0);

test('le seuil est bien 4 sièges', () => {
  assert.equal(MIN_SIEGES_AU_SEUIL, 4);
  assert.equal(TOTAL_SIEGES, 120);
});

test('le cas réel du 2026-08-06 : les 2,4 sièges des Réservistes disparaissent', () => {
  // Moyenne des 5 derniers sondages de prod, relevée ce jour-là.
  const r = repartirSieges(parts(24.2, 22.8, 12.6, 9.6, 9.4, 8.0, 8.0, 7.6, 5.4, 5.0, 5.0, 2.4));
  assert.equal(total(r), 120);
  assert.equal(r.length, 11, 'la liste sous le seuil sort du plateau');
  assert.ok(r.every(p => p.seats >= MIN_SIEGES_AU_SEUIL));
});

test('le total fait 120 même quand les scores n\'y arrivent pas', () => {
  // La garde du collecteur accepte les sondages qui totalisent 116 à 124 : la
  // moyenne ne tombe donc pas sur 120 toute seule.
  for (const somme of [116, 118, 120, 122, 124]) {
    const brut = parts(30, 25, 20, 15, 12, 10, 8);
    const facteur = somme / brut.reduce((n, p) => n + p.exact, 0);
    const r = repartirSieges(brut.map(p => ({ ...p, exact: p.exact * facteur })));
    assert.equal(total(r), 120, `total faux pour une somme d'entrée de ${somme}`);
  }
});

test('jamais 1, 2 ni 3 sièges, quelle que soit l\'entrée', () => {
  const cas = [
    parts(50, 40, 20, 6, 3, 1),
    parts(110, 4, 3, 2, 1),
    parts(0.4, 0.3, 60, 59),                       // deux miettes et deux géants
    parts(12, 12, 12, 12, 12, 12, 12, 12, 12, 12), // dix listes à égalité parfaite
    parts(...Array(40).fill(3)),                   // le bulletin israélien complet :
    parts(...Array(40).fill(0).map((_, i) => 40 - i)), // aucune liste ne peut tenir
  ];                                               //   4 sièges, il faut élaguer
  for (const c of cas) {
    const r = repartirSieges(c);
    const illegaux = r.filter(p => p.seats > 0 && p.seats < MIN_SIEGES_AU_SEUIL);
    assert.deepEqual(illegaux.map(p => `${p.slug}=${p.seats}`), [],
      `sièges impossibles pour ${JSON.stringify(c.map(p => p.exact))}`);
    assert.equal(total(r), 120);
  }
});

test('écarter une liste profite aux autres, pas au vide', () => {
  // Les voix d'une liste sous le seuil se redistribuent : c'est le mécanisme
  // réel du scrutin, pas une commodité d'affichage.
  const avec = repartirSieges(parts(60, 57, 3));
  const sans = repartirSieges(parts(60, 57));
  assert.equal(total(avec), 120);
  assert.deepEqual(avec.map(p => p.seats), sans.map(p => p.seats));
});

test('les scores nuls et les entrées vides ne cassent rien', () => {
  assert.deepEqual(repartirSieges([]), []);
  assert.deepEqual(repartirSieges(parts(0, 0, 0)), []);
  const r = repartirSieges(parts(0, 70, 0, 50));
  assert.equal(total(r), 120);
  assert.equal(r.length, 2);
});

test('l\'ordre de sortie va du plus grand au plus petit', () => {
  const r = repartirSieges(parts(10, 45, 25, 40));
  assert.deepEqual(r.map(p => p.seats), [...r.map(p => p.seats)].sort((a, b) => b - a));
});

test('les champs de l\'appelant sont préservés', () => {
  // FormeCoalition passe id/slug/name/color et s'attend à les retrouver.
  const [premier] = repartirSieges([
    { id: 'x', slug: 'likoud', name: 'Likoud', color: '#123456', exact: 60 },
    { id: 'y', slug: 'shas', name: 'Shas', color: '#654321', exact: 60 },
  ]);
  assert.equal(premier.id, 'x');
  assert.equal(premier.name, 'Likoud');
  assert.equal(premier.color, '#123456');
});
