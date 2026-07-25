// Libellés et couleurs des blocs politiques, partagés entre Listes.jsx,
// Liste.jsx et ListeCard.jsx (auparavant dupliqués dans les trois fichiers).
export const BLOC_LABEL = {
  coalition: 'Coalition sortante',
  opposition: 'Opposition',
  liste_arabe: 'Liste arabe',
  non_alignee: 'Non alignée',
};

// Valeurs hex (pas var(--p-*)) : ces couleurs sont concaténées avec un
// suffixe alpha ("${blocColor}18") pour les fonds teintés des badges —
// un var() ne supporte pas cette concaténation. #2B5CE6/#C8102E sont les
// valeurs de --p-blue/--p-red dans globals.css. liste_arabe/non_alignee
// sont assombries par rapport aux teintes d'origine (#22C55E/#9CA3AF) :
// utilisées comme texte direct sur le thème clair, elles ne faisaient que
// ~2.1-2.4:1 de contraste (calculé), sous le seuil AA 4.5:1.
export const BLOC_COLOR = {
  coalition: '#2B5CE6',
  opposition: '#C8102E',
  liste_arabe: '#16794A',
  non_alignee: '#5B6472',
};
