import { filterEntity, listEntity, updateEntity } from '../db/index.js';

const PM_POINTS = 100;

function getUserProgress(user_email) {
  return filterEntity('UserProgress', { user_email })[0] || null;
}

export function resolvePremierMinistre(investedCandidatPmId) {
  const investedId = (investedCandidatPmId || '').trim();
  if (!investedId) throw new Error('investedCandidatPmId requis (id CandidatPM, ou "autre").');

  const pending = listEntity('PronosticPM', { limit: 5000 }).filter(p => !p.resolved_at);
  const now = new Date().toISOString();
  let usersUpdated = 0;

  for (const p of pending) {
    const correct = p.candidat_pm_id === investedId;
    const points = correct ? PM_POINTS : 0;

    updateEntity('PronosticPM', p.id, { resolved_at: now, resolved_value: investedId, points_earned: points });

    if (points > 0) {
      const up = getUserProgress(p.user_email);
      if (up) {
        updateEntity('UserProgress', up.id, { total_points: (up.total_points ?? 0) + points });
        usersUpdated++;
      }
    }
  }

  return { ok: true, resolved: pending.length, users_awarded: usersUpdated };
}

export function autoResolveIfExpired() {
  const settings = filterEntity('CampaignSettings', { key: 'global' })[0];
  const deadline = settings?.pm_resolution_deadline_utc;
  if (!deadline) return { ok: true, message: "pm_resolution_deadline_utc non défini — rien à faire." };

  const expired = new Date() >= new Date(deadline);
  if (!expired) return { ok: true, message: 'Deadline de résolution automatique non atteinte.' };

  const pending = listEntity('PronosticPM', { limit: 5000 }).filter(p => !p.resolved_at);
  const now = new Date().toISOString();
  for (const p of pending) {
    updateEntity('PronosticPM', p.id, {
      resolved_at: now,
      resolved_value: 'autre',
      points_earned: p.candidat_pm_id === 'autre' ? PM_POINTS : 0,
    });
  }

  return { ok: true, resolved: pending.length, resolution: 'autre (deadline expirée sans investiture connue)' };
}
