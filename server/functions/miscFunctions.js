import { randomUUID } from 'node:crypto';
import { filterEntity, createEntity, updateEntity } from '../db/index.js';

export function ensureUserProgress(user_email) {
  const existing = filterEntity('UserProgress', { user_email })[0];
  if (existing) return existing;
  return createEntity('UserProgress', { id: randomUUID(), user_email });
}

function daysBetween(a, b) {
  const ms = new Date(b).setHours(0, 0, 0, 0) - new Date(a).setHours(0, 0, 0, 0);
  return Math.round(ms / 86400000);
}

/**
 * Version volontairement simple : incrémente le streak si l'utilisateur n'avait
 * pas déjà été actif aujourd'hui, le remet à 1 si plus d'un jour d'écart.
 * Les badges de régularité (Badge/user_badges) restent à câbler côté UI —
 * cette fonction pose juste la mécanique de streak.
 */
export function updateStreakAndBadges(user_email) {
  const up = ensureUserProgress(user_email);
  const today = new Date().toISOString().slice(0, 10);

  if (up.last_active_date === today) {
    return { ok: true, current_streak: up.current_streak, new_badges: [] };
  }

  const gap = up.last_active_date ? daysBetween(up.last_active_date, today) : null;
  const newStreak = gap === 1 ? (up.current_streak || 0) + 1 : 1;

  updateEntity('UserProgress', up.id, { current_streak: newStreak, last_active_date: today });

  return { ok: true, current_streak: newStreak, new_badges: [] };
}
