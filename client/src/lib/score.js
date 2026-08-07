// Le SCORE unique = LA métrique de rang, partout (classement général + ligues).
// Un total de points INTUITIF, mais avec l'anti-grind intégré : la précision
// (pronostics + skill de paris) compte SANS plafond ; le quiz et la régularité
// sont plafonnés, pour rester des coups de pouce et non des leviers de rang.
// Fini l'ancien « indice /100 » séparé et confus.
//
//   precision = total_points − learning_points − regularity_points − participation_points
//             = points de pronostics (sièges/PM) + 25 % du BÉNÉFICE NET des paris
//
// → « bien parier fait monter ton Score » (voir server/functions/parisSondages.js).
//   La phrase est vraie depuis que le crédit porte sur le net (gain − mise) et
//   non sur le gain brut : la cote étant un pari-mutuel à prior sans marge,
//   créditer le brut versait 0,25 × mise en espérance à TOUT LE MONDE, informé
//   ou non — c'était « parier » qui faisait monter le Score, pas « bien parier ».
//
// La MÊME formule est reproduite en SQL côté serveur pour les ligues
// (server/functions/ligues.js) — garder les deux synchronisées. Le test
// server/tests/plafond-participation.test.mjs casse si l'une dérive de l'autre.

// Extension explicite : Vite s'en moque, mais Node l'exige pour un import
// relatif, et server/tests/plafond-participation.test.mjs importe ce module tel
// quel pour confronter ses plafonds à ceux du serveur. Sans le `.js`, le test
// ne peut pas charger le fichier qu'il est censé verrouiller.
import { texteLisible } from './couleurs.js';

// Le quiz paie selon la difficulté (server/functions/quizScoring.js) :
// 10 en découverte, 25 en connaisseur, 50 en expert. Le plafond se remplit donc
// en 30 questions faciles… ou en 6 expertes. L'ancien commentaire n'annonçait
// que le premier cas et sous-estimait la vitesse de remplissage d'un facteur 5.
export const LEARNING_CAP = 300;        // 30 réponses en découverte, 6 en expert
export const REGULARITY_CAP = 900;      // ~12 bonus de série (7 jours d'affilée)

// Barème de participation — dupliqué depuis server/functions/prediciteScoringSieges.js
// (SCORE.engagement / SCORE.justifBonus). Le serveur les VERSE à la saisie, le
// client les PLAFONNE au classement.
export const PARTICIPATION_ENGAGEMENT = 120;
export const PARTICIPATION_JUSTIF_BONUS = 50;

// Nombre de listes ACTIVES au dépôt courant (docs/KNESSET_SEED_LISTES.json :
// 15 listes, dont Noam et Yesh Atid en is_active:false).
//
// Le plafond valait 720 en dur, calibré sur DOUZE listes — l'état du référentiel
// au moment où la règle a été écrite. Il y en a treize : une répartition
// entièrement justifiée vaut 770, et la treizième justification était donc
// écrêtée en silence, sans que rien ne le signale au joueur ni au code.
//
// Écrit en formule et non en nombre, pour que la promesse du commentaire
// ci-dessous reste vérifiable. À rouvrir au gel du référentiel, le 9 septembre
// 2026 : le test server/tests/plafond-participation.test.mjs échoue le jour où
// une liste entre ou sort, au lieu de laisser le plafond réécrêter en silence.
export const LISTES_ACTIVES = 13;

// Une répartition complète, entièrement justifiée, vaut EXACTEMENT ce plafond :
// participer rapporte des points à tout le monde, mais personne ne prend un
// rang en saisissant plus — seule la justesse départage.
export const PARTICIPATION_CAP =
  PARTICIPATION_ENGAGEMENT + LISTES_ACTIVES * PARTICIPATION_JUSTIF_BONUS;

export function computeScore(p) {
  if (!p) return 0;
  const learning = p.learning_points || 0;
  const regularity = p.regularity_points || 0;
  const participation = p.participation_points || 0;
  const precision = Math.max(0, (p.total_points || 0) - learning - regularity - participation);
  return Math.round(
    precision
    + Math.min(learning, LEARNING_CAP)
    + Math.min(regularity, REGULARITY_CAP)
    + Math.min(participation, PARTICIPATION_CAP)
  );
}

// Paliers de titre par Score (croissants). Cohérents avec l'onboarding/les ligues.
//
// DEUX couleurs par palier, comme chaque famille de globals.css (--p-gold pour
// le décoratif, --p-gold-text pour le texte) :
//   · `color` remplit les pastilles, les bordures et les dégradés — inchangée,
//     l'or vif d'Oracle reste l'or de marque ;
//   · `text`  est la SEULE à poser sur du texte.
//
// La règle existait déjà et était appliquée partout aux couleurs de partis, mais
// score.js est un fichier JS et non du CSS : les paliers y avaient échappé.
// Connaisseur tombait à 2.77:1 et Oracle à 2.10:1 sur --p-card — tous deux sous
// AA, et globals.css documente nommément ces deux valeurs comme illisibles.
// « Palier maximal atteint — tu es Oracle » était le moment le plus gratifiant
// du produit, rendu dans la couleur la moins lisible de l'application.
//
// `texteLisible` fonce juste assez en préservant la teinte : l'or d'Oracle reste
// de l'or (#887023, 4.78:1) et le cyan de Connaisseur reste du cyan (#0b7db1,
// 4.58:1). Les cinq valeurs obtenues restent distinctes entre elles — condition
// nécessaire, sans quoi deux paliers voisins s'afficheraient dans la même
// couleur et l'échelle cesserait de se lire comme une progression.
const avecTexte = (t) => ({ ...t, text: texteLisible(t.color) });

export const TITLES = [
  { min: 0, label: 'Citoyen', color: '#64748B' },
  { min: 300, label: 'Analyste', color: '#2B5CE6' },
  { min: 1000, label: 'Connaisseur', color: '#0EA5E9' },
  { min: 2500, label: 'Politologue', color: '#7A5F1A' },
  { min: 6000, label: 'Oracle', color: '#D4AF37' },
].map(avecTexte);

export function titleForScore(score) {
  let t = TITLES[0];
  for (const x of TITLES) if (score >= x.min) t = x;
  return t;
}

export function nextTitle(score) {
  return TITLES.find((x) => x.min > score) || null;
}
