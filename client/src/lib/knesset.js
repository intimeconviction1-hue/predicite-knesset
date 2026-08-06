// Les règles chiffrées du scrutin, en un seul endroit.
//
// Elles étaient recopiées à la main dans chaque page qui en avait besoin :
// TOTAL_SIEGES et MIN_SIEGES_AU_SEUIL en tête de MaRepartition, MAJORITE en tête
// de FormeCoalition, et leur jumeau serveur dans functions/repartitionSieges.js.
// Une valeur recopiée est une valeur qui diverge : le plateau de FormeCoalition
// affichait un parti à 2 sièges — impossible à la Knesset — pendant que
// MaRepartition refusait ce même chiffre au joueur. Même leçon que
// lib/echeances.js pour la date de clôture.
//
// Le pendant serveur reste dans server/functions/repartitionSieges.js : c'est
// lui qui fait foi à la validation d'un pronostic. Ces constantes-ci servent à
// ne pas proposer au joueur ce que le serveur rejettera.

export const TOTAL_SIEGES = 120;

// Majorité absolue à la Knesset : 61 des 120 sièges.
export const MAJORITE = 61;

// Seuil électoral national, relevé à 3,25 % en 2014.
export const SEUIL_PCT = 3.25;

// 3,25 % de 120 sièges = 3,9 : une liste qui franchit le seuil entre donc avec
// au moins 4 sièges. 1, 2 ou 3 sièges n'existent pas. C'est ce qui rend une
// moyenne de sondages inutilisable telle quelle — voir repartirSieges().
export const MIN_SIEGES_AU_SEUIL = Math.ceil((SEUIL_PCT / 100) * TOTAL_SIEGES);

/**
 * Transforme des scores continus (moyenne de sondages, intentions, pourcentages)
 * en une répartition de sièges que la Knesset pourrait réellement produire :
 * seuil appliqué, total ramené exactement à TOTAL_SIEGES.
 *
 * Pourquoi ce n'est pas un simple arrondi : la moyenne des 5 derniers sondages
 * donnait 2,4 sièges aux Réservistes début août 2026. Arrondi à 2, c'est un
 * résultat que le scrutin ne peut pas rendre — et que le jeu interdit par
 * ailleurs au joueur. Une liste sous le seuil obtient 0, et ses voix se
 * redistribuent entre celles qui l'ont franchi : c'est le mécanisme réel, pas
 * une commodité d'affichage.
 *
 * L'ordre compte. On applique le seuil AVANT de ramener à 120, sinon une liste
 * juste sous la barre serait remontée au-dessus par la renormalisation. Et on
 * boucle, parce que redistribuer peut faire passer une liste sous le seuil à
 * son tour.
 *
 * Le report final se fait au plus fort reste, la méthode de la Knesset (Bader-
 * Ofer y ajoute les accords d'excédents entre listes, hors de portée ici : ils
 * dépendent d'accords signés, pas des sondages).
 *
 * @param {Array<{exact:number}>} entrees objets porteurs d'un score continu
 * @returns {Array} les mêmes objets, avec `seats` entier, seuls ceux > 0
 */
export function repartirSieges(entrees) {
  let retenues = entrees.filter(e => e.exact > 0);
  if (!retenues.length) return [];

  // Seuil, en boucle : écarter une liste renchérit la part des autres, ce qui
  // peut faire franchir le seuil à une liste qui ne l'atteignait pas. La boucle
  // termine parce que `retenues` décroît strictement à chaque tour.
  const MAX_LISTES = Math.floor(TOTAL_SIEGES / MIN_SIEGES_AU_SEUIL);   // 30
  for (;;) {
    const somme = retenues.reduce((n, e) => n + e.exact, 0);
    if (!somme) return [];
    let survivantes = retenues.filter(
      e => (e.exact / somme) * TOTAL_SIEGES >= MIN_SIEGES_AU_SEUIL,
    );
    // Aucune ne franchit le seuil : c'est arithmétiquement possible dès qu'on
    // dépasse 30 listes à peu près à égalité — un bulletin israélien en aligne
    // couramment quarante, même si les sondages n'en créditent qu'une douzaine.
    // On ne peut pas toutes les garder (elles finiraient à 3 sièges chacune,
    // exactement le chiffre impossible qu'on cherche à éliminer) : on retient
    // les 30 premières, plafond au-delà duquel le seuil ne peut plus être tenu,
    // et le tour suivant élague le reste.
    if (!survivantes.length) {
      if (retenues.length <= MAX_LISTES) break;
      survivantes = [...retenues].sort((a, b) => b.exact - a.exact).slice(0, MAX_LISTES);
    }
    if (survivantes.length === retenues.length) break;
    retenues = survivantes;
  }

  // Ramené à 120 au prorata. La garde du collecteur accepte les sondages qui
  // totalisent 116 à 124 sièges (mapping imparfait des petites listes) : la
  // moyenne ne tombe donc pas sur 120 toute seule, et distribuer l'écart au plus
  // fort reste reviendrait à offrir des sièges aux grands partis.
  const somme = retenues.reduce((n, e) => n + e.exact, 0);
  const quotas = retenues.map(e => {
    const exact = (e.exact / somme) * TOTAL_SIEGES;
    return { ...e, seats: Math.floor(exact), reste: exact - Math.floor(exact) };
  });

  let restants = TOTAL_SIEGES - quotas.reduce((n, e) => n + e.seats, 0);
  for (const e of [...quotas].sort((a, b) => b.reste - a.reste)) {
    if (restants <= 0) break;
    e.seats += 1;
    restants -= 1;
  }

  return quotas.filter(e => e.seats > 0).sort((a, b) => b.seats - a.seats);
}
