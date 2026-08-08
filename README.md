# PrédiCité — édition Knesset 2026

Jeu prédictif civique sur les législatives israéliennes (Knesset, 27 octobre
2026), à destination d'un public francophone. Pronostics sièges par liste,
pronostic Premier ministre, indice citoyen, deux modules pédagogiques
(système électoral, formation du gouvernement).

Repo git autonome — plus aucune dépendance à Base44. Stack : React/Vite
(client) + Node/Express/Postgres (server), dans l'esprit de PILOTE.

## Structure

```
client/   React/Vite — l'interface (pages, composants, thème)
server/   Express + Postgres — API, auth, scoring, collecteurs
docs/     Notes de conception + historique du pivot depuis Base44
```

## Installation

Deux terminaux, comme pour PILOTE. **Sous PowerShell 5.1 (Windows), `&&` ne
fonctionne pas comme séparateur** — une commande à la fois, comme ci-dessous.

Il faut une base Postgres accessible (locale, ou un projet gratuit
Neon/Supabase — voir section Déploiement plus bas) avant de démarrer le
serveur.

**Terminal 1 — serveur :**
```
cd server
npm install
copy .env.example .env
```
Éditer `.env` : `DATABASE_URL` (obligatoire), `SESSION_SECRET`, éventuellement
`ANTHROPIC_API_KEY` pour le collecteur de sondages. Puis :
```
npm run dev
```
Le serveur écoute sur `http://localhost:8788` (port modifiable via `.env`) et
crée le schéma automatiquement au démarrage s'il n'existe pas encore.

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

## Déploiement

Choix fait le 2026-07-24 : Postgres géré (Neon ou Supabase, tiers gratuits
sans carte bancaire) + Render (tiers gratuit) pour le serveur Express, qui
sert aussi le build client (`client/dist`) — un seul service à héberger.
Render gratuit n'offre pas de disque persistant, d'où le passage de SQLite à
Postgres : la donnée vit hors du serveur web, qui peut donc rester stateless.

Étapes :
1. Créer un projet gratuit sur [Neon](https://neon.tech) ou
   [Supabase](https://supabase.com), récupérer la chaîne de connexion
   (`postgresql://...`).
2. Pousser ce repo sur GitHub (pas encore fait — pas de remote configuré).
3. Créer un Web Service sur [Render](https://render.com) branché sur ce repo
   GitHub : build command `cd client && npm install && npm run build`,
   start command `cd server && npm install && npm start`, variable
   d'environnement `NODE_ENV=production` + `DATABASE_URL` (étape 1) +
   `SESSION_SECRET` (une vraie valeur aléatoire, pas `change-moi`).
4. Le tier gratuit Render se met en veille après 15 min d'inactivité (30-60s
   de réveil au premier accès) — acceptable pour un usage privé/lien discret.

## Points d'attention avant d'aller plus loin

- **Connexion par lien e-mail** depuis le 2026-08-07. Les joueurs reçoivent un
  lien valable 20 minutes, à usage unique ; il n'y a plus de mot de passe, et
  taper l'adresse de quelqu'un d'autre n'ouvre plus sa session. **Cela rend
  `SMTP_HOST`/`SMTP_USER`/`SMTP_PASS`/`MAIL_FROM` obligatoires en production** :
  sans elles, personne ne peut créer de compte. Le serveur teste le SMTP au
  démarrage et l'écrit dans les journaux. Les admins, eux, entrent toujours par
  `ADMIN_KEY` — volontairement indépendant de l'e-mail, pour ne pas dépendre d'un
  envoi le soir du scrutin. Voir `server/.env.example`.
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
