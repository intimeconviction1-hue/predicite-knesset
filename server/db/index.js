import pg from 'pg';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Passage de node:sqlite à Postgres (2026-07-24) : SQLite écrit dans un
// fichier local, ce qui demande un disque persistant chez l'hébergeur — les
// tiers gratuits (Render, Fly.io) ne l'offrent plus en 2026. Une base Postgres
// gérée (Neon/Supabase, tiers gratuits sans carte bancaire) vit hors du
// serveur, donc l'hébergement web peut rester stateless et gratuit.
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    "DATABASE_URL manquant dans .env — voir .env.example. Nécessaire depuis le passage de SQLite à Postgres."
  );
}

// Neon/Supabase exigent TLS avec un certificat non vérifiable par la chaîne
// de confiance par défaut de Node (pratique standard chez ces fournisseurs) ;
// pas de TLS en local contre un Postgres de test.
export const pool = new pg.Pool({
  connectionString,
  ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false },
});

// Les fonctions CRUD ci-dessous viennent du portage node:sqlite d'origine
// (SQL écrit avec des '?'). On convertit vers les placeholders $1, $2...
// attendus par Postgres plutôt que de réécrire chaque requête à la main.
function toPg(sql) {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

export async function queryAll(sql, params = []) {
  const { rows } = await pool.query(toPg(sql), params);
  return rows;
}

export async function queryOne(sql, params = []) {
  const rows = await queryAll(sql, params);
  return rows[0] || null;
}

export async function run(sql, params = []) {
  await pool.query(toPg(sql), params);
}

let initPromise = null;
export function initDb() {
  if (!initPromise) {
    const schemaPath = path.join(__dirname, 'schema.sql');
    initPromise = pool.query(fs.readFileSync(schemaPath, 'utf8'));
  }
  return initPromise;
}

// ── Config par entité : nom (tel qu'utilisé côté front) → table + champs spéciaux ──
export const ENTITY_CONFIG = {
  Liste: { table: 'listes', jsonFields: ['predecessor_ids'], boolFields: ['is_active'], hasUpdatedAt: true },
  SondageSieges: { table: 'sondages_sieges', jsonFields: ['seats_by_liste'] },
  ResultatSieges: { table: 'resultats_sieges', jsonFields: ['seats_by_liste'], boolFields: ['is_final'] },
  KnessetHistorique: { table: 'knesset_historique', jsonFields: ['results'] },
  QuizQuestion: { table: 'quiz_questions', jsonFields: ['choices'] },
  QuizReponse: { table: 'quiz_reponses', boolFields: ['is_correct'] },
  PronosticSieges: { table: 'pronostics_sieges', boolFields: ['predicted_above_threshold', 'is_correct'], hasUpdatedAt: true },
  CandidatPM: { table: 'candidats_pm', boolFields: ['is_active'] },
  PronosticPM: { table: 'pronostics_pm' },
  CampaignSettings: { table: 'campaign_settings', idColumn: 'key' },
  UserProgress: { table: 'user_progress' },
  Badge: { table: 'badges', idColumn: 'id' },
  ParisMarche: { table: 'paris_marches', jsonFields: ['resolver_args'] },
  ParisIssue: { table: 'paris_issues' },
  ParisMise: { table: 'paris_mises' },
};

function getConfig(entityName) {
  const cfg = ENTITY_CONFIG[entityName];
  if (!cfg) throw new Error(`Entité inconnue : ${entityName}`);
  return cfg;
}

// Les VALEURS sont paramétrées ($1, $2...), mais pas les IDENTIFIANTS : noms de
// colonnes de filtre et colonne de tri viennent de la query string et sont
// interpolés dans le SQL. Postgres n'a pas de placeholder pour un identifiant,
// donc on valide strictement la forme. Sans ce garde-fou, un `_sort` du type
// `(SELECT ...)` reste exploitable en exfiltration, même si le protocole
// étendu de pg empêche d'empiler plusieurs requêtes.
const IDENT_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;
function assertIdent(name) {
  if (typeof name !== 'string' || !IDENT_RE.test(name)) {
    throw new Error(`Nom de colonne invalide : ${name}`);
  }
  return name;
}

// SQLite renvoyait les booléens comme 0/1 et les JSON comme texte : on garde
// la désérialisation à la lecture / sérialisation à l'écriture, pour un
// contrat identique à ce que les pages React attendent déjà (héritage de
// l'interface base44.entities.X) — les colonnes Postgres restent INTEGER/TEXT
// pour ces champs, donc le même traitement s'applique tel quel.
function deserializeRow(cfg, row) {
  if (!row) return row;
  const out = { ...row };
  for (const f of cfg.jsonFields || []) {
    if (out[f] != null) {
      try { out[f] = typeof out[f] === 'string' ? JSON.parse(out[f]) : out[f]; } catch { out[f] = null; }
    }
  }
  for (const f of cfg.boolFields || []) {
    if (out[f] != null) out[f] = !!out[f] && out[f] !== 0;
  }
  return out;
}

function serializeForWrite(cfg, payload) {
  const out = { ...payload };
  for (const f of cfg.jsonFields || []) {
    if (out[f] !== undefined) out[f] = JSON.stringify(out[f] ?? []);
  }
  for (const f of cfg.boolFields || []) {
    if (out[f] !== undefined) out[f] = out[f] ? 1 : 0;
  }
  return out;
}

// LIMIT/OFFSET ne sont pas parametrables comme des valeurs ici : on les
// interpole, donc on refuse tout ce qui n'est pas un entier positif plutot que
// de laisser passer un NaN qui casserait la requete.
function assertEntier(valeur, nom) {
  const n = Number(valeur);
  if (!Number.isInteger(n) || n < 0) throw new Error(`${nom} invalide : ${valeur}`);
  return n;
}

export async function listEntity(entityName, { sort, limit, offset } = {}) {
  const cfg = getConfig(entityName);
  let sql = `SELECT * FROM ${cfg.table}`;
  if (sort) {
    const desc = sort.startsWith('-');
    const col = assertIdent(desc ? sort.slice(1) : sort);
    sql += ` ORDER BY ${col} ${desc ? 'DESC' : 'ASC'}`;
  }
  if (limit) sql += ` LIMIT ${assertEntier(limit, 'limit')}`;
  if (offset) sql += ` OFFSET ${assertEntier(offset, 'offset')}`;
  const rows = await queryAll(sql);
  return rows.map(r => deserializeRow(cfg, r));
}

export async function filterEntity(entityName, query = {}) {
  const cfg = getConfig(entityName);
  const keys = Object.keys(query).filter(k => query[k] !== undefined && query[k] !== '');
  let sql = `SELECT * FROM ${cfg.table}`;
  if (keys.length > 0) {
    sql += ' WHERE ' + keys.map(k => `${assertIdent(k)} = ?`).join(' AND ');
  }
  const values = keys.map(k => {
    const v = query[k];
    if ((cfg.boolFields || []).includes(k)) return v ? 1 : 0;
    return v;
  });
  const rows = await queryAll(sql, values);
  return rows.map(r => deserializeRow(cfg, r));
}

export async function createEntity(entityName, payload) {
  const cfg = getConfig(entityName);
  const idColumn = cfg.idColumn || 'id';
  const body = serializeForWrite(cfg, payload);
  if (!body[idColumn]) body[idColumn] = idColumn === 'key' ? (body.key || 'global') : randomUUID();

  const cols = Object.keys(body).map(assertIdent);
  const placeholders = cols.map(() => '?').join(', ');
  const sql = `INSERT INTO ${cfg.table} (${cols.join(', ')}) VALUES (${placeholders})`;
  await run(sql, cols.map(c => body[c]));

  const row = await queryOne(`SELECT * FROM ${cfg.table} WHERE ${idColumn} = ?`, [body[idColumn]]);
  return deserializeRow(cfg, row);
}

export async function updateEntity(entityName, id, payload) {
  const cfg = getConfig(entityName);
  const idColumn = cfg.idColumn || 'id';
  const body = serializeForWrite(cfg, payload);
  if (cfg.hasUpdatedAt) body.updated_at = new Date().toISOString();

  const cols = Object.keys(body).map(assertIdent);
  if (cols.length === 0) {
    const row = await queryOne(`SELECT * FROM ${cfg.table} WHERE ${idColumn} = ?`, [id]);
    return deserializeRow(cfg, row);
  }
  const setClause = cols.map(c => `${c} = ?`).join(', ');
  await run(`UPDATE ${cfg.table} SET ${setClause} WHERE ${idColumn} = ?`, [...cols.map(c => body[c]), id]);

  const row = await queryOne(`SELECT * FROM ${cfg.table} WHERE ${idColumn} = ?`, [id]);
  return deserializeRow(cfg, row);
}

// Utilisée par la route REST générique (GET /api/entities/:name) : combine
// filtre exact, tri et limite en une seule requête — plus flexible que
// listEntity/filterEntity pris séparément, qui restent utilisées telles
// quelles côté fonctions serveur pour coller au contrat base44 d'origine.
export async function queryEntity(entityName, { where = {}, sort, limit } = {}) {
  const cfg = getConfig(entityName);
  const keys = Object.keys(where).filter(k => where[k] !== undefined && where[k] !== '');
  let sql = `SELECT * FROM ${cfg.table}`;
  if (keys.length > 0) sql += ' WHERE ' + keys.map(k => `${assertIdent(k)} = ?`).join(' AND ');
  if (sort) {
    const desc = sort.startsWith('-');
    const col = assertIdent(desc ? sort.slice(1) : sort);
    sql += ` ORDER BY ${col} ${desc ? 'DESC' : 'ASC'}`;
  }
  if (limit) sql += ` LIMIT ${Number(limit)}`;

  const values = keys.map(k => ((cfg.boolFields || []).includes(k) ? (where[k] ? 1 : 0) : where[k]));
  const rows = await queryAll(sql, values);
  return rows.map(r => deserializeRow(cfg, r));
}

export async function deleteEntity(entityName, id) {
  const cfg = getConfig(entityName);
  const idColumn = cfg.idColumn || 'id';
  await run(`DELETE FROM ${cfg.table} WHERE ${idColumn} = ?`, [id]);
  return { id, deleted: true };
}

export function getRaw(entityName) {
  return getConfig(entityName);
}
