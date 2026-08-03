import { randomUUID } from 'node:crypto';
import { pool, queryAll, filterEntity, createEntity, updateEntity } from '../db/index.js';

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

// ───────────────────────────────────────────────────────────────────────────
// BADGES
//
// Les DÉFINITIONS (libellé, description, icône) vivent en base, semées depuis
// docs/KNESSET_SEED_BADGES.json par `npm run seed:badges`. Ici ne vivent que
// les CRITÈRES — c'est-à-dire du code, qu'un JSON ne saurait porter. Les deux
// s'apparient par `code` : une règle dont le code n'est pas en base est
// ignorée (base pas encore semée = aucun badge attribué, pas de plantage), et
// un badge en base sans règle ici ne sera simplement jamais attribué.
//
// ⚠️ Les seuils ci-dessous sont ce que le joueur LIT dans l'infobulle du
// BadgeShelf : toute modification doit être répercutée dans la `description`
// du JSON, sinon on promet une chose et on en récompense une autre.

const JUSTIF_MIN = 20;   // même seuil que prediciteScoringSieges.js

/**
 * Statistiques du joueur, en UNE requête.
 *
 * On ne se sert PAS de user_progress.predictions_count / correct_predictions :
 * ces deux colonnes existent mais aucun code du serveur ne les alimente
 * aujourd'hui (vérifié le 2026-08-03) — un badge assis dessus ne tomberait
 * jamais. On compte donc sur les tables qui font foi.
 */
async function collecterStats(user_email) {
  const { rows } = await pool.query(
    `SELECT
       (SELECT COUNT(*) FROM pronostics_sieges WHERE user_email = $1)                          AS listes_pronostiquees,
       (SELECT COUNT(*) FROM pronostics_sieges
          WHERE user_email = $1 AND justification IS NOT NULL
            AND length(btrim(justification)) >= $2)                                            AS justifications,
       (SELECT COUNT(*) FROM pronostics_sieges WHERE user_email = $1 AND is_correct = 1)       AS sieges_exacts,
       (SELECT COUNT(*) FROM pronostics_pm WHERE user_email = $1)                              AS pronostics_pm,
       (SELECT COUNT(*) FROM quiz_reponses WHERE user_email = $1 AND is_correct = 1)           AS quiz_bonnes,
       (SELECT COUNT(*) FROM paris_mises WHERE user_email = $1)                                AS mises,
       (SELECT COUNT(*) FROM paris_mises WHERE user_email = $1 AND statut = 'gagne')           AS paris_gagnes,
       (SELECT COUNT(*) FROM ligue_membres WHERE user_email = $1)                              AS ligues`,
    [user_email, JUSTIF_MIN]
  );
  const r = rows[0] || {};
  // COUNT(*) revient en chaîne avec pg (bigint) : sans Number(), '10' >= 5 est
  // vrai mais '5' >= 30 aussi ferait des surprises en comparaison lexicale.
  const n = (v) => Number(v || 0);
  return {
    listes_pronostiquees: n(r.listes_pronostiquees),
    justifications: n(r.justifications),
    sieges_exacts: n(r.sieges_exacts),
    pronostics_pm: n(r.pronostics_pm),
    quiz_bonnes: n(r.quiz_bonnes),
    mises: n(r.mises),
    paris_gagnes: n(r.paris_gagnes),
    ligues: n(r.ligues),
  };
}

// L'ordre n'a pas d'importance ici (l'affichage se trie sur l'id du badge),
// mais on le garde aligné sur celui du JSON pour la relecture.
const REGLES_BADGES = [
  { code: 'premier-pronostic', gagne: (s) => s.listes_pronostiquees >= 1 },
  { code: 'plume-analyste',    gagne: (s) => s.justifications >= 5 },
  { code: 'faiseur-de-rois',   gagne: (s) => s.pronostics_pm >= 1 },
  { code: 'serie-3',           gagne: (s) => s.current_streak >= 3 },
  { code: 'curieux',           gagne: (s) => s.quiz_bonnes >= 5 },
  { code: 'premiere-mise',     gagne: (s) => s.mises >= 1 },
  { code: 'esprit-de-ligue',   gagne: (s) => s.ligues >= 1 },
  { code: 'semaine-pleine',    gagne: (s) => s.current_streak >= 7 },
  { code: 'flair-des-paris',   gagne: (s) => s.paris_gagnes >= 5 },
  { code: 'politologue',       gagne: (s) => s.quiz_bonnes >= 30 },
  { code: 'inusable',          gagne: (s) => s.current_streak >= 30 },
  { code: 'analyste-precis',   gagne: (s) => s.sieges_exacts >= 3 },
];

/**
 * Évalue TOUS les critères et attribue ceux qui sont remplis.
 *
 * Renvoie uniquement les badges gagnés À CET APPEL, pour que l'interface
 * puisse les célébrer sans rejouer la fête à chaque chargement. La garantie
 * ne repose pas sur une lecture préalable (deux onglets peuvent évaluer en
 * même temps) mais sur `ON CONFLICT DO NOTHING` + `rowCount` : seule
 * l'insertion qui a réellement créé la ligne annonce un nouveau badge.
 *
 * Le streak arrive en paramètre plutôt que d'être relu : l'appelant vient
 * peut-être de l'incrémenter, et une relecture verrait la valeur d'hier.
 */
export async function attribuerBadges(user_email, { current_streak = 0 } = {}) {
  const definis = await queryAll('SELECT code, label, description, icon FROM badges');
  if (definis.length === 0) return [];   // table pas encore semée

  const parCode = new Map(definis.map(b => [b.code, b]));
  const deja = new Set(
    (await queryAll('SELECT badge_code FROM user_badges WHERE user_email = ?', [user_email]))
      .map(r => r.badge_code)
  );

  // Tout est déjà gagné (ou aucune règle ne correspond aux badges semés) : on
  // s'arrête ici, sans payer la requête de statistiques.
  const candidats = REGLES_BADGES.filter(r => parCode.has(r.code) && !deja.has(r.code));
  if (candidats.length === 0) return [];

  const stats = { ...(await collecterStats(user_email)), current_streak: Number(current_streak) || 0 };

  const nouveaux = [];
  for (const regle of candidats) {
    if (!regle.gagne(stats)) continue;

    const res = await pool.query(
      `INSERT INTO user_badges (id, user_email, badge_code) VALUES ($1, $2, $3)
       ON CONFLICT (user_email, badge_code) DO NOTHING`,
      [randomUUID(), user_email, regle.code]
    );
    if (res.rowCount !== 1) continue;   // course : un autre appel l'a déjà posé

    const def = parCode.get(regle.code);
    nouveaux.push({ code: regle.code, label: def.label, description: def.description, icon: def.icon });
  }
  return nouveaux;
}

/**
 * Badges d'un joueur, pour l'affichage (BadgeShelf).
 *
 * Le passage par cette lecture sert aussi de RATTRAPAGE : `updateStreakAndBadges`
 * n'est appelé qu'une fois par jour (verrou sessionStorage dans Layout.jsx),
 * donc un badge gagné en cours de journée n'apparaîtrait que le lendemain.
 * L'attribution étant idempotente, la rejouer ici ne coûte que deux requêtes
 * quand il n'y a rien à gagner, et rend la vitrine immédiatement juste.
 */
export async function getUserBadges(user_email) {
  const up = await ensureUserProgress(user_email);

  let new_badges = [];
  try {
    new_badges = await attribuerBadges(user_email, { current_streak: up.current_streak || 0 });
  } catch (e) {
    console.error('[badges] rattrapage impossible, lecture seule :', e.message);
  }

  const badges = await queryAll(
    `SELECT ub.badge_code AS code, ub.earned_at, b.label, b.description, b.icon
       FROM user_badges ub
       JOIN badges b ON b.code = ub.badge_code
      WHERE ub.user_email = ?
      ORDER BY ub.earned_at ASC, b.id ASC`,
    [user_email]
  );

  return { badges, new_badges };
}

/**
 * Incrémente le streak si l'utilisateur n'avait pas déjà été actif aujourd'hui,
 * le remet à 1 si plus d'un jour d'écart. Tous les 7 jours consécutifs, verse
 * le bonus de régularité annoncé sur la page Règles du jeu (+75 pts). Évalue
 * ensuite tous les critères de badges et attribue ceux qui sont remplis.
 *
 * Appelé une fois par jour et par utilisateur depuis client/src/Layout.jsx.
 */
export async function updateStreakAndBadges(user_email) {
  const up = await ensureUserProgress(user_email);
  const today = new Date().toISOString().slice(0, 10);

  let current_streak = up.current_streak || 0;
  let bonus_awarded = false;

  // Déjà actif aujourd'hui : la série ne bouge pas, mais on continue quand même
  // vers les badges — l'ancienne version sortait ici, et un joueur qui remplissait
  // un critère après son premier passage du jour attendait le lendemain.
  if (up.last_active_date !== today) {
    const gap = up.last_active_date ? daysBetween(up.last_active_date, today) : null;
    current_streak = gap === 1 ? (up.current_streak || 0) + 1 : 1;
    bonus_awarded = current_streak > 0 && current_streak % STREAK_BONUS_EVERY === 0;

    await updateEntity('UserProgress', up.id, {
      current_streak,
      last_active_date: today,
      ...(bonus_awarded ? {
        regularity_points: (up.regularity_points || 0) + STREAK_BONUS_POINTS,
        total_points: (up.total_points || 0) + STREAK_BONUS_POINTS,
      } : {}),
    });
  }

  // La série est le cœur de la rétention : elle doit être enregistrée quoi qu'il
  // arrive. Un badge qui plante (table absente, base semée à moitié) ne doit
  // jamais faire échouer l'appel — d'où le try/catch, volontairement large.
  let new_badges = [];
  try {
    new_badges = await attribuerBadges(user_email, { current_streak });
  } catch (e) {
    console.error('[badges] attribution ignorée pour cet appel :', e.message);
  }

  return { ok: true, current_streak, bonus_awarded, new_badges };
}
