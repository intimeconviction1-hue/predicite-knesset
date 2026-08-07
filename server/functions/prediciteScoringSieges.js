import { filterEntity, createEntity, updateEntity } from '../db/index.js';
import { lireTout } from '../lib/lireTout.js';
import { validerRepartition, MIN_SIEGES_AU_SEUIL, TOTAL_SIEGES } from './repartitionSieges.js';
// Import d'un module CLIENT, assumé : c'est déjà ce que fait server/lib/meta-html.js
// avec titres.js, le dépôt est déployé entier, et blocs.js est du JS pur sans
// dépendance. Dupliquer le regroupement en camps ici serait la garantie qu'il
// diverge un jour de ce que le site affiche — ce qu'il faisait déjà.
import { campDe } from '../../client/src/lib/blocs.js';

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

// `lireTout` a demenage dans ../lib/lireTout.js : resolvePremierMinistre.js
// avait exactement le meme besoin, et la recopier aurait garanti qu'elles
// divergent un jour.

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

/**
 * Le scénario de majorité qui sort d'une répartition de sièges.
 *
 * Remplace la question « le bloc coalition atteint-il 61 ? », qui avait deux
 * défauts.
 *
 * Le premier est un vrai bug, pas une faiblesse : elle n'interrogeait QU'UN
 * camp. Un joueur qui prévoyait une majorité anti-Netanyahou et un joueur qui
 * prévoyait une Knesset sans majorité répondaient tous deux « coalition < 61 »
 * et étaient traités à l'identique — alors qu'ils avaient prédit deux issues
 * politiques opposées. Le barème ne savait pas les distinguer.
 *
 * Le second : elle ne départage personne. Les deux camps tournent autour de 54
 * dans les sondages d'août 2026, aucun n'approche 61. Le 27 octobre, quasiment
 * tout le monde aura répondu « non », tout le monde touchera les points, et le
 * critère n'aura rien classé — un item de barème pour rien.
 *
 * Trois issues, donc, et il faut choisir la bonne : majorité pro-Netanyahou,
 * majorité anti-Netanyahou, ou aucune des deux — le cas où les partis arabes,
 * ou une recomposition, tiennent la balance. C'est exactement ce que la page
 * d'accueil enseigne depuis les trois blocs.
 *
 * Le regroupement en camps ne vit plus ici : il est importé de
 * client/src/lib/blocs.js, seul endroit où il soit écrit. Il était recopié
 * verbatim dans ce fichier, dans useCampaignFlux, dans la Home et dans
 * MaRepartition — quatre copies d'une même règle, dont c'est le barème qui
 * décidait vraiment. Le barème et l'affichage ne peuvent plus diverger.
 *
 * Depuis le 2026-08-07, `sans_camp` (ex-`non_alignee`) ne compte plus dans le
 * camp anti-Netanyahou : voir CAMP_DE dans blocs.js.
 *
 * @param {Map<string, number>} seatsByListe  liste_id → sièges
 * @param {Map<string, string>} blocById      liste_id → bloc
 * @returns {'pro'|'anti'|'aucun'}
 */
export function scenarioMajorite(seatsByListe, blocById) {
  let pro = 0;
  let anti = 0;
  for (const [liste_id, seats] of seatsByListe.entries()) {
    const camp = campDe(blocById.get(liste_id));
    if (camp === 'pro') pro += seats || 0;
    else if (camp === 'anti') anti += seats || 0;
  }
  if (pro >= MAJORITY_SEATS) return 'pro';
  if (anti >= MAJORITY_SEATS) return 'anti';
  return 'aucun';
}

export async function scoreBlocMajoritaire() {
  const resultat = (await filterEntity('ResultatSieges', { is_final: true }))[0];
  requireField(!!resultat, 'ResultatSieges (is_final=true) introuvable.');

  const listes = await lireTout('Liste');
  const blocById = new Map(listes.map(l => [l.id, l.bloc]));
  const seatsByListe = new Map((resultat.seats_by_liste || []).map(r => [r.liste_id, r.seats]));

  const scenarioReel = scenarioMajorite(seatsByListe, blocById);

  const preds = await lireTout('PronosticSieges');
  const byUser = new Map();
  for (const p of preds) {
    if (!byUser.has(p.user_email)) byUser.set(p.user_email, []);
    byUser.get(p.user_email).push(p);
  }

  let usersUpdated = 0;
  let usersAwarded = 0;
  for (const [email, userPreds] of byUser.entries()) {
    const siegesPredits = new Map(userPreds.map(p => [p.liste_id, p.predicted_seats ?? 0]));
    const scenarioPredit = scenarioMajorite(siegesPredits, blocById);

    const up = (await filterEntity('UserProgress', { user_email: email }))[0];
    if (!up) continue;

    // On applique la DIFFÉRENCE avec ce qui a déjà été crédité, pas le bonus
    // brut : relancer le scoring doit être sans effet, et corriger un résultat
    // saisi par erreur doit reprendre le bonus accordé à tort.
    const attendu = scenarioPredit === scenarioReel ? SCORE.blocBonus : 0;
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
    scenario_reel: scenarioReel,
    users_awarded: usersAwarded,
    users_updated: usersUpdated,
  };
}
