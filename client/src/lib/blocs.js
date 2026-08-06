// Libellés et couleurs des blocs politiques, partagés entre Listes.jsx,
// Liste.jsx et ListeCard.jsx (auparavant dupliqués dans les trois fichiers).
//
// ── Libellés réécrits le 2026-08-04 ───────────────────────────────────────────
// Les CLÉS restent celles de la base (coalition / opposition / liste_arabe) :
// les renommer demande une migration, prévue au gel du référentiel du
// 9 septembre. Seuls les libellés AFFICHÉS changent ici, sans effet de bord.
//
// Trois raisons :
//
// 1. « Coalition sortante » et « Opposition » décrivent la 25e Knesset. Le
//    28 octobre au matin, ces deux mots ne désignent plus rien.
//
// 2. Ils entretiennent la confusion qui a produit les cinq erreurs corrigées ce
//    jour dans la Boussole : « s'oppose à Netanyahou » lu comme « est de
//    gauche ». Or Yashar, Ensemble et Yisrael Beytenou sont dans l'opposition ET
//    favorables aux implantations — la Knesset a d'ailleurs voté une motion
//    d'annexion par 71 voix contre 13. Nommer le bloc par sa fonction réelle,
//    l'arithmétique de coalition, coupe court à l'amalgame.
//
// 3. « Liste arabe » classe un bloc par l'ethnicité de son électorat plutôt que
//    par sa fonction parlementaire, alors que la catégorie est justifiée par
//    tout autre chose : ces partis sont le PIVOT: ni l'un ni l'autre bloc
//    n'atteint 61 sans eux dans les sondages actuels.
// Forme courte et symétrique : ces libellés s'affichent dans des pastilles en
// MAJUSCULES avec tracking-widest à 9-10 px (ListeCard.jsx, Liste.jsx).
// « BLOC ANTI-NETANYAHOU » y déborde ; « ANTI-NETANYAHOU » tient, et le
// parallélisme pro/anti se lit mieux qu'un « bloc » répété.
export const BLOC_LABEL = {
  coalition: 'Pro-Netanyahou',
  opposition: 'Anti-Netanyahou',
  liste_arabe: 'Partis arabes',
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

/**
 * La phrase qui dit où en est l'arithmétique de coalition.
 *
 * Elle était écrite à trois endroits — le bandeau en direct, le verdict de
 * l'hémicycle, la carte du fait du jour — et ils ne disaient plus la même chose.
 * Deux affirmaient « aucun BLOC n'atteint 61 » à quelques centaines de pixels
 * d'un hémicycle qui affiche désormais TROIS blocs nommés, dont les partis
 * arabes. Le mot juste est « camp » : les partis arabes sont un bloc, et c'est
 * justement parce qu'ils n'appartiennent à aucun des deux camps qu'ils font la
 * balance. La contradiction n'était pas une coquetterie de vocabulaire, elle
 * défaisait ce que la page venait de démontrer.
 *
 * Une seule phrase, un seul endroit — même leçon que BLOC_LABEL, qui avait déjà
 * été recopié à la main dans la Home et dans l'image partagée.
 *
 * @param {{coalition:number, opposition:number, arabes:number}} sieges
 * @returns {string|null} null s'il n'y a pas encore de sondage à commenter
 */
export function verdictMajorite({ coalition = 0, opposition = 0, arabes = 0 } = {}) {
  if (!coalition && !opposition && !arabes) return null;
  if (coalition >= 61 || opposition >= 61) {
    const camp = coalition >= opposition ? BLOC_LABEL.coalition : BLOC_LABEL.opposition;
    // Première lettre seulement : un toLowerCase() complet donnait
    // « pro-netanyahou », et le nom perdait sa majuscule au passage.
    return `Le camp ${camp.charAt(0).toLowerCase()}${camp.slice(1)} franchit la barre des 61 sièges.`;
  }
  return arabes > 0
    ? `Aucun camp n'atteint 61 — les ${arabes} sièges des partis arabes tiennent la balance.`
    : "Aucun camp n'atteint 61 — la majorité reste à construire.";
}
