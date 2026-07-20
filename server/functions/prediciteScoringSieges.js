import { filterEntity, listEntity, createEntity, updateEntity } from '../db/index.js';

const SCORE = { engagement: 10, exactSeat: 150, within1Seat: 100, within3Seats: 50, thresholdBonus: 30, blocBonus: 50 };
const FALLBACK_DEADLINE_UTC = '2026-10-26T04:00:00Z';
const MAJORITY_SEATS = 61;
const JUSTIF_MAX = 500;

function requireField(cond, message) { if (!cond) throw new Error(message); }

function getDeadlineUtc() {
  const settings = filterEntity('CampaignSettings', { key: 'global' })[0];
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

function getUserProgress(user_email) {
  const up = filterEntity('UserProgress', { user_email })[0];
  if (!up) throw new Error('UserProgress introuvable pour cet utilisateur.');
  return up;
}

export function submitPronosticSieges(user_email, body) {
  requireField(typeof body.liste_id === 'string' && body.liste_id.trim(), 'liste_id requis.');
  requireField(Number.isFinite(body.predicted_seats), 'predicted_seats doit être un nombre.');
  const liste_id = body.liste_id.trim();
  const predicted_seats = Math.max(0, Math.min(120, Math.round(body.predicted_seats)));

  const deadlineUtc = getDeadlineUtc();
  if (isPastDeadline(deadlineUtc)) {
    const err = new Error('Phase fermée : pronostics clôturés.');
    err.status = 403; err.deadline_utc = deadlineUtc;
    throw err;
  }

  const liste = filterEntity('Liste', { id: liste_id })[0];
  requireField(!!liste, 'Liste introuvable.');

  const up = getUserProgress(user_email);
  const existing = filterEntity('PronosticSieges', { user_email, liste_id })[0] || null;

  const justification = typeof body.justification === 'string' ? body.justification.trim().slice(0, JUSTIF_MAX) : '';
  const hasJustification = justification.length >= 20;
  const newPoints = existing ? (existing.points_earned ?? 0) : (SCORE.engagement + (hasJustification ? 50 : 0));
  const delta = existing ? 0 : newPoints;

  const payload = {
    user_email, liste_id, predicted_seats,
    predicted_above_threshold: predicted_seats > 0,
    justification, points_earned: newPoints, is_correct: false,
  };

  if (existing) {
    updateEntity('PronosticSieges', existing.id, payload);
  } else {
    createEntity('PronosticSieges', payload);
    updateEntity('UserProgress', up.id, { total_points: (up.total_points ?? 0) + delta });
  }

  return { ok: true, awarded: newPoints, delta, updated: !!existing };
}

export function scoreSiegesAndSync() {
  const resultat = filterEntity('ResultatSieges', { is_final: true })[0];
  requireField(!!resultat, 'ResultatSieges (is_final=true) introuvable.');

  const seatsByListe = new Map((resultat.seats_by_liste || []).map(r => [r.liste_id, r.seats]));
  const preds = listEntity('PronosticSieges', { sort: '-created_at', limit: 5000 });

  const deltaByUser = new Map();

  for (const p of preds) {
    const realSeats = seatsByListe.get(p.liste_id);
    if (realSeats == null) continue;

    const oldPoints = p.points_earned ?? 0;
    const err = Math.abs((p.predicted_seats ?? 0) - realSeats);
    let finalPoints = seatPointsForError(err);

    const realAboveThreshold = realSeats > 0;
    if (!!p.predicted_above_threshold === realAboveThreshold) finalPoints += SCORE.thresholdBonus;

    const delta = finalPoints - oldPoints;
    deltaByUser.set(p.user_email, (deltaByUser.get(p.user_email) ?? 0) + delta);

    updateEntity('PronosticSieges', p.id, { points_earned: finalPoints, is_correct: err === 0 });
  }

  for (const [email, delta] of deltaByUser.entries()) {
    const up = filterEntity('UserProgress', { user_email: email })[0];
    if (!up) continue;
    updateEntity('UserProgress', up.id, { total_points: (up.total_points ?? 0) + delta });
  }

  return { ok: true, users_updated: deltaByUser.size, predictions_scored: preds.length };
}

export function scoreBlocMajoritaire() {
  const resultat = filterEntity('ResultatSieges', { is_final: true })[0];
  requireField(!!resultat, 'ResultatSieges (is_final=true) introuvable.');

  const listes = listEntity('Liste', { sort: '-created_at', limit: 200 });
  const blocById = new Map(listes.map(l => [l.id, l.bloc]));
  const seatsByListe = new Map((resultat.seats_by_liste || []).map(r => [r.liste_id, r.seats]));

  let coalitionSeats = 0;
  for (const [liste_id, seats] of seatsByListe.entries()) {
    if (blocById.get(liste_id) === 'coalition') coalitionSeats += seats;
  }
  const realCoalitionMajority = coalitionSeats >= MAJORITY_SEATS;

  const preds = listEntity('PronosticSieges', { sort: '-created_at', limit: 5000 });
  const byUser = new Map();
  for (const p of preds) {
    if (!byUser.has(p.user_email)) byUser.set(p.user_email, []);
    byUser.get(p.user_email).push(p);
  }

  let usersUpdated = 0;
  for (const [email, userPreds] of byUser.entries()) {
    let predictedCoalitionSeats = 0;
    for (const p of userPreds) {
      if (blocById.get(p.liste_id) === 'coalition') predictedCoalitionSeats += (p.predicted_seats ?? 0);
    }
    const predictedMajority = predictedCoalitionSeats >= MAJORITY_SEATS;
    if (predictedMajority === realCoalitionMajority) {
      const up = filterEntity('UserProgress', { user_email: email })[0];
      if (up) {
        updateEntity('UserProgress', up.id, { total_points: (up.total_points ?? 0) + SCORE.blocBonus });
        usersUpdated++;
      }
    }
  }

  return { ok: true, real_coalition_seats: coalitionSeats, real_coalition_majority: realCoalitionMajority, users_updated: usersUpdated };
}
