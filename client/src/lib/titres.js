// Le titre et la description de chaque page — la fiche d'identité d'une URL.
//
// Deux consommateurs, une seule table :
//   • le Layout, qui pose document.title à la navigation (côté client) ;
//   • server/lib/meta-html.js, qui injecte titre, description et balises Open
//     Graph dans le HTML servi (côté serveur).
//
// Pourquoi les deux. Le titre côté client suffit pour les onglets, les favoris
// et l'historique — c'est du JavaScript qui tourne dans le navigateur de
// quelqu'un. Mais un aperçu de lien dans WhatsApp, X, Slack ou Discord n'exécute
// aucun JavaScript : le robot lit le HTML brut et s'arrête là. Sans injection
// serveur, les vingt-et-une pages partagent le même aperçu — celui d'index.html.
// Sur un site qui a un bouton « partager ma projection », c'est le partage
// lui-même qui perd son sens.
//
// Le serveur importe ce fichier du dossier client. C'est assumé : le serveur sert
// déjà client/dist, les deux vivent sur le même disque en production, et
// server/tests/ importe déjà lib/knesset.js et lib/frictions.js de la même façon.
// Dupliquer la table serait la garantie qu'un jour les deux divergent.
//
// Les descriptions décrivent ce que la page fait vraiment. Pas de promesse que le
// produit ne tient pas : c'est la règle d'honnêteté du projet, et un aperçu de
// partage est justement l'endroit où l'on est tenté d'embellir.

export const SUFFIXE = 'PrédiCité';

export const DESCRIPTION_PAR_DEFAUT =
  "Pronostiquez les législatives israéliennes — Knesset, 27 octobre 2026. Répartissez les 120 sièges, formez des coalitions, suivez la campagne. En français, gratuit, sans mise d'argent.";

const PAGES = {
  Home: {
    titre: 'Pronostics Knesset 2026',
    description:
      "Le jeu de pronostics des législatives israéliennes du 27 octobre 2026. Répartissez les 120 sièges, misez sur le Premier ministre, suivez les sondages en direct.",
  },
  MaRepartition: {
    titre: 'Mon pronostic : les 120 sièges',
    description:
      "Répartissez les 120 sièges de la Knesset entre les listes en lice. Seuil de 3,25 % appliqué, total contraint à 120 — le même exercice que les instituts de sondage.",
  },
  Paris: {
    titre: 'Le direct : mise tes jetons',
    description:
      "Misez vos jetons sur les prochains sondages sièges. Pas d'argent réel : des jetons, un classement, et la campagne comme terrain de jeu.",
  },
  Leaderboard: {
    titre: 'Classement',
    description:
      "Le classement des pronostiqueurs. La précision des pronostics et des paris compte sans plafond ; le quiz et la régularité sont plafonnés, pour récompenser le flair plus que le volume.",
  },
  Ligues: {
    titre: 'Ligues privées',
    description:
      "Créez une ligue privée et comparez vos pronostics sur la Knesset 2026 entre amis, en famille ou entre collègues.",
  },

  // Mini-jeux
  SensDuVent: {
    titre: 'Le sens du vent',
    description:
      "Une liste monte-t-elle ou descend-elle ? Devinez la tendance à partir des vrais sondages sièges publiés en Israël.",
  },
  FormeCoalition: {
    titre: 'Forme ta coalition',
    description:
      "Assemblez 61 sièges à partir des sondages réels, puis découvrez la plausibilité de votre coalition — chaque friction entre listes est sourcée.",
  },
  Boussole: {
    titre: 'Quel parti te ressemble ?',
    description:
      "Dix-neuf affirmations sur la société, la sécurité et la religion : découvrez de quelle liste israélienne vos réponses vous rapprochent. Toutes les positions sont sourcées.",
  },
  VraiOuFake: {
    titre: 'Vrai ou Fake ?',
    description:
      "Vrai ou faux sur le système électoral israélien, la Knesset et la campagne 2026. Chaque réponse est expliquée.",
  },
  Quiz: {
    titre: 'Quiz',
    description:
      "Testez ce que vous savez de la Knesset, du scrutin proportionnel israélien et de la campagne 2026.",
  },

  // Comprendre
  Learn: {
    titre: "L'élection en bref",
    description:
      "Comment les voix israéliennes deviennent des sièges, et comment un gouvernement se forme ensuite. Le nécessaire pour pronostiquer sans se tromper de logique.",
  },
  Voter: {
    titre: 'Comment on vote à la Knesset',
    description:
      "Le bulletin à deux lettres hébraïques, la proportionnelle nationale, le seuil de 3,25 % et les accords d'excédents — le vote israélien expliqué en français.",
  },
  ReglesDuJeu: {
    titre: 'Comment ça marche',
    description:
      "Les règles de PrédiCité : comment se dépose un pronostic, comment se comptent les points, ce qui est plafonné et pourquoi. Gratuit, sans mise d'argent.",
  },
  Methodologie: {
    titre: 'Sources & méthodologie',
    description:
      "D'où viennent les sondages affichés, comment ils sont collectés et vérifiés, et comment le barème de points est calculé. Aucune donnée inventée.",
  },

  // Suivre
  Listes: {
    titre: 'Les listes en lice',
    description:
      "Toutes les listes candidates à la 26ᵉ Knesset : dirigeant, bloc, sièges sortants, projection du dernier sondage et histoire de chaque parti.",
  },
  Liste: {
    // Remplacé par le nom du parti au chargement de la page (voir Liste.jsx).
    titre: 'Fiche de liste',
    description:
      "La fiche d'une liste candidate à la Knesset 2026 : son dirigeant, son histoire, ses sièges sortants et sa courbe dans les sondages.",
  },
  PremierMinistre: {
    titre: 'Premier ministre',
    description:
      "Qui dirigera le prochain gouvernement israélien ? Les candidats déclarés, leur liste, et l'arithmétique de coalition qui décidera vraiment.",
  },
  Actu: {
    titre: 'Actu de la campagne',
    description:
      "L'actualité de la campagne israélienne, en français : un flux de vrais médias francophones, complété par des résumés traduits de sources israéliennes, toujours sourcés.",
  },
  Historique: {
    titre: 'Historique des Knesset',
    description:
      "Les 25 élections israéliennes de 1949 à 2022, avec la composition réelle de la Knesset issue de chaque scrutin — sourcée élection par élection.",
  },

  Login: {
    titre: 'Connexion',
    description: 'Connectez-vous pour déposer vos pronostics et rejoindre le classement.',
  },
  AdminResultats: {
    titre: 'Saisie des résultats',
    description: 'Écran réservé à la saisie des résultats officiels du scrutin.',
  },
};

/**
 * Le titre d'onglet complet d'une page.
 * Sans correspondance (page inconnue, 404), on retombe sur la marque seule
 * plutôt que d'afficher « undefined — PrédiCité ».
 */
export function titrePour(nomDePage) {
  const p = PAGES[nomDePage];
  return p ? `${p.titre} — ${SUFFIXE}` : `${SUFFIXE} — Knesset 2026`;
}

/**
 * Titre et description d'une page, pour les balises du document.
 * @returns {{titre: string, description: string, connue: boolean}}
 */
export function metaPour(nomDePage) {
  const p = PAGES[nomDePage];
  return {
    titre: titrePour(nomDePage),
    description: p?.description || DESCRIPTION_PAR_DEFAUT,
    connue: Boolean(p),
  };
}

/** Les noms de pages connus — utilisé par les tests d'intégrité. */
export const NOMS_DE_PAGES = Object.keys(PAGES);
