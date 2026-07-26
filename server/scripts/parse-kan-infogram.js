// Pipeline « source israélienne → sondage » : lit une infographie Infogram
// (Kan publie ses sondages sièges via Infogram, dont les données sont dans un
// JSON lisible), en extrait les sièges par parti, les mappe vers les slugs de
// nos listes, et PROPOSE l'entrée de sondage à ajouter à
// docs/KNESSET_SEED_SONDAGES.json — revue humaine avant tout import en prod.
//
// Pourquoi côté serveur : les sites israéliens (kan.org.il…) bloquent les
// fetch automatisés (403), mais infogram.com ne les bloque pas, et le backend
// n'a pas les restrictions d'un outil tiers.
//
// Usage :
//   node scripts/parse-kan-infogram.js <url-ou-id-infogram> [--date=YYYY-MM-DD] [--media="Kan 11"] [--source=<url-article>]
// Exemple :
//   node scripts/parse-kan-infogram.js https://infogram.com/1p9g76gjy2p2w2s7kvvq67ylwla3vvjvyvv --media="Kan 11" --source=https://www.kan.org.il/content/kan-news/politic/1081690/

// Table de correspondance nom hébreu → slug de liste (dérivé de name_fr par le
// seed). Les variantes de graphie (guillemets, « ! », leaders) sont normalisées
// avant recherche. À COMPLÉTER quand un nouveau parti apparaît.
const HE_TO_SLUG = [
  { match: ['הליכוד'], slug: 'likoud' },
  { match: ['איזנקוט'], slug: 'yashar-gadi-eisenkot' },        // « ישר! עם איזנקוט » — « ישר » seul collisionne avec « ישראל »
  { match: ['ביחד'], slug: 'ensemble-bennett-lapid' },
  { match: ['הדמוקרטים'], slug: 'les-democrates' },
  { match: ['עוצמה יהודית'], slug: 'otzma-yehudit' },
  { match: ['ביתנו'], slug: 'yisrael-beytenou' },              // token unique (évite la collision « ישראל »)
  { match: ['שס', 'ש"ס'], slug: 'shas' },
  { match: ['יהדות התורה'], slug: 'judaisme-unifie-de-la-torah' },
  { match: ['חדש', 'תעל', 'חד"ש'], slug: 'hadash-ta-al-liste-commune' },
  { match: ['רעם', 'רע"ם'], slug: 'ra-am' },
  { match: ['הציונות הדתית'], slug: 'sionisme-religieux' },
  { match: ['המילואימניקים', 'הנדל', 'טרופר'], slug: 'les-reservistes-hendel-tropper' },
  { match: ['המחנה הממלכתי'], slug: 'unite-nationale' },        // Unité nationale (Gantz)
];

// Partis connus qu'on ignore volontairement (hors seuil / hors périmètre du site).
const IGNORE = ['כחול לבן', 'בלד', 'בל"ד', 'אחר'];             // Kahol Lavan, Balad, « autre »

function norm(s) {
  return (s || '').replace(/["'!.־‏‎]/g, '').replace(/\s+/g, ' ').trim();
}

function slugForHebrew(nameHe) {
  const n = norm(nameHe);
  if (IGNORE.some(ig => n.includes(norm(ig)))) return { slug: null, ignored: true };
  for (const { match, slug } of HE_TO_SLUG) {
    if (match.some(m => n.includes(norm(m)))) return { slug, ignored: false };
  }
  return { slug: null, ignored: false };
}

function extractInfographicData(html) {
  // window.infographicData={...}; suivi d'un </script>. On coupe au </script>
  // qui suit l'affectation (le JSON ne contient pas de balise script littérale).
  const start = html.indexOf('window.infographicData=');
  if (start === -1) throw new Error("Bloc window.infographicData introuvable — l'URL est-elle bien une infographie Infogram ?");
  const from = start + 'window.infographicData='.length;
  const end = html.indexOf('</script>', from);
  let raw = html.slice(from, end === -1 ? undefined : end).trim();
  if (raw.endsWith(';')) raw = raw.slice(0, -1);
  return JSON.parse(raw);
}

function findChartRows(data) {
  // Les entités réelles sont dans content.content.entities (une map) ; les
  // blocks ne contiennent qu'une liste d'ids. On cherche un CHART dont
  // chartData.data[0] est le tableau de lignes [ [libelle],[valeur] ].
  const entities = data?.elements?.content?.content?.entities || {};
  for (const ent of Object.values(entities)) {
    if (ent.type === 'CHART' && ent.props?.chartData?.data?.[0]) {
      return ent.props.chartData.data[0];
    }
  }
  throw new Error('Aucune donnée de graphique (CHART) trouvée dans l’infographie.');
}

function parseDateFromTitle(title) {
  // Titres du type « … סקר 26.07 » → 2026-07-26 (année déduite : 2026).
  const m = (title || '').match(/(\d{1,2})[.\/](\d{1,2})/);
  if (!m) return null;
  const [, dd, mm] = m;
  return `2026-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
}

function arg(name, def) {
  const p = process.argv.find(a => a.startsWith(`--${name}=`));
  return p ? p.slice(name.length + 3) : def;
}

async function main() {
  const input = process.argv[2];
  if (!input) {
    console.error('Usage : node scripts/parse-kan-infogram.js <url-ou-id-infogram> [--date=…] [--media=…] [--source=…]');
    process.exit(1);
  }
  const url = input.startsWith('http') ? input : `https://infogram.com/${input}`;

  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 PrediciteKnesset/1.0' }, signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`HTTP ${res.status} en récupérant ${url}`);
  const html = await res.text();

  const data = extractInfographicData(html);
  const rows = findChartRows(data);
  const pollDate = arg('date') || parseDateFromTitle(data.title) || null;

  const seats_by_liste = [];
  const unknown = [];
  let ignoredCount = 0;

  for (const row of rows) {
    const nameHe = row?.[0]?.value;
    const seats = parseInt(row?.[1]?.value, 10);
    if (!nameHe || !Number.isFinite(seats)) continue;
    const { slug, ignored } = slugForHebrew(nameHe);
    if (ignored) { ignoredCount++; continue; }
    if (!slug) { unknown.push({ nameHe, seats }); continue; }
    if (seats > 0) seats_by_liste.push({ slug, seats });   // convention seed : hors seuil = absent
  }

  const total = seats_by_liste.reduce((s, r) => s + r.seats, 0);
  const proposal = {
    institute: arg('media', '').includes('Kan') ? 'Kantar' : arg('institute', 'Kantar'),
    publisher_media: arg('media', 'Kan 11'),
    poll_date: pollDate,
    sample_size: null,
    source_url: arg('source', url),
    source_language: 'he',
    seats_by_liste,
  };

  console.log('\n=== SONDAGE PROPOSÉ (à relire avant import) ===');
  console.log(JSON.stringify(proposal, null, 2));
  console.log(`\nTotal sièges attribués : ${total} ${total === 120 ? '✅' : '⚠️ (attendu 120)'}`);
  console.log(`Listes retenues : ${seats_by_liste.length} · ignorées (hors périmètre) : ${ignoredCount}`);
  if (unknown.length) {
    console.log('\n⚠️ PARTIS NON RECONNUS (rien n’est inventé — ajoute un mapping ou une nouvelle liste) :');
    for (const u of unknown) console.log(`   • « ${u.nameHe} » → ${u.seats} sièges`);
  }
  if (!pollDate) console.log('\n⚠️ Date non détectée — passe --date=YYYY-MM-DD.');
  console.log('\nSi tout est correct : colle ce bloc en tête de docs/KNESSET_SEED_SONDAGES.json, puis « npm run seed:sondages ».\n');
}

main().catch(e => { console.error('Erreur :', e.message); process.exit(1); });
