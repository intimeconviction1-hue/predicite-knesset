/**
 * Injection des balises de page dans le HTML servi.
 *
 * Le problème. Le client pose document.title à la navigation (voir Layout.jsx
 * et client/src/lib/titres.js), ce qui règle les onglets, les favoris et
 * l'historique — tout ce qui vit dans un navigateur qui exécute du JavaScript.
 * Mais un aperçu de lien dans WhatsApp, X, Slack, Discord, LinkedIn ou iMessage
 * n'exécute rien : le robot demande l'URL, lit le HTML brut, prend ce qu'il
 * trouve dans <head> et s'arrête là. Les vingt-et-une pages renvoyant le même
 * index.html, elles partageaient toutes le même aperçu — sur un site dont le
 * produit central est une projection qu'on partage.
 *
 * La solution retenue. Ce n'est PAS du rendu serveur : on ne rend aucun composant
 * React, on ne va pas chercher de données, et le HTML reste le même document pour
 * tout le monde à un détail près. On lit index.html une fois, on le découpe autour
 * des balises à remplacer, et on recolle par requête avec le titre et la
 * description de la page demandée. Le coût est une concaténation de chaînes ;
 * l'application côté client ne change pas d'un octet.
 *
 * Ce que ça ne fait pas. /Liste?slug=likoud reçoit l'aperçu générique des fiches
 * de liste, pas « Likoud » : le nom du parti vit en base, et aller le chercher
 * transformerait ceci en vrai rendu serveur. À faire le jour où l'on partagera
 * des fiches de liste plutôt que des projections.
 */
import fs from 'node:fs';
import path from 'node:path';
import { metaPour, SUFFIXE } from '../../client/src/lib/titres.js';

// L'image d'aperçu. Format imposé par les réseaux : 1200x630. Générée depuis
// knesset-hero.jpg (voile bleu institutionnel + liseré tricolore).
const IMAGE = '/images/og-predicite.jpg';
const IMAGE_ALT = 'Le bâtiment de la Knesset à Jérusalem, sous un voile bleu aux couleurs de PrédiCité.';

/** Échappe ce qui casserait un attribut HTML. Les descriptions sont du texte
 *  français avec apostrophes et guillemets : sans ceci, la première apostrophe
 *  droite refermerait l'attribut. */
function attr(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Le nom de page correspondant à un chemin d'URL.
 * Les routes du client sont /<NomDePage> exactement (voir pages.config.js),
 * la racine étant Home.
 */
export function pagePour(pathname) {
  const seg = String(pathname || '/').split('/').filter(Boolean)[0];
  if (!seg) return 'Home';
  // /login est la seule route en minuscules (voir App.jsx).
  if (seg.toLowerCase() === 'login') return 'Login';
  return seg;
}

/**
 * Le chemin canonique d'une page — l'URL unique sous laquelle elle doit être
 * connue.
 *
 * Home est la seule dont le chemin n'est pas son nom. Elle répond à DEUX URL
 * (« / » parce qu'elle est `mainPage`, et « /Home » parce qu'elle est aussi une
 * entrée de `PAGES` — voir pages.config.js), et un visiteur qui clique dans la
 * navigation atterrit sur l'une ou l'autre selon le lien. Sans cette
 * normalisation, chacune se déclare canonique de son côté : un moteur voit deux
 * pages au contenu identique et répartit le crédit entre les deux, au lieu de
 * tout donner à l'accueil.
 */
export function cheminCanonique(nomDePage) {
  return nomDePage === 'Home' ? '/' : `/${nomDePage}`;
}

/**
 * Titre et description d'une fiche de liste, à partir de la ligne en base.
 *
 * Volontairement fabriqués à partir de champs FACTUELS (nom, dirigeant, sièges
 * sortants) plutôt que d'un texte libre : un aperçu de partage est l'endroit où
 * l'on est le plus tenté d'embellir, et c'est celui qu'on ne peut plus corriger
 * une fois le lien envoyé. `histoire` n'est pas repris — c'est un paragraphe
 * rédigé, les robots le tronqueraient en plein milieu.
 *
 * @param {{name_fr:string, leader_name?:string, current_knesset_seats?:number|null,
 *          founded_or_merged_note?:string}} liste
 */
export function metaListe(liste) {
  if (!liste?.name_fr) return null;
  const dirigeant = liste.leader_name ? `Dirigée par ${liste.leader_name}. ` : '';
  const sortants = liste.current_knesset_seats != null
    ? `${liste.current_knesset_seats} sièges sortants à la 25ᵉ Knesset.`
    : 'Liste nouvelle, sans sièges sortants.';
  return {
    titre: `${liste.name_fr} — Knesset 2026 | ${SUFFIXE}`,
    description: `${dirigeant}${sortants} Sa projection en sièges, son histoire et sa place dans l'arithmétique de coalition.`,
    // Le slug fait partie de l'identité de l'URL, et il vivait hors du canonical.
    // Le serveur ne passait que `req.path` : les treize fiches annonçaient donc
    // toutes « /Liste » comme URL canonique, c'est-à-dire treize pages se
    // déclarant être la même. Un moteur qui lit ça n'en garde qu'une, et le
    // sitemap qui les énumère ne sert plus à rien.
    chemin: liste.slug ? `/Liste?slug=${encodeURIComponent(liste.slug)}` : null,
  };
}

function balises({ titre, description, url }) {
  return [
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="PrédiCité" />`,
    `<meta property="og:locale" content="fr_FR" />`,
    `<meta property="og:title" content="${attr(titre)}" />`,
    `<meta property="og:description" content="${attr(description)}" />`,
    `<meta property="og:url" content="${attr(url)}" />`,
    `<meta property="og:image" content="${attr(new URL(IMAGE, url).href)}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="${attr(IMAGE_ALT)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${attr(titre)}" />`,
    `<meta name="twitter:description" content="${attr(description)}" />`,
    `<meta name="twitter:image" content="${attr(new URL(IMAGE, url).href)}" />`,
    `<link rel="canonical" href="${attr(url)}" />`,
  ].join('\n    ');
}

/**
 * Prépare l'injecteur à partir d'un dossier de build.
 * Lit index.html UNE fois : en production le fichier ne change plus, et le
 * relire à chaque requête serait un accès disque par page vue.
 *
 * @returns {(pathname: string, origine: string) => string}
 */
export function creerInjecteurMeta(clientDist) {
  const brut = fs.readFileSync(path.join(clientDist, 'index.html'), 'utf8');

  // Les deux balises que le gabarit contient déjà et qu'il faut remplacer plutôt
  // que doubler : un <head> avec deux <title> laisse le robot choisir, et il ne
  // choisit pas toujours le nôtre.
  if (!/<title>[\s\S]*?<\/title>/.test(brut)) {
    throw new Error("meta-html : pas de <title> dans index.html — gabarit inattendu, l'injection serait silencieusement inopérante.");
  }

  /**
   * @param {string} pathname
   * @param {string} origine
   * @param {{titre?:string, description?:string, chemin?:string}|null} surcharge
   *   Métadonnées propres à UNE ressource, quand le chemin seul ne suffit pas :
   *   /Liste?slug=likoud doit annoncer « Likoud », pas « Fiche de liste ». Le
   *   nom du parti vit en base, et ce module n'y touche pas — c'est l'appelant
   *   qui va le chercher et le passe ici. Cette frontière est ce qui permet aux
   *   tests de tourner sans base, et à l'injection de survivre à une base
   *   injoignable : sans surcharge, on retombe sur l'aperçu générique.
   *   `chemin` porte l'URL canonique quand elle ne se déduit pas du nom de page.
   */
  return function htmlPour(pathname, origine, surcharge = null) {
    const page = pagePour(pathname);
    // L'URL canonique se DÉDUIT du nom de page ; elle ne recopie pas le chemin
    // demandé. C'est ce qui neutralise d'un coup les variantes d'une même page :
    // « /Home » qui doit se dire « / », et — le jour où on marquera les liens
    // partagés — les « ?via=… » qui feraient croire à autant de pages
    // différentes qu'il y a eu de partages.
    const url = new URL(surcharge?.chemin || cheminCanonique(page), origine).href;
    const base = metaPour(page);
    const titre = surcharge?.titre || base.titre;
    const description = surcharge?.description || base.description;

    return brut
      .replace(/<title>[\s\S]*?<\/title>/, `<title>${attr(titre)}</title>`)
      .replace(
        /<meta\s+name="description"[^>]*\/?>/i,
        `<meta name="description" content="${attr(description)}" />`,
      )
      .replace('</head>', `  ${balises({ titre, description, url })}\n  </head>`);
  };
}
