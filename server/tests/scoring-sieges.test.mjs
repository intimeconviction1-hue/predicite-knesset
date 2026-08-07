/**
 * Chaîne du soir du scrutin, de bout en bout : dépôt d'une répartition sous
 * contrainte de somme → saisie manuelle des résultats → scoring → bonus de
 * bloc → classement.
 *
 * C'est le seul chemin qui DOIT fonctionner le 27 octobre 2026. Il tourne ici
 * sur une base en mémoire (tests/helpers/memory-db.mjs) : aucune connexion
 * Postgres n'est ouverte, la base de production reste hors d'atteinte.
 *
 * Lancer :  npm test
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { mock } from 'node:test';
import { createMemoryDb } from './helpers/memory-db.mjs';
import { optionsMock } from './helpers/option-mock.mjs';

// Le mock délègue à `db`, réassigné avant chaque scénario : les modules testés
// ne sont importés qu'une fois, mais repartent d'une base vierge à chaque fois.
let db = createMemoryDb();

// optionsMock() choisit `exports` ou `namedExports` selon le Node installé :
// l'option a été renommée, et se tromper de nom fait mourir ce fichier à
// l'import, silencieusement, pendant que les autres passent au vert.
mock.module('../db/index.js', optionsMock({
  filterEntity: (...a) => db.filterEntity(...a),
  listEntity: (...a) => db.listEntity(...a),
  createEntity: (...a) => db.createEntity(...a),
  updateEntity: (...a) => db.updateEntity(...a),
}));

const { validerRepartition, MIN_SIEGES_AU_SEUIL, TOTAL_SIEGES } =
  await import('../functions/repartitionSieges.js');
const { saveResultatsManuels } = await import('../functions/resultatsManuels.js');
const { submitRepartitionSieges, scoreSiegesAndSync, scoreBlocMajoritaire, scenarioMajorite } =
  await import('../functions/prediciteScoringSieges.js');

const LIKOUD = 'l-likoud';
const YESH = 'l-yesh';
const PETITE = 'l-petite';
const ALICE = 'alice@exemple.fr';
const BOB = 'bob@exemple.fr';

const JUSTIF = 'Sondages stables depuis six semaines, report de voix probable.';

function seed() {
  db = createMemoryDb({
    Liste: [
      // name_fr, comme la colonne réelle de la table listes : un seed qui
      // invente « name » masquerait une erreur de nom de colonne côté serveur.
      { id: LIKOUD, name_fr: 'Likoud', bloc: 'pro_netanyahou', is_active: true },
      { id: YESH, name_fr: 'Yesh Atid', bloc: 'anti_netanyahou', is_active: true },
      { id: PETITE, name_fr: 'Petite Liste', bloc: 'anti_netanyahou', is_active: true },
    ],
    CampaignSettings: [
      { id: 'global', key: 'global', predictions_deadline_utc: '2099-01-01T00:00:00Z' },
    ],
    UserProgress: [
      { id: 'up-alice', user_email: ALICE, total_points: 0, participation_points: 0 },
      { id: 'up-bob', user_email: BOB, total_points: 0, participation_points: 0 },
    ],
  });
}

const progressionDe = async (email) =>
  (await db.filterEntity('UserProgress', { user_email: email }))[0];
const pointsDe = async (email) => (await progressionDe(email)).total_points;

const resultatsReels = [
  { liste_id: LIKOUD, seats: 50 },
  { liste_id: YESH, seats: 40 },
  { liste_id: PETITE, seats: 30 },
];

// Alice justifie une liste ; Bob n'en justifie aucune.
const repartitionAlice = [
  { liste_id: LIKOUD, predicted_seats: 50, justification: JUSTIF },
  { liste_id: YESH, predicted_seats: 43 },
  { liste_id: PETITE, predicted_seats: 27 },
];
const repartitionBob = [
  { liste_id: LIKOUD, predicted_seats: 61 },
  { liste_id: YESH, predicted_seats: 29 },
  { liste_id: PETITE, predicted_seats: 30 },
];

test('contrainte de somme sur les 120 sièges', async (t) => {
  t.beforeEach(seed);

  await t.test('le seuil de 3,25 % vaut 4 sièges sur 120', () => {
    assert.equal(TOTAL_SIEGES, 120);
    assert.equal(MIN_SIEGES_AU_SEUIL, 4);
  });

  await t.test('refuse une répartition dont le total n’est pas 120', async () => {
    await assert.rejects(
      () => submitRepartitionSieges(ALICE, {
        predictions: [
          { liste_id: LIKOUD, predicted_seats: 50 },
          { liste_id: YESH, predicted_seats: 40 },
          { liste_id: PETITE, predicted_seats: 25 },
        ],
      }),
      /115 sièges au lieu de 120/,
    );
    assert.equal(db._rows('PronosticSieges').length, 0, 'rien ne doit être enregistré');
  });

  await t.test('refuse un pronostic sous le seuil (1 à 3 sièges)', async () => {
    await assert.rejects(
      () => submitRepartitionSieges(ALICE, {
        predictions: [
          { liste_id: LIKOUD, predicted_seats: 50 },
          { liste_id: YESH, predicted_seats: 68 },
          { liste_id: PETITE, predicted_seats: 2 },
        ],
      }),
      /Petite Liste.*au moins 4 sièges/s,
    );
  });

  await t.test('refuse une répartition incomplète', async () => {
    await assert.rejects(
      () => submitRepartitionSieges(ALICE, {
        predictions: [
          { liste_id: LIKOUD, predicted_seats: 60 },
          { liste_id: YESH, predicted_seats: 60 },
        ],
      }),
      /absente\(s\).*Petite Liste/s,
    );
  });

  await t.test('accepte une répartition complète à 120', async () => {
    const res = await submitRepartitionSieges(ALICE, { predictions: repartitionAlice });
    assert.equal(res.ok, true);
    assert.equal(res.total, 120);
    assert.equal(res.listes, 3);
    assert.equal(db._rows('PronosticSieges').length, 3);
  });

  await t.test('refuse après la clôture', async () => {
    db = createMemoryDb({
      Liste: [{ id: LIKOUD, name_fr: 'Likoud', bloc: 'pro_netanyahou', is_active: true }],
      CampaignSettings: [{ id: 'global', key: 'global', predictions_deadline_utc: '2020-01-01T00:00:00Z' }],
      UserProgress: [{ id: 'up-alice', user_email: ALICE, total_points: 0 }],
    });
    await assert.rejects(
      () => submitRepartitionSieges(ALICE, { predictions: [{ liste_id: LIKOUD, predicted_seats: 120 }] }),
      /pronostics clôturés/,
    );
  });
});

test('points de participation', async (t) => {
  t.beforeEach(seed);

  await t.test('déposer une répartition rapporte des points', async () => {
    await submitRepartitionSieges(ALICE, { predictions: repartitionAlice });
    // 120 pour le dépôt + 50 pour l'unique justification d'Alice.
    assert.equal(await pointsDe(ALICE), 170);
  });

  await t.test('une répartition sans justification rapporte quand même', async () => {
    await submitRepartitionSieges(BOB, { predictions: repartitionBob });
    assert.equal(await pointsDe(BOB), 120);
  });

  await t.test('corriger sa répartition ne recrédite pas la participation', async () => {
    await submitRepartitionSieges(ALICE, { predictions: repartitionAlice });
    await submitRepartitionSieges(ALICE, { predictions: repartitionAlice });
    await submitRepartitionSieges(ALICE, { predictions: repartitionAlice });

    assert.equal(await pointsDe(ALICE), 170, 'la participation ne se cumule pas');
    assert.equal(db._rows('PronosticSieges').length, 3, 'et ne duplique pas les lignes');
  });

  await t.test('ajouter des justifications augmente la participation, une seule fois', async () => {
    await submitRepartitionSieges(ALICE, { predictions: repartitionAlice });
    const enrichie = repartitionAlice.map(p => ({ ...p, justification: JUSTIF }));
    await submitRepartitionSieges(ALICE, { predictions: enrichie });

    // 120 + 3 × 50 = 270, et non 170 + 270.
    const up = await progressionDe(ALICE);
    assert.equal(up.participation_points, 270);
    assert.equal(up.total_points, 270);
  });
});

test('scoring de bout en bout', async (t) => {
  async function scenario() {
    seed();
    await submitRepartitionSieges(ALICE, { predictions: repartitionAlice });
    await submitRepartitionSieges(BOB, { predictions: repartitionBob });
    await saveResultatsManuels({ seats_by_liste: resultatsReels });
  }

  await t.test('crédite exactitude, proximité et seuil', async () => {
    await scenario();
    const res = await scoreSiegesAndSync();
    assert.equal(res.predictions_scored, 6);

    // Alice — précision : 50 exact (150+30) + 43 vs 40 (50+30) + 27 vs 30 (50+30) = 340.
    // Total = 170 de participation + 340.
    assert.equal(await pointsDe(ALICE), 510);
    // Bob — précision : 61 vs 50 (0+30) + 29 vs 40 (0+30) + 30 exact (150+30) = 240.
    // Total = 120 de participation + 240.
    assert.equal(await pointsDe(BOB), 360);
  });

  await t.test('la justification n’est pas repayée au dépouillement', async () => {
    await scenario();
    await scoreSiegesAndSync();
    const justifie = db._rows('PronosticSieges')
      .find(p => p.user_email === ALICE && p.liste_id === LIKOUD);
    // 150 d'exactitude + 30 de seuil, sans les 50 de justification déjà versés.
    assert.equal(justifie.points_earned, 180);
    assert.equal(justifie.is_correct, true);
  });

  await t.test('relancer le scoring ne double pas les points', async () => {
    await scenario();
    await scoreSiegesAndSync();
    await scoreSiegesAndSync();
    await scoreSiegesAndSync();
    assert.equal(await pointsDe(ALICE), 510);
    assert.equal(await pointsDe(BOB), 360);
  });

  await t.test('corriger un résultat corrige le classement, sans cumul', async () => {
    await scenario();
    await scoreSiegesAndSync();
    await saveResultatsManuels({
      seats_by_liste: [
        { liste_id: LIKOUD, seats: 41 }, { liste_id: YESH, seats: 49 }, { liste_id: PETITE, seats: 30 },
      ],
    });
    await scoreSiegesAndSync();

    // Alice : 50 vs 41 (0+30) + 43 vs 49 (0+30) + 27 vs 30 (50+30) = 140.
    assert.equal(await pointsDe(ALICE), 170 + 140);
  });

  await t.test('bonus de scénario : crédité une seule fois', async () => {
    await scenario();
    await scoreSiegesAndSync();

    // Résultat réel : Likoud (coalition) 50, Yesh + Petite (opposition) 70.
    // Le camp anti l'emporte donc AVEC une majorité — ce que l'ancien critère
    // ne voyait pas : il demandait seulement « coalition ≥ 61 ? » et répondait
    // « non », traitant cette victoire nette comme une Knesset sans majorité.
    // Alice prédit 50 / 70 → scénario « anti », juste.
    // Bob prédit 61 / 59  → scénario « pro », faux.
    const res = await scoreBlocMajoritaire();
    assert.equal(res.scenario_reel, 'anti');
    assert.equal(res.users_awarded, 1);
    assert.equal(await pointsDe(ALICE), 560);
    assert.equal(await pointsDe(BOB), 360);

    await scoreBlocMajoritaire();
    await scoreBlocMajoritaire();
    assert.equal(await pointsDe(ALICE), 560, 'le bonus de scénario ne doit pas se cumuler');
  });

  await t.test('les trois scénarios sont distingués', async () => {
    // Ce que l'ancien critère confondait : une majorité adverse et une Knesset
    // sans majorité donnaient toutes deux « coalition < 61 ».
    const blocs = new Map([[LIKOUD, 'pro_netanyahou'], [YESH, 'anti_netanyahou'], [PETITE, 'partis_arabes']]);
    const sieges = (a, b, c) => new Map([[LIKOUD, a], [YESH, b], [PETITE, c]]);

    assert.equal(scenarioMajorite(sieges(61, 49, 10), blocs), 'pro');
    assert.equal(scenarioMajorite(sieges(45, 65, 10), blocs), 'anti');
    assert.equal(scenarioMajorite(sieges(55, 55, 10), blocs), 'aucun',
      'les partis arabes tiennent la balance : personne ne gouverne seul');
    assert.equal(scenarioMajorite(sieges(60, 60, 0), blocs), 'aucun',
      'à un siège près, ce n\'est toujours pas une majorité');
    assert.equal(scenarioMajorite(sieges(120, 0, 0), blocs), 'pro');
  });

  await t.test('une liste hors des deux camps ne fabrique pas de majorité', async () => {
    // Les partis arabes ne comptent dans aucun camp : c'est tout le sujet du
    // pivot. Leur ajouter des sièges ne doit jamais faire basculer le scénario.
    const blocs = new Map([[LIKOUD, 'pro_netanyahou'], [YESH, 'anti_netanyahou'], [PETITE, 'partis_arabes']]);
    const avant = scenarioMajorite(new Map([[LIKOUD, 55], [YESH, 45], [PETITE, 0]]), blocs);
    const apres = scenarioMajorite(new Map([[LIKOUD, 55], [YESH, 45], [PETITE, 20]]), blocs);
    assert.equal(avant, 'aucun');
    assert.equal(apres, 'aucun');
  });

  await t.test('refuse de scorer sans résultat final', async () => {
    seed();
    await submitRepartitionSieges(ALICE, { predictions: repartitionAlice });
    await assert.rejects(() => scoreSiegesAndSync(), /ResultatSieges.*introuvable/);
  });
});

test('lecture paginée du scoring', async (t) => {
  await t.test('score toutes les lignes, pas seulement la première page', async () => {
    seed();

    // 400 joueurs × 3 listes = 1200 pronostics, soit deux pages de 1000.
    // Ce que le test verrouille, c'est que la boucle de pagination assemble
    // TOUTES les pages : si elle s'arrêtait à la première, 1000 lignes
    // seraient scorées au lieu de 1200. (Il ne rejoue pas l'ancien plafond de
    // 5000 lignes — ce code n'existe plus ; c'est la lecture complète qui doit
    // rester vraie quand le nombre de joueurs grandit.)
    const NB_JOUEURS = 400;
    const reels = [[LIKOUD, 50], [YESH, 40], [PETITE, 30]];
    let n = 0;

    for (let u = 0; u < NB_JOUEURS; u++) {
      const email = `joueur${String(u).padStart(4, '0')}@exemple.fr`;
      await db.createEntity('UserProgress', { id: `up-${u}`, user_email: email, total_points: 0 });
      for (const [liste_id, seats] of reels) {
        // id zéro-padé : la pagination trie sur id, on veut un ordre stable.
        await db.createEntity('PronosticSieges', {
          id: `p-${String(n++).padStart(5, '0')}`,
          user_email: email, liste_id,
          predicted_seats: seats,
          predicted_above_threshold: true,
          justification: '', points_earned: 0, is_correct: false,
        });
      }
    }

    await saveResultatsManuels({ seats_by_liste: resultatsReels });
    const res = await scoreSiegesAndSync();

    assert.equal(res.predictions_scored, 1200, 'les 1200 pronostics doivent être scorés');
    assert.equal(res.users_updated, NB_JOUEURS);

    // Un joueur de la DERNIÈRE page doit être crédité comme celui de la première.
    const premier = (await db.filterEntity('UserProgress', { user_email: 'joueur0000@exemple.fr' }))[0];
    const dernier = (await db.filterEntity('UserProgress', { user_email: 'joueur0399@exemple.fr' }))[0];
    assert.equal(premier.total_points, 540); // 3 × (150 exact + 30 seuil)
    assert.equal(dernier.total_points, 540, 'la dernière page ne doit pas être perdue');
  });
});

test('saisie manuelle des résultats', async (t) => {
  t.beforeEach(seed);

  await t.test('refuse un doublon et une liste inconnue', async () => {
    const v = await validerRepartition([
      { liste_id: LIKOUD, seats: 50 }, { liste_id: LIKOUD, seats: 40 },
      { liste_id: YESH, seats: 30 }, { liste_id: 'l-fantome', seats: 0 },
    ]);
    assert.equal(v.ok, false);
    assert.match(v.errors.join(' '), /deux fois/);
    assert.match(v.errors.join(' '), /Liste inconnue/);
  });

  await t.test('le mode aperçu ne persiste rien', async () => {
    const res = await saveResultatsManuels({ seats_by_liste: resultatsReels, dry_run: true });
    assert.equal(res.dry_run, true);
    assert.equal(db._rows('ResultatSieges').length, 0);
  });

  await t.test('enregistre une répartition valide comme résultat final', async () => {
    const res = await saveResultatsManuels({ seats_by_liste: resultatsReels });
    assert.equal(res.ok, true);
    assert.equal(res.total, 120);

    const rows = db._rows('ResultatSieges');
    assert.equal(rows.length, 1);
    assert.equal(rows[0].is_final, true);
  });

  await t.test('corriger les résultats remplace la ligne au lieu d’en créer une seconde', async () => {
    await saveResultatsManuels({ seats_by_liste: resultatsReels });
    const res = await saveResultatsManuels({
      seats_by_liste: [
        { liste_id: LIKOUD, seats: 48 }, { liste_id: YESH, seats: 42 }, { liste_id: PETITE, seats: 30 },
      ],
    });

    assert.equal(res.remplace, true);
    const finaux = db._rows('ResultatSieges').filter(r => r.is_final);
    assert.equal(finaux.length, 1, 'un seul résultat final peut faire foi');
    assert.equal(finaux[0].seats_by_liste.find(r => r.liste_id === LIKOUD).seats, 48);
  });
});
