# Comment utiliser ces schémas

Chaque fichier `.json` de ce dossier correspond à une entité à créer dans le
builder Base44 (app.base44.com → votre app → Entités → Ajouter une entité).

- Si Base44 propose un import/édition JSON du schéma : collez le contenu du
  fichier directement.
- Sinon : utilisez le fichier comme checklist de champs à saisir un par un
  (nom, type, valeur par défaut, description).

Ordre conseillé, du plus structurant au plus dépendant :
1. `Liste.json`
2. `CandidatPM.json` (référence `liste_id`, donc après `Liste`)
3. `SondageSieges.json` (référence des `liste_id`, donc après `Liste`)
4. `ResultatSieges.json`
5. `PronosticSieges.json`
6. `PronosticPM.json` (référence `candidat_pm_id`, donc après `CandidatPM`)

## Champs à ajouter aux entités existantes (pas de fichier séparé, elles existent déjà)

**`CampaignSettings`** : ajouter
- `predictions_deadline_utc` (string, date-time) — si pas déjà présent depuis l'édition municipale, sinon juste mettre à jour la valeur à `2026-10-26T04:00:00Z` (veille du scrutin, 07:00 heure d'Israël).
- `pm_resolution_deadline_utc` (string, date-time) — ex. `2027-12-31T23:59:59Z`, la date au-delà de laquelle un pronostic PM non résolu bascule automatiquement sur "autre".

**`UserProgress`** : ajouter
- `seats_points` (number, default 0)
- `pm_points` (number, default 0)
- `learning_points` (number, default 0)
- `regularity_points` (number, default 0)

**`Badge`** : ajouter deux entrées (pas des champs, des lignes de données)
- `Politologue` — quiz système électoral + coalition réussis.
- `Faiseur de rois` — pronostic PM correct.
