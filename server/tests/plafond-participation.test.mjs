/**
 * Le plafond de participation doit valoir EXACTEMENT une répartition complète
 * entièrement justifiée.
 *
 * Pourquoi ce test existe : PARTICIPATION_CAP valait 720 en dur, avec un
 * commentaire affirmant qu'« une répartition complète, entièrement justifiée,
 * vaut exactement ce plafond ». C'était vrai pour DOUZE listes — l'état du
 * référentiel le jour où la règle a été écrite. Il y en a treize actives depuis,
 * et le barème réel donne 120 + 13 × 50 = 770 : la treizième justification était
 * écrêtée en silence, sans que ni le joueur ni le code n'en sachent rien.
 *
 * Rien ne pouvait le signaler, parce que les trois informations vivaient dans
 * trois fichiers qui ne se parlent pas : le barème côté serveur, le plafond côté
 * client, et le nombre de listes dans le seed. Ce test les met face à face.
 *
 * Il recassera au gel du référentiel, le 9 septembre 2026, à la première liste
 * déposée ou retirée — et c'est tout son intérêt : échouer bruyamment plutôt que
 * laisser un plafond réécrêter en douce.
 *
 * Les modules serveur sont lus en TEXTE et non importés : `ligues.js` et
 * `prediciteScoringSieges.js` tirent tous deux `../db/index.js`, et aucun test
 * d'intégrité ne doit risquer d'ouvrir une connexion — le .env local pointe la
 * base de production. Le module client, lui, est du JS pur : il s'importe.
 *
 * Ne touche aucune base : lecture de quatre fichiers du dépôt.
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

const lire = (...p) => fs.readFileSync(path.join(racine, ...p), 'utf8');

// ── Les trois sources qui doivent s'accorder ─────────────────────────────
const seed = JSON.parse(lire('docs', 'KNESSET_SEED_LISTES.json'));
const listesActives = (seed.listes || []).filter(l => l.is_active !== false);

const scoring = lire('server', 'functions', 'prediciteScoringSieges.js');
const ligues = lire('server', 'functions', 'ligues.js');

const score = await import(
  pathToFileURL(path.join(racine, 'client', 'src', 'lib', 'score.js')).href
);

/** Extrait un entier nommé d'un source JS, en échouant explicitement s'il a disparu. */
function entier(source, motif, quoi) {
  const m = source.match(motif);
  assert.ok(m, `${quoi} : introuvable. Le test lit le source en texte — si la ` +
    `constante a été renommée ou déplacée, corriger le motif ici plutôt que de ` +
    `supprimer l'assertion.`);
  return Number(m[1]);
}

const ENGAGEMENT = entier(scoring, /engagement:\s*(\d+)/, 'SCORE.engagement (serveur)');
const JUSTIF_BONUS = entier(scoring, /justifBonus:\s*(\d+)/, 'SCORE.justifBonus (serveur)');

test('le plafond vaut exactement une répartition complète entièrement justifiée', () => {
  const attendu = ENGAGEMENT + listesActives.length * JUSTIF_BONUS;

  assert.equal(
    score.PARTICIPATION_CAP, attendu,
    `PARTICIPATION_CAP = ${score.PARTICIPATION_CAP}, attendu ${attendu} ` +
    `(${ENGAGEMENT} d'engagement + ${listesActives.length} listes actives × ${JUSTIF_BONUS}). ` +
    `Le référentiel a bougé : mettre à jour LISTES_ACTIVES dans client/src/lib/score.js ` +
    `ET PARTICIPATION_CAP dans server/functions/ligues.js. Tant que les deux ne suivent pas, ` +
    `les dernières justifications d'un joueur ne comptent pas dans son rang.`,
  );
});

test('le client compte le même nombre de listes actives que le seed', () => {
  assert.equal(
    score.LISTES_ACTIVES, listesActives.length,
    `score.js déclare ${score.LISTES_ACTIVES} listes actives, le seed en contient ` +
    `${listesActives.length} : ${listesActives.map(l => l.name_fr).join(', ')}.`,
  );
});

test('les plafonds du SQL des ligues ne dérivent pas de ceux du client', () => {
  // Même formule des deux côtés du réseau : le classement d'une ligue et le
  // classement général doivent ranger deux joueurs dans le même ordre.
  const paires = [
    ['LEARNING_CAP', score.LEARNING_CAP],
    ['REGULARITY_CAP', score.REGULARITY_CAP],
    ['PARTICIPATION_CAP', score.PARTICIPATION_CAP],
  ];

  for (const [nom, cote_client] of paires) {
    const cote_serveur = entier(ligues, new RegExp(`${nom}\\s*=\\s*(\\d+)`), `${nom} (ligues.js)`);
    assert.equal(
      cote_serveur, cote_client,
      `${nom} : ${cote_serveur} côté ligues.js, ${cote_client} côté client/src/lib/score.js. ` +
      `Les deux classements ne trient plus pareil.`,
    );
  }
});

test('le SQL des ligues interpole ses plafonds au lieu de les réécrire', () => {
  // Le 720 périmé a survécu si longtemps parce qu'il était en chiffres nus dans
  // la requête : aucune recherche sur « PARTICIPATION_CAP » ne pouvait le trouver.
  const requete = ligues.slice(ligues.indexOf('SELECT lm.user_email'));
  const enDur = requete.match(/LEAST\(COALESCE\([^)]*\),\s*(\d+)\)/g);

  assert.equal(
    enDur, null,
    `Plafond(s) réécrit(s) en dur dans le SQL des ligues : ${enDur?.join(' | ')}. ` +
    `Utiliser \${LEARNING_CAP} / \${REGULARITY_CAP} / \${PARTICIPATION_CAP}, sans quoi ` +
    `la prochaine mise à jour du plafond oubliera cette requête.`,
  );
});
