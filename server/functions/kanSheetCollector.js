// Collecteur MAÎTRE des sondages sièges — source primaire fiable.
//
// Kan (radiodiffuseur public israélien) maintient un Google Sheet PUBLIC qui
// agrège TOUS les sondages sièges de la campagne 2026, un onglet par média.
// Contrairement au web_search du LLM (que Cloudflare bloque sur kan.org.il /
// c14…), ce sheet se récupère directement en CSV, sans clé, sans deviner.
//
// Format d'un onglet : ligne 1 = en-tête (colonnes = DATES de sondage), lignes
// suivantes = partis (hébreu) avec le nb de sièges par date. On transpose :
// chaque colonne-date devient un sondage { média, date, sièges par liste }.
import { filterEntity, listEntity, createEntity } from '../db/index.js';

const SHEET_ID = '1sZZGda2PepdOHBWTglePJ5Lzt-ztkEonMgAK8dId_qM';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36';
const CHAMBER = 120;

// Un onglet par média (gid extraits du bundle du SPA skarim.kan.org.il).
const SOURCES = [
  { gid: '0',          media: 'Kan 11',       source_url: 'https://www.kan.org.il/lobby/skarim/' },
  { gid: '108451331',  media: 'Channel 12',   source_url: 'https://www.mako.co.il/' },
  { gid: '966252001',  media: 'Channel 13',   source_url: 'https://13tv.co.il/' },
  { gid: '372245839',  media: 'Channel 14',   source_url: 'https://www.c14.co.il/' },
  { gid: '2009534443', media: 'i24NEWS',      source_url: 'https://www.i24news.tv/' },
  { gid: '499562452',  media: 'Israel Hayom', source_url: 'https://www.israelhayom.co.il/' },
  { gid: '1644291431', media: 'Maariv',       source_url: 'https://www.maariv.co.il/' },
  { gid: '854896654',  media: 'Zman Israel',  source_url: 'https://www.zman.co.il/' },
];

// Normalisation hébreu : retire niqqud/te'amim, marques RTL/LTR, ponctuation et
// espaces multiples — pour un matching robuste malgré les variantes de graphie.
function normHe(s) {
  return (s || '')
    .replace(/[֑-ׇ]/g, '')
    .replace(/[‎‏‪-‮]/g, '')
    .replace(/[!"'.]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Matching par SOUS-CHAÎNE distinctive (pas d'égalité exacte, fragile) : ex.
// « איזנקוט » (Eisenkot) pour Yashar — surtout PAS « ישר », qui collisionnerait
// avec « ישראל » (Yisrael Beiteinu). Premier match l'emporte, ordre important.
// Exporté pour que tests/collecteur-slugs.test.mjs vérifie que chaque slug
// correspond à une liste du seed — la garde qui manquait quand 'yachad-bennett'
// visait une liste présente en base mais dans aucun seed.
export const MAPPED_RULES = [
  [/הליכוד/, 'likoud'],
  [/איזנקוט/, 'yashar-gadi-eisenkot'],
  // « ביחד » (Beyachad / Ensemble, mesuré depuis le 27.4.26) et « בנט 2026 »
  // (la liste de Bennett avant la fusion) désignent la MÊME liste ; leurs colonnes
  // ne se chevauchent jamais, le Math.max plus bas ne double donc rien.
  //
  // Pointait vers 'yachad-bennett' jusqu'au 2026-08-03 : un slug hérité de Base44,
  // absent de tout seed, qui existait bel et bien en base — donc rien n'échouait,
  // et 146 des 156 sondages ont atterri sur cette liste fantôme pendant que la
  // vraie ('ensemble-bennett-lapid', alimentée par le seed curé) en recevait 10.
  //
  // Le motif était « בנט » tout court : il matchait AUSSI la ligne « בנט » de la
  // section « cote de bon Premier ministre », dont la valeur du 2.8.26 est « 31% ».
  // Seul le filtre endsWith('%') empêchait Math.max d'attribuer 31 sièges à
  // Ensemble. On exige donc « בנט 2026 », qui ne désigne que la liste. Si Kan
  // renommait un jour la ligne en « בנט » seul, le sondage serait REJETÉ par la
  // garde de perte (> 4 sièges non reconnus) — un échec bruyant, pas un chiffre faux.
  [/ביחד|בנט 2026/, 'ensemble-bennett-lapid'],
  [/הדמוקרטים/, 'les-democrates'],
  [/עוצמה/, 'otzma-yehudit'],
  [/התורה/, 'judaisme-unifie-de-la-torah'],
  [/ביתנו/, 'yisrael-beytenou'],
  [/חדש|תעל/, 'hadash-ta-al-liste-commune'],
    // « המשותפת » (la Liste commune) est la CONFIGURATION UNIE des
    // partis arabes, testée par les instituts en alternative à Hadash-Ta'al.
    // Mesuré le 2026-08-02 sur les 152 colonnes du sheet : les deux libellés
    // n'apparaissent JAMAIS ensemble (0 co-occurrence, 12 fois seule) — les mapper
    // sur la même liste ne double donc aucun siège. Et si Kan changeait de modèle,
    // la garde d'intégrité le verrait : le total dépasserait 124 et le sondage
    // serait rejeté plutôt qu'ingéré faux.
    [/המשותפת/, 'hadash-ta-al-liste-commune'],
    // Yesh Atid, mesuré séparément de nov. 2025 à avr. 2026 (4 à 10 sièges) avant
    // sa fusion dans « Ensemble ». Sans cette règle ces sondages plafonnaient à
    // ~111/120 et étaient TOUS rejetés : 26 sondages réels perdus. Avec elle, les
    // totaux retombent exactement sur 120 — la preuve que la correspondance est juste.
    [/עתיד/, 'yesh-atid'],
  [/רעם/, 'ra-am'],
  [/הדתית/, 'sionisme-religieux'],
  [/טרופר|הנדל/, 'les-reservistes-hendel-tropper'],
  [/כחול/, 'unite-nationale'],
  [/^שס$/, 'shas'],
];
// Vrais partis pas (encore) dans notre modèle : comptés dans le total déclaré
// (garde d'intégrité) mais non ingérés. Tout le reste (blocs, % de la fonction
// de PM, lien) ne matche aucune règle → ignoré.
  // Ne reste ici que Balad, absent de notre modèle et présent dans 2 colonnes
  // sur 152 : le mapper ne débloquerait aucun sondage (mesuré).
  //
  // Recontrôlé le 2026-08-03, détail utile : sa LIGNE existe dans les 8 onglets,
  // mais la valeur y vaut 0 partout sauf chez Channel 13 — 20.1.26 (4 sièges) et
  // 10.3.26 (16). Le 0 est écarté en amont par `seats <= 0`, d'où les 2 colonnes.
  // Ces 16 sièges, invraisemblables pour Balad, sont justement ce qui fait tomber
  // le sondage du 10.3.26 à 104/120 et le fait rejeter : le comportement voulu.
  // Le vrai déclencheur pour l'ajouter au modèle est le dépôt des listes du
  // 9 septembre, si la configuration Hadash-Ta'al-Balad se confirme.
  const UNMAPPED_RULES = [/^בלד$/];

function matchParty(label) {
  const n = normHe(label);
  if (!n) return { kind: 'none' };
  for (const [re, slug] of MAPPED_RULES) if (re.test(n)) return { kind: 'mapped', slug };
  for (const re of UNMAPPED_RULES) if (re.test(n)) return { kind: 'unmapped', name: n };
  return { kind: 'none' };
}

function parseCSV(text) {
  return text.split(/\r?\n/).filter(l => l.length).map(line => {
    const out = []; let cur = ''; let q = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (q) { if (c === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
      else if (c === '"') q = true;
      else if (c === ',') { out.push(cur); cur = ''; }
      else cur += c;
    }
    out.push(cur); return out;
  });
}

// "26.7.26" → "2026-07-26" (format israélien JJ.M.AA).
function parseDate(s) {
  const m = (s || '').trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{2,4})$/);
  if (!m) return null;
  const d = m[1], mo = m[2]; let y = m[3];
  if (y.length === 2) y = '20' + y;
  return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

function buildChecksum(media, date, entries) {
  const key = `KAN|${media}|${date}|${entries.map(e => e.liste_id + ':' + e.seats).sort().join(',')}`;
  let h = 0;
  for (let i = 0; i < key.length; i++) { h = ((h << 5) - h) + key.charCodeAt(i); h |= 0; }
  return 'kan' + Math.abs(h).toString(16);
}

export async function runKanSheetCollector({ dryRun = false, onlyNewer = false } = {}) {
  const results = { source: 'kan-sheet', dryRun, created: 0, skipped: 0, surveilled: 0, errors: [], seen: [] };

  const listes = await filterEntity('Liste', {});
  const slugToId = Object.fromEntries(listes.map(l => [l.slug, l.id]));
  const existing = await listEntity('SondageSieges', { sort: '-poll_date', limit: 500 });
  const seenKeys = new Set(existing.map(p => `${(p.publisher_media || '').toLowerCase()}|${p.poll_date}`));
  const existingChecksums = new Set(existing.map(p => p.checksum));
  const latestDate = existing[0]?.poll_date || null;

  for (const src of SOURCES) {
    let rows;
    try {
      const res = await fetch(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=${src.gid}`, {
        headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(20000),
      });
      if (!res.ok) { results.errors.push(`${src.media}: HTTP ${res.status}`); continue; }
      rows = parseCSV(await res.text());
    } catch (e) { results.errors.push(`${src.media}: ${e.message}`); continue; }
    if (rows.length < 2) continue;

    const header = rows[0];
    const dateCols = header.map((h, idx) => ({ idx, date: parseDate(h) })).filter(c => c.date);

    for (const dc of dateCols) {
      if (onlyNewer && latestDate && dc.date <= latestDate) continue;  // ne prend que le gap
      const seatsById = {};       // liste_id -> sièges (mappés)
      let declaredTotal = 0;      // sièges de TOUS les partis (mappés + non mappés)
      const unmatched = [];
      for (let r = 1; r < rows.length; r++) {
        const m = matchParty(rows[r][0] || '');
        if (m.kind === 'none') continue;                     // blocs / % PM / lien : ignorés
        const raw = (rows[r][dc.idx] || '').trim();
        if (!raw || raw.endsWith('%')) continue;
        const seats = parseInt(raw, 10);
        if (!Number.isFinite(seats) || seats <= 0) continue;
        declaredTotal += seats;
        if (m.kind === 'unmapped') { unmatched.push(`${m.name}:${seats}`); continue; }
        const id = slugToId[m.slug];
        if (!id) { unmatched.push(`${m.slug} absent`); continue; }
        seatsById[id] = Math.max(seatsById[id] || 0, seats);  // ביחד/בנט : même liste, pas de double compte
      }

      const entries = Object.entries(seatsById).map(([liste_id, seats]) => ({ liste_id, seats }));
      if (entries.length === 0) continue;                     // colonne sans données sièges
      const sum = entries.reduce((a, e) => a + e.seats, 0);

      const trace = { media: src.media, poll_date: dc.date, mapped_seats: sum, declared_seats: declaredTotal, unmatched, disposition: null, newer_than_latest: !!(latestDate && dc.date > latestDate) };

      // Déjà en base ? (par média+date, robuste au cross-collecteur)
      if (seenKeys.has(`${src.media.toLowerCase()}|${dc.date}`)) { trace.disposition = 'duplicate'; results.skipped++; results.seen.push(trace); continue; }

      // Garde d'intégrité : ~120 sièges, peu de perte au mapping.
      const proche120 = sum >= 116 && sum <= 124;
      const perte = declaredTotal - sum;
      if (!proche120 || perte > 4) {
        trace.disposition = 'not_ingested_model';
        trace.reason = `${sum}/${CHAMBER} mappés` + (unmatched.length ? `, non reconnus : ${unmatched.join(', ')}` : '');
        results.surveilled++; results.seen.push(trace); continue;
      }

      const checksum = buildChecksum(src.media, dc.date, entries);
      if (existingChecksums.has(checksum)) { trace.disposition = 'duplicate'; results.skipped++; results.seen.push(trace); continue; }

      if (!dryRun) {
        await createEntity('SondageSieges', {
          institute: src.media, publisher_media: src.media, poll_date: dc.date,
          sample_size: null, margin_error_pct: null,
          source_url: src.source_url, source_language: 'he',
          seats_by_liste: entries, checksum,
        });
      }
      trace.disposition = dryRun ? 'would_create' : 'created';
      results.created++;
      results.seen.push(trace);
      // évite un doublon intra-run si la même date réapparaît
      seenKeys.add(`${src.media.toLowerCase()}|${dc.date}`);
      existingChecksums.add(checksum);
    }
  }
  return results;
}

// CLI : node functions/kanSheetCollector.js [--write]
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('kanSheetCollector.js')) {
  const mod = await import('dotenv/config').catch(() => {});
  const dbMod = await import('../db/index.js');
  const write = process.argv.includes('--write');
  const all = process.argv.includes('--all');   // --all = tout l'historique ; sinon, seulement + récent que la base
  await dbMod.initDb();
  const r = await runKanSheetCollector({ dryRun: !write, onlyNewer: !all });
  console.log(`\n=== Kan sheet collector (${write ? 'ÉCRITURE' : 'DRY-RUN'}) ===`);
  console.log(`créés=${r.created} doublons=${r.skipped} surveillés=${r.surveilled} erreurs=${r.errors.length}`);
  const fresh = r.seen.filter(s => s.newer_than_latest);
  console.log('\nSondages plus récents que la base :');
  for (const s of fresh) console.log(`  [${s.disposition}] ${s.media} ${s.poll_date} — ${s.mapped_seats}/120${s.reason ? ' · ' + s.reason : ''}`);
  if (r.errors.length) console.log('\nErreurs :', r.errors.join(' | '));
  await dbMod.pool.end();
}
