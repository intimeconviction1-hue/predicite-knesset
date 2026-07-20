# PrédiCité — édition Knesset 2026 (état d'avancement)

> **Note (2026-07-20)** : ce document décrivait le pivot vers Base44. Le projet
> a depuis quitté Base44 entièrement — voir la racine du repo (`client/` +
> `server/`, Express/SQLite, git autonome). Les instructions "à créer dans le
> builder Base44" ci-dessous sont conservées pour l'historique mais ne
> s'appliquent plus : le schéma réel vit maintenant dans
> `server/db/schema.sql`, et `docs/base44-entities-reference/` +
> `docs/KNESSET_ENTITIES.md` ne sont que des références de conception.

Pivot de l'édition municipales françaises vers les législatives israéliennes
(Knesset, 27 octobre 2026), public francophone. Ce document résume ce qui a été
fait dans cette passe et ce qu'il reste à faire avant mise en ligne.

## Fait

- **`KNESSET_ENTITIES.md`** — spec des entités à créer dans le builder Base44 :
  `Liste`, `SondageSieges`, `ResultatSieges`, `PronosticSieges`, `CandidatPM`,
  `PronosticPM`, + champs à ajouter à `CampaignSettings`, `UserProgress`, `Badge`.
  **À faire avant tout le reste** : ces entités n'existent pas encore, rien ne
  fonctionnera tant qu'elles ne sont pas créées côté Base44.
- **`KNESSET_SEED_LISTES.json`** — amorce de 12 listes (paysage mi-2026), à
  vérifier/compléter avant import — voir la note dans le fichier.
- **Modules pédagogiques** : `KnessetRulesModule.jsx` (scrutin, seuil 3,25%,
  Bader-Ofer, accords d'excédents) et `CoalitionRulesModule.jsx` (formation du
  gouvernement, mandat de formation, PM de transition).
- **Pages** : `Listes.jsx` (grille), `Liste.jsx` (détail + pronostic sièges),
  `PremierMinistre.jsx` (pronostic PM), `Home.jsx` et `ReglesDuJeu.jsx` réécrites,
  `pages.config.js` mis à jour.
- **Layout.jsx** : nav, footer, bandeau retirés du thème municipal français
  (tricolore → bleu/blanc, liens Cities/ScrutinMunicipal/ScrutinPLM → Listes/PremierMinistre).
- **Backend** : `sondagesSiegesCollector` (instituts francophones + hébreux,
  zéro donnée synthétique), `resultatsKnessetCollector` (squelette honnête —
  voir limite ci-dessous), `prediciteScoringSieges` (barème sièges/seuil/bloc),
  `resolvePremierMinistre` (résolution différée à l'investiture).

## Conservé tel quel (dormant, pas cassé)

`Cities.jsx`, `City.jsx`, `ScrutinMunicipal.jsx`, `ScrutinPLM.jsx` et les
fonctions backend de l'édition municipale (`pollCollector`,
`collectElectionResults`, `municipalNewsCollector`, `prediciteScoring`, etc.)
restent sur disque mais sont retirés du routage. Les anciens `Home.jsx` et
`ReglesDuJeu.jsx` sont sauvegardés en `.municipales.bak.jsx.txt`.

Plusieurs composants `src/components/home/*` (variantes A/B d'accueil non
utilisées par le nouveau `Home.jsx` : `RepublicanHero`, `DecisionHero`,
`CitiesTeaser`, etc.) référencent encore l'ancien vocabulaire municipal — ils ne
sont plus importés nulle part, donc inoffensifs, mais à nettoyer ou retirer si
vous voulez faire le ménage plus tard.

## Limite honnête à connaître

`resultatsKnessetCollector` **ne fait pas** de parsing réel des résultats.
Le motif d'URL officiel (`votesXX.bechirot.gov.il`) est stable d'élection en
élection, mais la structure JSON/HTML exacte de la page pour la 26e Knesset
n'était pas encore en ligne au moment de l'écriture (dissolution du 17 juillet,
scrutin le 27 octobre — le site se monte généralement dans les semaines qui
précèdent). La fonction vérifie l'accessibilité du site et s'arrête proprement
plutôt que d'inventer un parsing qui pourrait silencieusement produire de
faux résultats. **À reprendre courant septembre-octobre** une fois le site
réellement en ligne — ou basculer sur le jeu de données ouvert
`data.gov.il/he/dataset/central-election-committee` si sa structure est plus
stable.

## À faire, dans l'ordre

1. Créer les entités Base44 (`KNESSET_ENTITIES.md`).
2. Importer/compléter les listes (`KNESSET_SEED_LISTES.json`), en vérifiant
   chaque `current_knesset_seats` avant saisie.
3. Brancher `sondagesSiegesCollector` sur un cron (même fréquence que l'ancien
   `pollCollector`) et vérifier les premiers résultats manuellement avant de
   l'automatiser sans supervision.
4. Peupler `CandidatPM` (têtes de listes + éventuels outsiders suivis dans les
   sondages PM — Netanyahou, Bennett, Eisenkot, Lapid, etc. à ce stade).
5. Revenir sur `resultatsKnessetCollector` une fois le site officiel de la 26e
   Knesset en ligne (voir limite ci-dessus).
6. Nettoyer les composants `src/components/home/*` orphelins si souhaité.
