const THRESHOLD_PCT = 3.25;
const OFFICIAL_SITE_BASE = 'https://votes26.bechirot.gov.il';
const OPEN_DATA_HINT = 'https://data.gov.il/he/dataset/central-election-committee';

async function tryFetchOfficial() {
  try {
    const res = await fetch(`${OFFICIAL_SITE_BASE}/`, {
      headers: { 'User-Agent': 'PrediciteKnesset/1.0', Accept: 'text/html,application/json' },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return { ok: false, reason: `HTTP ${res.status}` };
    const text = await res.text();
    return { ok: true, raw: text, fetched_url: `${OFFICIAL_SITE_BASE}/` };
  } catch (e) {
    return { ok: false, reason: e?.message || 'fetch failed' };
  }
}

/**
 * Port du collecteur Deno d'origine. Même limite honnête : le site officiel
 * de la 26e Knesset n'était pas structuré au moment de l'écriture. Ne jamais
 * remplacer ce commentaire par un parsing inventé — mieux vaut ne rien écrire
 * que d'écrire de faux résultats. Voir docs/HISTORIQUE-PIVOT-BASE44.md.
 */
export async function runResultatsKnessetCollector() {
  const attempt = await tryFetchOfficial();
  const checked_at = new Date().toISOString();

  if (!attempt.ok) {
    return {
      success: false,
      message: `Source officielle non accessible en l'état (${attempt.reason}). ` +
        `Vérifier manuellement ${OFFICIAL_SITE_BASE} une fois la commission électorale ` +
        `de la 26e Knesset en ligne, ou utiliser le jeu de données ouvert : ${OPEN_DATA_HINT}.`,
      official_site_base: OFFICIAL_SITE_BASE,
      open_data_hint: OPEN_DATA_HINT,
      checked_at,
    };
  }

  return {
    success: true,
    message: 'Page officielle atteignable — parsing des sièges par liste à implémenter ' +
      'une fois la structure de données de la 26e Knesset confirmée.',
    fetched_url: attempt.fetched_url,
    threshold_pct: THRESHOLD_PCT,
    checked_at,
  };
}
