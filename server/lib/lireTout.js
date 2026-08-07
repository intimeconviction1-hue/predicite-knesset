import { listEntity } from '../db/index.js';

const TAILLE_PAGE = 1000;
// Garde-fou : une boucle de pagination qui ne se termine pas est un bug, pas
// une raison de tronquer. On leve plutot que de rendre un resultat partiel.
const PLAFOND_LIGNES = 500000;

/**
 * Lit TOUTES les lignes d'une entite, page par page.
 *
 * Vivait dans prediciteScoringSieges.js, ou elle avait ete ecrite pour corriger
 * un `limit: 5000` : a douze listes par joueur, la troncature mordait vers
 * 400 joueurs — silencieusement, et le tri par `-created_at` faisait
 * disparaitre les inscrits les PLUS ANCIENS, donc les plus fideles.
 *
 * Elle en sort le 2026-08-07 parce que resolvePremierMinistre.js avait le meme
 * `limit: 5000`, en PIRE : sans `sort`, listEntity ne genere aucun ORDER BY
 * (voir db/index.js, `if (sort)`). Postgres ne garantit alors rien — ce ne sont
 * pas « les 5000 plus recents », ce sont 5000 lignes arbitraires, possiblement
 * differentes d'une execution a l'autre. Au-dela de 5000 pronostics PM, une
 * partie des joueurs n'aurait jamais ete resolue, et le compte rendu aurait
 * affiche un chiffre d'apparence normale. Le soir du scrutin.
 *
 * Une fonction recopiee est une fonction qui diverge : elle n'a donc pas ete
 * dupliquee, elle a demenage.
 *
 * Le tri se fait sur `id` : cle unique, donc pagination stable. `created_at`
 * peut avoir des ex aequo, qui feraient sauter ou repeter des lignes d'une page
 * a l'autre. L'ordre n'a aucune importance ici, tout est parcouru.
 */
export async function lireTout(entite) {
  const tout = [];
  for (let offset = 0; ; offset += TAILLE_PAGE) {
    const page = await listEntity(entite, { sort: 'id', limit: TAILLE_PAGE, offset });
    tout.push(...page);
    if (page.length < TAILLE_PAGE) return tout;
    if (tout.length > PLAFOND_LIGNES) {
      throw new Error(`Lecture de ${entite} au-dela de ${PLAFOND_LIGNES} lignes : pagination suspecte, traitement interrompu.`);
    }
  }
}
