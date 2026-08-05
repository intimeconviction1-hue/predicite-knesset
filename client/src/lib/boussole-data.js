// Données de la Boussole — les 10 affirmations et les positions des partis.
//
// Extraites de pages/Boussole.jsx le 2026-08-04 : la page faisait 678 lignes
// dont ~390 de données pures. Séparer la donnée (validée éditorialement, voir
// docs/BOUSSOLE_SOURCES.md) de la logique d'écran permet de réviser les
// positions sans rouvrir le composant — et réciproquement.

// ⚠️ CONTENU VALIDÉ AVEC DAVID (2026-08) — positions des partis par affirmation.
// pour = plutôt d'accord, contre = plutôt contre, le reste = neutre.
//
// Les slugs ci-dessous DOIVENT correspondre à une Liste réelle (slug dérivé de
// name_fr par server/scripts/seed-listes.js). « yachad-bennett » a été retiré le
// 2026-08-04 : ce nom désignait une liste fantôme héritée de Base44, absente de
// tout seed, qui coexistait en base avec « ensemble-bennett-lapid » et pouvait
// donc sortir en tête de la boussole. Précision apportée le 2026-08-04 : « Yachad »
// (ביחד, Beyachad) est le NOM HÉBREU de la liste Bennett-Lapid — ce n'était donc
// pas un parti disparu mais un DOUBLON du même parti sous son autre nom, ce qui
// rend la fusion d'autant plus justifiée.
// La garde de cohérence en bas de computeMatches empêche que ça se reproduise.
//
// SOURCES — chaque position ajoutée ou retirée le 2026-08-04 est justifiée dans
// docs/BOUSSOLE_SOURCES.md, avec sa source et son degré de certitude. Les
// positions antérieures à cette date n'ont pas encore été sourcées : c'est une
// dette connue, listée en fin de ce même document.
//
// TROUS VOLONTAIRES — ces partis ne couvrent pas toutes les affirmations, et ce ne
// sont PAS des oublis. Sur les négociations de paix (5) et les implantations (6),
// ni Shas, ni le JUT, ni Les Réservistes n'ont de ligne propre et stable : l'IDI
// relève même que Shas « soutient la conclusion d'accords de paix avec les États
// arabes ». Leur prêter une position pour homogénéiser les dénominateurs
// reviendrait à fabriquer de la donnée — le pourcentage affiché avec son
// dénominateur dit déjà l'inégalité de couverture.
const STATEMENTS = [
  // ⚠️ AFFIRMATION STRUCTURANTE — elle pèse plus lourd que les autres dans le
  // résultat, une erreur ici se propage partout. Les Réservistes en ont été
  // RETIRÉS le 2026-08-04 : ils y figuraient « contre », alors que Yoaz Hendel
  // refuse explicitement de faire de Netanyahou l'axe du scrutin (« s'il y a
  // demain un gouvernement de 70-80 sièges sionistes et que Netanyahou en fait
  // partie, bien sûr que je le rejoindrais », JPost 23/07/2026). Absence de
  // position = position documentée, pas oubli.
  { text: 'Benyamin Netanyahou doit rester Premier ministre.',
    pour: ['likoud', 'shas', 'judaisme-unifie-de-la-torah', 'otzma-yehudit', 'sionisme-religieux'],
    contre: ['yashar-gadi-eisenkot', 'les-democrates', 'yisrael-beytenou', 'hadash-ta-al-liste-commune', 'ra-am', 'ensemble-bennett-lapid', 'unite-nationale'] },
  // Shas et le JUT ont été « au premier rang de la poussée réformatrice » : la
  // clause de dérogation est vue par les deux comme l'outil qui mettrait la loi
  // d'exemption militaire à l'abri du contrôle judiciaire (ToI). Nuance à garder
  // en tête : tous deux ont ensuite servi de force modératrice dans la coalition.
  // SOURCÉE le 2026-08-04. Eisenkot confirmé « contre » — il s'oppose à la refonte
  // judiciaire —, avec une nuance conservée ici : il dit vouloir « faire avancer
  // une réforme du système judiciaire » sans préciser laquelle. S'opposer à CETTE
  // refonte n'est pas défendre le statu quo.
  //
  // LES RÉSERVISTES RETIRÉS : aucune source. Le programme de Hendel porte sur la
  // conscription, la doctrine sécuritaire, la commission d'enquête et la
  // composition des coalitions ; il ne dit rien du pouvoir judiciaire. La position
  // était héritée de la rédaction initiale et reposait sur un alignement supposé
  // avec le reste de l'opposition.
  { text: 'La réforme judiciaire (affaiblir la Cour suprême) doit aboutir.',
    pour: ['likoud', 'otzma-yehudit', 'sionisme-religieux', 'shas', 'judaisme-unifie-de-la-torah'],
    contre: ['yashar-gadi-eisenkot', 'les-democrates', 'yisrael-beytenou', 'hadash-ta-al-liste-commune', 'ra-am', 'ensemble-bennett-lapid', 'unite-nationale'] },
  // SOURCÉE le 2026-08-04, dernière affirmation du fichier à l'être.
  //
  // Pour — Smotrich : « nous voudrions tous que l'État agisse selon la Torah et la
  // halakha » ; il veut le ministère de la Justice pour que le droit israélien
  // suive la loi juive, « comme aux jours du roi David », et son conseiller
  // spirituel assume vouloir un État halakhique. Ben Gvir a exigé la fin de la
  // reconnaissance des conversions réformées et fait saisir les haut-parleurs des
  // mosquées. Le JUT « œuvre à préserver le caractère religieux de l'État
  // d'Israël » (IDI) ; Shas de même.
  //
  // Contre — Lieberman a répliqué publiquement à Smotrich sur la Torah comme loi
  // de l'État. Bennett soutient le mariage civil et les transports le shabbat.
  // GANTZ CONFIRMÉ, ce qui lève l'un de mes deux doutes : il a lancé une
  // initiative pour le mariage civil et s'est entendu avec Lieberman sur un
  // ensemble de réformes — conversion assouplie, section égalitaire au Mur,
  // mariage civil hors du rabbinat, transports du shabbat laissés aux communes.
  //
  // ⚠️ YASHAR reste la position la plus faible du fichier : certitude MOYENNE.
  // Elle repose sur le programme d'Eisenkot — « un État juif et démocratique »
  // fidèle à la Déclaration d'indépendance, des droits égaux « quelles que soient
  // la religion, la nationalité, la race et le genre » — et non sur une
  // déclaration portant sur la halakha elle-même.
  { text: "L'État doit s'appuyer davantage sur la loi religieuse juive (halakha).",
    pour: ['shas', 'judaisme-unifie-de-la-torah', 'sionisme-religieux', 'otzma-yehudit'],
    contre: ['yisrael-beytenou', 'les-democrates', 'yashar-gadi-eisenkot', 'hadash-ta-al-liste-commune', 'ra-am', 'ensemble-bennett-lapid', 'unite-nationale'] },
  // SOURCÉE le 2026-08-04, les 9 positions. Shas a menacé de bloquer le budget
  // 2026 faute de loi d'exemption ; le JUT a déposé un texte pour la sanctuariser
  // et Gafni a appelé le gouvernement à ignorer les arrêts de la Cour suprême.
  // En face : Eisenkot porte une « loi de service national universel » ; Hendel a
  // fondé Les Réservistes précisément pour faire passer une conscription
  // universelle ; Bennett défend un service militaire ou civil universel ; Golan
  // réclame « une loi de conscription égalitaire » ; Lieberman dénonce un budget
  // « qui encourage l'évasion du service » ; le plan de Gantz incluait de « faire
  // avancer la législation sur l'enrôlement des ultra-orthodoxes ».
  //
  // Le Sionisme religieux a été ajouté du côté « contre » le 2026-08-04 : c'est la
  // faille qui sépare enfin les nationaux-religieux des haredim, alors qu'ils
  // siègent dans la même coalition. Déclaration officielle du 10/12/2025 — le
  // parti ne votera « que pour une loi qui amènera un enrôlement RÉEL ET RAPIDE
  // des haredim dans Tsahal ». Un de ses députés, Moshe Solomon, a d'ailleurs
  // rompu les rangs contre la loi interdisant l'arrestation des réfractaires
  // (adoptée 58-54). Position sous tension — le parti reste sous pression de
  // coalition — mais elle est déclarée, datée, et opposée à celle de Shas et du JUT.
  { text: 'Les étudiants des yeshivot (Haredim) doivent rester exemptés de service militaire.',
    pour: ['shas', 'judaisme-unifie-de-la-torah'],
    contre: ['yisrael-beytenou', 'les-democrates', 'yashar-gadi-eisenkot', 'les-reservistes-hendel-tropper', 'ensemble-bennett-lapid', 'unite-nationale', 'sionisme-religieux'] },
  // TROU JUSTIFIÉ PAR RÈGLE — « Ensemble » reste sans position ici, et ce n'est
  // plus un arbitrage en attente : c'est le cas « chef et numéro deux documentés
  // en sens opposés » de la table de docs/BOUSSOLE_SOURCES.md.
  //
  // Bennett rejette la voie de la négociation — doctrine du « rétrécissement du
  // conflit », « pas un centimètre de la terre d'Israël », refus d'un État
  // palestinien maintenu en 2026 comme chef de liste. Lapid, lui, défend de
  // longue date les deux États. Un parti dont les deux fondateurs s'opposent
  // frontalement sur une question n'a pas de position sur cette question.
  //
  // (Historique : le slug fantôme yachad-bennett était le seul porteur ici avant
  // le 2026-08-04 ; ailleurs il faisait doublon avec ensemble-bennett-lapid.)
  // SOURCÉE le 2026-08-04. L'énoncé a été précisé : « des négociations de paix »
  // était trop vague pour les sources disponibles, qui portent toutes sur
  // l'horizon des deux États. La question colle désormais aux preuves.
  //
  // Contre — Netanyahou : « aucun État palestinien ne sera établi », promesse
  // faite après la reconnaissance par le Royaume-Uni, le Canada et l'Australie.
  // Smotrich exige qu'il le « dise clairement au monde entier », jugeant son
  // silence « une honte diplomatique ». Ben Gvir réclame « l'application immédiate
  // de la souveraineté » sur la Cisjordanie. Eisenkot : « je n'ai jamais dit deux
  // États pour deux peuples ; quiconque parle de paix maintenant et de deux États
  // ne comprend pas le conflit. »
  //
  // Pour — Yair Golan est décrit comme « le seul chef de parti JUIF qui se batte
  // encore pour maintenir en vie la solution à deux États ». Cette formule est
  // précieuse en creux : elle confirme qu'aucune autre liste juive ne doit
  // figurer du côté « pour ».
  { text: 'Il faut relancer un processus de paix avec les Palestiniens, visant deux États.',
    pour: ['les-democrates', 'hadash-ta-al-liste-commune', 'ra-am'],
    contre: ['likoud', 'otzma-yehudit', 'sionisme-religieux', 'yashar-gadi-eisenkot'] },
  // ⚠️ CORRECTION du 2026-08-04. Yashar figurait ici « contre ». C'est faux :
  // Eisenkot déclarait en juin 2026 « je crois beaucoup à l'implantation en
  // Judée-Samarie », et « je n'ai jamais dit deux États pour deux peuples ».
  // Il est déplacé du côté « pour » — avec une réserve consignée dans
  // docs/BOUSSOLE_SOURCES.md : l'affirmation mêle extension ET annexion, or seule
  // l'extension est documentée chez lui. C'est la seconde erreur factuelle
  // trouvée sur ce parti, après son classement en « anti-Netanyahou ».
  // Positions « pour » sourcées le 2026-08-04 : Netanyahou a promis d'étendre les
  // implantations après la reconnaissance d'un État palestinien par Londres,
  // Ottawa et Canberra ; Ben Gvir réclame « l'application immédiate de la
  // souveraineté » ; Smotrich mène de longue date la bataille de l'annexion.
  //
  // YISRAEL BEYTENOU AJOUTÉ : il en était absent, alors que Lieberman est
  // l'AUTEUR d'un projet d'annexion — appliquer la souveraineté à Ma'ale Adumim,
  // adopté en lecture préliminaire par 32 voix contre 9 en octobre 2025 — et qu'il
  // cite Ariel, Gush Etzion et la vallée du Jourdain comme cibles suivantes. Sa
  // méthode diffère (annexion par étapes, contre l'annexion en bloc), pas son
  // objectif. Comme ministre de la Défense, il avait convoqué le Conseil supérieur
  // de planification pour accélérer la construction.
  //
  // ⚠️ CHIFFRE À RETENIR, qui éclaire les quatre corrections de cette affirmation :
  // la Knesset a voté une motion non contraignante appelant à annexer la
  // Cisjordanie par 71 voix contre 13. Classer les partis du centre « contre les
  // implantations » n'était pas une erreur ponctuelle mais un contresens sur la
  // structure du débat israélien : l'opposition à Netanyahou n'y implique en rien
  // l'opposition aux implantations.
  //
  // ⚠️ UNITÉ NATIONALE RETIRÉE le 2026-08-04 — quatrième erreur de la même
  // famille. Le parti figurait « contre ». Or Gantz, ministre de la Défense, a
  // cherché à approuver la construction d'environ 5 000 logements dans les
  // implantations après six mois de gel, et s'est dit prêt à soutenir une
  // annexion unilatérale « si les Palestiniens disent non pour toujours »,
  // à condition qu'elle ne compromette pas les accords de paix existants.
  //
  // Il n'est pas déplacé en « pour » pour autant : ces éléments datent de 2020,
  // sous une autre étiquette et dans un gouvernement d'union. Sans position, donc
  // — l'inverse de « contre », qui n'était soutenu par rien.
  //
  // ⚠️ DEUX CORRECTIONS du 2026-08-04, même erreur sur les deux listes récentes.
  //
  // Yashar y figurait « contre ». Eisenkot, juin 2026 : « je crois beaucoup à
  // l'implantation en Judée-Samarie », « je n'ai jamais dit deux États pour deux
  // peuples ».
  //
  // Ensemble y figurait « contre ». Bennett, EN TANT QUE CHEF DE LA LISTE, se dit
  // « favorable à l'implantation légale en zone C » et affirme que « la zone C
  // fera partie de l'État d'Israël, les zones A et B de l'autonomie
  // palestinienne ». Nuance conservée : il réclame le démantèlement des avant-
  // postes illégaux, ce qui lui a valu l'ire de la droite — il distingue
  // construction légale et sauvage, il ne s'oppose pas au principe.
  //
  // Distinction de méthode : « on n'hérite pas d'une position par fusion » vise à
  // ne pas prêter à la liste les positions de LAPID, son numéro deux. La ligne du
  // CHEF, elle, est la ligne de la liste. C'est pourquoi Ensemble reste sans
  // position sur la peine de mort — Bennett s'y est dit favorable en 2015, sous
  // une autre étiquette, pas comme chef d'Ensemble.
  { text: 'Il faut étendre les implantations, voire annexer une partie de la Cisjordanie.',
    pour: ['sionisme-religieux', 'otzma-yehudit', 'likoud', 'yashar-gadi-eisenkot', 'ensemble-bennett-lapid', 'yisrael-beytenou'],
    contre: ['les-democrates', 'hadash-ta-al-liste-commune', 'ra-am'] },
  // Les Réservistes : position la MIEUX documentée du lot. Yoaz Hendel veut un
  // « gouvernement d'unité sioniste sans partis arabes ni haredim » et déclare :
  // « Quiconque choisit de ne pas servir choisit d'être un citoyen de seconde
  // zone. Il ne recevra rien de l'État. Il ne pourra ni voter ni être élu à la
  // Knesset. » (ToI, 20/11/2025). C'est un refus explicite des deux volets de
  // l'affirmation — l'égalité pleine ET la place au gouvernement.
  // SOURCÉE le 2026-08-04. Les six positions tiennent, aucune correction.
  //
  // Contre — Otzma Yehudit est un parti kahaniste ouvertement anti-arabe ; Ben
  // Gvir déclare que son droit de circuler « est plus important que le droit de
  // circulation des Arabes », et s'est dit favorable à ce que les femmes arabes
  // enceintes prêtent « un serment de loyauté à l'État d'Israël », en soutien à
  // l'appel de Smotrich à séparer les maternités entre juifs et Arabes — d'où la
  // position du Sionisme religieux. Les Réservistes : « quiconque choisit de ne
  // pas servir choisit d'être un citoyen de seconde zone… il ne pourra ni voter
  // ni être élu » (Hendel, 20/11/2025).
  //
  // Pour — Hadash porte l'égalité dans son nom même (« Front démocratique pour la
  // paix et l'ÉGALITÉ ») ; Ra'am revendique la participation au gouvernement, que
  // Mansour Abbas a déjà obtenue en 2021 ; Yair Golan appelle explicitement
  // l'opposition à s'associer à Ra'am.
  { text: 'Les citoyens arabes doivent avoir pleine égalité et une place au gouvernement.',
    pour: ['hadash-ta-al-liste-commune', 'ra-am', 'les-democrates'],
    contre: ['otzma-yehudit', 'sionisme-religieux', 'les-reservistes-hendel-tropper'] },
  // Les Réservistes : « une doctrine sécuritaire plus agressive » est un pilier
  // déclaré du programme (ToI, 20/11/2025). Shas : l'IDI relève qu'« en série de
  // votes à la Knesset sur les grands dossiers diplomatiques, Shas a adopté une
  // position faucon ». Le JUT a été RETIRÉ d'ici le 2026-08-04 : l'IDI le décrit
  // comme « centriste », faisant primer « les considérations religieuses sur les
  // considérations sécuritaires ou diplomatiques » — il a même voté le
  // désengagement de Gaza. La position que je lui prêtais n'était pas sourçable.
  { text: 'Face au Hamas et à l\'Iran, la fermeté sécuritaire prime sur tout.',
    pour: ['likoud', 'otzma-yehudit', 'sionisme-religieux', 'yisrael-beytenou', 'yashar-gadi-eisenkot', 'ensemble-bennett-lapid', 'unite-nationale', 'les-reservistes-hendel-tropper', 'shas'],
    contre: ['les-democrates', 'hadash-ta-al-liste-commune', 'ra-am'] },
  // SOURCÉE le 2026-08-04, les 8 positions. Pour : Lieberman a bâti sa carrière
  // contre les partis haredim et dénonce un budget « sectaire » ; Golan vise les
  // écoles « qui refusent d'enseigner le tronc commun » ; Eisenkot rejette
  // ouvertement l'étreinte politique haredi, ses plans de conscription excluant de
  // fait une coalition avec eux ; Bennett soutient le mariage civil et les
  // transports le shabbat, ce qui lui a valu d'être accusé par Shas de « brader
  // l'identité juive du pays » ; Hendel refuse de siéger avec ces partis.
  // Contre : Shas et le JUT défendent cette influence, qui est leur raison d'être
  // politique ; le Sionisme religieux est lui-même un parti religieux qui veut
  // PLUS de religion dans la vie publique — sa querelle avec les haredim porte
  // sur la conscription (affirmation 4), pas sur la place du religieux.
  //
  // Les Réservistes : l'inégalité devant la conscription est le grief fondateur
  // du mouvement, d'où sa position ici comme sur l'exemption des yeshivot.
  { text: 'Les partis ultra-orthodoxes ont trop d\'influence sur la vie quotidienne.',
    pour: ['yisrael-beytenou', 'les-democrates', 'yashar-gadi-eisenkot', 'ensemble-bennett-lapid', 'les-reservistes-hendel-tropper'],
    contre: ['shas', 'judaisme-unifie-de-la-torah', 'sionisme-religieux'] },
  // Shas et le JUT sont des partis SOCIAUX autant que religieux : ils défendent
  // les allocations et le soutien public aux familles nombreuses, donc contre le
  // désengagement de l'État. C'est leur ligne la mieux établie hors du religieux.
  // ── Ajoutées le 2026-08-04 pour élargir les dénominateurs ────────────────────
  // Avec 10 affirmations et une couverture partielle, beaucoup de parties se
  // jouaient sur 4 ou 5 comparaisons — d'où les 100 % en pagaille. Ces trois-là
  // ont été choisies parce qu'elles CLIVENT et qu'elles se sourcent : la première
  // repose même sur un appel nominal. Détail dans docs/BOUSSOLE_SOURCES.md.

  // Loi votée le 30/03/2026 par 62 voix contre 48, à l'initiative d'Otzma
  // Yehudit. Le JUT est absent des deux camps À DESSEIN : ses deux composantes
  // se sont séparées, Degel HaTorah votant pour et Agoudat Israël s'abstenant.
  { text: 'Les terroristes condamnés doivent encourir la peine de mort.',
    pour: ['otzma-yehudit', 'likoud', 'shas', 'sionisme-religieux', 'yisrael-beytenou'],
    contre: ['les-democrates', 'hadash-ta-al-liste-commune', 'ra-am', 'unite-nationale'] },

  // La coalition a confirmé qu'aucune commission d'enquête d'État ne serait
  // créée avant le scrutin ; l'opposition refuse de participer au format
  // alternatif proposé. C'est un pilier déclaré du programme des Réservistes,
  // de celui de Bennett, et une position explicite d'Eisenkot.
  { text: "Il faut une commission d'enquête d'État indépendante sur le 7 octobre.",
    pour: ['yashar-gadi-eisenkot', 'ensemble-bennett-lapid', 'les-reservistes-hendel-tropper', 'les-democrates', 'unite-nationale', 'yisrael-beytenou'],
    contre: ['likoud', 'shas', 'judaisme-unifie-de-la-torah', 'otzma-yehudit', 'sionisme-religieux'] },

  // Bennett, 25/04/2026 : « les villes doivent pouvoir choisir si elles veulent
  // des transports publics le shabbat » et « chacun en Israël devrait pouvoir
  // concrétiser son amour dans ce pays sans partir à l'étranger ». Shas lui a
  // répondu qu'il était « prêt à brader l'identité juive du pays ».
  { text: 'Il faut le mariage civil et des transports publics le shabbat.',
    pour: ['ensemble-bennett-lapid', 'yisrael-beytenou', 'les-democrates'],
    contre: ['shas', 'judaisme-unifie-de-la-torah', 'sionisme-religieux', 'otzma-yehudit'] },

  // Affirmation DISCRIMINANTE : elle sépare les partis HAREDIM des nationaux-
  // religieux, à l'intérieur d'une même coalition. Ce n'est pas une nuance
  // théologique de salon — les partis haredim ont envisagé de quitter le
  // gouvernement quand Ben Gvir a poussé la prière juive sur le site.
  //
  // Le député du JUT Moshe Gafni : « monter sur le mont du Temple implique une
  // interdiction grave de karet » et « nous exigeons la fermeture du mont du
  // Temple aux juifs ». Côté Shas, le grand rabbin séfarade Yitzhak Yosef, fils
  // d'Ovadia Yosef, a écrit à Ben Gvir pour rappeler la « sévérité de
  // l'interdit » et l'avertir qu'il risquait de « faire pécher la multitude ».
  // Le motif est l'impureté rituelle : sans les cendres de la vache rousse, nul
  // ne peut atteindre la pureté requise, et l'emplacement exact du Saint des
  // Saints est inconnu.
  //
  // En face, Ben Gvir y monte et y prie régulièrement, et Netanyahou a soutenu
  // l'extension de la prière juive en janvier 2026 — c'est d'ailleurs pour cela
  // que ce sujet ne sépare PAS le Likoud d'Otzma (voir docs/BOUSSOLE_SOURCES.md).
  { text: 'Les juifs doivent pouvoir monter prier sur le mont du Temple.',
    pour: ['otzma-yehudit', 'sionisme-religieux', 'likoud'],
    contre: ['shas', 'judaisme-unifie-de-la-torah'] },

  // Affirmation DISCRIMINANTE : elle sépare la gauche sioniste de la gauche arabe,
  // dernière paire confondue de ce foyer. Hadash est un parti explicitement NON
  // SIONISTE, héritier du parti communiste, qui défend un « État de tous ses
  // citoyens » ; Yair Golan revendique à l'inverse « l'âme démocratique et
  // sioniste de l'État d'Israël ».
  //
  // Shas et le JUT en sont absents À DESSEIN, et ce n'est pas un oubli : les
  // partis haredim sont doctrinalement non sionistes — ils participent à l'État
  // sans adhérer au sionisme comme idéologie. Les ranger d'un côté ou de l'autre
  // trahirait une position théologique que ni « pour » ni « contre » ne rend.
  // Ra'am aussi, faute de source : il travaille dans le cadre de l'État sans
  // s'en réclamer.
  { text: "Israël doit rester défini comme un État juif, plutôt que comme « l'État de tous ses citoyens ».",
    pour: ['likoud', 'otzma-yehudit', 'sionisme-religieux', 'yisrael-beytenou', 'yashar-gadi-eisenkot', 'ensemble-bennett-lapid', 'unite-nationale', 'les-reservistes-hendel-tropper', 'les-democrates'],
    contre: ['hadash-ta-al-liste-commune'] },

  // Affirmation DISCRIMINANTE dans le centre, et question centrale du scrutin :
  // accepter de gouverner AVEC Netanyahou, ou en faire une ligne rouge. Gantz a
  // proposé en août 2025 un « gouvernement de rédemption des otages » à mandat de
  // six mois incluant Netanyahou ; Lieberman a répondu que c'était « un spectacle
  // pitoyable » et que Gantz « rampait dans la coalition » ; Hendel dit qu'il
  // rejoindrait un gouvernement de 70-80 sièges sionistes même avec Netanyahou
  // dedans, sa ligne rouge étant l'idéologie et non la personne.
  //
  // Ensemble en est absent : Lapid a dit « je ne siégerai pas dans un gouvernement
  // sous Benjamin Netanyahou, point », mais c'est Lapid, et Ensemble est dirigé
  // par Bennett. Yashar aussi : Eisenkot fait campagne contre Netanyahou sans
  // avoir formulé de refus explicite de siéger avec lui.
  { text: "Il est acceptable de gouverner avec Benyamin Netanyahou si le programme convient.",
    pour: ['unite-nationale', 'les-reservistes-hendel-tropper'],
    contre: ['yisrael-beytenou'] },

  // Affirmation DISCRIMINANTE : elle sépare les deux partis arabes, que tout le
  // reste du questionnaire confondait. Ra'am est islamiste et culturellement
  // conservateur, Hadash est communiste et laïque — c'est LA ligne qui les
  // divise, et elle est adossée à un vote : en juillet 2020, sur le renvoi en
  // commission d'un texte interdisant les « thérapies de conversion », les
  // députés de Hadash ont voté pour (dont Ayman Odeh) et ceux de Ra'am contre.
  // Ra'am a ensuite quitté la Liste commune, après le refus des autres partis de
  // s'engager à voter ensemble contre les textes LGBT.
  //
  // Ensemble, Yashar et Les Réservistes en sont absents faute de source : Bennett
  // soutient le mariage civil (affirmation 13) mais vient du sionisme religieux,
  // et rien ne documente sa position propre ici. Yisrael Beytenou aussi, malgré
  // sa laïcité affichée.
  { text: "L'État doit garantir l'égalité des droits aux personnes LGBT.",
    pour: ['hadash-ta-al-liste-commune', 'les-democrates'],
    contre: ['ra-am', 'shas', 'judaisme-unifie-de-la-torah', 'sionisme-religieux', 'otzma-yehudit'] },

  // Affirmation DISCRIMINANTE : c'est elle qui sépare enfin le Likoud de ses
  // alliés d'extrême droite. Ben Gvir et Smotrich ont annoncé voter CONTRE
  // l'accord et menacé de faire tomber la coalition — « nous n'accepterons pas la
  // fin de la guerre avant la destruction du Hamas » (Smotrich) — pendant que
  // Netanyahou consentait à la trêve proposée, ce que les deux lui ont
  // publiquement reproché. Côté opposition : Lapid a offert un « filet de
  // sécurité » parlementaire pour faire passer un accord, Gantz s'est dit prêt à
  // entrer au gouvernement pour le garantir, Lieberman réclame le retour de tous
  // les otages sans conditions, et Eisenkot accuse le Premier ministre
  // d'« ignorer et faire obstruction ».
  //
  // Ensemble en est absent, par la même règle que pour la peine de mort : le
  // « filet de sécurité » est une position de Lapid, et Ensemble est dirigé par
  // Bennett. On n'hérite pas d'une position par fusion.
  { text: "Il fallait accepter l'accord de cessez-le-feu et de libération des otages, même sans destruction complète du Hamas.",
    pour: ['likoud', 'unite-nationale', 'yisrael-beytenou', 'yashar-gadi-eisenkot'],
    contre: ['otzma-yehudit', 'sionisme-religieux'] },

  // Affirmation DISCRIMINANTE, ajoutée le 2026-08-04. Diagnostic : sur les 13
  // affirmations précédentes, Yashar, Yisrael Beytenou, Ensemble, Unité nationale
  // et Les Réservistes ne s'opposaient sur AUCUNE — la boussole désignait un bloc,
  // pas un parti. Celle-ci les sépare, parce que c'est la vraie ligne de fracture
  // du centre en 2026.
  //
  // À ne pas confondre avec l'affirmation 7 : celle-là porte sur les DROITS des
  // citoyens arabes, celle-ci sur l'arithmétique parlementaire — s'appuyer ou non
  // sur les voix de leurs partis pour gouverner.
  //
  // Yashar en est absent À DESSEIN : Eisenkot n'exclut pas ces partis mais pose
  // trois conditions, et a convoqué les chefs de l'opposition en avril 2026 sans
  // les y inviter. Cette ambiguïté est sa position ; la trancher serait la trahir.
  { text: "Un gouvernement peut légitimement s'appuyer sur les voix des partis arabes.",
    pour: ['hadash-ta-al-liste-commune', 'ra-am', 'les-democrates'],
    contre: ['ensemble-bennett-lapid', 'yisrael-beytenou', 'les-reservistes-hendel-tropper', 'otzma-yehudit', 'sionisme-religieux'] },

  // REMPLACE, le 2026-08-04, « L'État doit moins intervenir dans l'économie ».
  // L'ancienne affirmation avait zéro position sourcée sur neuf, ne départageait
  // aucun parti que d'autres ne séparaient déjà, et surtout elle mentait par
  // construction : elle rangeait Shas et le JUT « contre le libéralisme » alors
  // que ces partis ne défendent pas une doctrine sociale mais des subventions
  // sectorielles à leur propre communauté, tout en soutenant un gouvernement
  // libéral par ailleurs. Dire cela à un lecteur francophone était faux.
  //
  // Celle-ci porte sur le même terrain — l'argent public — mais s'adosse à une
  // ligne budgétaire votée et à des citations nommées. Budget 2026, le plus
  // important de l'histoire du pays : le financement des institutions éducatives
  // haredim passe de 4,1 à 5,17 milliards de shekels, dont 1,56 milliard pour les
  // yeshivot et kollels. Adopté 62-55.
  //
  // Pour : Shas et le JUT l'ont voté, conditionnant leur soutien à la
  // réintroduction de la loi d'exemption ; Smotrich, ministre des Finances, en est
  // l'auteur ; le Likoud et Otzma l'ont voté.
  // Contre : Lapid, « le plus grand vol de l'histoire de l'État… une aubaine pour
  // les corrompus et les réfractaires » ; Bennett, budget « le plus irresponsable
  // et antisioniste » de l'histoire d'Israël, gouvernement qui « pille les caisses
  // publiques » ; Golan, « un plan de travail pour démanteler l'État d'Israël »,
  // visant les écoles « qui refusent d'enseigner le tronc commun » ; Lieberman,
  // « budget sectaire et trompeur, qui encourage l'évasion du service ».
  //
  // Ensemble y figure sans réserve, cas rare : ses DEUX fondateurs l'ont attaqué,
  // il n'y a donc pas de division interne à arbitrer.
  { text: "L'État doit continuer à financer largement les yeshivot et les institutions haredim.",
    pour: ['shas', 'judaisme-unifie-de-la-torah', 'likoud', 'otzma-yehudit', 'sionisme-religieux'],
    contre: ['ensemble-bennett-lapid', 'les-democrates', 'yisrael-beytenou'] },
];

// Nombre d'affirmations où chaque liste se positionne. C'est le DÉNOMINATEUR
// du pourcentage d'affinité : un parti qui ne se prononce que sur 4 des 10
// affirmations peut afficher 100 % là où un parti couvert sur 10 plafonne.
// On l'expose à l'écran plutôt que de laisser croire à dix critères de poids égal.
const COUVERTURE = (() => {
  const n = {};
  STATEMENTS.forEach(s => [...s.pour, ...s.contre].forEach(x => { n[x] = (n[x] || 0) + 1; }));
  return n;
})();

export { STATEMENTS, COUVERTURE };
