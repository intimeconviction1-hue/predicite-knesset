/**
 * Traduire une exception en réponse HTTP honnête.
 *
 * Les routes attrapaient toute exception sous un code unique : 400 côté
 * entités, 500 côté paris. Une base momentanément indisponible ressortait donc
 * en « erreur du client ». Deux dégâts, vus en vrai le 2026-08-07 sur la
 * console d'un visiteur :
 *   - le navigateur ne peut pas savoir qu'un réessai a du sens, puisque 400
 *     veut dire « ne retente pas, ta requête est fautive » ;
 *   - les logs affichent des 400, c'est-à-dire « des clients envoient
 *     n'importe quoi », et l'incident réel devient invisible.
 *
 * Trois familles, trois codes :
 *   - requête réellement fautive    → 400, notre message est conservé ;
 *   - base ou réseau indisponible   → 503 + Retry-After, message générique ;
 *   - le reste (bug de notre côté)  → 500, message générique.
 *
 * Hors du 400 que nous levons nous-mêmes, le message brut de l'exception n'est
 * JAMAIS renvoyé au navigateur : une erreur Postgres contient du SQL, des noms
 * de tables et de colonnes. Il part dans les logs du serveur, où il sert.
 */

/**
 * Erreur imputable à l'appelant. Son message vient de nous, pas du moteur :
 * il est sûr à afficher, et c'est la seule chose qui la distingue d'un bug.
 */
export class RequeteInvalide extends Error {
  constructor(message) {
    super(message);
    this.name = 'RequeteInvalide';
  }
}

// Codes réseau de Node, remontés tels quels par pg quand la connexion échoue.
const CODES_RESEAU = new Set([
  'ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND',
  'EPIPE', 'EHOSTUNREACH', 'ENETUNREACH',
]);

// SQLSTATE : classe 08 = connexion, classe 53 = ressources épuisées (dont
// too_many_connections), 57P01..57P03 = le serveur s'arrête, redémarre ou
// coupe la session — exactement ce que fait Neon quand il se réveille.
const SQLSTATE_INDISPONIBLE = /^(?:08|53)|^57P0[123]$/;

// Classe 22 = donnée invalide (un UUID mal formé dans la query string, par
// exemple), classe 23 = contrainte violée. Dans les deux cas c'est l'appelant
// qui a tort — mais le message vient du moteur, donc on ne le relaie pas.
const SQLSTATE_FAUTE_APPELANT = /^(?:22|23)/;

const MSG_INDISPONIBLE = 'Service temporairement indisponible, réessayez dans un instant.';
const MSG_INTERNE = 'Erreur interne du serveur.';

/** @returns {{status: number, message: string}} */
export function classer(e) {
  if (e instanceof RequeteInvalide) return { status: 400, message: e.message };

  const code = String(e?.code ?? '');
  // Le pool de pg épuise son délai d'attente sans poser de `code`.
  const attenteEpuisee = /timeout exceeded when trying to connect/i.test(e?.message ?? '');

  if (CODES_RESEAU.has(code) || SQLSTATE_INDISPONIBLE.test(code) || attenteEpuisee) {
    return { status: 503, message: MSG_INDISPONIBLE };
  }
  if (SQLSTATE_FAUTE_APPELANT.test(code)) {
    return { status: 400, message: 'Requête invalide.' };
  }
  return { status: 500, message: MSG_INTERNE };
}

/**
 * Classe l'erreur, journalise ce qui mérite de l'être, et répond.
 * `contexte` n'apparaît que dans les logs, pour retrouver la route coupable.
 */
export function repondreErreur(res, e, contexte = 'api') {
  const { status, message } = classer(e);
  if (status === 503) {
    // Une ligne, pas une pile : pendant un réveil de base, chaque requête en
    // vol échoue: la pile se répéterait à l'identique sans rien apprendre.
    console.warn(`[${contexte}] base indisponible :`, e?.code ?? e?.message ?? e);
    res.set('Retry-After', '5');
  } else if (status >= 500) {
    console.error(`[${contexte}]`, e?.stack ?? e);
  }
  res.status(status).json({ error: message });
}
