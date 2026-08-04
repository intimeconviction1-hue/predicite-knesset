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
prennent des positions **opposées**.

### Avancement : 20 → 8 paires (2026-08-03)

**Correction sans gain — Ensemble n'est pas contre les implantations.** Troisième
erreur factuelle héritée, et le même motif : une liste récente rangée trop à
gauche.

Ensemble figurait « contre » l'affirmation 6. Or Naftali Bennett, **en tant que
chef de la liste**, se dit « favorable à l'implantation légale en zone C » et
affirme que « la zone C fera partie de l'État d'Israël, les zones A et B de
l'autonomie palestinienne ». Il défend une « autonomie palestinienne sous
stéroïdes » et refuse un État. Nuance conservée : il réclame le démantèlement des
avant-postes illégaux, ce qui lui a valu l'ire de la droite — il distingue
construction légale et sauvage, il ne conteste pas le principe.

**Effet sur le compteur : nul.** La correction brise la paire Ensemble ↔ Unité
nationale, mais en fait réapparaître une autre — Yashar ↔ Ensemble, puisque
l'affirmation 6 était devenue leur seule opposition. C'est le résultat juste :
ces deux partis se ressemblent réellement sur ce point. **La justesse et le
compteur ne vont pas toujours dans le même sens, et c'est la justesse qui
tranche.**

  - https://www.timesofisrael.com/what-occupation-asks-bennett-rejecting-two-state-solution/
  - https://www.timesofisrael.com/bennett-calls-to-dismantle-illegal-settlement-outposts-draws-right-wing-leaders-ire/
  - https://arabcenterdc.org/resource/bennetts-agenda-on-palestine-shrinking-the-conflict/

### Relecture complète des positions d'Ensemble à l'aune de la table

Faite le 2026-08-03, après la troisième erreur. Sur les 19 affirmations, les
positions d'Ensemble tiennent, à deux exceptions près.

**Affirmation 5 (relancer des négociations de paix) — le trou reste, mais il
change de statut.** Ce matin il était marqué « arbitrage éditorial en attente ».
Il est désormais **justifié par règle** : c'est le cas « chef et numéro deux
documentés en sens opposés ».

Bennett rejette la voie de la négociation — doctrine du « rétrécissement du
conflit », qui ne vise ni à résoudre ni même à gérer le conflit mais à le réduire
jusqu'à l'oubli ; « aussi longtemps que j'aurai le pouvoir, je ne céderai pas un
centimètre de la terre d'Israël, point » ; refus d'un État palestinien maintenu en
2026 comme chef de liste. Lapid défend de longue date les deux États. Un parti
dont les deux fondateurs s'opposent frontalement n'a pas de position.

Réserve : la doctrine de Bennett est documentée pour son mandat de Premier
ministre, sous une autre étiquette, même si sa substance est confirmée en 2026
(« la zone C fera partie de l'État d'Israël »). Et le maintien de la position de
Lapid **au sein d'Ensemble** n'est pas documenté — il est notoire, pas sourcé.
Position à revoir si l'un des deux s'exprime ès qualités pendant la campagne.

  - https://arabcenterdc.org/resource/bennetts-agenda-on-palestine-shrinking-the-conflict/

**Affirmation 10 (moins d'État dans l'économie) — « pour », non sourcé.** Hérité
de la rédaction initiale. Plausible : Bennett vient de la tech et Lapid a été
ministre des Finances, tous deux libéraux en économie. Mais aucune source ne
l'établit, et c'est l'une des positions les plus anciennes du fichier. **À
vérifier** — elle fait partie de la dette listée plus bas.

### Précision de méthode : la ligne du chef n'est pas un héritage

La règle **« on n'hérite pas d'une position par fusion »** a été affinée le
2026-08-03. Elle visait à ne pas prêter à Ensemble les positions de **Lapid**, son
numéro deux — c'est ce qui justifie de laisser la liste sans position sur la peine
de mort et sur l'accord otages, où seul Lapid s'est exprimé.

Mais elle ne dit rien de la ligne du **chef de liste**, qui est par définition la
ligne de la liste. Quand Bennett s'exprime en tant que chef d'Ensemble, il engage
Ensemble.

Critère retenu, à appliquer uniformément :

| Situation | Traitement |
|---|---|
| Le chef de liste déclare une position pendant la campagne, ès qualités | Position **de la liste** |
| Un composant ou un numéro deux s'exprime seul | **Pas** de position |
| Chef et composant documentés en sens opposés | **Pas** de position (parti divisé) |
| Position ancienne du chef sous une autre étiquette | **Pas** de position |

C'est ce dernier cas qui maintient Ensemble hors de l'affirmation sur la peine de
mort : Bennett s'y est dit favorable en 2015, à la tête du Foyer juif, pas comme
chef d'Ensemble.

**Résolu par une CORRECTION — Yashar vs Ensemble et Unité nationale.** Aucune
affirmation ajoutée : Yashar était simplement **du mauvais côté** de l'affirmation
6, sur l'extension des implantations.

Il y figurait « contre ». Or Gadi Eisenkot déclarait en juin 2026, dans un
entretien à Haaretz :

> « Je crois beaucoup à l'implantation en Judée-Samarie. »
>
> « Je n'ai jamais dit deux États pour deux peuples… quiconque parle de "paix
> maintenant" et de deux États ne comprend pas le conflit. »

C'est la **seconde erreur factuelle** trouvée sur ce parti, après son classement
en « contre » le maintien de Netanyahou. Toutes deux allaient dans le même sens :
elles rangeaient Yashar plus à gauche qu'il ne se situe.

Deux réserves consignées :

1. L'affirmation mêle **extension** et **annexion**. Seule l'extension est
   documentée chez Eisenkot ; rien ne dit qu'il soutienne l'annexion. Le « pour »
   est donc juste sur la première moitié de l'énoncé, muet sur la seconde. Si
   l'affirmation était un jour scindée, il faudrait le revérifier.
2. Je n'ai **pas** ajouté Yashar à l'affirmation 5 (relancer des négociations de
   paix), bien que la seconde citation s'en approche. Rejeter le cadre des deux
   États n'est pas exactement refuser toute négociation. Retenue délibérée.

Source : les deux citations proviennent d'un entretien à Haaretz de juin 2026,
consultées via l'IMEU, l'original étant derrière un péage. **À reconfirmer sur la
source primaire** — l'IMEU est une organisation de plaidoyer, même si elle cite
ici explicitement Haaretz et sa date.

  - https://imeu.org/resources/important-figures/6-things-to-know-about-yashar-party-leader-gadi-eisenkot/497

  **Certitude : moyenne-élevée**, en attente de la source primaire.

**Résolu — Otzma Yehudit vs Shas et le JUT.** Nouvelle affirmation : la montée
des juifs sur le mont du Temple. C'est la faille qui sépare les partis **haredim**
des **nationaux-religieux**, à l'intérieur d'une même coalition — et ce n'est pas
une nuance de salon : les partis haredim ont envisagé de quitter le gouvernement
quand Ben Gvir a poussé la prière juive sur le site.

Moshe Gafni (JUT) : « Monter sur le mont du Temple implique une interdiction grave
de *karet* », et « nous exigeons la fermeture du mont du Temple aux juifs ». Côté
Shas, le grand rabbin séfarade Yitzhak Yosef — fils d'Ovadia Yosef — a écrit à Ben
Gvir pour rappeler la « sévérité de l'interdit » et l'avertir qu'il risquait de
« faire pécher la multitude ». Le motif est l'impureté rituelle : sans les cendres
de la vache rousse nul ne peut atteindre la pureté requise, et l'emplacement du
Saint des Saints est inconnu.

En face, Ben Gvir y monte et y prie régulièrement. Le Likoud est du même côté
qu'Otzma, Netanyahou ayant soutenu l'extension de la prière juive en janvier
2026 — c'est pourquoi ce sujet ne sépare pas ces deux-là (voir la piste abandonnée
plus bas, qui reste valable sur ce point précis).

  - https://www.timesofisrael.com/haredi-parties-mull-bolting-coalition-as-ben-gvir-pushes-jewish-prayer-on-temple-mount/
  - https://www.timesofisrael.com/ben-gvir-again-ascends-temple-mount-haredi-mk-slams-visit-as-desecration/
  - https://israel365news.com/373665/sephardi-chief-rabbi-ben-gvir-sinning-by-visiting-temple-mount/

  **Certitude : élevée** pour Shas, le JUT et Otzma ; **moyenne** pour le Sionisme
  religieux, dont le camp porte cet activisme sans que j'aie de déclaration de
  parti datée.

**Résolu — Les Démocrates vs Hadash-Ta'al, dernière paire du foyer
gauche/arabe.** Nouvelle affirmation : Israël comme État juif plutôt que comme
« État de tous ses citoyens ».

Hadash est explicitement **non sioniste** — héritier du parti communiste Maki, il
promeut la coopération judéo-arabe et défend un État de tous ses citoyens. Yair
Golan revendique à l'inverse « l'âme démocratique **et sioniste** de l'État
d'Israël », et distingue lui-même son parti des partis arabes en appelant
l'« opposition sioniste » à travailler avec Ra'am.

**Shas et le JUT en sont absents à dessein.** Les partis haredim sont
doctrinalement non sionistes : ils participent à l'État sans adhérer au sionisme
comme idéologie. Les ranger d'un côté ou de l'autre trahirait une position
théologique que ni « pour » ni « contre » ne rend. **Ra'am aussi**, faute de
source : il travaille dans le cadre de l'État sans s'en réclamer.

  - https://jewishvirtuallibrary.org/hadash-political-party
  - https://www.timesofisrael.com/liveblog_entry/the-democrats-golan-tonight-the-fight-begins-for-the-democratic-and-zionist-soul-of-israel/

  **Certitude : élevée.** Effet : Hadash-Ta'al et Les Démocrates sortent tous deux
  de la liste. Le foyer gauche/arabe est entièrement réglé.

### Inférence refusée — Ben Gvir et la conscription des haredim

Piste explorée puis **écartée**. Ben Gvir déclare, à propos de l'enrôlement des
haredim : « Je ne pense pas que la contrainte aidera. » C'est une position sur la
**méthode**, pas sur le maintien de l'exemption. En tirer un « pour » à
l'affirmation 4 aurait séparé Otzma Yehudit du Sionisme religieux — donc gagné une
paire — mais au prix exact de l'inférence rejetée pour le JUT sur la sécurité et
pour Les Réservistes sur la halakha.

Gagner une paire ne justifie pas d'abaisser le standard. Consigné pour que
personne ne refasse le chemin en croyant à une piste neuve.

  - https://www.timesofisrael.com/liveblog_entry/ben-gvir-on-haredi-draft-i-dont-think-coercion-will-help/

**Résolu — Yisrael Beytenou vs Les Réservistes.** Nouvelle affirmation : accepter
ou non de gouverner avec Netanyahou. C'est la question centrale du scrutin, et
elle ne figurait nulle part.

Gantz a proposé en août 2025 un « gouvernement de rédemption des otages » à mandat
de six mois incluant Netanyahou, à condition d'en écarter Smotrich et Ben Gvir.
Lieberman a répondu que c'était « un spectacle pitoyable » et que Gantz
« rampait dans la coalition ». Hendel, lui, rejoindrait un gouvernement de 70-80
sièges sionistes même avec Netanyahou dedans — sa ligne rouge est l'idéologie, pas
la personne.

**Ensemble en est absent** : Lapid a déclaré « je ne siégerai pas dans un
gouvernement sous Benjamin Netanyahou, point », mais c'est Lapid, et Ensemble est
dirigé par Bennett. **Yashar aussi** : Eisenkot fait campagne contre Netanyahou
sans avoir formulé de refus explicite de siéger avec lui.

  - https://www.timesofisrael.com/lapid-liberman-balk-at-gantzs-plan-to-join-hostage-redemption-government-with-pm/
  - https://www.jpost.com/israel-news/politics-and-diplomacy/article-903510

  **Certitude : élevée.**

### Découverte : Ensemble est divisé sur la peine de mort

En cherchant à documenter la position propre de Bennett, il apparaît qu'il
**soutient** la peine de mort pour les terroristes — il s'était prononcé pour son
application égale aux terroristes juifs et arabes. Or Lapid a combattu le texte de
2026 au plénum, le qualifiant d'« opération de communication dévoyée ».

Les deux fondateurs d'Ensemble sont donc sur des positions opposées. Ce n'est pas
un trou de sourçage : **c'est exactement la situation du Judaïsme unifié de la
Torah**, dont les deux composantes se sont séparées au même vote. Un parti divisé
n'a pas de position, et laisser Ensemble sans position sur ce sujet est le
traitement juste, pas un pis-aller.

  - http://www.timesofisrael.com/bennett-backs-death-penalty-for-jewish-terrorists/
  - https://www.timesofisrael.com/knesset-passes-death-penalty-law-for-palestinians-convicted-of-deadly-acts-of-terror/

### Le verrou restant : Yashar et Ensemble

Sur les 13 paires qui subsistent, **8 impliquent l'un de ces deux partis**. Ce
n'est pas un hasard, et le diagnostic est clair : ce sont les deux formations dont
les positions PROPRES sont les moins documentées.

- **Yashar** est neuve, et Eisenkot cultive délibérément l'ambiguïté — sur les
  partis arabes comme sur Netanyahou, il pose des conditions plutôt que des
  refus. Cette ambiguïté est une stratégie, donc elle durera.
- **Ensemble** est une fusion dont le chef ne pense pas comme son cofondateur.
  Chaque fois qu'une source documente « la position de Lapid », elle ne documente
  pas celle du parti que Bennett dirige.

La règle « on n'hérite pas d'une position par fusion » a un coût mesurable : elle
est responsable de la moitié des paires restantes. Elle reste juste — l'alternative
serait d'attribuer à Bennett des positions qu'il ne défend pas — mais il faut
savoir que le déblocage viendra de **déclarations propres de Bennett et
d'Eisenkot pendant la campagne**, pas d'un travail d'archive.

**Résolu — Ra'am vs Hadash-Ta'al et Les Démocrates.** Nouvelle affirmation :
l'égalité des droits des personnes LGBT. C'est la ligne qui divise réellement les
deux partis arabes, que tout le reste du questionnaire confondait — Ra'am est
islamiste et culturellement conservateur, Hadash est communiste et laïque.

Adossée à un vote : en juillet 2020, sur le renvoi en commission d'un texte
interdisant les « thérapies de conversion », les députés de Hadash ont voté pour
— dont Ayman Odeh, alors chef de la Liste commune — et ceux de Ra'am contre.
Ra'am a ensuite quitté la Liste commune, après que les autres partis eurent
refusé deux ultimatums lui demandant de s'engager à voter ensemble contre les
textes LGBT. Mansour Abbas s'est par ailleurs déclaré favorable aux « thérapies de
conversion » dans un entretien à Walla.

Les partis religieux juifs — Shas, JUT, Sionisme religieux, Otzma Yehudit — sont
placés « contre » par cohérence avec leur opposition documentée aux réformes
religion-État (affirmation 13). **Certitude : moyenne** pour eux, **élevée** pour
Ra'am, Hadash et Les Démocrates.

Ensemble, Yashar, Les Réservistes et Yisrael Beytenou en sont absents faute de
source propre : Bennett soutient le mariage civil mais vient du sionisme
religieux, et rien ne documente sa position ici.

  - https://www.timesofisrael.com/how-islamist-raam-broke-arab-politics-and-may-win-the-keys-to-the-government/
  - https://ecfr.eu/special/mapping_palestinian_politics/raam/

  Effet : Ra'am n'est plus confondu avec aucun parti.

**Résolu — Sionisme religieux vs Shas et JUT.** Ajouté à l'affirmation 4 du côté
« contre ». Déclaration officielle du parti le 10/12/2025 : il ne votera « que
pour une loi qui amènera un enrôlement **réel et rapide** des haredim dans Tsahal,
afin de répondre aux besoins sécuritaires d'Israël et d'alléger le fardeau des
combattants ». Son député Moshe Solomon a rompu les rangs contre la loi
interdisant l'arrestation des réfractaires (adoptée 58-54). Position sous tension
— le parti subit la pression de coalition et a démenti avoir arrêté sa décision —
mais déclarée, datée, et opposée à celle des partis haredim.

  - https://www.timesofisrael.com/religious-zionism-denies-it-agreed-to-back-controversial-haredi-draft-exemption-bill/
  - https://www.timesofisrael.com/knesset-passes-law-banning-arrests-of-haredi-draft-dodgers-legitimizing-ongoing-non-enlistment/

  **Certitude : moyenne-élevée.**

**Résolu — Likoud vs Otzma Yehudit et Sionisme religieux.** Nouvelle affirmation :
l'accord de cessez-le-feu et de libération des otages. C'est la fracture réelle de
la droite israélienne, et elle est parfaitement documentée.

Ben Gvir et Smotrich ont annoncé voter **contre** l'accord et menacé de faire
tomber la coalition. Smotrich : « Nous n'accepterons pas la fin de la guerre avant
la destruction du Hamas. » Ben Gvir a menacé de quitter le gouvernement si le
Hamas « continue d'exister » après la libération des otages — il l'avait déjà fait
lors d'une trêve précédente, avant de revenir. Les deux ont publiquement reproché
à Netanyahou d'avoir consenti à la trêve proposée : c'est ce reproche même qui
documente la position du Likoud.

Côté opposition : Lapid a offert un « filet de sécurité » parlementaire pour faire
passer un accord malgré la défection de l'extrême droite ; Gantz s'est dit prêt à
entrer au gouvernement pour le garantir ; Lieberman réclame le retour de tous les
otages sans conditions ; Eisenkot accuse le Premier ministre d'« ignorer et faire
obstruction » alors que le chef d'état-major juge les conditions réunies.

**Ensemble en est absent**, par la même règle que pour la peine de mort : le
« filet de sécurité » est une position de Lapid, et Ensemble est dirigé par
Bennett. On n'hérite pas d'une position par fusion.

  - https://www.haaretz.com/israel-news/2025-10-04/ty-article/.premium/far-right-ben-gvir-smotrich-slam-netanyahu-for-assenting-to-trumps-gaza-truce-proposal/00000199-b052-d5a6-afff-f4df5c4b0000
  - https://www.timesofisrael.com/ben-gvir-threatens-to-bolt-government-if-hamas-continues-to-exist-after-hostages-freed/
  - https://www.timesofisrael.com/smotrich-says-he-will-oppose-hostage-deal-as-his-party-weighs-quitting-the-government/
  - https://thehill.com/policy/international/5546764-yair-lapid-netanyahu-israel-hamas-ceasefire-terms/
  - https://www.timesofisrael.com/gantzs-party-signals-it-may-join-coalition-if-pms-far-right-allies-bolt-over-gaza-deal/

  **Certitude : élevée.** Effet : le Likoud n'est plus confondu avec AUCUN parti.

**Piste abandonnée — le mont du Temple ne sépare pas le Likoud d'Otzma.**
L'hypothèse était que le Likoud défendait le statu quo contre Ben Gvir. C'est
faux : en janvier 2026, Netanyahou a publiquement soutenu l'extension de la prière
juive sur le site — « les changements que fait Ben-Gvir ne modifient pas le statu
quo et se font en coordination avec moi. C'est moi qui décide de la politique. »
Les deux partis sont du même côté ; la seule différence est rhétorique, Ben Gvir
affirmant que le statu quo n'existe plus. Trop ténu pour une affirmation.

  - https://www.haaretz.com/israel-news/2026-01-05/ty-article/.premium/netanyahu-backs-expanded-jewish-prayer-at-jerusalems-most-sensitive-religious-site/0000019b-8ae7-dbc2-a3df-8ae775f00000

### Pistes restantes — 16 paires

Le blocage s'est déplacé. Le Likoud n'est plus confondu avec personne ; ce qui
reste se concentre sur trois foyers.

**Le centre — 8 paires sur 16, le foyer principal.** Yashar, Ensemble, Unité
nationale, Les Réservistes et Yisrael Beytenou restent mutuellement
indiscernables. C'est le groupe le plus disputé du scrutin, et donc le plus
coûteux à confondre. Difficulté de fond : ces partis se définissent moins par des
politiques que par des lignes de coalition, or celles-ci bougent chaque semaine.
La clé la plus prometteuse reste **la position propre de Bennett** sur les textes
que Lapid a combattus — peine de mort, accord sur les otages — puisque c'est elle
qui débloquerait Ensemble sans hériter d'une position par fusion.

**Les partis religieux — 2 paires, probablement IRRÉDUCTIBLES.**

Les deux pistes ont été explorées et **toutes deux échouent, pour de bonnes
raisons**. C'est un résultat, pas un échec : toutes les paires ne peuvent pas être
séparées, parce que certains partis ne diffèrent réellement pas sur les
politiques.

- **Shas vs le JUT — différence sociologique, pas politique.** Le réseau scolaire
  séfarade de Shas enseigne le tronc commun (maths, sciences, anglais) jusqu'au
  bout, là où les écoles de garçons ashkénazes du JUT s'arrêtent en sixième ou
  avant ; le JUT revendique une opposition de principe au contrôle de l'État sur
  le contenu de son enseignement. Mais **politiquement les deux partis ont soutenu
  ensemble l'abrogation** de la loi imposant ce tronc commun — au point que la
  presse décrit une fracture entre la base haredi, qui réclame ces matières, et sa
  direction politique. Encoder une pratique institutionnelle comme une position de
  parti serait la même faute que d'inférer la position du JUT sur la sécurité.
  **Refusé.**

  - https://www.shomrim.news/eng/380
  - https://www.timesofisrael.com/no-math-no-problem-government-flip-flops-on-haredi-core-curricula/

- **Otzma Yehudit vs Sionisme religieux — pas de divergence de fond, de l'aveu
  même de Ben Gvir.** Il a exclu une liste commune en 2026 en expliquant que les
  deux partis s'adressent à des électorats « fondamentalement différents » —
  Mizrahim de la périphérie pour lui, sionisme religieux classique pour Smotrich —
  tout en reconnaissant qu'ils tiennent « des positions similaires ». Leur
  divergence est électorale et stratégique, pas programmatique. Une boussole qui
  les séparerait inventerait une différence que les intéressés nient.

  - https://www.jpost.com/israel-news/politics-and-diplomacy/article-903791

**Conséquence méthodologique.** L'objectif n'est donc pas zéro paire. Deux partis
qui défendent le même programme *doivent* sortir ensemble : c'est le résultat
juste. Le vrai objectif est qu'aucune paire ne subsiste **par défaut de
documentation** — et c'est exactement ce qui reste vrai des 8 paires du centre.

**La gauche et les partis arabes — 1 paire.** Ra'am est réglé. Reste
**Les Démocrates vs Hadash-Ta'al**, et la ligne qui les sépare est connue : les
Démocrates sont un parti sioniste, Hadash défend un « État de tous ses citoyens ».
Une affirmation sur la définition d'Israël comme État juif les opposerait
frontalement. Attention au piège : la loi État-nation de 2018 ne convient PAS
comme source, Meretz — l'ancêtre des Démocrates — ayant voté contre elle comme
Hadash. Il faut une formulation qui porte sur le principe sioniste lui-même, pas
sur ce texte.

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

## Les deux affirmations les plus sensibles, soldées

Priorité n°1 de l'inventaire, traitée le 2026-08-03.

### Affirmation « processus de paix visant deux États » — sourcée, et reformulée

L'énoncé disait « Il faut relancer des négociations de paix avec les
Palestiniens ». Trop vague : **toutes** les sources disponibles portent sur
l'horizon des deux États, pas sur le principe d'une négociation. Plutôt que
d'étirer les preuves pour les faire entrer dans la question, j'ai précisé la
question pour qu'elle colle aux preuves.

- **Contre** — Netanyahou : « aucun État palestinien ne sera établi », après la
  reconnaissance par le Royaume-Uni, le Canada et l'Australie. Smotrich exige
  qu'il le « dise clairement au monde entier », jugeant son silence « une honte
  diplomatique ». Ben Gvir réclame « l'application immédiate de la souveraineté »
  sur la Cisjordanie. **Eisenkot ajouté** : « je n'ai jamais dit deux États pour
  deux peuples ».
- **Pour** — Yair Golan est décrit comme « le seul chef de parti **juif** qui se
  batte encore pour maintenir en vie la solution à deux États ». Formule précieuse
  en creux : elle confirme qu'aucune autre liste juive ne doit figurer « pour ».
  Hadash et Ra'am suivent.
- **Sans position** — Ensemble (chef et numéro deux opposés), Unité nationale,
  Yisrael Beytenou, Les Réservistes, Shas, le JUT.

  - https://www.haaretz.com/israel-news/2025-09-21/ty-article/.premium/israeli-ministers-call-for-sovereignty-over-west-bank-after-palestinian-state-recognition/00000199-6c83-d134-a1ff-fdcfffef0000
  - https://www.timesofisrael.com/liveblog_entry/smotrich-ben-gvir-demand-netanyahu-make-it-clear-palestinian-state-wont-be-established/
  - https://www.haaretz.com/opinion/2025-10-15/ty-article-opinion/.premium/yair-golan-must-convince-israelis-that-only-a-two-state-solution-will-save-zionism/00000199-e3ee-da09-a1bb-f3ee8e900000

  **Certitude : élevée.**

### Affirmation « égalité des citoyens arabes » — sourcée, aucune correction

Les six positions héritées tiennent toutes. C'est la première affirmation
ancienne à passer l'épreuve sans une seule correction.

- **Contre** — Otzma Yehudit est un parti kahaniste ouvertement anti-arabe ; Ben
  Gvir déclare que son droit de circuler « est plus important que le droit de
  circulation des Arabes », et s'est dit favorable à ce que les femmes arabes
  enceintes prêtent « un serment de loyauté à l'État d'Israël », en soutien à
  l'appel de Smotrich à séparer les maternités — d'où la position du Sionisme
  religieux. Les Réservistes : voir la citation de Hendel plus haut.
- **Pour** — Hadash porte l'égalité dans son nom (« Front démocratique pour la
  paix et l'**égalité** ») ; Ra'am revendique la participation gouvernementale,
  déjà obtenue en 2021 ; Golan appelle l'opposition à s'associer à Ra'am.

  - https://www.irac.org/ben-gvir-qoutes
  - https://www.aljazeera.com/news/2023/8/24/ben-gvir-says-israeli-rights-trump-palestinian-freedom-of-movement

  **Certitude : élevée.**

## Affirmations 1 et 2 — sourcées

Priorités n°2 et n°3 de l'inventaire.

### « Netanyahou doit rester Premier ministre » — 12 positions, aucune correction

Deuxième affirmation ancienne à passer l'épreuve intacte. Otzma Yehudit et le
Sionisme religieux sont décrits comme « quasi certains de soutenir Netanyahou
pour le poste de Premier ministre » s'ils franchissent le seuil ; Ben Gvir
réclame « un gouvernement de droite, très clair dans son caractère, qui agit
plutôt que paralysé ». Côté opposition, Eisenkot est *le* candidat
anti-Netanyahou en tête des sondages, et le « bloc anti-Netanyahou » réunit
Bennett et lui.

Rappel : Les Réservistes en avaient été retirés plus tôt dans la journée, Hendel
refusant d'en faire une ligne rouge.

  - https://www.britannica.com/event/2026-Israeli-Elections
  - https://www.irishtimes.com/world/middle-east/2026/07/21/this-man-wants-to-unseat-binyamin-netanyahu-can-he-succeed/

  **Certitude : élevée.**

### « La réforme judiciaire doit aboutir » — 13 positions, une correction

- **Eisenkot confirmé « contre »** — il s'oppose à la refonte judiciaire. Nuance
  conservée dans le code : il dit vouloir « faire avancer une réforme du système
  judiciaire » sans préciser laquelle. S'opposer à *cette* refonte n'est pas
  défendre le statu quo.
- **Ensemble confirmé « contre »** — le programme de l'alliance Bennett-Lapid
  porte sur les contre-pouvoirs et le statut de la magistrature.
- **Shas et le JUT « pour »** — sourcés plus haut : au premier rang de la poussée
  réformatrice, la clause de dérogation protégeant l'exemption militaire.
- **LES RÉSERVISTES RETIRÉS.** Aucune source. Le programme de Hendel porte sur la
  conscription, la doctrine sécuritaire, la commission d'enquête et la
  composition des coalitions ; il ne dit **rien** du pouvoir judiciaire. La
  position était héritée et reposait sur un alignement supposé avec le reste de
  l'opposition — le même raisonnement qui m'avait fait poser à tort une position
  sécuritaire au JUT.

  **Certitude : élevée** pour les positions conservées.

## L'affirmation économique remplacée, pas supprimée

Le diagnostic était : zéro position sourcée sur neuf, aucun pouvoir de
discrimination (8 paires avec ou sans elle), et surtout **un énoncé faux par
construction**. Il rangeait Shas et le JUT « contre le libéralisme économique »
alors que ces partis ne défendent pas une doctrine sociale mais des subventions
sectorielles à leur propre communauté, tout en soutenant un gouvernement libéral
par ailleurs. Dire cela à un lecteur francophone était trompeur.

Plutôt que de perdre le thème de l'argent public, l'affirmation a été
**remplacée** par une question du même terrain, mais adossée à une ligne
budgétaire votée et à des citations nommées.

### « L'État doit continuer à financer largement les yeshivot et les institutions haredim »

Budget 2026, le plus important de l'histoire du pays (699 milliards de shekels) :
le financement des institutions éducatives haredim passe de 4,1 à **5,17 milliards
de shekels**, dont 1,56 milliard pour les yeshivot et kollels. Adopté par 62 voix
contre 55. La procureure générale a jugé le transfert illégal et demandé son
arrêt.

- **Pour** — Shas et le JUT l'ont voté, en conditionnant leur soutien à la
  réintroduction de la loi d'exemption militaire ; Smotrich, ministre des
  Finances, en est l'auteur ; le Likoud et Otzma Yehudit l'ont voté.
- **Contre** — Lapid : « le plus grand vol de l'histoire de l'État », « une
  aubaine pour les corrompus et les réfractaires ». Bennett : budget « le plus
  irresponsable et antisioniste » de l'histoire d'Israël, gouvernement qui
  « pille les caisses publiques ». Golan : « un plan de travail pour démanteler
  l'État d'Israël », visant les écoles « qui refusent d'enseigner le tronc
  commun ». Lieberman : « budget sectaire et trompeur, qui encourage l'évasion du
  service ».
- **Sans position** — Yashar, Unité nationale, Les Réservistes, Hadash-Ta'al et
  Ra'am, faute de déclaration nommée.

**Ensemble y figure sans réserve, cas rare et précieux : ses DEUX fondateurs ont
attaqué le budget.** Il n'y a donc pas de division interne à arbitrer, contrairement
à la peine de mort, à l'accord otages ou au processus de paix.

  - https://www.timesofisrael.com/knesset-approves-2026-budget-israels-largest-ever-sending-billions-to-haredi-institutions/
  - https://www.timesofisrael.com/opposition-mks-voted-to-allocate-nis-800-million-for-haredi-schools-how-did-it-happen/

  **Certitude : élevée.** Huit positions, toutes adossées à un vote ou à une
  citation nommée.

## Dette de sourçage — inventaire chiffré (2026-08-03)

| | Positions |
|---|---|
| **Sourcées** — justifiées une par une | **160** (100 %) |
| **Non sourcées** | **0** |
| Total | 160 |

**Les 19 affirmations sont sourcées.** Une seule position reste en certitude
**moyenne** : Yashar sur la halakha, dont plus bas.

### La halakha — dernière affirmation sourcée

- **Pour** — Smotrich : « nous voudrions tous que l'État agisse selon la Torah et
  la halakha » ; il a réclamé le ministère de la Justice pour que le droit
  israélien suive la loi juive, « comme aux jours du roi David », et son
  conseiller spirituel assume vouloir un État halakhique. Comme ministre des
  Transports, il a fait cesser les travaux du shabbat. Ben Gvir a exigé la fin de
  la reconnaissance des conversions réformées pour la citoyenneté, et fait saisir
  les haut-parleurs des mosquées. Le JUT « œuvre à préserver le caractère
  religieux de l'État d'Israël » (IDI) ; Shas de même.
- **Contre** — Lieberman a répliqué publiquement à Smotrich sur la Torah comme loi
  de l'État. Bennett soutient le mariage civil et les transports du shabbat.
  **Gantz confirmé** : il a lancé une initiative pour le mariage civil et s'est
  entendu avec Lieberman sur un ensemble de réformes — conversion assouplie,
  section égalitaire au Mur, mariage civil hors du rabbinat, transports du shabbat
  laissés aux communes. Les Démocrates, Hadash et Ra'am suivent.

  - https://www.timesofisrael.com/smotrich-says-israel-should-follow-torah-law-again-drawing-ire-of-liberman/
  - https://www.timesofisrael.com/spiritual-adviser-to-smotrich-theres-no-problem-with-having-a-halachic-state/
  - https://www.timesofisrael.com/ben-gvir-calls-for-revoking-state-recognition-of-reform-conversions/
  - https://www.timesofisrael.com/gantz-and-liberman-said-to-agree-on-civil-marriage-other-religion-reforms/

**Le doute sur Unité nationale est levé** : c'était l'une des deux positions
signalées douteuses, elle se révèle solidement fondée. L'autre, **Yashar**, reste
la position la plus faible du fichier — certitude **moyenne**. Elle repose sur le
programme d'Eisenkot (« un État juif et démocratique » fidèle à la Déclaration
d'indépendance, des droits égaux « quelles que soient la religion, la
nationalité, la race et le genre ») et non sur une déclaration portant sur la
halakha elle-même. Conservée, mais c'est la première à revérifier.

### Cinquième erreur : Unité nationale et les implantations

Suspicion confirmée le 2026-08-03. Le parti figurait « contre » l'extension des
implantations. Or Gantz, comme ministre de la Défense, a cherché à approuver la
construction d'environ **5 000 logements** dans les implantations après six mois
de gel, et s'est dit prêt à soutenir une **annexion unilatérale** « si les
Palestiniens disent non pour toujours », à condition qu'elle ne compromette pas
les accords de paix existants.

Il n'est pas déplacé en « pour » pour autant : ces éléments datent de 2020, sous
une autre étiquette et dans un gouvernement d'union. **Sans position** — ce qui
reste l'inverse de « contre », lequel n'était soutenu par rien.

**Coût : le compteur de paires remonte de 8 à 10**, Unité nationale redevenant
indiscernable de Yashar et d'Ensemble. Même arbitrage que pour Ensemble plus
haut, tranché de la même façon : une position fausse qui « discrimine » ne vaut
rien.

  - https://www.timesofisrael.com/gantz-signals-support-for-unilateral-annexation-if-palestinians-say-no-forever/

### Yisrael Beytenou ajouté aux implantations — et le chiffre qui explique tout

Le parti était **absent** de l'affirmation sur les implantations. Or Lieberman en
est l'un des acteurs les plus actifs : il est l'**auteur** d'un projet d'annexion
appliquant la souveraineté à Ma'ale Adumim, adopté en lecture préliminaire par
**32 voix contre 9** en octobre 2025, et il cite Ariel, Gush Etzion et la vallée
du Jourdain comme cibles suivantes. Sa méthode diffère de celle de Smotrich —
annexion par étapes plutôt qu'en bloc — mais pas son objectif. Comme ministre de
la Défense, il avait convoqué le Conseil supérieur de planification pour
accélérer la construction.

**Le chiffre décisif : la Knesset a voté une motion non contraignante appelant à
annexer la Cisjordanie par 71 voix contre 13.**

Il éclaire rétrospectivement les cinq corrections de la journée. Classer les
partis du centre « contre les implantations » n'était pas une série d'erreurs
ponctuelles mais **un contresens unique sur la structure du débat israélien** :
l'opposition à Netanyahou n'y implique en rien l'opposition aux implantations. Sur
120 sièges, 71 ont voté pour l'annexion — il était arithmétiquement impossible que
tous les partis du centre soient « contre ».

  - https://www.timesofisrael.com/liveblog_entry/rebelling-against-pm-mks-pass-preliminary-reading-of-west-bank-annexation-bill/
  - https://www.timesofisrael.com/knesset-votes-71-13-for-non-binding-motion-calling-to-annex-west-bank/

### Bilan des erreurs de la journée

Cinq positions héritées invalidées, et **les cinq relèvent du même motif** : un
parti de droite ou de centre-droit rangé à gauche parce qu'il s'oppose à
Netanyahou.

| Parti | Affirmation | Était | Devient |
|---|---|---|---|
| Les Réservistes | Netanyahou doit rester PM | contre | sans position |
| Les Réservistes | Réforme judiciaire | contre | sans position |
| Yashar | Implantations | contre | **pour** |
| Ensemble | Implantations | contre | **pour** |
| Unité nationale | Implantations | contre | sans position |

L'affirmation sur les implantations concentre trois des cinq. C'est cohérent :
c'est la question sur laquelle « anti-Netanyahou » et « de gauche » divergent le
plus en Israël, et donc celle où l'amalgame se paie le plus cher.

*Progression de la journée : 66 (41 %) → 79 (49 %) → 103 (64 %) → 111 (69 %) →
148 (93 %) → **159 (100 %)**.*

Le dernier saut n'a demandé aucune recherche neuve : les affirmations sur
l'exemption des yeshivot et sur l'influence des ultra-orthodoxes étaient déjà
couvertes par les sources rassemblées dans la journée pour d'autres questions.
Elles n'avaient simplement jamais été rattachées. Leçon de méthode : avant de
relancer une enquête, inventorier ce qu'on a déjà.

**Reste à sourcer**, par ordre d'exposition décroissante : la halakha (11
positions), l'exemption des yeshivot (9), les implantations (9, dont deux
corrigées ce jour), l'influence des ultra-orthodoxes (8). L'affirmation
économique, elle, n'y figure plus : elle a été remplacée, voir plus haut.

Parmi les positions héritées que j'ai effectivement contrôlées ce jour, **trois se
sont révélées fausses** : Les Réservistes en « contre » Netanyahou, Yashar et
Ensemble en « contre » les implantations. Les trois concernaient des listes
récentes ou fusionnées, et les trois les tiraient vers la gauche.

### Ordre de priorité — et une bonne nouvelle

Le classement ne doit pas suivre le nombre de positions mais **l'exposition** :
ce qu'on vous reprochera le plus cher.

1. **Affirmations 5 (négociations de paix) et 7 (égalité des citoyens arabes) —
   12 positions à elles deux.** Ce sont les deux sujets les plus sensibles du
   questionnaire, et ce sont aussi les **moins fournis**. Une demi-journée de
   sourçage solderait la partie la plus risquée de toute la dette. À faire en
   premier, sans hésiter.
2. **Affirmation 1 (Netanyahou), 12 positions**, dont trois déjà vérifiées. Elle
   structure le résultat plus que les autres.
3. **Affirmation 2 (réforme judiciaire), 13 positions** — la plus fournie du
   fichier, donc la plus coûteuse, mais aussi la plus consensuelle à documenter :
   les votes existent.
4. **Affirmations 8 (sécurité, 12) et 3 (halakha, 11)** — beaucoup de positions
   d'alignement, du type de celle que j'ai dû retirer au JUT. À traiter avec la
   table des cas sous les yeux.
5. **Affirmation 19 (économie, 9)** — la plus faible du lot. Aucune des positions
   n'est sourcée, et l'économie est le domaine où les partis israéliens sont le
   moins nettement identifiés. Envisager de la retirer plutôt que de la sourcer.

### Positions héritées explicitement repérées comme douteuses

- **Yashar, affirmation 3 (halakha)** — « contre », non documenté. Le programme
  d'Eisenkot parle d'un « État juif et démocratique » sans se prononcer sur la
  place de la halakha.
- **Les Réservistes, affirmation 2 (réforme judiciaire)** — « contre », non
  documenté. Rien dans le programme de Hendel ne porte sur ce sujet.
- **Les Réservistes, affirmation 19 (économie)** — « pour », non documenté.
- **Ensemble, affirmation 19 (économie)** — « pour », non documenté.

## Dette de sourçage

Les positions **antérieures au 2026-08-03** — l'essentiel du tableau — n'ont pas
encore été vérifiées une par une. Elles proviennent de la rédaction initiale et
sont plausibles, mais elles ne portent pas de source.

Tant que cette dette n'est pas soldée, la Boussole ne devrait pas être mise en
avant comme une référence sourcée au même titre que l'historique des 25 Knesset.

Ordre de priorité suggéré, du plus exposé au moins exposé :

1. ~~Affirmation 1 (Netanyahou)~~ — **faite le 2026-08-03**. Elle a livré une
   erreur factuelle (Les Réservistes) sur l'affirmation qui pèse le plus lourd.
   L'affirmation 6 en a livré une seconde (Yashar), trouvée par un autre chemin.

   **Taux de correction cumulé : 4 positions invalidées.** Deux étaient
   antérieures à cette session (Les Réservistes en anti-Netanyahou, Yashar contre
   les implantations), deux étaient les miennes, posées puis retirées le même jour
   (le JUT sur la sécurité, Les Réservistes sur la halakha).

   Fait notable : **les deux erreurs héritées concernaient les deux partis les
   plus récents**, et toutes deux les rangeaient plus à gauche qu'ils ne se
   situent. Ce n'est probablement pas un hasard — une liste neuve est décrite par
   sa position dans le jeu (« l'opposition à Netanyahou ») avant de l'être par son
   programme. Il faut relire les autres positions de Yashar et des Réservistes
   avec ce biais en tête.
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
