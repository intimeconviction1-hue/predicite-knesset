// Le titre d'onglet de chaque page.
//
// Jusqu'ici le site n'en avait qu'un, posé une fois dans index.html :
// « PrédiCité — Knesset 2026 », le même sur les vingt-et-une pages. Seule
// Liste.jsx faisait exception, en écrivant le nom du parti. Conséquences, toutes
// visibles à l'usage : six onglets ouverts et impossibles à distinguer, une barre
// de favoris où chaque page porte le même nom, un historique de navigateur
// inutilisable, et un titre de partage identique quel que soit ce qu'on partage —
// sur un site qui a un bouton « partager ma projection ».
//
// Le titre est écrit par le Layout, qui reçoit déjà currentPageName : une page
// n'a rien à faire pour en avoir un. Une page qui veut un titre DYNAMIQUE (le nom
// du parti sur /Liste) garde son propre effet : celui du Layout se pose au
// montage, celui de la page écrase quand sa donnée arrive.
//
// Les libellés reprennent ceux de la navigation quand ils existent, pour qu'un
// onglet porte le nom par lequel on y est entré.

export const SUFFIXE = 'PrédiCité';

const TITRES = {
  Home: 'Pronostics Knesset 2026',
  MaRepartition: 'Mon pronostic : les 120 sièges',
  Paris: 'Le direct : mise tes jetons',
  Leaderboard: 'Classement',
  Ligues: 'Ligues privées',

  // Mini-jeux
  SensDuVent: 'Le sens du vent',
  FormeCoalition: 'Forme ta coalition',
  Boussole: 'Quel parti te ressemble ?',
  VraiOuFake: 'Vrai ou Fake ?',
  Quiz: 'Quiz',

  // Comprendre
  Learn: "L'élection en bref",
  Voter: 'Comment on vote à la Knesset',
  ReglesDuJeu: 'Comment ça marche',
  Methodologie: 'Sources & méthodologie',

  // Suivre
  Listes: 'Les listes en lice',
  Liste: 'Fiche de liste',            // remplacé par le nom du parti au chargement
  PremierMinistre: 'Premier ministre',
  Actu: 'Actu de la campagne',
  Historique: 'Historique des Knesset',

  Login: 'Connexion',
  AdminResultats: 'Saisie des résultats',
};

/**
 * Le titre d'onglet complet d'une page.
 * Sans correspondance (page inconnue, 404), on retombe sur la marque seule
 * plutôt que d'afficher « undefined — PrédiCité ».
 */
export function titrePour(nomDePage) {
  const titre = TITRES[nomDePage];
  return titre ? `${titre} — ${SUFFIXE}` : `${SUFFIXE} — Knesset 2026`;
}
