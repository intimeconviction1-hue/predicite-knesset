# PrédiCité — édition Knesset 2026

Jeu prédictif civique sur les législatives israéliennes (Knesset, 27 octobre
2026), à destination d'un public francophone. Pronostics sièges par liste,
pronostic Premier ministre, indice citoyen, deux modules pédagogiques
(système électoral, formation du gouvernement).

Repo git autonome — plus aucune dépendance à Base44. Stack : React/Vite
(client) + Node/Express/SQLite (server), dans l'esprit de PILOTE.

## Structure

```
client/   React/Vite — l'interface (pages, composants, thème)
server/   Express + SQLite — API, auth, scoring, collecteurs
docs/     Notes de conception + historique du pivot depuis Base44
```

## Installation

Deux terminaux, comme pour PILOTE. **Sous PowerShell 5.1 (Windows), `&&` ne
fonctionne pas comme séparateur** — une commande à la fois, comme ci-dessous.

**Terminal 1 — serveur :**
```
cd server
npm install
copy .env.example .env
```
Éditer `.env` : `SESSION_SECRET`, éventuellement `ANTHROPIC_API_KEY` pour le
collecteur de sondages. Puis :
```
npm run dev
```
Le serveur écoute sur `http://localhost:8788` (port modifiable via `.env`).

**Terminal 2 — client (nouveau terminal séparé, le serveur doit rester lancé) :**
```
cd client
npm install
npm run dev
```
Le client écoute sur le port Vite habituel (5173 par défaut) et proxy les
appels `/api/*` vers le serveur — voir `client/vite.config.js`.

Ouvrir `http://localhost:5173`, se connecter avec un email (pas de mot de
passe pour l'instant — voir `server/routes/auth.js`), le premier compte créé
devient automatiquement admin.

## Peupler les données de départ

```
cd server
npm run seed:listes
```

Importe `docs/KNESSET_SEED_LISTES.json` (paysage partisan mi-2026) dans la
base. **Vérifiez chaque `current_knesset_seats` avant de vous y fier** — voir
la note en tête du fichier JSON.

## Build production

```
cd client
npm run build
```
Puis, dans un autre terminal :
```
cd server
$env:NODE_ENV="production"
npm start
```
(Sous macOS/Linux : `cd server && NODE_ENV=production npm start` fonctionne normalement.)
En production, Express sert directement `client/dist/` — plus besoin du
serveur Vite séparé.

## Points d'attention avant d'aller plus loin

- **Auth minimale** (email seul) — à durcir avant toute ouverture au-delà d'un
  usage personnel/petit cercle.
- **`resultatsKnessetCollector` ne fait pas de vrai parsing** — le site
  officiel de la 26e Knesset n'était pas structuré au moment de l'écriture.
  Voir `server/functions/resultatsKnessetCollector.js`.
- **`sondagesSiegesCollector` nécessite `ANTHROPIC_API_KEY`** dans `.env` — il
  appelle l'API Anthropic avec l'outil de recherche web pour identifier les
  sondages réels publiés (aucune donnée inventée, cf. le commentaire en tête
  du fichier).
- Le détail complet du pivot (ce qui a changé depuis la version Base44,
  pourquoi) est dans `docs/HISTORIQUE-PIVOT-BASE44.md`.

## Git

```
git log --oneline
```
Premier commit : squelette complet, testé de bout en bout (login → création
de liste → pronostic → résultat → scoring → points), avant tout peuplement
réel de données.
