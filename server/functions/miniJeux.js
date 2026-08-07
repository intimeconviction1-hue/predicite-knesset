import { randomUUID } from 'node:crypto';
import { createEntity, updateEntity } from '../db/index.js';
import { ensureUserProgress } from './miscFunctions.js';

/**
 * Crédit des mini-jeux.
 *
 * Les quatre mini-jeux n'écrivaient rien côté serveur : ils appelaient
 * `gate.record()`, qui incrémente un compteur localStorage, et s'arrêtaient là —
 * y compris pour un joueur connecté. Le mur d'inscription qui les bloque au bout
 * de trois parties annonçait pourtant, en tête de ses arguments, « ton score
 * sauvegardé + le classement ». Un visiteur créait donc un compte pour obtenir
 * exactement ce qu'il avait déjà : rien. C'était la seule promesse du produit qui
 * n'était pas tenue, et elle était posée sur le geste de conversion.
 *
 * Les points vont dans learning_points, et non dans la précision : ces jeux sont
 * pédagogiques, c'est le bucket de l'apprentissage. Il est plafonné à 300 dans le
 * calcul du rang (client/src/lib/score.js), donc aucun de ces points ne peut
 * décider d'un classement.
 *
 * Le plafond ne suffit pourtant pas à écarter le grind, contrairement à ce qu'on
 * pourrait croire : le quiz se protège parce que chaque QUESTION ne compte qu'une
 * fois, alors qu'un mini-jeu se rejoue à l'infini. Enchaîner des parties
 * remplirait le bucket entier en une dizaine de minutes. D'où la règle d'un
 * crédit par jeu et par jour, portée par la contrainte UNIQUE de la table :
 * quatre jeux, 40 points par jour, une semaine de visites pour saturer les 300.
 * Revenir est récompensé, pilonner ne l'est pas.
 */

// Identifiants des quatre mini-jeux. Le client envoie l'un de ces jetons et rien
// d'autre : une valeur libre laisserait fabriquer autant de « jeux » que voulu,
// donc autant de crédits quotidiens.
export const JEUX = Object.freeze(['sens-du-vent', 'vrai-ou-fake', 'boussole', 'forme-coalition']);

// Une partie terminée vaut une bonne réponse de quiz en découverte
// (server/functions/quizScoring.js). Même ordre de grandeur pour un même service
// rendu : on a appris quelque chose, sans que ce soit une preuve de flair.
export const POINTS_PAR_PARTIE = 10;

// Le jour de référence est UTC, comme tout ce qui est daté dans ce dépôt. Le
// crédit bascule donc à 2h ou 3h du matin en Israël — c'est-à-dire au creux de
// la nuit, et jamais au milieu d'une session de jeu.
function jourUtc(maintenant = new Date()) {
  return maintenant.toISOString().slice(0, 10);
}

/**
 * Crédite une partie de mini-jeu terminée.
 *
 * Idempotente à la journée : rappeler la fonction le même jour pour le même jeu
 * ne verse rien de plus et ne lève pas d'erreur — le client rejoue autant qu'il
 * veut, l'écran affiche simplement que le crédit du jour est déjà pris.
 *
 * @param {string} user_email  vient TOUJOURS du jeton d'authentification
 * @param {{ jeu: string }} body
 */
export async function crediterPartieMiniJeu(user_email, { jeu } = {}) {
  if (!JEUX.includes(jeu)) {
    const e = new Error(`Mini-jeu inconnu : ${JSON.stringify(jeu)}`);
    e.status = 400;
    throw e;
  }

  const jour = jourUtc();

  // La ligne est posée AVANT le crédit, et c'est la contrainte UNIQUE qui décide.
  // ON CONFLICT DO NOTHING, donc : rejouer le même jeu le même jour est le cas
  // NORMAL — un joueur qui enchaîne trois parties de Vrai ou Fake n'a rien fait
  // de mal, et doit voir son écran de fin, pas une erreur. Un INSERT sec aurait
  // renvoyé une violation de contrainte à la deuxième partie, transformant la
  // règle anti-grind en panne visible.
  //
  // Le SELECT préalable a disparu avec lui : il ne servait qu'à éviter cette
  // exception, et il ouvrait une fenêtre de course entre la lecture et
  // l'écriture. Une seule requête tranche désormais, et elle tranche juste.
  // Créditer d'abord puis marquer inverserait le risque du mauvais côté : on
  // paierait avant de savoir.
  const ligne = await createEntity('MiniJeuPartie', {
    id: randomUUID(), user_email, jeu, jour, points: POINTS_PAR_PARTIE,
  }, { ignoreConflict: true });

  if (!ligne) {
    return { credite: false, motif: 'deja_credite_aujourdhui', points: 0, points_par_partie: POINTS_PAR_PARTIE };
  }

  const up = await ensureUserProgress(user_email);
  await updateEntity('UserProgress', up.id, {
    learning_points: (up.learning_points || 0) + POINTS_PAR_PARTIE,
    total_points: (up.total_points || 0) + POINTS_PAR_PARTIE,
  });

  return {
    credite: true,
    points: POINTS_PAR_PARTIE,
    points_par_partie: POINTS_PAR_PARTIE,
    learning_points: (up.learning_points || 0) + POINTS_PAR_PARTIE,
  };
}
