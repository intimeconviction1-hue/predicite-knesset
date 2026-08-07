// Blocs politiques : clés, libellés, couleurs, et le camp auquel chaque bloc
// appartient dans l'arithmétique des 61 sièges.
//
// ── Libellés réécrits le 2026-08-04, clés migrées le 2026-08-07 ──────────────
// Les libellés avaient été réécrits en laissant les CLÉS derrière (coalition /
// opposition / liste_arabe / non_alignee), faute d'une migration. Elles ont
// rejoint les libellés : voir la fin de server/db/schema.sql.
//
// Trois raisons avaient motivé la réécriture, et elles valent pour les clés :
//
// 1. « Coalition sortante » et « Opposition » décrivent la 25e Knesset. Le
//    28 octobre au matin, ces deux mots ne désignent plus rien.
//
// 2. Ils entretiennent la confusion qui a produit les cinq erreurs corrigées le
//    2026-08-04 dans la Boussole : « s'oppose à Netanyahou » lu comme « est de
//    gauche ». Or Yashar, Ensemble et Yisrael Beytenou sont dans l'opposition ET
//    favorables aux implantations — la Knesset a d'ailleurs voté une motion
//    d'annexion par 71 voix contre 13. Nommer le bloc par sa fonction réelle,
//    l'arithmétique de coalition, coupe court à l'amalgame.
//
// 3. « Liste arabe » classait un bloc par l'ethnicité de son électorat plutôt
//    que par sa fonction parlementaire, alors que la catégorie est justifiée par
//    tout autre chose : ces partis sont le pivot.
//
// L'argument 3 et le libellé retenu ne se rejoignaient pas — l'un plaidait pour
// nommer la FONCTION, l'autre disait « Partis arabes ». Il fallait trancher,
// puisque la migration grave le choix. Retenu : la clé nomme le GROUPE, la
// phrase dit la fonction.
//
// Pourquoi : « pivot » décrit une POSITION, qui change à chaque sondage — le
// jour où un camp atteint 61 sans eux, la clé devient fausse, et c'est exactement
// le piège de « coalition sortante » reproduit sous un autre nom. « Partis
// arabes » décrit une COMPOSITION, qui ne change pas. La leçon de tout ce
// chantier n'est pas « nommer par la fonction » mais « que le nom décrive ce que
// la chose est, durablement ». La fonction, elle, est déjà portée par
// verdictMajorite() — « les X sièges des partis arabes tiennent la balance » —
// et cette phrase-là est recalculée à chaque sondage.
//
// Forme courte et symétrique : ces libellés s'affichent dans des pastilles en
// MAJUSCULES avec tracking-widest à 9-10 px (ListeCard.jsx, Liste.jsx).
// « BLOC ANTI-NETANYAHOU » y déborde ; « ANTI-NETANYAHOU » tient, et le
// parallélisme pro/anti se lit mieux qu'un « bloc » répété.
export const BLOC_LABEL = {
  pro_netanyahou: 'Pro-Netanyahou',
  anti_netanyahou: 'Anti-Netanyahou',
  partis_arabes: 'Partis arabes',
  sans_camp: 'Sans camp',
};

// Valeurs hex (pas var(--p-*)) : ces couleurs sont concaténées avec un
// suffixe alpha ("${blocColor}18") pour les fonds teintés des badges —
// un var() ne supporte pas cette concaténation. #2B5CE6/#C8102E sont les
// valeurs de --p-blue/--p-red dans globals.css. partis_arabes/sans_camp
// sont assombries par rapport aux teintes d'origine (#22C55E/#9CA3AF) :
// utilisées comme texte direct sur le thème clair, elles ne faisaient que
// ~2.1-2.4:1 de contraste (calculé), sous le seuil AA 4.5:1.
export const BLOC_COLOR = {
  pro_netanyahou: '#2B5CE6',
  anti_netanyahou: '#C8102E',
  partis_arabes: '#16794A',
  sans_camp: '#5B6472',
};

// Repli quand une liste n'a pas de couleur en base. Traînait en dur dans une
// dizaine de fichiers — dont trois où il alimente texteLisible() ou un canvas,
// qui ne savent lire ni l'un ni l'autre un var(). D'où une constante JS et non
// un token CSS : c'est la seule forme qui marche dans les trois contextes.
// À ne pas confondre avec BLOC_COLOR.sans_camp (#5B6472), qui dit « ce parti
// n'a pas de camp » — celui-ci dit « on ne connaît pas sa couleur ».
export const COULEUR_PARTI_INCONNU = '#6B7280';

/**
 * Le camp d'un bloc dans la course aux 61 sièges — 'pro', 'anti', ou null.
 *
 * Ce regroupement était recopié VERBATIM à quatre endroits : le barème
 * (server/functions/prediciteScoringSieges.js), le bandeau en direct
 * (useCampaignFlux.js), la Home et MaRepartition. C'est ce qui a fait qu'une
 * migration de vocabulaire touche treize fichiers, et c'est la pathologie que
 * `lireTout` avait déjà coûté une fois. Désormais ici, et ici seulement.
 *
 * `null` n'est PAS un oubli : deux blocs ne comptent dans aucun camp, et c'est
 * ce qui rend la balance possible.
 *
 * ── Ce que la migration a corrigé au passage ────────────────────────────────
 * `non_alignee` comptait dans le camp anti-Netanyahou. Aucun commentaire ne le
 * justifiait, son propre nom le contredisait, et l'asymétrie avec `liste_arabe`
 * — exclue des deux camps — n'était expliquée nulle part. Une liste sans camp
 * versée d'office à un camp est une contradiction dans les termes. Aucune liste
 * ne portait la clé, la bascule est donc sans effet sur les données : c'est la
 * règle qu'elle corrige, avant que le dépôt du 9 septembre ne la rende vivante.
 */
export const CAMP_DE = {
  pro_netanyahou: 'pro',
  anti_netanyahou: 'anti',
  partis_arabes: null,
  sans_camp: null,
};

/** @param {string} bloc @returns {'pro'|'anti'|null} */
export function campDe(bloc) {
  return CAMP_DE[bloc] ?? null;
}

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
 * @param {{pro:number, anti:number, arabes:number}} sieges
 * @returns {string|null} null s'il n'y a pas encore de sondage à commenter
 */
export function verdictMajorite({ pro = 0, anti = 0, arabes = 0 } = {}) {
  if (!pro && !anti && !arabes) return null;
  if (pro >= 61 || anti >= 61) {
    const camp = pro >= anti ? BLOC_LABEL.pro_netanyahou : BLOC_LABEL.anti_netanyahou;
    // Première lettre seulement : un toLowerCase() complet donnait
    // « pro-netanyahou », et le nom perdait sa majuscule au passage.
    return `Le camp ${camp.charAt(0).toLowerCase()}${camp.slice(1)} franchit la barre des 61 sièges.`;
  }
  return arabes > 0
    ? `Aucun camp n'atteint 61 — les ${arabes} sièges des partis arabes tiennent la balance.`
    : "Aucun camp n'atteint 61 — la majorité reste à construire.";
}
