# Boussole — sources des positions

Ce document justifie chaque position de `client/src/pages/Boussole.jsx` **ajoutée
ou retirée à partir du 2026-08-03**. Il applique à la Boussole la discipline déjà
tenue ailleurs sur le site : `histoire_source` sur chaque liste, `margin_error_pct`
omis quand la source ne le publie pas, `current_knesset_seats` jamais déduit d'un
sondage.

Règle : **une position sans source ne s'écrit pas.** Un trou visible vaut mieux
qu'une donnée fabriquée — le pourcentage d'affinité affiche son dénominateur,
donc une couverture partielle se lit à l'écran au lieu de se cacher.

Les affirmations sont numérotées de 1 à 10 dans l'ordre du tableau `STATEMENTS`.

---

## Positions ajoutées

### Shas — 2. Réforme judiciaire → **pour**

Shas et le Judaïsme unifié de la Torah ont été « au premier rang de la poussée
réformatrice ». Le mobile est documenté : la clause de dérogation est vue par les
deux partis comme l'outil qui mettrait la loi d'exemption militaire à l'abri du
contrôle judiciaire, après des décisions de la Cour suprême sur la conscription et
sur les subventions aux écoles refusant le tronc commun.

*Nuance retenue* : tous deux sont ensuite devenus une force modératrice au sein de
la coalition. La position reste « plutôt pour », pas « fer de lance ».

- https://www.timesofisrael.com/haredi-parties-were-at-forefront-of-overhaul-push-then-they-werent-what-changed/
- https://en.wikipedia.org/wiki/2023_Israeli_judicial_reform

**Certitude : élevée.**

### Judaïsme unifié de la Torah — 2. Réforme judiciaire → **pour**

Même source, même raisonnement que Shas.

**Certitude : élevée.**

### Shas — 10. Moins d'État dans l'économie → **contre**

L'Israel Democracy Institute résume l'idéologie du parti par la « promotion de la
justice sociale », et Shas met en avant de longue date les questions de protection
sociale, de santé et d'éducation pour son électorat. C'est sa ligne la mieux
établie hors du champ religieux.

- https://en.idi.org.il/israeli-elections-and-parties/parties/shas/
- https://www.jns.org/feature/israeli-elections-2026-meet-the-parliament-mk-moshe-abutbul

**Certitude : élevée.**

### Judaïsme unifié de la Torah — 10. Moins d'État dans l'économie → **contre**

Le parti défend les intérêts de la communauté haredi en matière d'éducation et de
protection sociale (logement, santé, éducation). Fait daté et vérifiable : le
budget 2026 a intégré plus d'un milliard de shekels supplémentaires pour les
yeshivot et institutions haredim, en contrepartie de l'abandon par Shas et le JUT
de leur exigence sur la loi d'exemption.

- https://jewishinsider.com/2026/03/israel-2026-budget-netanyahu-coalition-haredi-parties-draft-exemption-election/

**Certitude : moyenne.** Le JUT n'a pas de doctrine économique générale ; la
position se déduit d'un comportement budgétaire constant, pas d'un programme.

### Shas — 8. Fermeté sécuritaire → **pour**

L'IDI relève qu'« en une série de votes à la Knesset sur les grands dossiers
diplomatiques, Shas a adopté une position faucon ».

- https://en.idi.org.il/israeli-elections-and-parties/parties/shas/

**Certitude : moyenne.** La même page note que Shas « soutient la conclusion
d'accords de paix avec les États arabes tout en préservant la sécurité des
habitants d'Israël » — l'IDI signale lui-même la contradiction sans la trancher.

### Les Réservistes — 8. Fermeté sécuritaire → **pour**

« Adopter une doctrine sécuritaire plus agressive » figure parmi les piliers
déclarés du programme, avec la création d'une commission d'enquête d'État sur le
7 octobre.

- https://www.timesofisrael.com/yoaz-hendel-says-his-reservists-party-wants-government-without-haredi-arab-factions/

**Certitude : élevée.**

### Les Réservistes — 9. Influence des ultra-orthodoxes → **pour**

Yoaz Hendel a fondé le parti pour faire passer une loi de conscription
universelle et a exclu de façon répétée de siéger dans une coalition avec les
partis haredim.

- https://www.timesofisrael.com/yoaz-hendel-says-his-reservists-party-wants-government-without-haredi-arab-factions/
- https://www.jpost.com/israel-news/politics-and-diplomacy/article-903788

**Certitude : élevée.**

### Les Réservistes — 7. Égalité des citoyens arabes → **contre**

Position la mieux documentée de tout ce lot. Hendel réclame un « gouvernement
d'unité sioniste sans partis arabes ni haredim », et déclare le 20/11/2025 :

> « Quiconque choisit de ne pas servir choisit d'être un citoyen de seconde zone.
> Il ne recevra rien de l'État. Il ne pourra ni voter ni être élu à la Knesset. »

Le refus porte explicitement sur les deux volets de l'affirmation : l'égalité
pleine et la place au gouvernement.

- https://www.timesofisrael.com/yoaz-hendel-says-his-reservists-party-wants-government-without-haredi-arab-factions/

**Certitude : élevée.**

---

## Positions retirées

### Les Réservistes — 1. Netanyahou doit rester Premier ministre (était : contre)

**Retirée le 2026-08-03. Erreur factuelle, et sur l'affirmation la plus lourde du
questionnaire.** Le parti était classé « contre ». Or Yoaz Hendel refuse
explicitement de faire de Netanyahou l'axe du scrutin :

> « S'il y a demain un gouvernement de 70-80 sièges sionistes et que Netanyahou en
> fait partie, bien sûr que je le rejoindrais. »
>
> « Ma ligne rouge, c'est quelle idéologie le gouvernement représente, si c'est un
> gouvernement sioniste. »

Sa réserve ne porte pas sur la personne mais sur la composition : « un gouvernement
à 61 sièges pour Netanyahou n'arrivera pas, parce que cela signifie siéger avec les
partis ultra-orthodoxes ». C'est une objection aux haredim, pas à Netanyahou — et
elle est déjà encodée à l'affirmation 9.

Conséquence concrète de l'erreur : un utilisateur répondant « Netanyahou doit
rester » était écarté des Réservistes sur la base d'une position que le parti
rejette. Absence de position = position documentée, pas oubli.

- https://www.jpost.com/israel-news/politics-and-diplomacy/article-903510 (23/07/2026)

### Judaïsme unifié de la Torah — 8. Fermeté sécuritaire (était : pour)

**Retirée le 2026-08-03, faute de source — et contredite par la meilleure
disponible.** L'IDI décrit le JUT comme « centriste » en matière de sécurité et de
diplomatie, faisant primer « les considérations religieuses sur les considérations
sécuritaires ou diplomatiques ». Le parti a voté le désengagement de Gaza alors
même qu'il soutient habituellement le camp de droite, pour des motifs religieux.

Je l'avais posée par alignement de coalition. L'alignement n'est pas une position.

- https://en.idi.org.il/israeli-elections-and-parties/parties/united-torah-judaism/

### Les Réservistes — 3. Loi religieuse juive (était : contre)

**Retirée le 2026-08-03, faute de source.** Je l'avais déduite de l'hostilité du
parti aux partis haredim. Or ce conflit porte sur la **conscription**, pas sur la
place de la halakha dans l'État — et Yoaz Hendel est lui-même issu du sionisme
religieux. La déduction était illégitime.

---

## Affirmations ajoutées le 2026-08-03 (10 → 13)

Motif : avec 10 affirmations et une couverture partielle, beaucoup de parties se
jouaient sur 4 ou 5 comparaisons seulement — d'où des 100 % à répétition et des
égalités impossibles à départager. Élargir le questionnaire attaque la cause.
Ces trois sujets ont été retenus parce qu'ils **clivent** et qu'ils se **sourcent**.

Couverture moyenne : 7,2/10 avant → **9,3/13** après. Minimum : 4 → **7**.

### 11. « Les terroristes condamnés doivent encourir la peine de mort. »

La meilleure source possible : un **appel nominal**. Loi adoptée le 30/03/2026 par
62 voix contre 48, à l'initiative d'Otzma Yehudit.

- **Pour** : Likoud, Shas, Otzma Yehudit, Sionisme religieux, Yisrael Beytenou
  (parti d'opposition ayant voté avec la coalition).
- **Contre** : Les Démocrates, Hadash-Ta'al, Ra'am, Unité nationale (Bleu Blanc).
- **Sans position, à dessein** : le Judaïsme unifié de la Torah, dont les deux
  composantes se sont séparées — Degel HaTorah a voté pour, Agoudat Israël s'est
  abstenue, seule exception au sein de la coalition. Un parti divisé n'a pas de
  position : on n'en invente pas une.
- **Sans position** : Yashar et Les Réservistes, qui n'existaient pas comme
  groupes à la Knesset en mars 2026 ; Ensemble, dont seule la composante Yesh Atid
  a voté (contre) — l'attribuer à une liste que Bennett dirige serait un abus.

- https://en.wikipedia.org/wiki/Death_Penalty_for_Terrorists_Law

**Certitude : élevée** (vote nominal).

### 12. « Il faut une commission d'enquête d'État indépendante sur le 7 octobre. »

Ligne de fracture majeure de la campagne. La coalition a confirmé qu'aucune
commission d'enquête d'État ne serait créée avant le scrutin, invoquant des
contraintes de calendrier ; elle propose à la place une commission de six membres
nommée à la majorité qualifiée. L'opposition refuse d'y participer, y voyant une
tentative de contrôler l'enquête.

- **Pour** : Eisenkot le soutient explicitement ; c'est un pilier déclaré du
  programme de Bennett comme de celui des Réservistes. Les Démocrates, Unité
  nationale et Yisrael Beytenou au titre de l'opposition.
- **Contre** : Likoud et ses partenaires de coalition, qui l'ont bloquée.
- **Sans position** : Hadash-Ta'al et Ra'am — appartenir à l'opposition ne suffit
  pas à documenter une position sur ce format précis.

- https://www.thejc.com/news/israel/no-october-7-inquiry-before-elections-israel-xcgbj2pb
- https://www.haaretz.com/israel-news/israel-politics/2026-07-22/ty-article/.premium/netanyahu-government-urges-high-court-not-to-intervene-in-october-7-probe/0000019f-8aac-df92-a7ff-aeaea8120000

**Certitude : élevée** pour les partis nommés, **moyenne** pour les trois rattachés
au bloc d'opposition.

### 13. « Il faut le mariage civil et des transports publics le shabbat. »

Sujet religion-État distinct de l'affirmation 3 (place de la halakha) : il porte
sur des mesures concrètes, pas sur un principe. Naftali Bennett, le 25/04/2026 :

> « Les villes doivent pouvoir choisir si elles veulent des transports publics le
> shabbat. »
>
> « Chaque personne en Israël devrait pouvoir concrétiser son amour dans ce pays,
> et ne pas devoir partir à l'étranger. »

Shas lui a répondu qu'il était « prêt à brader l'identité juive du pays ».

- **Pour** : Ensemble (citations directes), Yisrael Beytenou (le mariage civil est
  le combat historique de Lieberman pour l'électorat russophone), Les Démocrates.
- **Contre** : Shas (réaction citée), le Judaïsme unifié de la Torah, le Sionisme
  religieux et Otzma Yehudit.
- **Sans position** : Hadash-Ta'al et Ra'am, faute de source — et la question
  divise réellement entre laïcité de Hadash et conservatisme religieux de Ra'am.

- https://www.timesofisrael.com/backing-public-transit-on-shabbat-bennett-steers-campaign-into-jammed-center-lane/

**Certitude : élevée** pour Ensemble et Shas, **moyenne** pour les autres.

### 14. « Un gouvernement peut légitimement s'appuyer sur les voix des partis arabes. »

La vraie ligne de fracture du centre en 2026, et à ne pas confondre avec
l'affirmation 7 : celle-là porte sur les **droits** des citoyens arabes, celle-ci
sur l'**arithmétique parlementaire**.

- **Contre** : Bennett, en avril 2026, alors même qu'il avait gouverné avec Ra'am
  en 2021 — « les partis arabes ne sont pas sionistes, et nous ne nous appuierons
  donc pas sur eux ». Lieberman rejette toute coopération avec les partis arabes
  « non sionistes ». Hendel veut « un gouvernement d'unité sioniste sans partis
  arabes ni haredim ». Otzma Yehudit et le Sionisme religieux par cohérence avec
  leur position déjà documentée à l'affirmation 7.
- **Pour** : Hadash-Ta'al et Ra'am, qui le revendiquent ; Les Démocrates, dont
  Yair Golan appelle explicitement l'opposition à s'associer à Ra'am.
- **Sans position, à dessein** : **Yashar**. Eisenkot n'exclut pas ces partis mais
  pose trois conditions — reconnaissance d'Israël comme État juif et démocratique,
  adhésion aux valeurs de la Déclaration d'indépendance, engagement au service
  militaire ou civil — et il a convoqué les chefs de l'opposition en avril 2026
  pour une « majorité sioniste » sans y inviter les dirigeants arabes. Cette
  ambiguïté **est** sa position ; la trancher serait la trahir.
- **Sans position** : Unité nationale, Likoud, Shas et le JUT, faute de source.

- https://arabcenterdc.org/resource/israels-election-and-eisenkots-arab-coalition-dilemma/
- https://www.timesofisrael.com/eisenkot-invites-most-opposition-chiefs-to-meet-coordinate-path-to-zionist-majority-victory/
- https://www.jpost.com/israel-news/politics-and-diplomacy/article-895522

**Certitude : élevée** pour Ensemble, Yisrael Beytenou et Les Réservistes.

---

## ⚠️ Diagnostic du 2026-08-03 : la boussole désigne un BLOC, pas un parti

Mesure faite sur les 78 paires de partis possibles : **20 d'entre elles ne
s'opposent sur AUCUNE affirmation**. Trois groupes sont entièrement
indiscernables les uns au sein des autres :

| Groupe | Partis mutuellement indiscernables |
|---|---|
| Droite et religieux | Likoud, Otzma Yehudit, Sionisme religieux, Shas, JUT |
| Centre | Yashar, Yisrael Beytenou, Ensemble, Unité nationale, Les Réservistes |
| Gauche et partis arabes | Les Démocrates, Hadash-Ta'al, Ra'am |

Conséquence directe, observée en production : un utilisateur obtient quatre partis
à 100 % simultanément. Ce n'est pas un défaut de calcul — ce sont quatre partis
que le questionnaire n'oppose jamais. **La page s'intitule « Quel parti te
ressemble ? » et répond en réalité « quel bloc te ressemble ».**

L'affirmation 14 (appui sur les partis arabes) a été ajoutée pour attaquer ce
problème sur le centre. Elle influence les scores, mais **elle n'a pas fait
baisser le compteur** : Ensemble, Yisrael Beytenou et Les Réservistes y sont tous
du même côté, et Yashar en est absent — or une absence ne crée pas de désaccord.

Pour rendre ces partis réellement discernables, il faut des affirmations où ils
prennent des positions **opposées**. Pistes à sourcer :

- **Likoud vs Otzma Yehudit / Sionisme religieux** : prière juive sur le mont du
  Temple (le Likoud défend officiellement le statu quo, Ben Gvir veut le changer).
- **Shas / JUT vs Otzma / Sionisme religieux** : la conscription des haredim.
  Les partis nationaux-religieux servent ; Hendel accuse d'ailleurs le Sionisme
  religieux d'« encourager l'évasion massive du service ». Piste solide.
- **Shas vs JUT** : le vote sur la peine de mort les a déjà séparés en pratique
  (Degel HaTorah pour, Agoudat Israël abstenue) ; il faudrait un sujet où Shas,
  parti social séfarade, s'oppose franchement au JUT ashkénaze.
- **Ensemble vs Yisrael Beytenou** : Yisrael Beytenou a voté la peine de mort ;
  documenter la position de Bennett sur ce texte les séparerait aussitôt.

Tant que ce travail n'est pas fait, le titre de la page promet plus que le
questionnaire ne délivre.

---

## Positions antérieures vérifiées

Début du remboursement de la dette décrite plus bas, en commençant par
l'affirmation 1 comme prévu.

### Shas et le Judaïsme unifié de la Torah — 1. Netanyahou → **pour** (confirmé)

Malgré une crise ouverte sur la loi de conscription — Shas a menacé de faire tomber
le budget 2026 — les deux partis sont restés dans la coalition, et Aryeh Deri y est
décrit comme « celui qui tient le gouvernement ». Netanyahou a fait avancer leurs
priorités législatives en échange de leur soutien, jusqu'à la Loi fondamentale sur
l'étude de la Torah adoptée le 13/07/2026 par 63 voix contre 52.

La tension est réelle mais elle porte sur le prix du soutien, pas sur son principe.

- https://www.timesofisrael.com/shas-vows-to-oppose-2026-budget-unless-coalition-passes-haredi-draft-exemption-bill/
- https://www.timesofisrael.com/knesset-passes-contentious-basic-law-declaring-torah-study-a-constitutional-value/

**Certitude : élevée.**

---

## Trous laissés volontairement

| Parti | Affirmations sans position | Motif |
|---|---|---|
| Shas | 5, 6, 7 | Pas de ligne propre et stable. L'IDI note même que Shas « soutient la conclusion d'accords de paix avec les États arabes », en tension avec ses votes. |
| Judaïsme unifié de la Torah | 5, 6, 7, 8 | Parti religieux et social, sans doctrine diplomatique ni sécuritaire propre (IDI). |
| Les Réservistes | 1, 3, 5, 6 | Liste neuve ; positions non documentées à ce jour hors sécurité, conscription et composition de coalition. Sur l'affirmation 1, l'absence est **documentée** : Hendel refuse de faire de Netanyahou sa ligne rouge (voir plus haut). |

---

## Dette de sourçage

Les positions **antérieures au 2026-08-03** — l'essentiel du tableau — n'ont pas
encore été vérifiées une par une. Elles proviennent de la rédaction initiale et
sont plausibles, mais elles ne portent pas de source.

Tant que cette dette n'est pas soldée, la Boussole ne devrait pas être mise en
avant comme une référence sourcée au même titre que l'historique des 25 Knesset.

Ordre de priorité suggéré, du plus exposé au moins exposé :

1. ~~Affirmation 1 (Netanyahou)~~ — **faite le 2026-08-03**. Elle a livré une
   erreur factuelle (Les Réservistes) sur l'affirmation qui pèse le plus lourd.
   Taux de correction à ce stade : 3 positions invalidées sur 12 vérifiées. Il
   faut s'attendre à un taux comparable sur le reste.
2. Affirmations 5, 6, 7 (paix, implantations, citoyens arabes) — les plus
   sensibles, celles sur lesquelles une erreur se paierait le plus cher.
3. Les partis les mieux couverts (Les Démocrates 10/10, Sionisme religieux,
   Hadash-Ta'al, Ra'am, Ensemble 8/10) — ce sont eux qui sortent le plus souvent
   en tête, donc eux qu'on citera.
4. Le reste.

---

## À revoir au dépôt des listes du 9 septembre 2026

**Le nom des Réservistes a changé et n'est pas stabilisé.** Après le ralliement de
Chili Tropper (ex-Bleu Blanc) le 07/07/2026, l'alliance a d'abord été annoncée sous
le nom « Yesodot Yisrael » (Fondations d'Israël), puis apparaît dans les sondages
sous « Zionist Home–The Reservists » / « Bayit Tzioni–HaMiluimnikim ». Notre
référentiel dit encore « Les Réservistes (Hendel-Tropper) ».

Ce n'est pas urgent, pour une raison de conception qui mérite d'être notée : le
collecteur Kan matche sur `/טרופר|הנדל/`, c'est-à-dire sur les **noms des
dirigeants**, pas sur celui de la liste. Il survit donc aux renommages. C'est
exactement l'inverse du piège `yachad-bennett`, où un nom de liste périmé avait
figé une entité fantôme.

- https://www.timesofisrael.com/yoaz-hendels-reservists-teams-up-with-ex-minister-chili-tropper-ahead-of-election/
- https://israeled.org/2026-israeli-election-polling-the-month-ending-july-31/
