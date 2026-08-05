# Forme ta coalition — sources des frictions

Ce document justifie chaque paire de la table `FRICTIONS` de
`client/src/pages/FormeCoalition.jsx` (pénalités de plausibilité de coalition),
complétée le 2026-08-05. Il applique aux frictions la règle de la Boussole :
**une friction sans source ne s'écrit pas** — une paire absente est un trou à
dessein, pas un oubli.

Particularité : ce document ne cite **aucune source nouvelle**. Chaque friction
se déduit de positions déjà sourcées ailleurs dans le dépôt — les affirmations
de `client/src/lib/boussole-data.js` (sourcées le 2026-08-04, détail dans
`BOUSSOLE_SOURCES.md`) et les fiches du seed (`KNESSET_SEED_LISTES.json`).
Si une position bouge dans la Boussole, la friction qui s'y adosse doit être
revue.

Statut : **poids à valider (David)**. Les paires sont sourcées ; la valeur
numérique de chaque poids reste un jugement à ajuster.

---

## Échelle des poids

- **40 et plus** — exclusion réciproque, identitaire, sans précédent de
  coopération (kahanisme vs gauche, kahanisme vs partis arabes).
- **26 à 35** — incompatibilité déclarée par au moins un des deux camps, pas de
  précédent récent de coopération.
- **16 à 25** — désaccord structurant, mais précédent de coopération ou
  ouverture documentée (Gantz vs le Likoud, Ra'am vs ses partenaires de 2021).
- **15 et moins** — friction résiduelle : le refus est déclaré mais la
  coopération a déjà eu lieu.

Rappel du modèle : les pénalités s'additionnent, le score plancher est 3.
On ne bloque jamais — en Israël tout est possible, on mesure la plausibilité.

---

## Axe 1 — le « mur » anti-Netanyahou (paires historiques, inchangées)

Adossé à l'affirmation structurante « Benyamin Netanyahou doit rester Premier
ministre » (pour : Likoud, Shas, JUT, Otzma, Sionisme religieux ; contre : les
cinq listes du bloc du changement).

| Paire | Poids | Justification |
|---|---|---|
| Likoud ⊥ Les Démocrates | 42 | La gauche exclut Netanyahou. |
| Likoud ⊥ Yashar | 35 | Eisenkot fait campagne contre Netanyahou. |
| Likoud ⊥ Ensemble | 32 | ⚠️ chiffre de Lapid pour une liste que Bennett dirige — à trancher (voir commentaire dans le code). |
| Likoud ⊥ Yisrael Beytenou | 30 | Lieberman, ennemi juré. |
| Likoud ⊥ Unité nationale | 22 | Passif anti-Netanyahou, mais Gantz a proposé en août 2025 un gouvernement incluant Netanyahou (« acceptable si le programme convient » : pour). |

**Trou à dessein** : pas de paire Likoud ⊥ Les Réservistes. Hendel dit qu'il
rejoindrait un gouvernement de 70-80 sièges sionistes même avec Netanyahou
(JPost 23/07/2026, déjà cité dans boussole-data) — « acceptable de gouverner
avec Netanyahou » : pour.

## Axe 2 — piliers du gouvernement sortant ⊥ bloc du changement (ajouté 2026-08-05)

Le trou que cet axe ferme : Otzma Yehudit + Les Démocrates + Ensemble +
Yisrael Beytenou sortait « très plausible » à 100 %, aucune paire ne se
déclenchant. Or Otzma et le Sionisme religieux sont les seuls, avec le Likoud
et les haredim, à vouloir que Netanyahou reste Premier ministre — et les seuls
avec eux à refuser la commission d'enquête d'État sur le 7 octobre. Gouverner
ensemble en étant en désaccord sur QUI gouverne est le cœur de ce que la table
mesure.

| Paire | Poids | Justification |
|---|---|---|
| Otzma ⊥ Les Démocrates | 40 | Exclusion identitaire réciproque : héritier du kahanisme (fiche seed) contre la liste qui porte l'égalité des citoyens arabes (« pleine égalité » : pour/contre frontal). |
| Otzma ⊥ Yashar | 30 | Netanyahou PM + commission du 7 octobre : opposés sur les deux. |
| Otzma ⊥ Ensemble | 30 | Idem. |
| Otzma ⊥ Yisrael Beytenou | 26 | Idem — deux droites, mais opposées sur l'axe du scrutin. |
| Otzma ⊥ Unité nationale | 20 | Gantz n'exclut pas la droite (axe 1) — poids réduit. |
| Sionisme religieux ⊥ Les Démocrates | 34 | Même logique qu'Otzma, sans la charge kahaniste. |
| Sionisme religieux ⊥ Yashar | 26 | Netanyahou PM + commission. Nuance : alignés sur la conscription des haredim. |
| Sionisme religieux ⊥ Ensemble | 26 | Idem. |
| Sionisme religieux ⊥ Yisrael Beytenou | 22 | Idem, nuance conscription. |
| Sionisme religieux ⊥ Unité nationale | 16 | La plus faible de l'axe. |

**Trou à dessein** : pas de paire Otzma/Sionisme religieux ⊥ Les Réservistes.
Hendel a été retiré de l'affirmation structurante (il refuse de faire de
Netanyahou l'axe du scrutin) et sa ligne rouge est « l'idéologie, pas la
personne » — trop ambigu pour chiffrer sans fabriquer.

## Axe 3 — haredim ⊥ centre laïque (Lieberman historique ; le reste ajouté 2026-08-05)

Adossé aux affirmations exemption militaire, influence religieuse, mariage
civil/shabbat et budget des yeshivot de boussole-data (toutes sourcées le
2026-08-04).

| Paire | Poids | Justification |
|---|---|---|
| Yisrael Beytenou ⊥ Shas / JUT | 30 / 30 | Historique : carrière bâtie contre les partis haredim, « budget sectaire ». |
| Shas / JUT ⊥ Les Réservistes | 32 / 32 | Le refus le plus net du centre : Hendel refuse de siéger avec ces partis ; l'inégalité devant la conscription est le grief fondateur du mouvement. |
| Shas / JUT ⊥ Yashar | 28 / 28 | Eisenkot rejette « l'étreinte politique haredi » ; ses plans de conscription excluent de fait une coalition avec eux. |
| Shas / JUT ⊥ Les Démocrates | 26 / 26 | Golan : conscription égalitaire, écoles « qui refusent d'enseigner le tronc commun », budget = « plan de travail pour démanteler l'État ». |
| Shas / JUT ⊥ Ensemble | 24 / 24 | Shas accuse Bennett de « brader l'identité juive du pays » ; les deux fondateurs d'Ensemble ont attaqué le budget des yeshivot (cas rare : pas de division interne). Poids sous Yashar/Réservistes : pas de refus de siéger déclaré. |

**Trou à dessein** : pas de paire Unité nationale ⊥ Shas/JUT. Gantz est absent
des affirmations religieuses sourcées et a siégé avec les haredim dans le
gouvernement de 2020.

## Axe 4 — extrême droite ⊥ partis arabes (paires historiques, inchangées)

| Paire | Poids | Justification |
|---|---|---|
| Otzma ⊥ Hadash-Ta'al | 45 | Kahanisme vs partis arabes — la friction maximale de la table. |
| Otzma ⊥ Ra'am | 42 | Idem. |
| Sionisme religieux ⊥ Hadash-Ta'al | 38 | « Pleine égalité » : contre ; vs le parti qui porte l'égalité dans son nom. |
| Sionisme religieux ⊥ Ra'am | 34 | Idem. |

## Axe 5 — partis arabes dans les autres coalitions (Likoud historique ; le reste ajouté 2026-08-05)

Adossé à « Un gouvernement peut légitimement s'appuyer sur les voix des partis
arabes » (pour : Hadash-Ta'al, Ra'am, Les Démocrates ; contre : Ensemble,
Yisrael Beytenou, Les Réservistes, Otzma, Sionisme religieux). Asymétrie
systématique Hadash/Ra'am, sur le modèle des paires Likoud existantes : Ra'am
a gouverné en 2021 (improbable, pas inédit), Hadash jamais.

| Paire | Poids | Justification |
|---|---|---|
| Likoud ⊥ Hadash-Ta'al | 40 | Historique. |
| Likoud ⊥ Ra'am | 24 | Historique — « improbable, pas inédit ». |
| Ensemble ⊥ Hadash-Ta'al | 26 | Refus déclaré de l'appui arabe ; Hadash sans précédent gouvernemental. |
| Ensemble ⊥ Ra'am | 14 | Refus déclaré — mais Bennett et Lapid ont gouverné AVEC Ra'am en 2021. |
| Yisrael Beytenou ⊥ Hadash-Ta'al | 26 | Idem Ensemble. |
| Yisrael Beytenou ⊥ Ra'am | 14 | Lieberman a siégé avec Ra'am en 2021. |
| Les Réservistes ⊥ Hadash-Ta'al | 26 | « Doctrine sécuritaire plus agressive » (pilier du programme) ; contre la place au gouvernement des citoyens arabes ; parti nouveau, aucun précédent. |
| Les Réservistes ⊥ Ra'am | 20 | Idem, sans précédent 2021 — d'où plus haut qu'Ensemble/Lieberman. |

**Trous à dessein** :
- Les Démocrates ⊥ Ra'am/Hadash : zéro friction — Golan appelle explicitement
  l'opposition à s'associer à Ra'am.
- Yashar et Unité nationale ⊥ partis arabes : absents de l'affirmation —
  l'ambiguïté d'Eisenkot (trois conditions, chefs arabes non invités en avril
  2026) est sa position ; la chiffrer serait la trahir.
- Hadash-Ta'al ⊥ Ra'am : leurs divisions sont réelles (thérapies de conversion,
  sortie de Ra'am de la Liste commune) mais ils ont cohabité des années sur une
  même liste — non retenu tant qu'ils se présentent ensemble dans les sondages.
  À réévaluer au dépôt officiel des listes.

---

## Garde de cohérence

La table est vérifiée en dev contre les **listes actives** (jamais contre le
plateau du jeu, filtré par le dernier sondage — leçon du faux positif
`unite-nationale`, commit `250454f` ; et jamais contre la base de prod — leçon
`yachad-bennett` du 2026-08-03). Un slug orphelin déclenche une erreur console
en dev et s'ignore en prod.
