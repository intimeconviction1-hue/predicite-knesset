// Traqueur automatique de sondages : fait tourner le collecteur (LLM + web_search)
// à intervalle régulier, sans intervention manuelle. Les sondages sortent souvent
// pendant la campagne — on va donc chercher les sources en continu.
//
// Contraintes tier gratuit : le serveur peut s'endormir/redémarrer. On lance donc
// la collecte AU RÉVEIL (throttlée via poll_tracker_state) + périodiquement tant
// que le process vit. Idempotent et sûr : dédup par checksum côté collecteur, et
// on réserve le créneau (last_run) AVANT de lancer pour éviter les doublons.
import { queryOne, run, listEntity } from '../db/index.js';
import { runSondagesSiegesCollector } from './sondagesSiegesCollector.js';
import { rolloverParis } from './parisSondages.js';
import { runActuHebrewCollector } from './actuHebrewCollector.js';

const INTERVAL_H = Number(process.env.POLL_TRACK_INTERVAL_HOURS || 6);
let running = false;

function disabled() {
  return !process.env.ANTHROPIC_API_KEY || process.env.POLL_TRACK_DISABLED === 'true';
}

async function getLastRun() {
  try {
    const row = await queryOne("SELECT last_run_utc FROM poll_tracker_state WHERE id = 'singleton'");
    return row?.last_run_utc ? new Date(row.last_run_utc) : null;
  } catch { return null; }
}

async function setState(iso, result) {
  await run(
    `INSERT INTO poll_tracker_state (id, last_run_utc, last_result) VALUES ('singleton', ?, ?)
     ON CONFLICT (id) DO UPDATE SET last_run_utc = EXCLUDED.last_run_utc, last_result = EXCLUDED.last_result`,
    [iso, (result || '').slice(0, 500)],
  );
}

// Cotes vivantes « à la Winamax » : dès qu'un NOUVEAU sondage entre en base, on
// résout les marchés « rang » ouverts (les gagnants sont payés) et on rouvre une
// manche dont les cotes sont recalculées sur ce sondage. Les cotes évoluent donc
// en permanence : à chaque sondage (le prior) et à chaque mise (le pari-mutuel).
// Garde anti-double-résolution : on mémorise le sondage déjà utilisé.
async function maybeRolloverParis() {
  const latest = (await listEntity('SondageSieges', { sort: '-poll_date', limit: 1 }))[0];
  if (!latest) return { skipped: 'aucun sondage' };

  const state = await queryOne("SELECT last_rollover_poll FROM poll_tracker_state WHERE id = 'singleton'");
  if (state?.last_rollover_poll === latest.id) return { skipped: 'déjà pris en compte' };

  const res = await rolloverParis(latest.id);
  await run(
    `INSERT INTO poll_tracker_state (id, last_rollover_poll) VALUES ('singleton', ?)
     ON CONFLICT (id) DO UPDATE SET last_rollover_poll = EXCLUDED.last_rollover_poll`,
    [latest.id],
  );
  console.log(`[poll-tracker] cotes rafraîchies sur ${latest.institute} ${latest.poll_date} :`, JSON.stringify(res));
  return res;
}

export async function maybeCollectPolls(reason = 'scheduler') {
  if (disabled()) return { skipped: 'disabled' };
  if (running) return { skipped: 'already_running' };

  const last = await getLastRun();
  const now = new Date();
  if (last && (now.getTime() - last.getTime()) < INTERVAL_H * 3600 * 1000) {
    return { skipped: 'throttled', last: last.toISOString() };
  }

  running = true;
  const iso = now.toISOString();
  try {
    await setState(iso, 'running');            // réserve le créneau tôt
    const res = await runSondagesSiegesCollector();
    const r = res?.results || {};
    await setState(iso, JSON.stringify({ created: r.created, skipped: r.skipped, rejected: r.rejected }));
    console.log(`[poll-tracker/${reason}] créés=${r.created ?? '?'} skip=${r.skipped ?? '?'} rejet=${r.rejected ?? '?'}`);

    // Un nouveau sondage → les cotes se recalculent (résolution + nouvelle manche).
    // Isolé : un échec du rollover ne doit pas faire échouer la collecte.
    let rollover = null;
    try { rollover = await maybeRolloverParis(); }
    catch (e) { console.error('[poll-tracker] rollover échoué :', e.message); rollover = { error: e.message }; }

    // Brèves de la presse israélienne (hébreu) : faits reformulés en français,
    // sources citées. Isolé aussi — l'actu ne doit pas casser la collecte.
    let breves = null;
    try {
      breves = await runActuHebrewCollector();
      const br = breves?.results;
      if (br) console.log(`[poll-tracker] brèves israéliennes : +${br.created} (skip ${br.skipped}, rejet ${br.rejected})`);
    } catch (e) { console.error('[poll-tracker] brèves échouées :', e.message); breves = { error: e.message }; }

    return { ...res, rollover, breves };
  } catch (e) {
    console.error('[poll-tracker] échec :', e.message);
    await setState(iso, `error: ${e.message}`).catch(() => {});
    return { error: e.message };
  } finally {
    running = false;
  }
}

export function startPollTracker() {
  if (disabled()) {
    console.log('[poll-tracker] désactivé (pas de ANTHROPIC_API_KEY ou POLL_TRACK_DISABLED=true).');
    return;
  }
  // Au réveil (throttlé), puis à intervalle régulier tant que le serveur vit.
  setTimeout(() => { maybeCollectPolls('startup').catch(() => {}); }, 8000);
  setInterval(() => { maybeCollectPolls('interval').catch(() => {}); }, INTERVAL_H * 3600 * 1000);
  console.log(`[poll-tracker] actif — collecte auto toutes les ${INTERVAL_H}h.`);
}
