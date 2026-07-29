// Le SCORE unique = LA métrique de rang, partout (classement général + ligues).
// Un total de points INTUITIF, mais avec l'anti-grind intégré : la précision
// (pronostics + skill de paris) compte SANS plafond ; le quiz et la régularité
// sont plafonnés, pour rester des coups de pouce et non des leviers de rang.
// Fini l'ancien « indice /100 » séparé et confus.
//
//   precision = total_points − learning_points − regularity_points
//             = points de pronostics (sièges/PM) + 25 % des gains de paris
//
// → « bien parier fait monter ton Score » (voir server/functions/parisSondages.js,
//   qui ajoute déjà 25 % du gain aux total_points). C'est désormais assumé.
//
// La MÊME formule est reproduite en SQL côté serveur pour les ligues
// (server/functions/ligues.js) — garder les deux synchronisées.

export const LEARNING_CAP = 300;     // ~30 bonnes réponses de quiz
export const REGULARITY_CAP = 900;   // ~12 bonus de série (7 jours d'affilée)

export function computeScore(p) {
  if (!p) return 0;
  const learning = p.learning_points || 0;
  const regularity = p.regularity_points || 0;
  const precision = Math.max(0, (p.total_points || 0) - learning - regularity);
  return Math.round(precision + Math.min(learning, LEARNING_CAP) + Math.min(regularity, REGULARITY_CAP));
}

// Paliers de titre par Score (croissants). Cohérents avec l'onboarding/les ligues.
export const TITLES = [
  { min: 0, label: 'Citoyen', color: '#64748B' },
  { min: 300, label: 'Analyste', color: '#2B5CE6' },
  { min: 1000, label: 'Connaisseur', color: '#0EA5E9' },
  { min: 2500, label: 'Politologue', color: '#7A5F1A' },
  { min: 6000, label: 'Oracle', color: '#D4AF37' },
];

export function titleForScore(score) {
  let t = TITLES[0];
  for (const x of TITLES) if (score >= x.min) t = x;
  return t;
}

export function nextTitle(score) {
  return TITLES.find((x) => x.min > score) || null;
}
