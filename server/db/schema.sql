-- Schéma PrédiCité — édition Knesset 2026 (dialecte Postgres depuis le
-- passage de node:sqlite, 2026-07-24)
-- Une table par entité. Les champs "tableau" (ex. seats_by_liste) sont stockés
-- en JSON texte et (dé)sérialisés côté serveur (voir db/index.js).
-- now_iso() reproduit le format ISO 8601 que produisait datetime('now') côté
-- SQLite, pour rester cohérent avec new Date().toISOString() utilisé côté JS.
CREATE OR REPLACE FUNCTION now_iso() RETURNS text AS $$
  SELECT to_char(now() AT TIME ZONE 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"');
$$ LANGUAGE sql;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'user', -- 'user' | 'admin'
  created_at TEXT NOT NULL DEFAULT (now_iso())
);

CREATE TABLE IF NOT EXISTS listes (
  id TEXT PRIMARY KEY,
  name_fr TEXT NOT NULL,
  name_he TEXT,
  slug TEXT UNIQUE NOT NULL,
  ballot_letters TEXT,
  leader_name TEXT,
  bloc TEXT NOT NULL CHECK (bloc IN ('coalition','opposition','liste_arabe','non_alignee')),
  color TEXT,
  founded_or_merged_note TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  predecessor_ids TEXT, -- JSON array de liste_id
  current_knesset_seats INTEGER,
  logo_url TEXT,
  created_at TEXT NOT NULL DEFAULT (now_iso()),
  updated_at TEXT NOT NULL DEFAULT (now_iso())
);

CREATE TABLE IF NOT EXISTS sondages_sieges (
  id TEXT PRIMARY KEY,
  institute TEXT NOT NULL,
  publisher_media TEXT,
  poll_date TEXT NOT NULL,
  sample_size INTEGER,
  margin_error_pct REAL,
  source_url TEXT NOT NULL,
  source_language TEXT CHECK (source_language IN ('fr','he')) DEFAULT 'fr',
  seats_by_liste TEXT NOT NULL, -- JSON array [{liste_id, seats}]
  checksum TEXT UNIQUE,
  created_at TEXT NOT NULL DEFAULT (now_iso())
);

CREATE TABLE IF NOT EXISTS resultats_sieges (
  id TEXT PRIMARY KEY,
  election_date TEXT NOT NULL DEFAULT '2026-10-27',
  seats_by_liste TEXT NOT NULL, -- JSON array [{liste_id, seats, vote_pct}]
  turnout_pct REAL,
  threshold_pct REAL NOT NULL DEFAULT 3.25,
  source_url TEXT,
  is_final INTEGER NOT NULL DEFAULT 0,
  collected_at TEXT NOT NULL DEFAULT (now_iso())
);

CREATE TABLE IF NOT EXISTS pronostics_sieges (
  id TEXT PRIMARY KEY,
  user_email TEXT NOT NULL,
  liste_id TEXT NOT NULL REFERENCES listes(id),
  predicted_seats INTEGER NOT NULL,
  predicted_above_threshold INTEGER NOT NULL DEFAULT 0,
  justification TEXT,
  points_earned INTEGER NOT NULL DEFAULT 0,
  is_correct INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (now_iso()),
  updated_at TEXT NOT NULL DEFAULT (now_iso()),
  UNIQUE(user_email, liste_id)
);

CREATE TABLE IF NOT EXISTS candidats_pm (
  id TEXT PRIMARY KEY,
  name_fr TEXT NOT NULL,
  name_he TEXT,
  liste_id TEXT REFERENCES listes(id),
  photo_url TEXT,
  is_active INTEGER NOT NULL DEFAULT 1
);
-- Ajouté après la création initiale de la table : ADD COLUMN IF NOT EXISTS
-- (plutôt qu'un DROP/CREATE) pour ne pas perdre les lignes déjà en base.
ALTER TABLE candidats_pm ADD COLUMN IF NOT EXISTS bio TEXT;

CREATE TABLE IF NOT EXISTS pronostics_pm (
  id TEXT PRIMARY KEY,
  user_email TEXT NOT NULL UNIQUE,
  candidat_pm_id TEXT NOT NULL, -- id de candidats_pm, ou littéralement "autre"
  submitted_at TEXT NOT NULL DEFAULT (now_iso()),
  locked_at TEXT,
  resolved_at TEXT,
  resolved_value TEXT,
  points_earned INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS knesset_historique (
  id TEXT PRIMARY KEY,
  knesset_number INTEGER NOT NULL UNIQUE, -- 1 à 25
  election_date TEXT NOT NULL,
  name TEXT NOT NULL, -- ex. "25e Knesset"
  turnout_pct REAL,
  threshold_pct REAL, -- seuil en vigueur à cette élection (a varié dans le temps : 1%, 1.5%, 2%, 3.25%)
  results TEXT NOT NULL, -- JSON array [{party_name, leader, vote_pct, seats}]
  pm_after TEXT, -- Premier ministre du gouvernement formé après cette élection
  notes TEXT,
  source_url TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (now_iso())
);

CREATE TABLE IF NOT EXISTS quiz_questions (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN ('regles','historique','actualite')),
  question TEXT NOT NULL,
  choices TEXT NOT NULL, -- JSON array de 4 chaînes
  correct_index INTEGER NOT NULL,
  explanation TEXT,
  source_url TEXT,
  created_at TEXT NOT NULL DEFAULT (now_iso())
);

CREATE TABLE IF NOT EXISTS quiz_reponses (
  id TEXT PRIMARY KEY,
  user_email TEXT NOT NULL,
  question_id TEXT NOT NULL REFERENCES quiz_questions(id),
  is_correct INTEGER NOT NULL DEFAULT 0,
  answered_at TEXT NOT NULL DEFAULT (now_iso()),
  UNIQUE(user_email, question_id)
);

CREATE TABLE IF NOT EXISTS campaign_settings (
  key TEXT PRIMARY KEY,
  predictions_deadline_utc TEXT,
  pm_resolution_deadline_utc TEXT
);

CREATE TABLE IF NOT EXISTS user_progress (
  id TEXT PRIMARY KEY,
  user_email TEXT UNIQUE NOT NULL,
  total_points INTEGER NOT NULL DEFAULT 0,
  seats_points INTEGER NOT NULL DEFAULT 0,
  pm_points INTEGER NOT NULL DEFAULT 0,
  learning_points INTEGER NOT NULL DEFAULT 0,
  regularity_points INTEGER NOT NULL DEFAULT 0,
  predictions_count INTEGER NOT NULL DEFAULT 0,
  correct_predictions INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  last_active_date TEXT
);

CREATE TABLE IF NOT EXISTS badges (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL, -- 'analyste_precis' | 'politologue' | 'faiseur_de_rois' | ...
  label TEXT NOT NULL,
  description TEXT,
  icon TEXT
);

CREATE TABLE IF NOT EXISTS user_badges (
  id TEXT PRIMARY KEY,
  user_email TEXT NOT NULL,
  badge_code TEXT NOT NULL REFERENCES badges(code),
  earned_at TEXT NOT NULL DEFAULT (now_iso()),
  UNIQUE(user_email, badge_code)
);

-- ───────────────────────────────────────────────────────────────────────────
-- Paris sur sondages — jeu de POINTS gratuit, aucun argent réel. Modèle et
-- cotes détaillés : docs/predicite-paris-modele-scoring.md. Deux monnaies :
-- le score (total_points, permanent) et les JETONS (renouvelables, à miser).

ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS jetons INTEGER NOT NULL DEFAULT 1000;
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS jetons_semaine TEXT;   -- semaine ISO de la dernière dotation

-- Un marché = une question pariable, rattachée à une manche (cadence des sondages).
CREATE TABLE IF NOT EXISTS paris_marches (
  id TEXT PRIMARY KEY,
  manche INTEGER NOT NULL,
  type TEXT NOT NULL,                       -- 'binaire' | 'seuil' | 'rang'
  question TEXT NOT NULL,
  resolver_kind TEXT NOT NULL,              -- 'liste_rang' | 'liste_seuil' | 'bloc_majorite'
  resolver_args TEXT,                       -- JSON : { liste_id, seuil, ... }
  liquidity_k INTEGER NOT NULL DEFAULT 800, -- force du prior sondage dans la cote
  opens_at TEXT NOT NULL DEFAULT (now_iso()),
  closes_at TEXT,                           -- verrou (avant publication du sondage)
  resolved_by TEXT,                         -- id du sondage qui a tranché
  status TEXT NOT NULL DEFAULT 'open',      -- 'open' | 'locked' | 'resolved' | 'void'
  winning_issue TEXT,
  created_at TEXT NOT NULL DEFAULT (now_iso())
);

-- Les issues d'un marché (OUI/NON, ou une par liste pour un marché 'rang').
CREATE TABLE IF NOT EXISTS paris_issues (
  id TEXT PRIMARY KEY,
  marche_id TEXT NOT NULL REFERENCES paris_marches(id),
  label TEXT NOT NULL,
  match_value TEXT,                         -- valeur qui rend cette issue gagnante
  prob_open REAL NOT NULL DEFAULT 0.5,      -- P implicite du sondage à l'ouverture
  pool_reel INTEGER NOT NULL DEFAULT 0      -- somme des mises réelles sur cette issue
);

-- Chaque mise d'un joueur — la cote est VERROUILLÉE à la prise du pari.
CREATE TABLE IF NOT EXISTS paris_mises (
  id TEXT PRIMARY KEY,
  user_email TEXT NOT NULL,
  marche_id TEXT NOT NULL REFERENCES paris_marches(id),
  issue_id TEXT NOT NULL REFERENCES paris_issues(id),
  mise INTEGER NOT NULL,
  cote REAL NOT NULL,
  gain_pot INTEGER NOT NULL,                -- round(mise * cote), pré-calculé
  statut TEXT NOT NULL DEFAULT 'en_jeu',    -- 'en_jeu' | 'gagne' | 'perdu' | 'rembourse'
  created_at TEXT NOT NULL DEFAULT (now_iso())
);
CREATE INDEX IF NOT EXISTS idx_mises_user ON paris_mises(user_email);
CREATE INDEX IF NOT EXISTS idx_mises_marche ON paris_mises(marche_id);
