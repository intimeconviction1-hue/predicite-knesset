// Brèves depuis les médias ISRAÉLIENS (hébreu) — l'actu de campagne sort d'abord
// en hébreu, et la presse francophone ne la couvre que partiellement/en retard.
//
// RÈGLE ABSOLUE (produit réel, droit d'auteur + honnêteté) : on ne traduit ni ne
// recopie JAMAIS un article. On extrait des FAITS (qui, quoi, quand, chiffres) et
// on les reformule en une brève courte, en français, TOUJOURS accompagnée du nom
// du média et de l'URL de l'article d'origine — le lien renvoie vers la source,
// jamais vers une copie chez nous. Rien de vérifiable = rien de publié.
import { pool, queryAll, run } from '../db/index.js';
import { randomUUID } from 'node:crypto';
import { invokeLLMWithWebSearch } from './llm.js';

// Médias israéliens de référence (hébreu/anglais) autorisés comme sources.
const MEDIAS = [
  'Kan 11', 'Ynet', 'Maariv', 'Walla', 'Channel 12', 'Channel 13', 'Channel 14',
  'Israel Hayom', 'Haaretz', 'Times of Israel', 'Jerusalem Post', 'Zman Yisrael',
  'Globes', 'Arutz Sheva', 'N12', 'Kikar HaShabbat',
];

const MAX_PAR_PASSE = 6;

function checksumFor(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h |= 0; }
  return Math.abs(h).toString(16);
}

export async function runActuHebrewCollector() {
  if (!process.env.ANTHROPIC_API_KEY) return { skipped: 'ANTHROPIC_API_KEY manquant' };

  const todayFR = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jerusalem' });

  const prompt = `Tu es un veilleur de presse pour un site francophone qui suit la campagne des élections législatives israéliennes (Knesset) du 27 octobre 2026. Nous sommes le ${todayFR}.

Cherche sur le web les informations RÉCENTES (moins de 4 jours) de la campagne publiées par la presse israélienne, en particulier en HÉBREU : ${MEDIAS.join(', ')}.

Pour chaque information, produis une BRÈVE FACTUELLE EN FRANÇAIS.

RÈGLES ABSOLUES :
1. N'INVENTE RIEN. Aucune information non trouvée dans une source réelle.
2. NE TRADUIS PAS et NE RECOPIE PAS l'article. Extrais les FAITS (qui, quoi, quand, chiffres) et reformule-les avec tes propres mots, en 1 à 2 phrases maximum.
3. Chaque brève DOIT avoir : le nom du média d'origine (source) et l'URL réelle de l'article (source_url). Pas d'URL réelle vérifiable ⇒ tu n'inclus pas la brève.
4. Uniquement des sujets de CAMPAGNE : sondages, listes, primaires, fusions/alliances, défections, candidatures, règles électorales, calendrier. Pas de géopolitique/guerre sans lien direct avec l'élection.
5. Pour un sondage : donne l'institut, le média commanditaire, la date et les sièges annoncés s'ils sont publiés — exactement, sans arrondir.
6. Si tu ne trouves rien de solide, renvoie une liste vide. Mieux vaut zéro brève qu'une brève douteuse.

Maximum ${MAX_PAR_PASSE} brèves, les plus importantes.`;

  const jsonSchemaHint = `{ "breves": [ { "title": "titre court en français", "summary": "1 à 2 phrases de faits, reformulés", "source": "nom du média", "source_url": "https://...", "pub_date": "YYYY-MM-DD" } ] }`;

  const out = await invokeLLMWithWebSearch({ prompt, jsonSchemaHint, maxTokens: 4000 });
  const breves = Array.isArray(out?.breves) ? out.breves : [];
  const results = { found: breves.length, created: 0, skipped: 0, rejected: 0, errors: [] };
  if (breves.length === 0) return { success: true, results };

  const existing = await queryAll('SELECT checksum FROM actu_breves');
  const seen = new Set(existing.map(r => r.checksum));

  for (const b of breves) {
    try {
      if (!b?.title || !b?.summary || !b?.source || !b?.source_url) { results.rejected++; continue; }
      if (!/^https?:\/\//i.test(b.source_url)) { results.rejected++; results.errors.push(`URL invalide (${b.source})`); continue; }
      // Le média doit faire partie des sources autorisées.
      if (!MEDIAS.some(m => b.source.toLowerCase().includes(m.toLowerCase()) || m.toLowerCase().includes(b.source.toLowerCase()))) {
        results.rejected++; results.errors.push(`Source non autorisée : ${b.source}`); continue;
      }
      const checksum = checksumFor(`${b.source}|${b.title}`);
      if (seen.has(checksum)) { results.skipped++; continue; }

      await run(
        `INSERT INTO actu_breves (id, title, summary, source, source_url, pub_date, checksum)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [randomUUID(), b.title.trim(), b.summary.trim(), b.source.trim(), b.source_url.trim(), b.pub_date || null, checksum],
      );
      seen.add(checksum);
      results.created++;
    } catch (e) {
      results.errors.push(`${b?.source || '?'}: ${e.message}`);
    }
  }

  return { success: true, results };
}

// Brèves récentes, pour la route /api/actu (fusionnées au flux RSS).
export async function getActuBreves(limit = 12) {
  try {
    const rows = await queryAll(
      `SELECT title, summary, source, source_url, pub_date, created_at
       FROM actu_breves ORDER BY COALESCE(pub_date, created_at) DESC LIMIT ${Number(limit)}`,
    );
    return rows.map(r => ({
      title: r.title,
      summary: r.summary,
      link: r.source_url,
      source: r.source,
      pubDate: r.pub_date || r.created_at,
      curated: true,     // affiché comme « Résumé PrédiCité » — jamais confondu avec la presse
    }));
  } catch {
    return [];
  }
}

export { pool };
