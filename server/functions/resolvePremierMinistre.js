import { filterEntity, updateEntity } from '../db/index.js';
import { lireTout } from '../lib/lireTout.js';

const PM_POINTS = 100;

async function getUserProgress(user_email) {
  return (await filterEntity('UserProgress', { user_email }))[0] || null;
}

/**
 * Résout le pronostic « qui sera Premier ministre » : marque chaque pronostic
 * en attente, et CRÉDITE les gagnants au classement.
 *
 * `investedCandidatPmId` est l'identifiant du CandidatPM effectivement investi,
 * ou la chaîne « autre » quand l'investiture échappe aux candidats proposés.
 *
 * Deux corrections du 2026-08-07, signalées par un audit externe.
 *
 * 1. La lecture se faisait en `listEntity('PronosticPM', { limit: 5000 })`,
 *    SANS `sort`. Or `listEntity` ne pose un `ORDER BY` que si on lui donne un
 *    tri (voir db/index.js) : Postgres ne garantit alors aucun ordre. Ce
 *    n'étaient donc pas « les 5000 plus récents », c'étaient 5000 lignes
 *    arbitraires, possiblement différentes d'une exécution à l'autre. Au-delà
 *    de 5000 pronostics, une partie des joueurs n'aurait jamais été résolue —
 *    et `resolved: pending.length` aurait affiché un chiffre d'apparence
 *    parfaitement normale. Le soir du scrutin, sans le moindre message.
 *
 * 2. `autoResolveIfExpired` faisait la moitié du travail (voir plus bas).
 */
export async function resolvePremierMinistre(investedCandidatPmId) {
  const investedId = (investedCandidatPmId || '').trim();
  if (!investedId) throw new Error('investedCandidatPmId requis (id CandidatPM, ou "autre").');

  const pending = (await lireTout('PronosticPM')).filter(p => !p.resolved_at);
  const now = new Date().toISOString();
  let usersUpdated = 0;

  for (const p of pending) {
    const correct = p.candidat_pm_id === investedId;
    const points = correct ? PM_POINTS : 0;

    await updateEntity('PronosticPM', p.id, { resolved_at: now, resolved_value: investedId, points_earned: points });

    if (points > 0) {
      const up = await getUserProgress(p.user_email);
      if (up) {
        await updateEntity('UserProgress', up.id, { total_points: (up.total_points ?? 0) + points });
        usersUpdated++;
      }
    }
  }

  return { ok: true, resolved: pending.length, users_awarded: usersUpdated };
}

/**
 * Résolution automatique à l'expiration de la date butoir : faute d'investiture
 * connue, tout se résout sur « autre ».
 *
 * Elle avait sa PROPRE boucle, qui écrivait `points_earned` sur la ligne du
 * pronostic sans jamais incrémenter `total_points`. Et `total_points` n'est
 * recalculé nulle part dans le projet — il n'est qu'incrémenté, ici comme dans
 * le quiz, les paris et le scoring des sièges. Les 100 points des joueurs ayant
 * misé « autre » existaient donc sur leur ligne de pronostic mais n'atteignaient
 * jamais le classement, définitivement.
 *
 * Elle ne réécrit plus cette boucle : elle DÉLÈGUE. Résoudre à l'expiration,
 * c'est résoudre sur « autre » — même traitement, seul l'identifiant investi
 * change. Deux implémentations d'une même règle finissent toujours par
 * diverger ; c'est précisément ce qui s'était produit.
 */
export async function autoResolveIfExpired() {
  const settings = (await filterEntity('CampaignSettings', { key: 'global' }))[0];
  const deadline = settings?.pm_resolution_deadline_utc;
  if (!deadline) return { ok: true, message: "pm_resolution_deadline_utc non défini — rien à faire." };

  const expired = new Date() >= new Date(deadline);
  if (!expired) return { ok: true, message: 'Deadline de résolution automatique non atteinte.' };

  const res = await resolvePremierMinistre('autre');
  return { ...res, resolution: 'autre (deadline expirée sans investiture connue)' };
}
