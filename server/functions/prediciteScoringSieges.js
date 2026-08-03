import { filterEntity, listEntity, createEntity, updateEntity } from '../db/index.js';
import { validerRepartition, MIN_SIEGES_AU_SEUIL, TOTAL_SIEGES } from './repartitionSieges.js';

/**
 * Deux monnaies distinctes, et c'est volontaire.
 *
 * PARTICIPATION (engagement + justifications) : versée à la saisie. Participer
 * rapporte toujours des points, ils comptent dans le total affiché et font
 * progresser les titres. Mais ils sont plafonnés dans le calcul du rang
 * (client/src/lib/score.js) : tout le monde peut atteindre ce plafond, donc
 * personne ne gagne un rang en saisissant davantage.
 *
 * PRÉCISION (exactitude, proximité, seuil, bloc) : versée au dépouillement,
 * sans plafond. C'est elle seule qui départage le classement.
 *
 * L'ancienne règle versait 10 + 50 points PAR LISTE dans le total sans plafond :
 * douze justifications de vingt caractères valaient 720 points garantis avant
 * le moindre résultat, et comme le scoring ne pouvait pas tourner faute de
 * résultats parsés, ce score farmé était le score définitif.
 *
 * La justification est payée UNE fois, à la saisie. La repayer au scoring la
 * ferait basculer dans la précision, sans plafond — le garde-fou ne servirait
 * plus à rien.
 */
const SCORE = {
  engagement: 120,   // dépôt d'une répartition complète — un acte, pas douze
  justifBonus: 50,   // par justification d'au moins JUSTIF_MIN caractères
  exactSeat: 150, within1Seat: 100, within3Seats: 50, thresholdBonus: 30, blocBonus: 50,
};
// Clôture par défaut : l'ouverture des bureaux de vote, le 27 octobre 2026 à
// 07h00 en Israël. L'heure d'été israélienne se termine le dimanche 25 octobre :
// le pays est donc à UTC+2 ce jour-là, et non UTC+3 — d'où 05:00Z et pas 04:00Z.
// Écrasée par CampaignSettings.predictions_deadline_utc si la ligne existe.
const FALLBACK_DEADLINE_UTC = '2026-10-27T05:00:00Z';
const MAJORITY_SEATS = 61;
const JUSTIF_MAX = 500;
const JUSTIF_MIN = 20;   // en deçà, ce n'est pas une analyse

function requireField(cond, message) { if (!cond) throw new Error(message); }

async function getDeadlineUtc() {
  const settings = (await filterEntity('CampaignSettings', { key: 'global' }))[0];
  const d = settings?.predictions_deadline_utc;
  if (typeof d === 'string' && d.trim()) {
    const parsed = new Date(d.trim());
    if (!Number.isNaN(parsed.getTime())) return d.trim();
  }
  return FALLBACK_DEADLINE_UTC;
}

function isPastDeadline(deadlineUtc) {
  const d = new Date(deadlineUtc);
  if (Number.isNaN(d.getTime())) return false;
  return new Date() >= d;
}

function seatPointsForError(err) {
  if (err === 0) return SCORE.exactSeat;
  if (err <= 1) return SCORE.within1Seat;
  if (err <= 3) return SCORE.within3Seats;
  return 0;
}

const TAILLE_PAGE = 1000;
// Garde-fou : une boucle de pagination qui ne se termine pas est un bug, pas
// une raison de tronquer. On leve plutot que de rendre un classement partiel.
const PLAFOND_LIGNES = 500000;

/**
 * Lit TOUTES les lignes d'une entite, page par page.
 *
 * L'ancienne version demandait 5000 lignes d'un coup. A douze listes par
 * joueur, la troncature mordait vers 400 joueurs — silencieusement, et le tri
 * par `-created_at` faisait disparaitre les inscrits les PLUS ANCIENS, donc les
 * plus fideles. Un classement faux le soir du scrutin, sans le moindre message.
 *
 * Le tri se fait sur `id` : cle unique, donc pagination stable. `created_at`
 * peut avoir des ex aequo, qui feraient sauter ou repeter des lignes d'une
 * page a l'autre. L'ordre n'a aucune importance ici, tout est parcouru.
 */
async function lireTout(entite) {
  const tout = [];
  for (let offset = 0; ; offset += TAILLE_PAGE) {
    const page = await listEntity(entite, { sort: 'id', limit: TAILLE_PAGE, offset });
    tout.push(...page);
    if (page.length < TAILLE_PAGE) return tout;
    if (tout.length > PLAFOND_LIGNES) {
      throw new Error(`Lecture de ${entite} au-dela de ${PLAFOND_LIGNES} lignes : pagination suspecte, scoring interrompu.`);
    }
  }
}

async function getUserProgress(user_email) {
  const up = (await filterEntity('UserProgress', { user_email }))[0];
  if (!up) throw new Error('UserProgress introuvable pour cet utilisateur.');
  return up;
}

/**
 * Dépose une répartition COMPLÈTE des 120 sièges.
 *
 * Le pronostic était auparavant déposé liste par liste, chacun borné 0–120
 * indépendamment : rien n'obligeait le total à faire 120. Or c'est là tout
 * l'intérêt intellectuel d'une proportionnelle nationale — donner un siège à
 * une liste, c'est le retirer à une autre. Sans contrainte de somme, il n'y a
 * aucun arbitrage à faire, donc pas de jeu.
 *
 * Conséquence heureuse sur les points : déposer une répartition est UN acte,
 * pas douze. Les points de participation ne peuvent donc plus être multipliés
 * par le nombre de listes — et ils sont de toute façon plafonnés dans le calcul
 * du rang (voir client/src/lib/score.js).
 */
export async function submitRepartitionSieges(user_email, body) {
  const deadlineUtc = await getDeadlineUtc();
  if (isPastDeadline(deadlineUtc)) {
    const err = new Error('Phase fermée : pronostics clôturés.');
    err.status = 403; err.deadline_utc = deadlineUtc;
    throw err;
  }

  const entrees = Array.isArray(body?.predictions) ? body.predictions : [];
  const validation = await validerRepartition(
    entrees.map(p => ({ liste_id: p?.liste_id, seats: p?.predicted_seats, justification: p?.justification }))
  );
  if (!validation.ok) {
    const err = new Error(validation.errors.join(' '));
    err.status = 400;
    err.validation = validation;
    throw err;
  }

  const up = await getUserProgress(user_email);
  const existants = await filterEntity('PronosticSieges', { user_email });
  const parListe = new Map(existants.map(p => [p.liste_id, p]));

  let justifiees = 0;

  for (const { liste_id, seats, justification: brute } of validation.normalized) {
    const justification = typeof brute === 'string' ? brute.trim().slice(0, JUSTIF_MAX) : '';
    if (justification.length >= JUSTIF_MIN) justifiees++;

    const payload = {
      user_email, liste_id,
      predicted_seats: seats,
      // Franchir le seuil de 3,25 %, ce n'est pas « avoir au moins un siège » :
      // c'est en avoir au moins MIN_SIEGES_AU_SEUIL. Comparer à 0 offrait le
      // bonus à qui prédisait 1, 2 ou 3 sièges — des scores que la loi rend
      // impossibles.
      predicted_above_threshold: seats >= MIN_SIEGES_AU_SEUIL,
      justification,
      is_correct: false,
    };

    const existing = parListe.get(liste_id);
    if (existing) {
      await updateEntity('PronosticSieges', existing.id, payload);
    } else {
      await createEntity('PronosticSieges', { ...payload, points_earned: 0 });
    }
  }

  // Participation : recalculée à chaque dépôt puis appliquée en DIFFÉRENCE, de
  // sorte que corriger sa répartition dix fois ne rapporte pas dix fois.
  const participationDue = SCORE.engagement + justifiees * SCORE.justifBonus;
  const dejaCredite = up.participation_points ?? 0;
  const delta = participationDue - dejaCredite;
  if (delta !== 0) {
    await updateEntity('UserProgress', up.id, {
      total_points: (up.total_points ?? 0) + delta,
      participation_points: participationDue,
    });
  }

  return {
    ok: true,
    listes: validation.normalized.length,
    total: validation.total,
    justifications: justifiees,
    participation_points: participationDue,
    participation_delta: delta,
  };
}

export async function scoreSiegesAndSync() {
  const resultat = (await filterEntity('ResultatSieges', { is_final: true }))[0];
  requireField(!!resultat, 'ResultatSieges (is_final=true) introuvable.');

  const seatsByListe = new Map((resultat.seats_by_liste || []).map(r => [r.liste_id, r.seats]));
  const preds = await lireTout('PronosticSieges');

  const deltaByUser = new Map();

  for (const p of preds) {
    const realSeats = seatsByListe.get(p.liste_id);
    if (realSeats == null) continue;

    const oldPoints = p.points_earned ?? 0;
    const err = Math.abs((p.predicted_seats ?? 0) - realSeats);
    let finalPoints = seatPointsForError(err);

    const realAboveThreshold = realSeats >= MIN_SIEGES_AU_SEUIL;
    if (!!p.predicted_above_threshold === realAboveThreshold) finalPoints += SCORE.thresholdBonus;

    // Pas de bonus de justification ici : il a déjà été versé à la saisie, dans
    // les points de participation (plafonnés). Le rejouer au dépouillement le
    // ferait compter dans la précision, sans plafond, et rendrait de nouveau le
    // classement farmable à coups de justifications de vingt caractères.

    const delta = finalPoints - oldPoints;
    deltaByUser.set(p.user_email, (deltaByUser.get(p.user_email) ?? 0) + delta);

    await updateEntity('PronosticSieges', p.id, { points_earned: finalPoints, is_correct: err === 0 });
  }

  for (const [email, delta] of deltaByUser.entries()) {
    const up = (await filterEntity('UserProgress', { user_email: email }))[0];
    if (!up) continue;
    await updateEntity('UserProgress', up.id, { total_points: (up.total_points ?? 0) + delta });
  }

  return { ok: true, users_updated: deltaByUser.size, predictions_scored: preds.length };
}

export async function scoreBlocMajoritaire() {
  const resultat = (await filterEntity('ResultatSieges', { is_final: true }))[0];
  requireField(!!resultat, 'ResultatSieges (is_final=true) introuvable.');

  const listes = await lireTout('Liste');
  const blocById = new Map(listes.map(l => [l.id, l.bloc]));
  const seatsByListe = new Map((resultat.seats_by_liste || []).map(r => [r.liste_id, r.seats]));

  let coalitionSeats = 0;
  for (const [liste_id, seats] of seatsByListe.entries()) {
    if (blocById.get(liste_id) === 'coalition') coalitionSeats += seats;
  }
  const realCoalitionMajority = coalitionSeats >= MAJORITY_SEATS;

  const preds = await lireTout('PronosticSieges');
  const byUser = new Map();
  for (const p of preds) {
    if (!byUser.has(p.user_email)) byUser.set(p.user_email, []);
    byUser.get(p.user_email).push(p);
  }

  let usersUpdated = 0;
  let usersAwarded = 0;
  for (const [email, userPreds] of byUser.entries()) {
    let predictedCoalitionSeats = 0;
    for (const p of userPreds) {
      if (blocById.get(p.liste_id) === 'coalition') predictedCoalitionSeats += (p.predicted_seats ?? 0);
    }
    const predictedMajority = predictedCoalitionSeats >= MAJORITY_SEATS;

    const up = (await filterEntity('UserProgress', { user_email: email }))[0];
    if (!up) continue;

    // On applique la DIFFÉRENCE avec ce qui a déjà été crédité, pas le bonus
    // brut : relancer le scoring doit être sans effet, et corriger un résultat
    // saisi par erreur doit reprendre le bonus accordé à tort.
    const attendu = predictedMajority === realCoalitionMajority ? SCORE.blocBonus : 0;
    const dejaCredite = up.bloc_bonus_points ?? 0;
    const delta = attendu - dejaCredite;

    if (attendu > 0) usersAwarded++;
    if (delta !== 0) {
      await updateEntity('UserProgress', up.id, {
        total_points: (up.total_points ?? 0) + delta,
        bloc_bonus_points: attendu,
      });
      usersUpdated++;
    }
  }

  return {
    ok: true,
    real_coalition_seats: coalitionSeats,
    real_coalition_majority: realCoalitionMajority,
    users_awarded: usersAwarded,
    users_updated: usersUpdated,
  };
}
