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

-- Montant du bonus « bloc majoritaire » DÉJÀ crédité à cet utilisateur. Sans
-- cette mémoire, relancer le scoring recréditait 50 points à chaque passage :
-- le soir du scrutin, un double-clic suffisait à fausser le classement. Le
-- scoring applique désormais la différence, comme il le fait déjà pour les
-- points de sièges (voir functions/prediciteScoringSieges.js).
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS bloc_bonus_points INTEGER NOT NULL DEFAULT 0;

-- Points de PARTICIPATION (saisie d'une répartition, justifications écrites).
-- Ils comptent dans total_points — participer rapporte, toujours — mais sont
-- plafonnés dans le calcul du Score, comme le quiz et la régularité : sinon le
-- volume de saisie déciderait du rang avant le moindre résultat. Voir
-- client/src/lib/score.js et functions/ligues.js, à garder synchronisés.
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS participation_points INTEGER NOT NULL DEFAULT 0;

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

-- Difficulté du quiz : 'decouverte' (+10) | 'connaisseur' (+25) | 'expert' (+50).
ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS difficulte TEXT NOT NULL DEFAULT 'connaisseur';

-- Thème du quiz (évolutif) — découplé de `category` (qui a un CHECK à 3 valeurs).
-- 6 thèmes : systeme_electoral | partis | histoire | sondages_blocs | personnalites | actu.
-- Dérivé de la catégorie pour l'existant, explicite pour les nouvelles questions.
ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS theme TEXT;

-- Histoire enrichie d'une liste (narratif + source), affichée sur sa fiche.
ALTER TABLE listes ADD COLUMN IF NOT EXISTS histoire TEXT;
ALTER TABLE listes ADD COLUMN IF NOT EXISTS histoire_source TEXT;

-- Bio des candidats Premier ministre (la colonne bio existait en prod mais
-- n'était pas déclarée — on la fixe ; + source pour attribution).
ALTER TABLE candidats_pm ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE candidats_pm ADD COLUMN IF NOT EXISTS bio_source TEXT;

-- Défi série : pari en jetons sur N bonnes réponses de quiz d'affilée.
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS defi_objectif INTEGER;
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS defi_mise INTEGER;
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS defi_mult REAL;
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS defi_progres INTEGER NOT NULL DEFAULT 0;
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS defi_statut TEXT;   -- 'en_cours' | null (résolu -> effacé)

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

-- ───────────────────────────────────────────────────────────────────────────
-- Ligues privées : classements entre amis, sur invitation par code court.
-- Rétention : jouer « contre ses potes » plutôt que contre des inconnus.
-- Purement du jeu de points — aucune donnée sensible, aucun argent.
CREATE TABLE IF NOT EXISTS ligues (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,          -- code court partagé (ex. 7F3K9Q)
  owner_email TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (now_iso())
);

CREATE TABLE IF NOT EXISTS ligue_membres (
  id TEXT PRIMARY KEY,
  ligue_id TEXT NOT NULL REFERENCES ligues(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  joined_at TEXT NOT NULL DEFAULT (now_iso()),
  UNIQUE(ligue_id, user_email)
);
CREATE INDEX IF NOT EXISTS idx_ligue_membres_ligue ON ligue_membres(ligue_id);
CREATE INDEX IF NOT EXISTS idx_ligue_membres_user ON ligue_membres(user_email);

-- État du traqueur de sondages : horodatage du dernier passage automatique, pour
-- throttler la collecte (le serveur peut redémarrer souvent en tier gratuit).
CREATE TABLE IF NOT EXISTS poll_tracker_state (
  id TEXT PRIMARY KEY,
  last_run_utc TEXT,
  last_result TEXT
);

-- Dernier sondage ayant déclenché un rollover des paris (résolution des marchés
-- « rang » + réouverture avec de nouvelles cotes). Évite de résoudre deux fois
-- avec le même sondage.
ALTER TABLE poll_tracker_state ADD COLUMN IF NOT EXISTS last_rollover_poll TEXT;

-- Dernier BALAYAGE COMPLET du sheet de Kan (onlyNewer = false). La collecte
-- ordinaire ne regarde que ce qui est plus récent que la base : elle ne verrait
-- donc jamais un sondage ancien ajouté rétroactivement par Kan, ni un sondage
-- autrefois rejeté que de nouvelles règles de correspondance rendent ingérable
-- (cas vécu le 2026-08-03 : 55 sondages récupérés d'un coup). D'où un balayage
-- intégral périodique, espacé car il relit les 8 onglets en entier.
ALTER TABLE poll_tracker_state ADD COLUMN IF NOT EXISTS last_full_sweep_utc TEXT;

-- Brèves de campagne extraites de la presse ISRAÉLIENNE (souvent en hébreu) :
-- des FAITS reformulés en français, jamais une traduction ni une copie, avec le
-- média et l'URL d'origine obligatoires (voir functions/actuHebrewCollector.js).
CREATE TABLE IF NOT EXISTS actu_breves (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  source TEXT NOT NULL,          -- nom du média d'origine (obligatoire)
  source_url TEXT NOT NULL,      -- lien vers l'article d'origine (obligatoire)
  pub_date TEXT,
  checksum TEXT UNIQUE,          -- dédup source|titre
  created_at TEXT NOT NULL DEFAULT (now_iso())
);
CREATE INDEX IF NOT EXISTS idx_actu_breves_date ON actu_breves(pub_date);
