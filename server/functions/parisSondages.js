// Paris sur sondages — moteur de cotes et cycle de vie des marchés.
// Jeu de POINTS gratuit, aucun argent réel. Modèle : docs/predicite-paris-modele-scoring.md
//
// Cote (pari-mutuel à prior sondage), verrouillée à la prise du pari :
//   cote_i = (K + R) / (K·Pᵢ + Rᵢ)
// où Pᵢ = proba implicite du sondage (Monte-Carlo), Rᵢ = mises réelles sur i,
// R = mises réelles totales du marché, K = liquidité (force du prior).
import crypto from 'node:crypto';
import { pool, filterEntity, listEntity, createEntity, updateEntity } from '../db/index.js';

const SIGMA = 2.5;        // écart-type des sièges (ordre de grandeur de l'erreur de sondage)
const N_SIM = 8000;       // tirages Monte-Carlo
const DEFAULT_K = 800;
const WEEKLY_JETONS = 500;
const JETONS_CAP = 2000;
const MISE_MIN = 10, MISE_MAX = 500;
const SCORE_ON_WIN_RATIO = 0.25;   // le score gagné = 25 % du gain en jetons
const LEADER_MIN_MEAN = 10;        // pré-filtre : listes assez hautes pour le tirage
const MIN_ISSUE_PROB = 0.01;       // on n'offre pas d'issue à moins de 1 % de chance
const MAX_COTE = 25;               // plafond (évite les cotes absurdes sur quasi-0)

const uuid = () => crypto.randomUUID();

// Gaussienne N(mean, sd) — Box-Muller.
function gauss(mean, sd) {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// Formule de cote (exportée pour test isolé).
export function coteFor(prob_open, pool_reel, pool_total, K = DEFAULT_K) {
  const denom = K * Math.max(prob_open, 1e-6) + pool_reel;
  const raw = (K + pool_total) / denom;
  return Math.min(MAX_COTE, Math.max(1.01, Math.round(raw * 100) / 100));
}

// Moyenne des sièges par liste sur les derniers sondages.
async function latestSeatMeans() {
  const sondages = await listEntity('SondageSieges', { sort: '-poll_date', limit: 3 });
  if (!sondages.length) return null;
  const sum = new Map(), cnt = new Map();
  for (const s of sondages) for (const r of (s.seats_by_liste || [])) {
    sum.set(r.liste_id, (sum.get(r.liste_id) || 0) + r.seats);
    cnt.set(r.liste_id, (cnt.get(r.liste_id) || 0) + 1);
  }
  const means = new Map();
  for (const [id, tot] of sum) means.set(id, tot / cnt.get(id));
  return means;
}

// P(chaque liste candidate finit en tête) par Monte-Carlo (exportée pour test).
export function probsListeRang(candidateIds, means) {
  const wins = new Map(candidateIds.map(id => [id, 0]));
  for (let n = 0; n < N_SIM; n++) {
    let bestId = null, best = -Infinity;
    for (const id of candidateIds) {
      const draw = Math.max(0, gauss(means.get(id) || 0, SIGMA));
      if (draw > best) { best = draw; bestId = id; }
    }
    if (bestId != null) wins.set(bestId, wins.get(bestId) + 1);
  }
  const probs = new Map();
  for (const id of candidateIds) probs.set(id, wins.get(id) / N_SIM);
  return probs;
}

// Numéro de la prochaine manche.
async function nextManche() {
  const all = await listEntity('ParisMarche', { sort: '-manche', limit: 1 });
  return (all[0]?.manche || 0) + 1;
}

// Ouvre un marché « Quelle liste sera en tête au prochain sondage ? » pour la
// prochaine manche, avec une issue par liste candidate (mean ≥ seuil).
export async function openMancheRang() {
  const means = await latestSeatMeans();
  if (!means) throw new Error('Aucun sondage : impossible d’ouvrir un marché.');
  const listes = await listEntity('Liste', { limit: 200 });
  const byId = new Map(listes.map(l => [l.id, l]));
  const prelim = [...means.entries()].filter(([, m]) => m >= LEADER_MIN_MEAN).map(([id]) => id);
  if (prelim.length < 2) throw new Error('Pas assez de listes candidates.');

  // On tire sur tous les pré-candidats, mais on n'ouvre d'issue que pour ceux
  // ayant une vraie chance (≥ 1 %) — sinon on offrirait des paris à cote absurde.
  const prelimProbs = probsListeRang(prelim, means);
  const candidateIds = prelim.filter(id => (prelimProbs.get(id) || 0) >= MIN_ISSUE_PROB);
  if (candidateIds.length < 2) throw new Error('Pas assez de listes réellement en lice.');
  const probs = probsListeRang(candidateIds, means);
  const manche = await nextManche();
  const marcheId = uuid();
  await createEntity('ParisMarche', {
    id: marcheId, manche, type: 'rang',
    question: 'Quelle liste sera en tête au prochain sondage ?',
    resolver_kind: 'liste_rang', resolver_args: { candidate_ids: candidateIds },
    liquidity_k: DEFAULT_K, status: 'open',
  });
  for (const id of candidateIds) {
    await createEntity('ParisIssue', {
      id: uuid(), marche_id: marcheId,
      label: byId.get(id)?.name_fr || 'Liste',
      match_value: id, prob_open: probs.get(id) || 0, pool_reel: 0,
    });
  }
  // Premier point de la courbe : la cote d'ouverture, celle que dit le sondage
  // avant qu'aucun joueur n'ait misé.
  await snapshotMarche(marcheId);
  return { marche_id: marcheId, manche, issues: candidateIds.length };
}

// Dotation hebdomadaire de jetons (idempotente par semaine ISO).
function isoWeek(d = new Date()) {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const yStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const wk = Math.ceil(((t - yStart) / 86400000 + 1) / 7);
  return `${t.getUTCFullYear()}-W${String(wk).padStart(2, '0')}`;
}

export async function ensureWeeklyJetons(user_email) {
  const up = (await filterEntity('UserProgress', { user_email }))[0];
  if (!up) return null;
  const wk = isoWeek();
  if (up.jetons_semaine === wk) return up;
  const jetons = Math.min(JETONS_CAP, (up.jetons ?? 0) + WEEKLY_JETONS);
  await updateEntity('UserProgress', up.id, { jetons, jetons_semaine: wk });
  return { ...up, jetons, jetons_semaine: wk };
}

// ── Historique des cotes ─────────────────────────────────────────────────────
// La cote ne bouge QU'à la prise d'un pari (K et Pᵢ sont figés à l'ouverture,
// seuls Rᵢ et R évoluent). Un instantané à l'ouverture puis un après chaque mise
// reconstitue donc la courbe complète — pas d'échantillonnage périodique, pas de
// point interpolé, aucune tâche planifiée à surveiller.
//
// Écriture en SQL direct : la table est en ajout seul et n'a ni lecture par id
// ni champ JSON ; la faire passer par ENTITY_CONFIG n'apporterait rien et
// obligerait à déclarer une entité que le front n'utilise jamais telle quelle.
const MAX_POINTS_HISTORIQUE = 200;

export async function snapshotMarche(marche_id) {
  const marche = (await filterEntity('ParisMarche', { id: marche_id }))[0];
  if (!marche) return;
  const issues = await filterEntity('ParisIssue', { marche_id });
  if (!issues.length) return;
  const poolTotal = issues.reduce((s, i) => s + (i.pool_reel || 0), 0);
  for (const i of issues) {
    const cote = coteFor(i.prob_open, i.pool_reel || 0, poolTotal, marche.liquidity_k || DEFAULT_K);
    await pool.query(
      'INSERT INTO paris_cotes_snapshots (id, marche_id, issue_id, cote, pool_total) VALUES ($1,$2,$3,$4,$5)',
      [uuid(), marche_id, i.id, cote, poolTotal],
    );
  }
}

// Marchés ouverts + cotes courantes (pour l'affichage). Chaque issue reçoit sa
// cote calculée sur les pools actuels, et son historique de cotes.
export async function getOpenMarketsWithCotes() {
  const marches = (await listEntity('ParisMarche', { sort: '-manche', limit: 20 })).filter(m => m.status === 'open');
  const out = [];
  for (const m of marches) {
    const issues = await filterEntity('ParisIssue', { marche_id: m.id });
    const poolTotal = issues.reduce((s, i) => s + (i.pool_reel || 0), 0);

    const snaps = await pool.query(
      'SELECT issue_id, cote, created_at FROM paris_cotes_snapshots WHERE marche_id = $1 ORDER BY created_at ASC LIMIT $2',
      [m.id, MAX_POINTS_HISTORIQUE],
    );
    const parIssue = new Map();
    for (const s of snaps.rows) {
      if (!parIssue.has(s.issue_id)) parIssue.set(s.issue_id, []);
      parIssue.get(s.issue_id).push({ t: s.created_at, cote: Number(s.cote) });
    }

    out.push({
      ...m,
      pool_total: poolTotal,
      issues: issues.map(i => ({
        id: i.id, label: i.label, match_value: i.match_value,
        pool_reel: i.pool_reel || 0,
        cote: coteFor(i.prob_open, i.pool_reel || 0, poolTotal, m.liquidity_k || DEFAULT_K),
        historique: parIssue.get(i.id) || [],
      })).sort((a, b) => a.cote - b.cote),
    });
  }
  return out;
}

// Les paris d'un joueur — ses positions ouvertes et ses paris déjà tranchés.
//
// Cette fonction n'existait pas. `paris_mises` était écrite à chaque mise et
// relue uniquement par le résolveur : un joueur misait, voyait des confettis,
// et son pari disparaissait de sa vue. Il n'apprenait qu'il avait gagné que
// parce que son solde de jetons avait bougé.
//
// La cote affichée est celle VERROUILLÉE à la prise du pari (colonne `cote` de
// la mise), jamais la cote courante du marché : c'est celle-là qui décidera du
// gain, et la montrer bouger après coup ferait croire à un pari qu'on n'a pas
// pris.
export async function listerMises(user_email) {
  const { rows } = await pool.query(
    `SELECT mi.id, mi.mise, mi.cote, mi.gain_pot, mi.statut, mi.created_at,
            ma.id AS marche_id, ma.question, ma.type, ma.status AS marche_status,
            iss.label AS issue_label
       FROM paris_mises   mi
       JOIN paris_marches ma  ON ma.id  = mi.marche_id
       JOIN paris_issues  iss ON iss.id = mi.issue_id
      WHERE mi.user_email = $1
      ORDER BY mi.created_at DESC
      LIMIT 60`,
    [user_email],
  );

  const mises = rows.map(r => ({
    id: r.id, mise: Number(r.mise), cote: Number(r.cote), gain_pot: Number(r.gain_pot),
    statut: r.statut, created_at: r.created_at,
    marche_id: r.marche_id, question: r.question, type: r.type, marche_status: r.marche_status,
    issue_label: r.issue_label,
  }));

  const enJeu = mises.filter(m => m.statut === 'en_jeu');
  const gagnes = mises.filter(m => m.statut === 'gagne');
  return {
    mises,
    resume: {
      en_jeu: enJeu.length,
      mise_engagee: enJeu.reduce((s, m) => s + m.mise, 0),
      gain_potentiel: enJeu.reduce((s, m) => s + m.gain_pot, 0),
      gagnes: gagnes.length,
      perdus: mises.filter(m => m.statut === 'perdu').length,
      // Gains réellement encaissés — jamais une projection sur les paris ouverts.
      jetons_gagnes: gagnes.reduce((s, m) => s + m.gain_pot, 0),
    },
  };
}

// Place une mise : débite les jetons (conditionnel), verrouille la cote, crée la
// mise, incrémente le pool de l'issue. Débit conditionnel = pas de solde négatif.
export async function placerMise(user_email, body) {
  const issue_id = String(body.issue_id || '').trim();
  const mise = Math.round(Number(body.mise));
  if (!issue_id) throw new Error('issue_id requis.');
  if (!Number.isFinite(mise) || mise < MISE_MIN || mise > MISE_MAX) {
    throw new Error(`Mise invalide (entre ${MISE_MIN} et ${MISE_MAX} jetons).`);
  }

  const issue = (await filterEntity('ParisIssue', { id: issue_id }))[0];
  if (!issue) throw new Error('Issue introuvable.');
  const marche = (await filterEntity('ParisMarche', { id: issue.marche_id }))[0];
  if (!marche || marche.status !== 'open') throw new Error('Ce marché n’est plus ouvert.');

  await ensureWeeklyJetons(user_email);

  // Cote sur les pools actuels, puis verrouillée.
  const issues = await filterEntity('ParisIssue', { marche_id: marche.id });
  const poolTotal = issues.reduce((s, i) => s + (i.pool_reel || 0), 0);
  const cote = coteFor(issue.prob_open, issue.pool_reel || 0, poolTotal, marche.liquidity_k || DEFAULT_K);
  const gain_pot = Math.round(mise * cote);

  // Débit conditionnel : n'affecte la ligne que si le solde suffit.
  const debit = await pool.query(
    'UPDATE user_progress SET jetons = jetons - $1 WHERE user_email = $2 AND jetons >= $1',
    [mise, user_email]
  );
  if (debit.rowCount !== 1) throw new Error('Jetons insuffisants.');

  try {
    await createEntity('ParisMise', {
      id: uuid(), user_email, marche_id: marche.id, issue_id,
      mise, cote, gain_pot, statut: 'en_jeu',
    });
    await updateEntity('ParisIssue', issue.id, { pool_reel: (issue.pool_reel || 0) + mise });
  } catch (e) {
    // Rollback du débit si l'écriture échoue.
    await pool.query('UPDATE user_progress SET jetons = jetons + $1 WHERE user_email = $2', [mise, user_email]);
    throw e;
  }

  // Nouveau point sur la courbe — APRÈS l'écriture du pool, donc la cote
  // enregistrée est bien celle qui vaut désormais pour le joueur suivant.
  // Hors du try/catch volontairement : un instantané manquant ne doit jamais
  // faire échouer une mise déjà débitée et enregistrée. La courbe perdrait un
  // point, le joueur perdrait ses jetons — ce n'est pas le même prix.
  try { await snapshotMarche(marche.id); } catch { /* la mise, elle, est passée */ }

  return { ok: true, cote, gain_pot, mise };
}

// ── Marchés « événement » ────────────────────────────────────────────────
// Fusions, désertions, primaires restantes, incidents… : tout ce qui impacte
// la campagne. Binaires ou multi-issues, créés et résolus MANUELLEMENT par
// l'admin (aucun sondage ne les tranche). Cotes en pari-mutuel à prior.

// Catalogue de propositions (semi-auto) : événements de campagne connus, à
// ouvrir d'un clic par l'admin. À enrichir depuis l'actu au fil de l'eau.
export function proposerMarchesEvenements() {
  return [
    { question: 'Le Likoud tiendra-t-il ses primaires le 4 août comme prévu ?', issues: [{ label: 'Oui', prob_open: 0.8 }, { label: 'Non', prob_open: 0.2 }] },
    { question: "Une nouvelle fusion de listes sera-t-elle annoncée avant le dépôt du 9 septembre ?", issues: [{ label: 'Oui', prob_open: 0.5 }, { label: 'Non', prob_open: 0.5 }] },
    { question: 'Le Sionisme religieux franchira-t-il le seuil au prochain sondage ?', issues: [{ label: 'Oui', prob_open: 0.5 }, { label: 'Non', prob_open: 0.5 }] },
    { question: 'Une personnalité quittera-t-elle sa liste (défection) avant le scrutin ?', issues: [{ label: 'Oui', prob_open: 0.45 }, { label: 'Non', prob_open: 0.55 }] },
  ];
}

// Ouvre un marché événement (binaire ou multi-issues). prob_open normalisées.
export async function openMarcheEvenement({ question, issues, liquidity_k = DEFAULT_K }) {
  if (!question || !Array.isArray(issues) || issues.length < 2) throw new Error('question + au moins 2 issues requises.');
  const sum = issues.reduce((s, i) => s + (Number(i.prob_open) || 0), 0);
  const manche = await nextManche();
  const marcheId = uuid();
  await createEntity('ParisMarche', {
    id: marcheId, manche, type: 'evenement', question,
    resolver_kind: 'manuel', resolver_args: {}, liquidity_k, status: 'open',
  });
  for (const iss of issues) {
    const p = sum > 0 ? (Number(iss.prob_open) || 0) / sum : 1 / issues.length;
    await createEntity('ParisIssue', {
      id: uuid(), marche_id: marcheId, label: iss.label,
      match_value: iss.match_value || iss.label, prob_open: p || 1 / issues.length, pool_reel: 0,
    });
  }
  await snapshotMarche(marcheId);
  return { marche_id: marcheId, manche, issues: issues.length };
}

// Résolution manuelle d'un marché (l'admin déclare l'issue gagnante).
export async function resolveMarcheManuel(marche_id, winning_issue_id) {
  const m = (await filterEntity('ParisMarche', { id: marche_id }))[0];
  if (!m) throw new Error('Marché introuvable.');
  if (m.status !== 'open') throw new Error('Marché déjà résolu ou fermé.');
  const issues = await filterEntity('ParisIssue', { marche_id });
  const win = issues.find(i => i.id === winning_issue_id);
  if (!win) throw new Error('Issue gagnante inconnue.');

  const mises = await filterEntity('ParisMise', { marche_id });
  let paid = 0;
  for (const mise of mises) {
    if (mise.statut !== 'en_jeu') continue;
    const gagne = mise.issue_id === win.id;
    await updateEntity('ParisMise', mise.id, { statut: gagne ? 'gagne' : 'perdu' });
    if (gagne) {
      const up = (await filterEntity('UserProgress', { user_email: mise.user_email }))[0];
      if (up) {
        await updateEntity('UserProgress', up.id, {
          jetons: (up.jetons ?? 0) + mise.gain_pot,
          total_points: (up.total_points ?? 0) + Math.round(mise.gain_pot * SCORE_ON_WIN_RATIO),
        });
        paid++;
      }
    }
  }
  await updateEntity('ParisMarche', marche_id, { status: 'resolved', winning_issue: win.id });
  return { ok: true, mises_payees: paid };
}

// Enchaînement complet à l'arrivée d'un nouveau sondage : on résout les marchés
// ouverts (ils avaient été ouverts sur des données plus anciennes), puis on
// ouvre une nouvelle manche fondée sur ce sondage. Idempotent côté résolution
// (les marchés déjà résolus sont ignorés) ; l'ouverture peut échouer sans
// casser le reste (ex. pas assez de listes en lice).
export async function rolloverParis(sondage_id) {
  const resolved = await resolveByPoll(sondage_id);
  let opened;
  try { opened = await openMancheRang(); }
  catch (e) { opened = { skipped: e.message }; }
  return { resolved, opened };
}

// Résout tous les marchés 'rang' ouverts à partir d'un sondage : l'issue
// gagnante est la liste qui a le plus de sièges. Paie les gagnants, marque le
// marché résolu. Idempotent (ne retouche pas un marché déjà résolu).
export async function resolveByPoll(sondage_id) {
  const sondage = (await filterEntity('SondageSieges', { id: sondage_id }))[0];
  if (!sondage) throw new Error('Sondage introuvable.');
  const seats = new Map((sondage.seats_by_liste || []).map(r => [r.liste_id, r.seats]));

  const marches = (await listEntity('ParisMarche', { sort: '-manche', limit: 50 }))
    .filter(m => m.status === 'open' && m.resolver_kind === 'liste_rang');

  let resolved = 0, paid = 0;
  for (const m of marches) {
    const issues = await filterEntity('ParisIssue', { marche_id: m.id });
    // liste gagnante = plus de sièges parmi les candidates
    let winId = null, best = -1;
    for (const iss of issues) {
      const s = seats.get(iss.match_value) ?? -1;
      if (s > best) { best = s; winId = iss.match_value; }
    }
    const winningIssue = issues.find(i => i.match_value === winId);

    const mises = await filterEntity('ParisMise', { marche_id: m.id });
    for (const mise of mises) {
      if (mise.statut !== 'en_jeu') continue;
      const gagne = winningIssue && mise.issue_id === winningIssue.id;
      await updateEntity('ParisMise', mise.id, { statut: gagne ? 'gagne' : 'perdu' });
      if (gagne) {
        const up = (await filterEntity('UserProgress', { user_email: mise.user_email }))[0];
        if (up) {
          await updateEntity('UserProgress', up.id, {
            jetons: (up.jetons ?? 0) + mise.gain_pot,
            total_points: (up.total_points ?? 0) + Math.round(mise.gain_pot * SCORE_ON_WIN_RATIO),
          });
          paid++;
        }
      }
    }
    await updateEntity('ParisMarche', m.id, {
      status: 'resolved', resolved_by: sondage_id, winning_issue: winningIssue?.id || null,
    });
    resolved++;
  }
  return { ok: true, marches_resolus: resolved, mises_gagnantes_payees: paid };
}
