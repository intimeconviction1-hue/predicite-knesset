/**
 * robots.txt et sitemap.xml — ce qui rend le site trouvable autrement que par
 * un lien qu'on a envoyé soi-même.
 *
 * Le problème. Les vingt-et-une routes du client sont servies par le même
 * index.html (voir server/index.js) : dans le HTML d'une page, rien ne mène aux
 * vingt autres tant que React n'a pas tourné. Un robot d'indexation exécute du
 * JavaScript aujourd'hui, mais tard, et il ne visite une URL que si quelque
 * chose la lui a donnée. Sans sitemap, la seule porte d'entrée du site est le
 * lien qu'on a partagé à la main — c'est précisément ce qu'une diffusion
 * cherche à dépasser.
 *
 * Deux règles tenues ici.
 *
 *   • Une seule URL par page. « / » et « /Home » rendent la même chose : Home
 *     est à la fois `mainPage` et une entrée de `PAGES` (voir pages.config.js).
 *     Le sitemap n'annonce que « / », et meta-html pose le canonical
 *     correspondant. Deux URL pour un contenu identique, c'est la façon la plus
 *     sûre de diviser son propre référencement en deux moitiés.
 *
 *   • Pas de `lastmod` inventé. La tentation est d'écrire la date du jour
 *     partout pour paraître frais ; les moteurs finissent par ignorer un
 *     sitemap qui prétend que tout change tous les jours, et la règle du projet
 *     est de ne rien fabriquer. Seules les fiches de liste en portent une, prise
 *     de `listes.updated_at`. Les pages statiques n'en ont pas : on ne sait pas
 *     quand elles ont changé, donc on se tait. Même chose pour `changefreq` et
 *     `priority`, que Google déclare ignorer — les écrire serait décorer.
 */
import { NOMS_DE_PAGES } from '../../client/src/lib/titres.js';
import { cheminCanonique } from './meta-html.js';

/**
 * Les pages qu'un moteur ne doit pas indexer.
 *
 * `AdminResultats` est l'écran de saisie du soir du scrutin : il est déjà hors
 * navigation et protégé côté serveur, mais une URL d'admin dans un index public
 * est une invitation à venir la tester. `Login` n'a rien à y faire non plus —
 * une page de connexion indexée capte des recherches de marque et amène le
 * visiteur sur un formulaire au lieu du produit.
 *
 * Cette liste est en dur, et c'est voulu : dériver l'inverse (« tout ce qui
 * ressemble à de l'admin ») ferait entrer silencieusement dans le sitemap la
 * prochaine page privée qu'on écrira.
 */
export const PAGES_PRIVEES = new Set(['Login', 'AdminResultats']);

/**
 * Les chemins à annoncer, dans l'ordre de titres.js (Home en tête).
 *
 * Le chemin vient de `cheminCanonique` (meta-html.js), la même fonction qui
 * écrit la balise <link rel="canonical"> de chaque page. C'est la seule façon de
 * garantir que le sitemap et les pages qu'il annonce disent la même chose : un
 * sitemap qui pointe une URL dont le canonical en désigne une autre s'annule
 * lui-même.
 */
export function cheminsPublics() {
  return NOMS_DE_PAGES.filter(n => !PAGES_PRIVEES.has(n)).map(cheminCanonique);
}

/**
 * Échappe ce qui casserait le XML. Les slugs viennent de la base, donc de
 * l'extérieur du dépôt — ils passent par ici comme le reste.
 */
function xml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Le contenu de /robots.txt.
 *
 * Le `Sitemap:` est absolu — c'est la seule directive de robots.txt qui l'exige,
 * et c'est par elle que les moteurs trouvent le reste. Elle est construite depuis
 * l'origine de la requête pour que le jour du vrai nom de domaine ne demande
 * aucun passage dans le code.
 *
 * @param {string} origine  ex. « https://predicite-knesset.onrender.com »
 */
export function robotsTxt(origine) {
  return [
    'User-agent: *',
    'Allow: /',
    // /api/ ne rend aucune page : l'indexer ne produirait que du JSON dans les
    // résultats de recherche, et des requêtes de robots sur un tier gratuit.
    'Disallow: /api/',
    // Les deux graphies : la route est /login, mais /Login est servi aussi (le
    // catch-all répond à tout) et se ferait indexer comme page vide.
    'Disallow: /login',
    'Disallow: /Login',
    'Disallow: /AdminResultats',
    '',
    `Sitemap: ${new URL('/sitemap.xml', origine).href}`,
    '',
  ].join('\n');
}

/**
 * Le contenu de /sitemap.xml.
 *
 * @param {string} origine
 * @param {Array<{slug: string, updated_at?: string}>} listes
 *   Les listes actives. Vide si la base est injoignable : un sitemap des seules
 *   pages statiques vaut mieux qu'une 500 — un moteur qui reçoit une erreur
 *   espace ses visites suivantes.
 */
export function sitemapXml(origine, listes = []) {
  const entree = (chemin, lastmod) => {
    const loc = `    <loc>${xml(new URL(chemin, origine).href)}</loc>`;
    // `updated_at` est déjà au format ISO 8601 (voir now_iso() dans schema.sql),
    // que la spec sitemap accepte tel quel. On ne reformate donc rien — et on
    // n'écrit la balise que si la date est réellement présente et plausible.
    const date = lastmod && /^\d{4}-\d{2}-\d{2}/.test(lastmod)
      ? `\n    <lastmod>${xml(lastmod.slice(0, 10))}</lastmod>`
      : '';
    return `  <url>\n${loc}${date}\n  </url>`;
  };

  const urls = [
    ...cheminsPublics().map(c => entree(c)),
    // Les fiches de liste. Le slug est le seul paramètre, donc pas d'esperluette
    // à échapper aujourd'hui — l'échappement reste appliqué pour le jour où il y
    // en aura une.
    ...listes
      .filter(l => l?.slug)
      .map(l => entree(`/Liste?slug=${encodeURIComponent(l.slug)}`, l.updated_at)),
  ];

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    '</urlset>',
    '',
  ].join('\n');
}
