# Fontes du site — provenance et licences

Les trois fontes du site sont **auto-hébergées** depuis ce dossier. Elles
étaient chargées depuis Google Fonts jusqu'au 7 août 2026 ; c'était le seul
appel à un tiers effectué par le site, et il communiquait l'adresse IP de
chaque visiteur à Google à chaque page. Pour un site francophone (RGPD) qui
porte sur un scrutin politique, la seule position tenable était de ne pas
faire cet appel du tout — plutôt que de le déclarer, ce que faisait la page
[Mentions](../../src/pages/Mentions.jsx) dans une section aujourd'hui retirée
parce qu'elle est devenue fausse.

Effet secondaire non négligeable : deux poignées de main DNS+TLS
(`fonts.googleapis.com`, puis `fonts.gstatic.com`) quittent le chemin critique
du premier affichage. Sur le tier gratuit de Render, cela se voit.

Les `@font-face` sont déclarés en tête de [globals.css](../../src/globals.css),
et les deux fontes du premier écran préchargées depuis
[index.html](../../index.html).

## Les trois fichiers

| Fichier | Famille | Version | Axe `wght` | Graisses déclarées | Poids |
|---|---|---|---|---|---|
| `syne-latin.woff2` | Syne | 2.200 | 400–800 | 400, 700, 800 | 34,6 ko |
| `inter-latin.woff2` | Inter | 4.001 (git-66647c0bb) | 100–900 | 400, 500, 600 | 48,3 ko |
| `jetbrains-mono-latin.woff2` | JetBrains Mono | 2.211 | 400–800 | 400, 600 | 31,4 ko |

Trois fichiers pour huit graisses : ce sont des **fontes variables**, et c'est
déjà ce que Google servait — ses huit `@font-face` pointaient vers ces trois
mêmes URL. Chaque déclaration fixe une graisse sur l'axe `wght` ; le fichier
n'est téléchargé qu'une fois. 114 ko au total, dont 83 ko sur le chemin
critique (JetBrains Mono ne sert qu'aux compteurs d'un joueur connecté).

Sous-ensemble **latin uniquement**, tel que Google le découpait. Ni cyrillique,
ni grec, ni vietnamien, ni latin-ext : le dépôt a été scanné caractère par
caractère et ne contient pas une seule occurrence de latin-ext. Les flèches
(`→`), l'exposant `ᵉ` et les symboles décoratifs sont hors de cette plage,
mais ils l'étaient déjà — aucun des sous-ensembles servis par Google ne les
portait — et ils continuent de retomber sur la fonte système, comme avant.

## Licences

Les trois sont sous **SIL Open Font License 1.1**, vérifiée à deux endroits
indépendants : la table `name` du binaire livré (identifiant 14, URL de
licence) et le fichier de licence du dépôt amont, tous deux repris ci-dessous.

| Famille | Notice de copyright (lue dans le binaire livré) | Licence | Amont |
|---|---|---|---|
| Syne | Copyright 2019 The Syne Project Authors | OFL 1.1 — `OFL-syne.txt` | [gitlab.com/bonjour-monde/fonderie/syne-typeface](https://gitlab.com/bonjour-monde/fonderie/syne-typeface) |
| Inter | Copyright 2016 The Inter Project Authors | OFL 1.1 — `OFL-inter.txt` | [github.com/rsms/inter](https://github.com/rsms/inter) |
| JetBrains Mono | Copyright 2020 The JetBrains Mono Project Authors | OFL 1.1 — `OFL-jetbrains-mono.txt` | [github.com/JetBrains/JetBrainsMono](https://github.com/JetBrains/JetBrainsMono) |

Le texte de licence de chaque fonte est déposé ici **verbatim**, tel que son
dépôt amont le distribue, et non résumé ni fusionné : les trois versions
diffèrent par de petites variantes éditoriales (`http`/`https` dans l'URL de
SIL, `PERMISSION & CONDITIONS` contre `PERMISSION AND CONDITIONS`,
`openfontlicense.org` chez JetBrains) et recopier l'une pour les trois
reviendrait à leur attribuer un texte qu'elles ne portent pas. L'OFL impose
que la licence accompagne toute redistribution du logiciel de fonte : ces
fichiers étant dans `public/`, ils sont servis à côté des `.woff2`, ce qui est
la façon la plus littérale de satisfaire cette clause.

Deux points vérifiés parce qu'ils conditionnent le droit de faire ce qu'on
fait ici :

- **Aucune des trois ne déclare de « Reserved Font Name ».** L'OFL réserve
  cette clause aux fontes dont le nom est protégé : une version modifiée
  devrait alors être renommée. Les fichiers servis ici *sont* des versions
  modifiées — Google les a sous-ensemblées au latin — et c'est précisément
  l'absence de nom réservé qui permet de continuer à les appeler `Syne`,
  `Inter` et `JetBrains Mono` sans enfreindre la licence.
- **L'OFL autorise explicitement la redistribution et l'usage commercial**,
  y compris intégrée à un produit, à la seule condition de ne pas vendre la
  fonte seule. Rien à négocier ni à signaler côté site.

Un écart relevé, sans conséquence : l'en-tête de l'`OFL.txt` du dépôt Syne
indique `Copyright 2017` là où le binaire en version 2.200 indique
`Copyright 2019`. Ce sont les mêmes ayants droit (« The Syne Project
Authors ») et la même licence ; l'année a été mise à jour dans la fonte entre
les deux. Le tableau ci-dessus reprend la notice du binaire, puisque c'est ce
fichier-là qui est redistribué.

## Refaire ces fichiers

Les trois `.woff2` sont ceux que servait l'API Google Fonts au 7 août 2026,
récupérés tels quels. Pour les régénérer, demander le CSS avec un
*User-Agent* de navigateur récent — sans lui, Google renvoie du `.ttf` ou du
`.woff` au lieu du `.woff2` variable :

```
curl -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36" \
  "https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=JetBrains+Mono:wght@400;600&family=Inter:wght@400;500;600&display=swap"
```

Puis ne garder que les blocs commentés `/* latin */` et télécharger leurs URL.
Si les graisses déclarées dans `globals.css` changent, mettre à jour la
requête ci-dessus **et** le tableau de ce fichier : les fichiers étant
variables, ajouter une graisse ne change aucun octet téléchargé, seulement une
ligne de CSS.

Les crédits des photos et des logos sont dans
[../images/CREDITS.md](../images/CREDITS.md).
