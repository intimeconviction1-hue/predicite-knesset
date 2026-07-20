# Entités à créer dans le builder Base44 — édition Knesset 2026

Base44 gère les entités depuis app.base44.com (pas de fichier de schéma dans cet export).
Voici les entités à créer, avec leurs champs, avant de brancher les pages ci-dessous.
Les entités existantes (UserProgress, Badge, CampaignSettings) sont conservées — voir
en bas de ce document pour les champs à leur ajouter.

---

## 1. `Liste` (remplace `City`)

Une liste électorale (parti ou alliance de partis) candidate à la Knesset.
**Versionnée** : ne pas coder une taxonomie figée, le paysage bouge chaque semaine
(fusions, scissions, alliances comme « Ensemble »/Bennett-Lapid).

| Champ | Type | Notes |
|---|---|---|
| `name_fr` | string | Nom d'usage en français (ex. « Likoud ») |
| `name_he` | string | Nom hébreu (ex. « הליכוד ») |
| `slug` | string | identifiant URL |
| `ballot_letters` | string | lettres du bulletin de vote (ex. « מחל ») — optionnel tant qu'non attribuées |
| `leader_name` | string | tête de liste actuelle |
| `bloc` | enum | `coalition` \| `opposition` \| `liste_arabe` \| `non_alignee` — descriptif, jamais évaluatif |
| `color` | string | hex, pour les graphiques |
| `founded_or_merged_note` | string | ex. « Fusion Bennett-Lapid, juillet 2026 » — traçabilité des mouvements |
| `is_active` | boolean | passe à false si dissoute/fusionnée avant le dépôt officiel des listes |
| `predecessor_ids` | array\<string\> | listes dont celle-ci est issue (fusion) |
| `current_knesset_seats` | number | sièges sortants (25e Knesset), pour comparaison avant/après |
| `logo_url` | string | optionnel |

## 2. `SondageSieges` (remplace `RealPoll`)

Un sondage réel publié, sièges projetés par liste.

| Champ | Type | Notes |
|---|---|---|
| `institute` | string | ex. « i24NEWS », « Midgam », « Direct Polls », « Kantar » |
| `publisher_media` | string | ex. « Kan 11 », « Maariv », « Channel 14 » (souvent différent de l'institut) |
| `poll_date` | date | date de terrain, pas date de publication |
| `sample_size` | number | |
| `margin_error_pct` | number | |
| `source_url` | string | obligatoire, source réelle |
| `source_language` | enum | `fr` \| `he` — pour tracer si traduit |
| `seats_by_liste` | array\<{liste_id, seats}\> | projection sièges par liste |
| `checksum` | string | anti-doublon, même logique que l'existant |

## 3. `ResultatSieges` (remplace `ElectionResult`)

Résultat national unique (pas de découpage par ville).

| Champ | Type | Notes |
|---|---|---|
| `election_date` | date | 2026-10-27 |
| `seats_by_liste` | array\<{liste_id, seats, vote_pct}\> | |
| `turnout_pct` | number | |
| `threshold_pct` | number | 3.25, en dur mais versionné au cas où la loi change |
| `source_url` | string | bechirot.gov.il / data.gov.il |
| `is_final` | boolean | vs résultats partiels le soir du scrutin |
| `collected_at` | datetime | |

## 4. `PronosticSieges` (remplace `Prediction` côté sièges)

| Champ | Type | Notes |
|---|---|---|
| `user_email` | string | |
| `liste_id` | string | |
| `predicted_seats` | number | |
| `predicted_above_threshold` | boolean | pari seuil, redondant avec predicted_seats>0 mais noté explicitement pour le scoring |
| `justification` | string | |
| `points_earned` | number | |
| `is_correct` | boolean | |

## 5. `CandidatPM`

Personnalités pressenties pour le poste de Premier ministre (têtes de listes + outsiders suivis dans les sondages PM).

| Champ | Type | Notes |
|---|---|---|
| `name_fr` | string | |
| `name_he` | string | |
| `liste_id` | string | liste associée, nullable (un outsider peut ne pas encore avoir de liste) |
| `photo_url` | string | |
| `is_active` | boolean | |

## 6. `PronosticPM`

| Champ | Type | Notes |
|---|---|---|
| `user_email` | string | |
| `candidat_pm_id` | string | ou `"autre"` |
| `submitted_at` | datetime | |
| `locked_at` | datetime | verrouillé à la deadline sièges |
| `resolved_at` | datetime | null tant que personne n'est investi |
| `resolved_value` | string | id du candidat effectivement investi, ou `"autre"` |
| `points_earned` | number | 0 tant que non résolu |

---

## Champs à ajouter aux entités existantes

**`CampaignSettings`** : ajouter `pm_resolution_deadline_utc` (ex. 2027-12-31, cf. logique des marchés prédictifs actuels sur ce scrutin — passé cette date sans investiture, résolution automatique vers "Autre").

**`UserProgress`** : ajouter `seats_points`, `pm_points`, `learning_points`, `regularity_points` séparés (pour recalculer l'indice citoyen 35/15/30/20 — voir ReglesDuJeu.jsx).

**`Badge`** : ajouter deux badges — `Politologue` (quiz système électoral + coalition réussis) et `Faiseur de rois` (pronostic PM correct).
