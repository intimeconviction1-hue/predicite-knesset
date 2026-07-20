import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

// Piège connu (cf. PILOTE) : ne jamais utiliser process.cwd() pour localiser data/,
// le process peut être lancé depuis un cwd différent de ce dossier. On dérive le
// chemin depuis import.meta.url à la place.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'predicite-knesset.sqlite3');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// node:sqlite (module SQLite intégré à Node, sans compilation native) plutôt
// que better-sqlite3 : ce dernier nécessite node-gyp + Visual Studio Build
// Tools sous Windows pour compiler son binaire natif, ce qu'on veut éviter
// ici. node:sqlite est disponible sans flag depuis Node 24.15 environ —
// toujours marqué "expérimental" par Node lui-même, mais stable à l'usage
// pour une appli de cette taille.
export const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

const schemaPath = path.join(__dirname, 'schema.sql');
db.exec(fs.readFileSync(schemaPath, 'utf8'));

// ── Config par entité : nom (tel qu'utilisé côté front) → table + champs spéciaux ──
export const ENTITY_CONFIG = {
  Liste: { table: 'listes', jsonFields: ['predecessor_ids'], boolFields: ['is_active'], hasUpdatedAt: true },
  SondageSieges: { table: 'sondages_sieges', jsonFields: ['seats_by_liste'] },
  ResultatSieges: { table: 'resultats_sieges', jsonFields: ['seats_by_liste'], boolFields: ['is_final'] },
  PronosticSieges: { table: 'pronostics_sieges', boolFields: ['predicted_above_threshold', 'is_correct'], hasUpdatedAt: true },
  CandidatPM: { table: 'candidats_pm', boolFields: ['is_active'] },
  PronosticPM: { table: 'pronostics_pm' },
  CampaignSettings: { table: 'campaign_settings', idColumn: 'key' },
  UserProgress: { table: 'user_progress' },
  Badge: { table: 'badges', idColumn: 'id' },
};

function getConfig(entityName) {
  const cfg = ENTITY_CONFIG[entityName];
  if (!cfg) throw new Error(`Entité inconnue : ${entityName}`);
  return cfg;
}

// SQLite renvoie les booléens comme 0/1 et les JSON comme texte : on déserialise
// à la lecture et on serialise à l'écriture, pour un contrat identique à ce que
// les pages React attendent déjà (héritage de l'interface base44.entities.X).
function deserializeRow(cfg, row) {
  if (!row) return row;
  const out = { ...row };
  for (const f of cfg.jsonFields || []) {
    if (out[f] != null) {
      try { out[f] = JSON.parse(out[f]); } catch { out[f] = null; }
    }
  }
  for (const f of cfg.boolFields || []) {
    if (out[f] != null) out[f] = !!out[f];
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

export function listEntity(entityName, { sort, limit } = {}) {
  const cfg = getConfig(entityName);
  let sql = `SELECT * FROM ${cfg.table}`;
  if (sort) {
    const desc = sort.startsWith('-');
    const col = desc ? sort.slice(1) : sort;
    sql += ` ORDER BY ${col} ${desc ? 'DESC' : 'ASC'}`;
  }
  if (limit) sql += ` LIMIT ${Number(limit)}`;
  const rows = db.prepare(sql).all();
  return rows.map(r => deserializeRow(cfg, r));
}

export function filterEntity(entityName, query = {}) {
  const cfg = getConfig(entityName);
  const keys = Object.keys(query).filter(k => query[k] !== undefined && query[k] !== '');
  let sql = `SELECT * FROM ${cfg.table}`;
  if (keys.length > 0) {
    sql += ' WHERE ' + keys.map(k => `${k} = ?`).join(' AND ');
  }
  const values = keys.map(k => {
    const v = query[k];
    if ((cfg.boolFields || []).includes(k)) return v ? 1 : 0;
    return v;
  });
  const rows = db.prepare(sql).all(...values);
  return rows.map(r => deserializeRow(cfg, r));
}

export function createEntity(entityName, payload) {
  const cfg = getConfig(entityName);
  const idColumn = cfg.idColumn || 'id';
  const body = serializeForWrite(cfg, payload);
  if (!body[idColumn]) body[idColumn] = idColumn === 'key' ? (body.key || 'global') : randomUUID();

  const cols = Object.keys(body);
  const placeholders = cols.map(() => '?').join(', ');
  const sql = `INSERT INTO ${cfg.table} (${cols.join(', ')}) VALUES (${placeholders})`;
  db.prepare(sql).run(...cols.map(c => body[c]));

  const row = db.prepare(`SELECT * FROM ${cfg.table} WHERE ${idColumn} = ?`).get(body[idColumn]);
  return deserializeRow(cfg, row);
}

export function updateEntity(entityName, id, payload) {
  const cfg = getConfig(entityName);
  const idColumn = cfg.idColumn || 'id';
  const body = serializeForWrite(cfg, payload);
  if (cfg.hasUpdatedAt) body.updated_at = new Date().toISOString();

  const cols = Object.keys(body);
  if (cols.length === 0) {
    const row = db.prepare(`SELECT * FROM ${cfg.table} WHERE ${idColumn} = ?`).get(id);
    return deserializeRow(cfg, row);
  }
  const setClause = cols.map(c => `${c} = ?`).join(', ');
  db.prepare(`UPDATE ${cfg.table} SET ${setClause} WHERE ${idColumn} = ?`).run(...cols.map(c => body[c]), id);

  const row = db.prepare(`SELECT * FROM ${cfg.table} WHERE ${idColumn} = ?`).get(id);
  return deserializeRow(cfg, row);
}

// Utilisée par la route REST générique (GET /api/entities/:name) : combine
// filtre exact, tri et limite en une seule requête — plus flexible que
// listEntity/filterEntity pris séparément, qui restent utilisées telles
// quelles côté fonctions serveur pour coller au contrat base44 d'origine.
export function queryEntity(entityName, { where = {}, sort, limit } = {}) {
  const cfg = getConfig(entityName);
  const keys = Object.keys(where).filter(k => where[k] !== undefined && where[k] !== '');
  let sql = `SELECT * FROM ${cfg.table}`;
  if (keys.length > 0) sql += ' WHERE ' + keys.map(k => `${k} = ?`).join(' AND ');
  if (sort) {
    const desc = sort.startsWith('-');
    const col = desc ? sort.slice(1) : sort;
    sql += ` ORDER BY ${col} ${desc ? 'DESC' : 'ASC'}`;
  }
  if (limit) sql += ` LIMIT ${Number(limit)}`;

  const values = keys.map(k => ((cfg.boolFields || []).includes(k) ? (where[k] ? 1 : 0) : where[k]));
  const rows = db.prepare(sql).all(...values);
  return rows.map(r => deserializeRow(cfg, r));
}

export function deleteEntity(entityName, id) {
  const cfg = getConfig(entityName);
  const idColumn = cfg.idColumn || 'id';
  db.prepare(`DELETE FROM ${cfg.table} WHERE ${idColumn} = ?`).run(id);
  return { id, deleted: true };
}

export function getRaw(entityName) {
  return getConfig(entityName);
}
