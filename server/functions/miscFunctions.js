import { randomUUID } from 'node:crypto';
import { filterEntity, createEntity, updateEntity } from '../db/index.js';

export async function ensureUserProgress(user_email) {
  const existing = (await filterEntity('UserProgress', { user_email }))[0];
  if (existing) return existing;
  return createEntity('UserProgress', { id: randomUUID(), user_email });
}

function daysBetween(a, b) {
  const ms = new Date(b).setHours(0, 0, 0, 0) - new Date(a).setHours(0, 0, 0, 0);
  return Math.round(ms / 86400000);
}

const STREAK_BONUS_EVERY = 7;
const STREAK_BONUS_POINTS = 75;

/**
 * Incrémente le streak si l'utilisateur n'avait pas déjà été actif aujourd'hui,
 * le remet à 1 si plus d'un jour d'écart. Tous les 7 jours consécutifs, verse
 * le bonus de régularité annoncé sur la page Règles du jeu (+75 pts).
 * Les badges de régularité (Badge/user_badges) restent à câbler côté UI.
 */
export async function updateStreakAndBadges(user_email) {
  const up = await ensureUserProgress(user_email);
  const today = new Date().toISOString().slice(0, 10);

  if (up.last_active_date === today) {
    return { ok: true, current_streak: up.current_streak, bonus_awarded: false, new_badges: [] };
  }

  const gap = up.last_active_date ? daysBetween(up.last_active_date, today) : null;
  const newStreak = gap === 1 ? (up.current_streak || 0) + 1 : 1;
  const bonusAwarded = newStreak > 0 && newStreak % STREAK_BONUS_EVERY === 0;

  await updateEntity('UserProgress', up.id, {
    current_streak: newStreak,
    last_active_date: today,
    ...(bonusAwarded ? {
      regularity_points: (up.regularity_points || 0) + STREAK_BONUS_POINTS,
      total_points: (up.total_points || 0) + STREAK_BONUS_POINTS,
    } : {}),
  });

  return { ok: true, current_streak: newStreak, bonus_awarded: bonusAwarded, new_badges: [] };
}
