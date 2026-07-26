// Agrège automatiquement de vraies actualités (Google News RSS, gratuit,
// sans clé API) sur la campagne Knesset 2026 — pas de curation manuelle,
// pas de contenu généré : uniquement des titres et liens réels vers les
// médias d'origine. Résultat mis en cache en mémoire quelques minutes pour
// ne pas re-solliciter Google à chaque chargement de page.
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const router = express.Router();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

// Fusionne les brèves curatives (en tête, puis triées avec le flux par date).
function withCurated(rssItems) {
  const curated = loadCurated();
  return [...curated, ...rssItems]
    .sort((a, b) => new Date(b.pubDate || 0) - new Date(a.pubDate || 0));
}

// Uniquement des requêtes francophones — pas de résultats en anglais/hébreu.
const QUERIES = [
  { q: 'Knesset 2026 élections', hl: 'fr', gl: 'IL', ceid: 'IL:fr' },
  { q: 'Israël Knesset campagne électorale', hl: 'fr', gl: 'FR', ceid: 'FR:fr' },
];

const CACHE_TTL_MS = 20 * 60 * 1000;
let cache = { at: 0, items: [] };

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
    return res.json({ items: withCurated(cache.items), cached: true });
  }
  try {
    const results = await Promise.all(QUERIES.map(fetchQuery));
    const seen = new Set();
    const merged = results.flat().filter(it => {
      const key = it.title.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).sort((a, b) => new Date(b.pubDate || 0) - new Date(a.pubDate || 0)).slice(0, 24);

    cache = { at: now, items: merged };
    res.json({ items: withCurated(merged), cached: false });
  } catch (e) {
    if (cache.items.length > 0) return res.json({ items: withCurated(cache.items), cached: true, stale: true });
    // Même si le flux automatique échoue, on sert au moins les brèves curatives.
    const curated = withCurated([]);
    if (curated.length > 0) return res.json({ items: curated, cached: false, rssDown: true });
    res.status(502).json({ error: "Impossible de récupérer l'actualité pour le moment.", detail: e.message });
  }
});

export default router;
