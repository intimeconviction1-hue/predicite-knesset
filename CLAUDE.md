# PRÉDICITÉ — édition Knesset 2026 (contexte complet)

Dernière mise à jour : 2026-07-24

## Ce que c'est
Jeu prédictif civique sur les législatives israéliennes (Knesset, **27 octobre
2026**), public francophone. Pronostics sièges par liste + Premier ministre,
indice citoyen, modules pédagogiques (système électoral, formation du
gouvernement). Repo git **autonome**, plus aucune dépendance à Base44.

## Origine du projet
Parti d'un export Base44 (`civic-play-now.zip`) d'une app municipale française
("PrédiCité"), analysé puis pivoté vers la Knesset (public francophone plutôt
que présidentielle française — l'autre option envisagée). Simon a ensuite
demandé à sortir complètement de Base44 ("je m'en fous de Base44, je le veux
en git") → réécriture complète en stack autonome.

## Stack
- **client/** : React/Vite (thème/pages hérités de l'export, nettoyés)
- **server/** : Express + Postgres (`pg`). A tourné sur `node:sqlite` (module
  SQLite intégré à Node) jusqu'au 2026-07-24, abandonné au profit de Postgres
  pour permettre un hébergement gratuit (voir incident/déploiement ci-dessous).
- Auth maison minimale (email seul, pas de mot de passe — volontairement
  reporté, Simon a dit "on verra ça plus tard")

## Environnement local chez Simon
Deux terminaux séparés, toujours actifs en parallèle :
- **Serveur** : `cd server` puis `npm run dev` → écoute sur `http://localhost:8788`
- **Client** : `cd client` puis `npm run dev` → écoute sur `http://localhost:5173`

PILOTE tourne aussi en parallèle sur cette machine (port 8787, différent, pas
de conflit). `Stop-Process -Name node -Force` tue tout node en cours **y
compris PILOTE** — à savoir avant de l'utiliser comme méthode de nettoyage.

## ⚠️ Incident historique : perte de données via OneDrive (SQLite, résolu par la migration Postgres)
La base SQLite vivait dans `server/data/`, **à l'intérieur** du dossier de
projet synchronisé par OneDrive. En mode WAL (fichiers `-wal`/`-shm` en plus
du fichier principal), la synchro OneDrive en direct pendant l'écriture a fait
disparaître la base sans erreur visible. Corrigé une première fois en
déplaçant le fichier hors OneDrive (`~/.predicite-knesset/`), puis rendu
définitivement non-applicable le 2026-07-24 par le passage à Postgres (la
donnée ne vit plus du tout sur le disque local/OneDrive — voir section
Déploiement).

## Déploiement — migration SQLite → Postgres (2026-07-24)
Décision : rester gratuit pour l'hébergement. Or en 2026, ni Render ni Fly.io
n'offrent de disque persistant gratuit (Render : payant uniquement ; Fly.io :
plus de tier gratuit du tout). SQLite a justement besoin de ce disque. Plutôt
que d'accepter un VPS auto-géré (Oracle Cloud Always Free) ou un petit coût
mensuel, Simon a choisi de migrer la base vers Postgres géré (Neon/Supabase,
gratuits sans carte bancaire) — la donnée vit alors hors du serveur web, qui
peut donc rester un service Render 100% gratuit et stateless.

Migration faite et **testée de bout en bout contre un vrai Postgres local
(Docker)** dans cette session : login (premier compte → admin), CRUD entités,
soumission de pronostic, scoring sièges, résolution Premier ministre, script
`seed:listes` — tout fonctionne. Fichiers touchés : `server/db/index.js`
(réécrit, requêtes async avec `pg.Pool`, conversion `?` → `$1..$n`),
`server/db/schema.sql` (dialecte Postgres, `now_iso()` remplace
`datetime('now')`), `server/middleware/auth.js`, `server/routes/auth.js`
(`INSERT OR IGNORE` → `ON CONFLICT DO NOTHING`, `COUNT(*)` renvoie une string
en pg → `Number()`), `server/routes/entities.js`, `server/routes/functions.js`,
les 4 fonctions dans `server/functions/` qui touchent la base, et
`server/scripts/seed-listes.js`. `DB_PATH` a disparu de `.env`, remplacé par
`DATABASE_URL` (obligatoire, le serveur refuse de démarrer sans).

**✅ Mise en ligne faite et vérifiée le 2026-07-24** :
- Base Postgres gratuite sur **Neon** (pas Neon Auth — désactivé volontairement,
  l'auth maison existante suffit, pas besoin d'un deuxième système).
- Repo poussé sur GitHub via GitHub Desktop (pas la CLI git — plus simple pour
  Simon) : [github.com/intimeconviction1-hue/predicite-knesset](https://github.com/intimeconviction1-hue/predicite-knesset),
  **privé**.
- Web Service **Render** (tier gratuit, région Frankfurt), build command
  `cd client && npm install --include=dev && npm run build && cd ../server && npm install`
  (le `--include=dev` est nécessaire : Render met `NODE_ENV=production` par
  défaut, ce qui fait sauter les devDependencies dont `vite` sans ce flag —
  premier déploiement raté pour cette raison, corrigé ensuite).
- Site live : **https://predicite-knesset.onrender.com** — vérifié
  fonctionnel (`/api/health`, page d'accueil, 12 listes visibles via l'API en
  prod).
- Visibilité choisie par Simon : lien discret/privé, pas d'annonce publique —
  donc pas besoin de durcir l'auth email-seul dans l'immédiat.
- À savoir : le tier gratuit Render se met en veille après 15 min
  d'inactivité (30-60s de réveil au premier accès après une pause) —
  accepté comme compromis pour un hébergement gratuit à usage privé.

## État d'avancement

### ✅ Fait et vérifié
- **Repo git autonome**, ~9 commits, historique propre (voir `git log --oneline`).
- **Toutes les entités** créées via schéma SQL (`server/db/schema.sql`) :
  Liste, SondageSieges, ResultatSieges, PronosticSieges, CandidatPM,
  PronosticPM, CampaignSettings, UserProgress, Badge + users/sessions.
- **Moteur CRUD générique** (`server/db/index.js` + `server/routes/entities.js`)
  qui imite l'interface `base44.entities.X.filter/list/create/update` côté
  client (`client/src/api/client.js`) — permet de garder les pages presque
  telles quelles.
- **4 fonctions métier** portées en JS pur (`server/functions/`) :
  `sondagesSiegesCollector` (instituts francophones+hébreux, zéro donnée
  synthétique, nécessite `ANTHROPIC_API_KEY` **jamais testé avec une vraie
  clé**), `resultatsKnessetCollector` (**honnête limite** : pas de vrai
  parsing, le site officiel de la 26e Knesset n'était pas structuré au moment
  de l'écriture — à reprendre courant septembre-octobre 2026),
  `prediciteScoringSieges` (barème sièges/seuil/bloc, testé de bout en bout),
  `resolvePremierMinistre` (résolution différée à l'investiture, testé).
- **Pages fonctionnelles** : Home (hémicycle signature), Listes, Liste,
  PremierMinistre, Leaderboard, Learn, Methodologie, ReglesDuJeu, Login.
- **Pages supprimées** (appelaient des entités disparues, auraient planté) :
  AdminSync, ElectionNight, FinalRecap, Leagues, PollMap, Predictions,
  Profile, Quiz, Surveys, Voter, + Cities/City/ScrutinMunicipal/ScrutinPLM
  (édition municipale). ~50 fichiers de composants orphelins supprimés aussi.
  Récupérables dans l'historique git si besoin de les réadapter un jour.
- **Design** :
  - Correctif critique : `globals.css` (polices Syne/JetBrains Mono/Inter,
    tokens `--p-*`) contenait des accolades échappées invalides ET n'était
    jamais importé (main.jsx chargeait l'`index.css` générique shadcn). Corrigé
    et branché — impact large (Leaderboard notamment tournait sans styles).
  - Palette consolidée sur les tokens partagés (`--p-night`, `--p-gold`,
    `--p-blue`, `--p-red`, `--p-paper`, `--p-ink`) plutôt que des couleurs
    codées en dur dispersées.
  - **Hemicycle.jsx** (composant signature) : 120 sièges en arc parlementaire
    réel, ligne de majorité à 61, coloré par bloc. Réutilisé sur Home et
    PremierMinistre (calcul de coalition).
  - **BallotChip.jsx** : bulletin de vote avec lettres hébraïques (détail
    d'authenticité — en Israël on vote pour des lettres, pas un nom). Sur les
    fiches listes + candidats PM liés à leur liste.
  - **CountUp.jsx** : compteurs animés (ease-out, démarre au scroll).
  - Animation signature : l'hémicycle se remplit en cascade (effet ressort,
    décalage 5,5ms/siège) au chargement de la page — un seul moment fort
    plutôt que des effets dispersés partout.
  - Bandeau/nav/footer nettoyés du vocabulaire municipal français (tricolore
    → bleu/blanc/bleu, liens vers pages supprimées retirés).
  - Titre d'onglet + favicon Base44 remplacés.

### ⏳ À faire / pistes ouvertes
*(statut à date du 2026-07-24 — à re-vérifier si cette note a plus de
quelques semaines, ce projet évolue vite)*

1. **[non re-vérifié depuis le déplacement de la base]** Vérifier chez Simon
   que les 12 listes sont bien réapparues après le déplacement de la base
   (c'était la dernière action avant une coupure de chat précédente — statut
   réel inconnu tant que ce n'est pas recontrôlé).
2. **Peupler des CandidatPM réels** avec `liste_id` pour voir le rendu complet
   de la page Premier ministre (actuellement testé seulement dans le sandbox
   Claude, avec des données de test).
3. **Badges** : le schéma existe (`badges`, `user_badges`), la logique
   d'attribution réelle n'est qu'un stub (`updateStreakAndBadges` ne fait que
   le streak, `new_badges` toujours vide). Pas de surface d'affichage des
   badges côté UI depuis la suppression de Profile.jsx.
4. **`resultatsKnessetCollector`** à reprendre une fois le site officiel de la
   26e Knesset en ligne (voir limite ci-dessus) — pas avant septembre/octobre
   2026, bloqué par une dépendance externe, pas par du travail restant ici.
5. **`sondagesSiegesCollector`** jamais testé avec une vraie clé Anthropic —
   à faire quand Simon voudra activer la collecte réelle de sondages.
6. **Login/auth** : fonctionnel mais explicitement mis de côté par Simon
   ("on verra ça plus tard") — ne pas relancer ce sujet sans qu'il le demande.
   **Sauf si mise en ligne publique** : à durcir avant toute ouverture
   au-delà d'un usage personnel/petit cercle (cf. README, section "Points
   d'attention").
7. Design : Learn/Methodologie ont eu un balayage de contenu mais pas le même
   niveau de polish visuel (animations, composants signature) que Home/Listes/
   Liste/PremierMinistre — pourrait continuer dans le même esprit si demandé.
8. `KNESSET_SEED_LISTES.json` (docs/) : paysage partisan mi-2026, à
   actualiser — plusieurs `current_knesset_seats` volontairement laissés
   `null` (pas de source fiable vérifiée à l'écriture).
9. ~~Mise en ligne / hébergement~~ **fait le 2026-07-24** — site live sur
   https://predicite-knesset.onrender.com (Render + Neon), voir section
   Déploiement ci-dessus pour le détail.

## Méthode de travail établie (à conserver)
- **Livraison en patchs**, pas de zip complet à chaque changement : quand
  seuls quelques fichiers changent (pas de nouvelle dépendance npm), livrer
  un petit zip contenant uniquement ces fichiers, à l'arborescence identique
  (`client/src/pages/Home.jsx` etc.), que Simon extrait **par-dessus** son
  dossier existant (choisir la destination = dossier existant, accepter le
  remplacement). Pas de réinstall, pas de perte de données, Vite/`node
  --watch` rechargent tout seuls. Zip complet seulement si nouvelle dépendance
  ajoutée ou changement de structure important.
- **Auto-vérification avant livraison** : le sandbox Claude a accès à
  Chromium headless (`/opt/pw-browsers/chromium-1194/chrome-linux/chrome`).
  Tester en faisant tourner serveur+client localement dans le sandbox
  (`node index.js &`, `npx vite --port 4173 &`), peupler des données de test,
  screenshoter avant de livrer. Attention : les process en arrière-plan ne
  survivent pas entre deux appels d'outil bash séparés — tout faire dans **une
  seule invocation** de commande (démarrer, tester, killer à la fin).
- **PowerShell 5.1 chez Simon** : pas de `&&` comme séparateur (une commande
  par ligne). `cp`/`copy` fonctionnent. Une commande à la fois, laisser le
  prompt revenir avant la suivante — Simon colle parfois l'historique entier
  du terminal par erreur, ou colle une commande deux fois d'affilée : rester
  patient, redemander calmement.
- Warnings `npm audit`/`allow-scripts` : bénins, ne jamais lancer `npm audit
  fix --force`.
- Simon n'écrit pas de code, style de collab direct/français, une
  recommandation à la fois, pas de listes pour/contre, flag l'empilement de
  features avant d'avoir vécu avec l'existant (cf. profil général David/Simon).
