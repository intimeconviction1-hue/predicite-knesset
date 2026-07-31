import { filterEntity, listEntity, createEntity } from '../db/index.js';
import { invokeLLMWithWebSearch } from './llm.js';

// Médias et instituts reconnus. On accepte un sondage si SON INSTITUT **OU** SON
// MÉDIA correspond à l'un d'eux. Avant, seul `poll.institute` était testé : un
// sondage de Channel 14 réalisé par l'institut « NEXT DATA » était rejeté à tort
// (« Source non autorisée »), alors que Channel 14 est un média parfaitement
// connu. On sépare donc explicitement médias et instituts, et on teste les deux.
const KNOWN_MEDIA = [
  'Channel 12', 'Channel 13', 'Channel 14', 'Now 14', 'Arutz 14',
  'Kan 11', 'Kan 12', 'Kan', 'N12', 'Mako', 'Reshet 13', 'Reshet',
  'i24NEWS', 'i24News', 'Ynet', 'Yediot', 'Yediot Aharonot', 'Walla',
  'Maariv', 'Israel Hayom', 'Israël Hayom', 'Haaretz', "Ha'aretz",
  'Times of Israël', 'Times of Israel', 'Jerusalem Post', 'Globes',
  'Zman Israel', 'Zman Yisrael', 'FokusIsrael', 'Srugim', 'Kikar HaShabat',
];
const KNOWN_POLLSTERS = [
  'Midgam', 'Direct Polls', 'Kantar', 'Panels Politics', 'Lazar', 'Menachem Lazar',
  'Geocartography', 'Panel4All', 'Rafi Smith', 'Smith', 'NEXT DATA', 'Next Data',
  'Shlomo Filber', 'Filber', 'Maagar Mochot', 'Statnet', 'Agam', 'iPanel',
];
const KNOWN_SOURCES = [...KNOWN_MEDIA, ...KNOWN_POLLSTERS];

// L'hémicycle fait 120 sièges. Un vrai sondage sièges les répartit tous.
const CHAMBER = 120;

// Normalisation tolérante (minuscule + sans accents) pour comparer noms d'instituts,
// de médias et de listes malgré les variations de graphie.
export function norm(s) {
  return (s || '').toString().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
}

export function sourceKnown(poll) {
  const champs = [poll.institute, poll.publisher_media].map(norm).filter(Boolean);
  if (champs.length === 0) return false;
  return KNOWN_SOURCES.some(src => {
    const n = norm(src);
    return champs.some(f => f.includes(n) || n.includes(f));
  });
}

// Retrouve la liste de notre base qui correspond au nom renvoyé par le modèle.
// Ordre : égalité exacte du nom_fr, puis slug, puis inclusion, puis nom du chef.
export function matchListe(listes, listeName) {
  const cible = norm(listeName);
  if (!cible) return null;
  const slugified = cible.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return (
    listes.find(l => norm(l.name_fr) === cible) ||
    listes.find(l => norm(l.slug) === slugified) ||
    listes.find(l => { const n = norm(l.name_fr); return n && (n.includes(cible) || cible.includes(n)); }) ||
    listes.find(l => { const n = norm(l.leader_name); return n && (n.includes(cible) || cible.includes(n)); }) ||
    null
  );
}

function buildChecksum(institute, date, seatsByListe) {
  const key = `${institute}|${date}|${JSON.stringify((seatsByListe || []).map(s => s.liste_name + s.seats))}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = ((hash << 5) - hash) + key.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
}

export async function runSondagesSiegesCollector() {
  // `seen` = surveillance : la trace de CHAQUE sondage vu par le modèle et de ce
  // qu'on en a fait. Rien ne disparaît en silence — les ratés y sont visibles.
  const results = { created: 0, skipped: 0, rejected: 0, surveilled: 0, errors: [], unmatched_listes: [], seen: [], missed_fresh: [] };
  const todayFR = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jerusalem' });

  const existingListes = await filterEntity('Liste', { is_active: true });
  const listeNames = existingListes.map(l => l.name_fr);

  const existingPolls = await listEntity('SondageSieges', { sort: '-poll_date', limit: 200 });
  const latestDate = existingPolls[0]?.poll_date || null;

  const prompt = `Tu es un assistant de veille électorale. Nous sommes le ${todayFR}.

Objectif : NE RATER AUCUN sondage sièges réel publié récemment sur les élections législatives israéliennes (Knesset) du 27 octobre 2026. Sois EXHAUSTIF.

MÉTHODE DE RECHERCHE (couvre un maximum de sources) :
- Passe en revue les grands médias israéliens : ${KNOWN_MEDIA.join(', ')}.
- Et les instituts de sondage : ${KNOWN_POLLSTERS.join(', ')}.
- Cherche AUSSI en hébreu (סקר מנדטים, סקר בחירות) et en anglais, pas seulement en français — beaucoup de sondages ne sortent d'abord qu'en hébreu.
- Pour CHAQUE média ou institut, cherche son DERNIER sondage sièges.${latestDate ? `\n- Le sondage le plus récent déjà dans notre base date du ${latestDate}. Rapporte en priorité tout sondage publié à cette date ou APRÈS, sans oublier ceux légèrement antérieurs qui manqueraient.` : ''}

RÈGLES ABSOLUES :
1. Ne génère JAMAIS de données inventées, estimées ou extrapolées. Uniquement des sondages RÉELLEMENT publiés.
2. Renseigne \`publisher_media\` (le média qui publie, ex. "Channel 14") ET \`institute\` (l'institut qui réalise, ex. "NEXT DATA") dès que tu les connais — les deux peuvent différer.
3. \`source_url\` doit être une URL réelle. Privilégie l'article d'origine ; s'il est inaccessible, une URL d'agrégateur fiable (Knesset Jeremy, Wikipédia "Opinion polling for the 2026 Israeli legislative election") est acceptable.
4. Les sièges doivent être EXACTEMENT ceux publiés, sans arrondi. Donne la répartition COMPLÈTE (le total doit approcher 120).
5. Pour les noms de listes, utilise ceux de notre base (traduis vers le plus proche si graphie différente) : ${listeNames.join(', ') || '(base vide)'}.
6. Si tu n'as connaissance d'AUCUN sondage réel récent, renvoie une liste vide.`;

  const jsonSchemaHint = `{ "polls": [ { "institute": "", "publisher_media": "", "poll_date": "YYYY-MM-DD", "source_url": "", "source_language": "fr", "sample_size": 0, "margin_error_pct": 0, "seats_by_liste": [ { "liste_name": "", "seats": 0 } ] } ] }`;

  const llmResult = await invokeLLMWithWebSearch({ prompt, jsonSchemaHint, maxTokens: 16000 });
  const polls = llmResult?.polls || [];

  if (polls.length === 0) {
    return { success: true, message: 'Aucun sondage réel identifié pour le moment.', results };
  }

  for (const poll of polls) {
    // Trace de surveillance pour CE sondage (complétée au fil des contrôles).
    const trace = {
      institute: poll.institute || null,
      publisher_media: poll.publisher_media || null,
      poll_date: poll.poll_date || null,
      source_url: poll.source_url || null,
      disposition: null,
      reason: null,
      mapped_seats: 0,
      declared_seats: (poll.seats_by_liste || []).reduce((a, s) => a + (Number(s.seats) || 0), 0),
      unmatched: [],
      newer_than_latest: !!(poll.poll_date && latestDate && poll.poll_date > latestDate),
    };
    results.seen.push(trace);

    try {
      if (!sourceKnown(poll)) {
        trace.disposition = 'rejected_source';
        trace.reason = `Ni institut ni média reconnu (institut="${poll.institute || '?'}", média="${poll.publisher_media || '?'}")`;
        results.rejected++; results.errors.push(trace.reason); continue;
      }
      if (!poll.institute || !poll.poll_date || !poll.source_url || !poll.seats_by_liste?.length) {
        trace.disposition = 'rejected_incomplete';
        trace.reason = `Sondage incomplet (${poll.institute || '?'})`;
        results.rejected++; results.errors.push(trace.reason); continue;
      }
      if (!/^https?:\/\//.test(poll.source_url)) {
        trace.disposition = 'rejected_url';
        trace.reason = `URL invalide pour ${poll.institute}`;
        results.rejected++; results.errors.push(trace.reason); continue;
      }

      const seatsResolved = [];
      for (const s of poll.seats_by_liste) {
        const match = matchListe(existingListes, s.liste_name);
        if (match) seatsResolved.push({ liste_id: match.id, seats: Number(s.seats) || 0 });
        else { results.unmatched_listes.push(s.liste_name); trace.unmatched.push(s.liste_name); }
      }
      const sum = seatsResolved.reduce((a, s) => a + s.seats, 0);
      trace.mapped_seats = sum;

      if (seatsResolved.length === 0) {
        trace.disposition = 'rejected_no_liste';
        trace.reason = `Aucune liste reconnue (${poll.institute}, ${poll.poll_date})`;
        results.rejected++; results.errors.push(trace.reason); continue;
      }

      // Garde d'intégrité : on n'ingère un sondage OFFICIEL que s'il représente
      // fidèlement notre modèle (≈120 sièges, peu de perte au mapping). Un sondage
      // au découpage de partis différent du nôtre (ex. Bennett en liste séparée
      // alors qu'on n'a qu'« Ensemble (Bennett-Lapid) ») est SURVEILLÉ mais non
      // ingéré : il reste visible (brèves), sans fausser l'hémicycle ni dénouer un
      // marché à tort. Il apparaît ici comme « vu, non ingéré » pour décision humaine.
      const proche120 = sum >= 116 && sum <= 124;
      const perte = trace.declared_seats > 0 ? trace.declared_seats - sum : 0;
      if (!proche120 || perte > 4) {
        trace.disposition = 'not_ingested_model';
        trace.reason = `Modèle de partis différent : ${sum}/${CHAMBER} sièges mappés` +
          (trace.unmatched.length ? `, listes non reconnues : ${trace.unmatched.join(', ')}` : '');
        results.surveilled++;
        if (trace.newer_than_latest) results.missed_fresh.push(trace);
        continue;
      }

      const checksum = buildChecksum(poll.institute, poll.poll_date, poll.seats_by_liste);
      if (existingPolls.some(p => p.checksum === checksum)) {
        trace.disposition = 'duplicate';
        results.skipped++; continue;
      }

      await createEntity('SondageSieges', {
        institute: poll.institute,
        publisher_media: poll.publisher_media || poll.institute,
        poll_date: poll.poll_date,
        sample_size: poll.sample_size || null,
        margin_error_pct: poll.margin_error_pct || null,
        source_url: poll.source_url,
        source_language: poll.source_language === 'he' ? 'he' : 'fr',
        seats_by_liste: seatsResolved,
        checksum,
      });
      trace.disposition = 'created';
      results.created++;
    } catch (e) {
      trace.disposition = 'error';
      trace.reason = e.message;
      results.errors.push(`Poll ${poll.institute}: ${e.message}`);
    }
  }

  return { success: true, polls_found: polls.length, results };
}
