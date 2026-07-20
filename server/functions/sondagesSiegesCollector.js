import { randomUUID } from 'node:crypto';
import { db, filterEntity, listEntity, createEntity } from '../db/index.js';
import { invokeLLMWithWebSearch } from './llm.js';

const AUTHORIZED_SOURCES = [
  'i24NEWS', 'i24News', 'Times of Israël', 'FokusIsrael',
  'Midgam', 'Direct Polls', 'Kantar', 'Panels Politics', 'Lazar', 'Maariv',
  'Statistics', 'Channel 12', 'Channel 13', 'Channel 14', 'Kan 11', 'Kan 12',
  'Zman Israel', 'Zman Yisrael', 'Walla',
];

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
  const results = { created: 0, skipped: 0, rejected: 0, errors: [], unmatched_listes: [] };
  const todayFR = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jerusalem' });

  const existingListes = filterEntity('Liste', { is_active: true });
  const listeNames = existingListes.map(l => l.name_fr);

  const prompt = `Tu es un assistant de veille électorale. Nous sommes le ${todayFR}.

Tu dois identifier des sondages sièges réels, publiés récemment, concernant les élections législatives israéliennes (Knesset) du 27 octobre 2026.

RÈGLES ABSOLUES :
1. Ne génère JAMAIS de données inventées, estimées ou extrapolées.
2. Inclure UNIQUEMENT des sondages réellement publiés, par un institut ou média de cette liste : ${AUTHORIZED_SOURCES.join(', ')}.
3. La source_url doit être une URL réelle connue.
4. Si tu n'as connaissance d'aucun sondage réel récent, renvoie une liste vide.
5. Les sièges doivent être exactement ceux publiés, sans arrondi.
6. Utilise ces noms de listes tels qu'ils apparaissent dans notre base (traduis vers le plus proche si graphie différente) : ${listeNames.join(', ') || '(base vide)'}.

Pour chaque sondage réel : institute, publisher_media, poll_date (YYYY-MM-DD), source_url, source_language ("fr"/"he"), sample_size, margin_error_pct, seats_by_liste (tableau de { liste_name, seats }).`;

  const jsonSchemaHint = `{ "polls": [ { "institute": "", "publisher_media": "", "poll_date": "YYYY-MM-DD", "source_url": "", "source_language": "fr", "sample_size": 0, "margin_error_pct": 0, "seats_by_liste": [ { "liste_name": "", "seats": 0 } ] } ] }`;

  const llmResult = await invokeLLMWithWebSearch({ prompt, jsonSchemaHint });
  const polls = llmResult?.polls || [];

  if (polls.length === 0) {
    return { success: true, message: 'Aucun sondage réel identifié pour le moment.', results };
  }

  const existingPolls = listEntity('SondageSieges', { sort: '-poll_date', limit: 200 });

  for (const poll of polls) {
    try {
      if (!AUTHORIZED_SOURCES.some(src => poll.institute?.includes(src) || src.includes(poll.institute || ''))) {
        results.rejected++; results.errors.push(`Source non autorisée : ${poll.institute}`); continue;
      }
      if (!poll.institute || !poll.poll_date || !poll.source_url || !poll.seats_by_liste?.length) {
        results.rejected++; results.errors.push(`Sondage incomplet (${poll.institute || '?'})`); continue;
      }
      if (!poll.source_url.startsWith('http')) {
        results.rejected++; results.errors.push(`URL invalide pour ${poll.institute}`); continue;
      }

      const seatsResolved = [];
      for (const s of poll.seats_by_liste) {
        const match = existingListes.find(l =>
          l.name_fr?.toLowerCase() === s.liste_name?.toLowerCase() ||
          l.name_fr?.toLowerCase().includes((s.liste_name || '__nomatch__').toLowerCase())
        );
        if (match) seatsResolved.push({ liste_id: match.id, seats: s.seats });
        else results.unmatched_listes.push(s.liste_name);
      }
      if (seatsResolved.length === 0) {
        results.rejected++; results.errors.push(`Aucune liste reconnue (${poll.institute}, ${poll.poll_date})`); continue;
      }

      const checksum = buildChecksum(poll.institute, poll.poll_date, poll.seats_by_liste);
      if (existingPolls.some(p => p.checksum === checksum)) { results.skipped++; continue; }

      createEntity('SondageSieges', {
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
      results.created++;
    } catch (e) {
      results.errors.push(`Poll ${poll.institute}: ${e.message}`);
    }
  }

  return { success: true, polls_found: polls.length, results };
}
