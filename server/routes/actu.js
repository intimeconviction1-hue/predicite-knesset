// Agrège automatiquement de vraies actualités (Google News RSS, gratuit,
// sans clé API) sur la campagne Knesset 2026 — pas de curation manuelle,
// pas de contenu généré : uniquement des titres et liens réels vers les
// médias d'origine. Résultat mis en cache en mémoire quelques minutes pour
// ne pas re-solliciter Google à chaque chargement de page.
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getActuBreves } from '../functions/actuHebrewCollector.js';

const router = express.Router();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 2026-08-02 (demande de Simon : « mets les plus récents en premier ») — les
// places réservées aux articles de sondage ont été retirées. Elles remontaient
// jusqu'à 5 articles « sondage » en tête QUELLE QUE SOIT leur date, ce qui
// faisait passer l'actualité du jour derrière des articles plus anciens. Le flux
// est désormais strictement antéchronologique.

// Résumés PrédiCité (français) de sources israéliennes — traduits/résumés à la
// main quand l'info manque en français. Chargés depuis docs/ACTU_CURATED.json
// et fusionnés au flux automatique, mais TAGGÉS `curated: true` pour être
// affichés distinctement (jamais confondus avec la presse d'origine).
function loadCurated() {
  try {
    const p = path.join(__dirname, '..', '..', 'docs', 'ACTU_CURATED.json');
    const raw = JSON.parse(fs.readFileSync(p, 'utf8'));
    return (raw.items || []).map(it => ({
      title: it.title,
      summary: it.summary || null,
      link: it.source_url,
      source: it.source || null,
      pubDate: it.pub_date || null,
      curated: true,
    }));
  } catch {
    return [];
  }
}

// Fusionne les brèves curatives + les brèves issues de la presse israélienne
// (collecteur hébreu → faits reformulés en français, sources citées), puis trie
// tout le flux par date. Les brèves restent taggées `curated: true` pour être
// affichées distinctement de la presse d'origine.
async function withCurated(rssItems) {
  const curated = loadCurated();
  let breves = [];
  try { breves = await getActuBreves(12); } catch { breves = []; }
  const seen = new Set();
  // Une date illisible ou absente ne doit pas être traitée comme « 1970 » : elle
  // enverrait l'article tout en bas. On la remplace par 0 seulement après avoir
  // vérifié qu'elle est invalide, et le tri reste strictement du plus récent au
  // plus ancien — aucune catégorie d'article n'est remontée artificiellement.
  const quand = (it) => {
    const t = new Date(it.pubDate || 0).getTime();
    return Number.isNaN(t) ? 0 : t;
  };

  return [...breves, ...curated, ...rssItems]
    .filter(it => {
      const k = (it.title || '').toLowerCase().replace(/\s+/g, ' ').trim();
      if (!k || seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .sort((a, b) => quand(b) - quand(a));
}

// Uniquement des requêtes francophones — pas de résultats en anglais/hébreu.
//
// 2026-07-29 : les deux requêtes d'origine (« Knesset 2026 élections » et
// « Israël Knesset campagne électorale ») étaient trop étroites — mesuré, elles
// ne remontaient plus rien après le 19 juillet, d'où une actu qui « datait de
// deux jours ». On élargit avec des requêtes vérifiées comme fraîches (acteurs
// + termes de campagne), dédupliquées ensuite par titre.
const QUERIES = [
  { q: 'Knesset', hl: 'fr', gl: 'FR', ceid: 'FR:fr' },
  { q: 'élections israéliennes', hl: 'fr', gl: 'FR', ceid: 'FR:fr' },
  { q: 'Israël élections législatives', hl: 'fr', gl: 'FR', ceid: 'FR:fr' },
  { q: 'Israël politique', hl: 'fr', gl: 'FR', ceid: 'FR:fr' },
  { q: 'Netanyahou', hl: 'fr', gl: 'FR', ceid: 'FR:fr' },
  { q: 'Eisenkot', hl: 'fr', gl: 'FR', ceid: 'FR:fr' },
  { q: 'Likoud primaires', hl: 'fr', gl: 'FR', ceid: 'FR:fr' },
  { q: 'Bennett Israël', hl: 'fr', gl: 'FR', ceid: 'FR:fr' },
  // Sondages — le contenu clé d'un site de pronostics. Il n'y en avait AUCUNE
  // requête dédiée jusqu'ici (le mot n'était que dans le filtre de pertinence).
  { q: 'sondage Israël', hl: 'fr', gl: 'FR', ceid: 'FR:fr' },
  { q: 'sondage Netanyahou', hl: 'fr', gl: 'FR', ceid: 'FR:fr' },
  // Anciennement gl=IL/ceid=IL:fr : mesuré à 0 résultat (Google News n'a pas
  // d'édition francophone israélienne). Basculé sur l'édition FR, qui répond.
  { q: 'Knesset 2026 élections', hl: 'fr', gl: 'FR', ceid: 'FR:fr' },
];

const CACHE_TTL_MS = 20 * 60 * 1000;
let cache = { at: 0, items: [] };

// Les requêtes larges (« Netanyahou », « Israël politique ») ramènent aussi de la
// géopolitique sans lien avec la campagne (Iran, Gaza, diplomatie…). On ne garde
// que ce qui touche VRAIMENT à l'élection. Filtre volontairement large, avec
// repli : si trop peu d'articles passent, on complète avec les plus récents.
// NB : pas de simples noms de personnes ici — « Netanyahou » seul ramènerait
// toute la diplomatie. Il faut un marqueur ÉLECTORAL (ou un nom de parti).
const CAMPAGNE_RE = new RegExp([
  'knesset', 'élection', 'election', 'électoral', 'electoral', 'scrutin', 'sondage',
  'urnes', 'campagne', 'primaire', 'coalition coalition', 'député', 'depute',
  'majorité parlementaire', 'majorite parlementaire', 'tête de liste', 'tete de liste',
  'candidat', 'parti', 'listes?\\b', 'siège', 'siege', 'électeur', 'electeur',
  'likoud', 'shas', 'yesh atid', 'yisrael beytenu', 'sionisme religieux', 'otzma',
].join('|'), 'i');

function estPertinent(item) {
  return CAMPAGNE_RE.test(`${item.title} ${item.source || ''}`);
}

function decodeEntities(str) {
  return (str || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function parseItems(xml) {
  const items = [];
  const blocks = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
  for (const block of blocks) {
    const title = decodeEntities((block.match(/<title>([\s\S]*?)<\/title>/) || [])[1]);
    const link = decodeEntities((block.match(/<link>([\s\S]*?)<\/link>/) || [])[1]);
    const pubDate = (block.match(/<pubDate>([\s\S]*?)<\/pubDate>/) || [])[1] || null;
    const source = decodeEntities((block.match(/<source[^>]*>([\s\S]*?)<\/source>/) || [])[1]);
    if (title && link) items.push({ title, link, pubDate, source: source || null });
  }
  return items;
}

async function fetchQuery({ q, hl, gl, ceid }) {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=${hl}&gl=${gl}&ceid=${ceid}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'PrediciteKnesset/1.0 (+https://predicite-knesset.onrender.com)' },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) return [];
  return parseItems(await res.text());
}

router.get('/', async (req, res) => {
  const now = Date.now();
  if (now - cache.at < CACHE_TTL_MS && cache.items.length > 0) {
    return res.json({ items: await withCurated(cache.items), cached: true });
  }
  try {
    // allSettled : avec plusieurs requêtes, une seule qui échoue (timeout, 429…)
    // ne doit pas priver le site de TOUT le flux.
    const settled = await Promise.allSettled(QUERIES.map(fetchQuery));
    const results = settled.filter(r => r.status === 'fulfilled').map(r => r.value);
    if (results.length === 0) throw new Error('Toutes les requêtes ont échoué.');

    const seen = new Set();
    const dedup = results.flat().filter(it => {
      // Dédup par titre normalisé : le même article remonte souvent via
      // plusieurs requêtes (Netanyahou / Knesset / élections…).
      const key = it.title.toLowerCase().replace(/\s+/g, ' ').trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).sort((a, b) => new Date(b.pubDate || 0) - new Date(a.pubDate || 0));

    // Priorité aux articles de campagne ; on complète avec le reste (le plus
    // frais d'abord) si la moisson électorale est maigre — jamais de page vide.
    const pertinents = dedup.filter(estPertinent);
    const autres = dedup.filter(it => !estPertinent(it));

    // Le tri final (strictement du plus récent au plus ancien) est fait dans
    // withCurated, une fois les brèves fusionnées au flux RSS.
    const merged = [...pertinents, ...autres].slice(0, 30);

    cache = { at: now, items: merged };
    res.json({ items: await withCurated(merged), cached: false });
  } catch (e) {
    if (cache.items.length > 0) return res.json({ items: await withCurated(cache.items), cached: true, stale: true });
    // Même si le flux automatique échoue, on sert au moins les brèves curatives.
    const curated = await withCurated([]);
    if (curated.length > 0) return res.json({ items: curated, cached: false, rssDown: true });
    res.status(502).json({ error: "Impossible de récupérer l'actualité pour le moment.", detail: e.message });
  }
});

export default router;
