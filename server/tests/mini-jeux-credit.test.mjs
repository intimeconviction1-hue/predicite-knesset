/**
 * Crédit des mini-jeux.
 *
 * Ce que ce test protège : les quatre mini-jeux n'écrivaient rien côté serveur,
 * alors que le mur d'inscription qui les bloque promettait un score sauvegardé.
 * La régression serait silencieuse — un jeu qui ne crédite pas ressemble
 * exactement à un jeu qui crédite, vu de l'écran de fin.
 *
 * Et surtout : la règle d'un crédit par jeu et par jour EST l'anti-grind. Le
 * plafond d'apprentissage (300) ne suffit pas ici, contrairement au quiz : une
 * question de quiz ne se répond qu'une fois, un mini-jeu se rejoue à l'infini.
 * Sans la règle du jour, enchaîner des parties saturerait le bucket entier en
 * quelques minutes.
 *
 * Tourne sur la base en mémoire (tests/helpers/memory-db.mjs) : aucune connexion
 * Postgres n'est ouverte, la base de production reste hors d'atteinte.
 *
 * Lancer :  npm test
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { mock } from 'node:test';
import { createMemoryDb } from './helpers/memory-db.mjs';
import { optionsMock } from './helpers/option-mock.mjs';

let db = createMemoryDb();

// `pool` et `queryAll` ne servent pas au crédit, mais miniJeux.js tire
// ensureUserProgress de miscFunctions.js, qui les importe : un mock qui les
// omet fait échouer le fichier À L'IMPORT, avant le premier test. Ils sont donc
// présents et volontairement inertes — si un jour du SQL brut entrait dans ce
// chemin, ces stubs le rendraient visible plutôt que de le laisser filer vers
// une vraie connexion.
mock.module('../db/index.js', optionsMock({
  filterEntity: (...a) => db.filterEntity(...a),
  listEntity: (...a) => db.listEntity(...a),
  createEntity: (...a) => db.createEntity(...a),
  updateEntity: (...a) => db.updateEntity(...a),
  pool: { query: async () => { throw new Error('SQL brut interdit dans ce test'); } },
  queryAll: async () => { throw new Error('SQL brut interdit dans ce test'); },
}));

const { crediterPartieMiniJeu, JEUX, POINTS_PAR_PARTIE } = await import('../functions/miniJeux.js');

const JOUEUR = 'joueuse@exemple.fr';

function seed() {
  db = createMemoryDb({
    UserProgress: [
      { id: 'up-1', user_email: JOUEUR, total_points: 0, learning_points: 0 },
    ],
  });
}

const progression = async () => (await db.filterEntity('UserProgress', { user_email: JOUEUR }))[0];

test('une première partie crédite les points d\'apprentissage', async () => {
  seed();
  const res = await crediterPartieMiniJeu(JOUEUR, { jeu: 'vrai-ou-fake' });

  assert.equal(res.credite, true);
  assert.equal(res.points, POINTS_PAR_PARTIE);

  const up = await progression();
  assert.equal(up.learning_points, POINTS_PAR_PARTIE);
  assert.equal(up.total_points, POINTS_PAR_PARTIE, 'les points doivent aussi entrer dans le total affiché');
});

test('rejouer le même jeu le même jour ne recrédite rien', async () => {
  seed();
  await crediterPartieMiniJeu(JOUEUR, { jeu: 'boussole' });
  const rejeu = await crediterPartieMiniJeu(JOUEUR, { jeu: 'boussole' });

  assert.equal(rejeu.credite, false);
  assert.equal(rejeu.points, 0);
  assert.equal(rejeu.motif, 'deja_credite_aujourdhui');

  const up = await progression();
  assert.equal(up.learning_points, POINTS_PAR_PARTIE, 'le bucket ne doit pas doubler');
});

test('pilonner un jeu ne remplit pas le plafond d\'apprentissage', async () => {
  seed();
  // 40 parties d'affilée : le scénario exact que la contrainte de jour interdit.
  // Sans elle, 40 × 10 = 400 points, soit plus que le plafond de 300 — le bucket
  // entier gagné en quelques minutes, sans rien apprendre.
  for (let i = 0; i < 40; i++) {
    await crediterPartieMiniJeu(JOUEUR, { jeu: 'sens-du-vent' });
  }

  const up = await progression();
  assert.equal(up.learning_points, POINTS_PAR_PARTIE,
    `40 parties ont rapporté ${up.learning_points} points au lieu de ${POINTS_PAR_PARTIE} : ` +
    `la règle d'un crédit par jeu et par jour ne s'applique plus.`);
});

test('les quatre jeux se cumulent le même jour', async () => {
  seed();
  for (const jeu of JEUX) {
    const res = await crediterPartieMiniJeu(JOUEUR, { jeu });
    assert.equal(res.credite, true, `${jeu} aurait dû créditer`);
  }

  const up = await progression();
  assert.equal(up.learning_points, JEUX.length * POINTS_PAR_PARTIE);
  assert.equal(JEUX.length, 4, 'quatre mini-jeux : si ce nombre change, revoir le rythme de remplissage du plafond');
});

test('un identifiant de jeu inconnu est refusé', async () => {
  seed();
  // Sans cette garde, le client fabriquerait autant de « jeux » que voulu et
  // s'offrirait un crédit quotidien par nom inventé.
  await assert.rejects(
    () => crediterPartieMiniJeu(JOUEUR, { jeu: 'jeu-invente' }),
    (e) => e.status === 400,
  );
  await assert.rejects(() => crediterPartieMiniJeu(JOUEUR, {}), (e) => e.status === 400);

  const up = await progression();
  assert.equal(up.learning_points, 0);
});

test('chaque partie créditée laisse une trace datée', async () => {
  seed();
  await crediterPartieMiniJeu(JOUEUR, { jeu: 'forme-coalition' });

  const lignes = db._rows('MiniJeuPartie');
  assert.equal(lignes.length, 1);
  assert.match(lignes[0].jour, /^\d{4}-\d{2}-\d{2}$/, 'le jour doit être une date ISO courte');
  assert.equal(lignes[0].user_email, JOUEUR);
  assert.equal(lignes[0].jeu, 'forme-coalition');
});
