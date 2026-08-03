// Ligues privées : jouer « contre ses potes ». Une ligue = un nom + un code
// d'invitation court. On rejoint par le code, on se compare sur le score
// permanent (user_progress.total_points). Pur jeu de points, aucune donnée
// sensible : on ne renvoie jamais les e-mails des autres membres, seulement un
// nom d'affichage.
import { pool, queryAll, queryOne, run } from '../db/index.js';
import { randomUUID, randomInt } from 'node:crypto';

// Alphabet sans caractères ambigus (0/O, 1/I/L) pour un code lisible à l'oral.
// Code de 8 caractères tirés au sort par CSPRNG (crypto.randomInt) : ~30^8 ≈
// 6,5·10^11 combinaisons, non prédictible — seule protection d'une ligue privée
// (pas de rate-limiter côté infra), donc on ne lésine pas sur l'entropie.
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const CODE_LEN = 8;
const MAX_LIGUES_PAR_USER = 20;
const NAME_MIN = 2, NAME_MAX = 40;

function randomCode() {
  let out = '';
  for (let i = 0; i < CODE_LEN; i++) {
    out += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  }
  return out;
}

async function uniqueCode() {
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = randomCode();
    const existing = await queryOne('SELECT id FROM ligues WHERE invite_code = ?', [code]);
    if (!existing) return code;
  }
  throw new Error("Impossible de générer un code d'invitation, réessaie.");
}

function normalizeCode(raw) {
  return String(raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, CODE_LEN);
}

async function memberCount(ligue_id) {
  const row = await queryOne('SELECT COUNT(*) AS n FROM ligue_membres WHERE ligue_id = ?', [ligue_id]);
  return Number(row?.n || 0);
}

function shapeLigue(row, user_email, count) {
  return {
    id: row.id,
    name: row.name,
    invite_code: row.invite_code,
    member_count: count,
    is_owner: row.owner_email === user_email,
  };
}

export async function createLigue(user_email, body) {
  const name = String(body?.name || '').trim();
  if (name.length < NAME_MIN || name.length > NAME_MAX) {
    throw new Error(`Le nom de la ligue doit faire entre ${NAME_MIN} et ${NAME_MAX} caractères.`);
  }
  const owned = await queryOne('SELECT COUNT(*) AS n FROM ligues WHERE owner_email = ?', [user_email]);
  if (Number(owned?.n || 0) >= MAX_LIGUES_PAR_USER) {
    throw new Error(`Tu as déjà créé ${MAX_LIGUES_PAR_USER} ligues — c'est la limite.`);
  }

  const id = randomUUID();
  const code = await uniqueCode();
  await run('INSERT INTO ligues (id, name, invite_code, owner_email) VALUES (?, ?, ?, ?)', [id, name, code, user_email]);
  await run('INSERT INTO ligue_membres (id, ligue_id, user_email) VALUES (?, ?, ?)', [randomUUID(), id, user_email]);

  const row = await queryOne('SELECT * FROM ligues WHERE id = ?', [id]);
  return { ligue: shapeLigue(row, user_email, 1), created: true };
}

export async function joinLigue(user_email, body) {
  const code = normalizeCode(body?.code);
  if (code.length !== CODE_LEN) throw new Error("Code d'invitation invalide.");

  const row = await queryOne('SELECT * FROM ligues WHERE invite_code = ?', [code]);
  if (!row) throw new Error("Aucune ligue ne correspond à ce code.");

  // Idempotent : rejoindre deux fois ne crée pas de doublon (contrainte UNIQUE).
  const already = await queryOne('SELECT id FROM ligue_membres WHERE ligue_id = ? AND user_email = ?', [row.id, user_email]);
  if (!already) {
    await pool.query(
      'INSERT INTO ligue_membres (id, ligue_id, user_email) VALUES ($1, $2, $3) ON CONFLICT (ligue_id, user_email) DO NOTHING',
      [randomUUID(), row.id, user_email]
    );
  }
  const count = await memberCount(row.id);
  return { ligue: shapeLigue(row, user_email, count), joined: !already, already: !!already };
}

export async function myLigues(user_email) {
  const rows = await queryAll(
    `SELECT l.*, (SELECT COUNT(*) FROM ligue_membres m WHERE m.ligue_id = l.id) AS member_count
     FROM ligues l
     JOIN ligue_membres lm ON lm.ligue_id = l.id
     WHERE lm.user_email = ?
     ORDER BY l.created_at DESC`,
    [user_email]
  );
  return { ligues: rows.map(r => shapeLigue(r, user_email, Number(r.member_count || 0))) };
}

export async function ligueLeaderboard(user_email, body) {
  const ligue_id = String(body?.ligue_id || '');
  const row = await queryOne('SELECT * FROM ligues WHERE id = ?', [ligue_id]);
  if (!row) throw new Error('Ligue introuvable.');

  // Confidentialité : seul un membre voit le classement de sa ligue.
  const membership = await queryOne('SELECT id FROM ligue_membres WHERE ligue_id = ? AND user_email = ?', [ligue_id, user_email]);
  if (!membership) { const e = new Error("Tu ne fais pas partie de cette ligue."); e.status = 403; throw e; }

  // SCORE unique = même formule que le classement général (client lib/score.js) :
  // précision (total − quiz − régularité − participation, = pronostics + 25 %
  // des gains de paris) + quiz plafonné à 300 + régularité plafonnée à 900
  // + participation plafonnée à 720. On classe là-dessus.
  const rows = await queryAll(
    `SELECT lm.user_email,
            COALESCE(up.total_points, 0)        AS total_points,
            (GREATEST(COALESCE(up.total_points, 0) - COALESCE(up.learning_points, 0) - COALESCE(up.regularity_points, 0) - COALESCE(up.participation_points, 0), 0)
              + LEAST(COALESCE(up.learning_points, 0), 300)
              + LEAST(COALESCE(up.regularity_points, 0), 900)
              + LEAST(COALESCE(up.participation_points, 0), 720))  AS score,
            COALESCE(up.predictions_count, 0)   AS predictions_count,
            COALESCE(up.correct_predictions, 0) AS correct_predictions,
            COALESCE(NULLIF(usr.full_name, ''), 'Joueur ' || substr(md5(lm.user_email), 1, 4)) AS name
     FROM ligue_membres lm
     LEFT JOIN user_progress up ON up.user_email = lm.user_email
     LEFT JOIN users usr        ON usr.email     = lm.user_email
     WHERE lm.ligue_id = ?
     ORDER BY score DESC, name ASC`,
    [ligue_id]
  );

  const membres = rows.map((r, i) => ({
    rank: i + 1,
    name: r.name,
    is_you: r.user_email === user_email,
    score: Number(r.score || 0),
    predictions_count: Number(r.predictions_count || 0),
    correct_predictions: Number(r.correct_predictions || 0),
  }));

  return { ligue: shapeLigue(row, user_email, membres.length), membres };
}

export async function leaveLigue(user_email, body) {
  const ligue_id = String(body?.ligue_id || '');
  const row = await queryOne('SELECT * FROM ligues WHERE id = ?', [ligue_id]);
  if (!row) throw new Error('Ligue introuvable.');

  await run('DELETE FROM ligue_membres WHERE ligue_id = ? AND user_email = ?', [ligue_id, user_email]);

  const count = await memberCount(ligue_id);
  if (count === 0) {
    // Ligue vide → on la supprime (ménage).
    await run('DELETE FROM ligues WHERE id = ?', [ligue_id]);
  } else if (row.owner_email === user_email) {
    // Le créateur part mais la ligue vit : on transfère la propriété au plus
    // ancien membre restant (sinon owner_email pointerait sur un non-membre).
    const heir = await queryOne(
      'SELECT user_email FROM ligue_membres WHERE ligue_id = ? ORDER BY joined_at ASC LIMIT 1',
      [ligue_id]
    );
    if (heir) await run('UPDATE ligues SET owner_email = ? WHERE id = ?', [heir.user_email, ligue_id]);
  }

  return { left: true, remaining: count };
}
