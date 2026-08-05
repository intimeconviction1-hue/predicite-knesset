import React, { useState, useMemo, useEffect } from 'react';
import { base44 } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Landmark, Check, RotateCcw, Trophy, Gauge } from 'lucide-react';
import { useGuestGate } from '@/lib/useGuestGate';
import TrialWall from '@/components/knesset/TrialWall';
import MiniJeuShell from '@/components/knesset/MiniJeuShell';

const MAJORITE = 61;

// ⚠️ FRICTIONS À VALIDER (David) — en Israël TOUT est possible : on ne bloque
// jamais, on mesure la PLAUSIBILITÉ. Chaque paire présente retire des points
// (poids = force de la friction). Chaque paire s'adosse à une position déjà
// sourcée du site (boussole-data.js, seed) — le détail, l'échelle des poids et
// les paires ÉCARTÉES faute de source vivent dans docs/FRICTIONS_SOURCES.md.
// Une paire absente est un trou à dessein, pas un oubli.
const FRICTIONS = [
  // ── Le « mur » anti-Netanyahou (la friction la plus structurante) ──────────
  ['likoud', 'les-democrates', 42, 'La gauche exclut Netanyahou'],
  ['likoud', 'yashar-gadi-eisenkot', 35, 'Eisenkot fait campagne contre Netanyahou'],
  // ⚠️ POIDS À REVOIR (David) : cette paire absorbe une seconde friction qui
  // existait en double. Une ligne ['likoud','yachad-bennett',16,'Bennett :
  // histoire compliquée avec Bibi'] visait le slug fantôme hérité de Base44,
  // désactivé le 2026-08-04 — elle ne s'appliquait donc JAMAIS. Les deux
  // fondateurs d'Ensemble n'ont pas le même passif avec Netanyahou : Lapid
  // pesait 32, Bennett 16. On garde 32, mais c'est le chiffre de Lapid pour une
  // liste que Bennett dirige : à trancher.
  ['likoud', 'ensemble-bennett-lapid', 32, 'Bloc du changement : Bennett et Lapid hors coalition Netanyahou'],
  ['likoud', 'yisrael-beytenou', 30, 'Lieberman, ennemi juré de Netanyahou'],
  ['likoud', 'unite-nationale', 22, 'Passif anti-Netanyahou'],
  // (Pas de paire likoud/les-reservistes : Hendel assume de gouverner avec
  // Netanyahou si le programme convient — trou à dessein.)

  // ── Piliers du gouvernement sortant ⊥ bloc du changement (2026-08-05) ──────
  // Sans cet axe, Otzma + Les Démocrates + Ensemble sortait « très plausible »
  // à 100 %. Adossé à l'affirmation structurante de la Boussole (Netanyahou PM :
  // Otzma et le Sionisme religieux pour, les cinq listes d'en face contre) et à
  // la commission d'enquête du 7 octobre. Unité nationale ferme l'axe avec les
  // poids les plus bas : Gantz assume de gouverner avec Netanyahou.
  ['otzma-yehudit', 'les-democrates', 40, 'Kahanisme vs gauche sioniste : exclusion réciproque'],
  ['otzma-yehudit', 'yashar-gadi-eisenkot', 30, 'Ben Gvir, pilier du gouvernement que combat Eisenkot'],
  ['otzma-yehudit', 'ensemble-bennett-lapid', 30, 'Ben Gvir vs bloc du changement'],
  ['otzma-yehudit', 'yisrael-beytenou', 26, 'Lieberman vs Ben Gvir : deux droites irréconciliables'],
  ['otzma-yehudit', 'unite-nationale', 20, 'Gantz vs Ben Gvir — mais Gantz n\'exclut pas la droite'],
  ['sionisme-religieux', 'les-democrates', 34, 'Smotrich vs gauche laïque'],
  ['sionisme-religieux', 'yashar-gadi-eisenkot', 26, 'Smotrich, pilier du gouvernement que combat Eisenkot'],
  ['sionisme-religieux', 'ensemble-bennett-lapid', 26, 'Smotrich vs bloc du changement'],
  ['sionisme-religieux', 'yisrael-beytenou', 22, 'Lieberman vs Smotrich'],
  ['sionisme-religieux', 'unite-nationale', 16, 'Gantz vs Smotrich — la friction la plus faible de l\'axe'],

  // ── Haredim ⊥ centre laïque ────────────────────────────────────────────────
  // Lieberman existait déjà ; les autres refus (2026-08-05) sont sourcés dans
  // boussole-data : exemption militaire, influence religieuse, budget des
  // yeshivot. Pas de paire avec Unité nationale : Gantz est absent des
  // affirmations religieuses sourcées et a siégé avec les haredim en 2020.
  ['yisrael-beytenou', 'shas', 30, 'Lieberman contre les partis ultra-orthodoxes'],
  ['yisrael-beytenou', 'judaisme-unifie-de-la-torah', 30, 'Lieberman contre les Haredim'],
  ['shas', 'les-reservistes-hendel-tropper', 32, 'Hendel refuse de siéger avec les partis haredim'],
  ['judaisme-unifie-de-la-torah', 'les-reservistes-hendel-tropper', 32, 'Hendel refuse de siéger avec les partis haredim'],
  ['shas', 'yashar-gadi-eisenkot', 28, 'Eisenkot rejette « l\'étreinte politique haredi »'],
  ['judaisme-unifie-de-la-torah', 'yashar-gadi-eisenkot', 28, 'La conscription universelle d\'Eisenkot exclut les Haredim'],
  ['shas', 'les-democrates', 26, 'Golan vs subventions haredim : tronc commun, conscription'],
  ['judaisme-unifie-de-la-torah', 'les-democrates', 26, 'Golan vs subventions haredim : tronc commun, conscription'],
  ['shas', 'ensemble-bennett-lapid', 24, 'Shas accuse Bennett de « brader l\'identité juive »'],
  ['judaisme-unifie-de-la-torah', 'ensemble-bennett-lapid', 24, 'Bennett et Lapid ont attaqué le budget des yeshivot'],

  // ── Extrême droite ⊥ partis arabes ─────────────────────────────────────────
  ['otzma-yehudit', 'hadash-ta-al-liste-commune', 45, 'Kahanisme vs partis arabes'],
  ['otzma-yehudit', 'ra-am', 42, 'Ben Gvir vs partis arabes'],
  ['sionisme-religieux', 'hadash-ta-al-liste-commune', 38, 'Sionisme religieux vs partis arabes'],
  ['sionisme-religieux', 'ra-am', 34, 'Sionisme religieux vs Ra\'am'],

  // ── Partis arabes dans les autres coalitions ───────────────────────────────
  // Asymétrie Hadash/Ra'am partout : Ra'am a siégé au gouvernement en 2021
  // (improbable, pas inédit), Hadash jamais. Ensemble, Lieberman et Les
  // Réservistes refusent l'appui des partis arabes (Boussole, 2026-08-05) —
  // mais Bennett, Lapid et Lieberman ont gouverné avec Ra'am, d'où les poids
  // réduits. Les Démocrates : zéro friction à dessein, Golan appelle à
  // s'associer à Ra'am.
  ['likoud', 'hadash-ta-al-liste-commune', 40, 'Hadash-Ta\'al hors gouvernement Likoud'],
  ['likoud', 'ra-am', 24, 'Ra\'am au gouvernement Likoud : improbable, pas inédit'],
  ['ensemble-bennett-lapid', 'hadash-ta-al-liste-commune', 26, 'Ensemble refuse l\'appui des partis arabes'],
  ['ensemble-bennett-lapid', 'ra-am', 14, 'Refus déclaré — mais Ra\'am gouvernait avec eux en 2021'],
  ['yisrael-beytenou', 'hadash-ta-al-liste-commune', 26, 'Lieberman refuse l\'appui des partis arabes'],
  ['yisrael-beytenou', 'ra-am', 14, 'Refus déclaré — mais Ra\'am gouvernait avec Lieberman en 2021'],
  ['les-reservistes-hendel-tropper', 'hadash-ta-al-liste-commune', 26, 'Doctrine sécuritaire des Réservistes vs partis arabes'],
  ['les-reservistes-hendel-tropper', 'ra-am', 20, 'Doctrine sécuritaire des Réservistes vs Ra\'am'],
];

// Garde de cohérence, même principe que celle de Boussole.jsx : une friction dont
// un slug ne correspond à aucune liste active ne se déclenche JAMAIS, sans que
// rien ne le signale. C'est ce qui a laissé vivre ici la paire 'yachad-bennett'
// après la désactivation de la liste fantôme. En dev on le dit ; en prod on
// ignore sans casser la page.
// ⚠️ Valider contre les listes ACTIVES, jamais contre le plateau du jeu : le
// plateau ne retient que les listes créditées de sièges par le DERNIER sondage,
// et une liste sous le seuil ce jour-là n'est pas un slug fantôme — sa friction
// doit survivre pour le sondage suivant. C'est ce qui a fait crier la garde sur
// 'unite-nationale' (Gantz, bien active au seed et à la Boussole) en août 2026.
function verifierFrictions(slugsActifs) {
  if (!import.meta.env?.DEV || Object.keys(slugsActifs).length === 0) return;
  const orphelins = [...new Set(FRICTIONS.flatMap(([a, b]) => [a, b]))].filter(s => !slugsActifs[s]);
  if (orphelins.length) console.error('[FormeCoalition] frictions sans liste correspondante :', orphelins.join(', '));
}

function plausibility(slugs) {
  const set = new Set(slugs);
  let penalty = 0; const active = [];
  for (const [a, b, w, reason] of FRICTIONS) if (set.has(a) && set.has(b)) { penalty += w; active.push({ a, b, w, reason }); }
  return { score: Math.max(3, 100 - penalty), active: active.sort((x, y) => y.w - x.w) };
}
function plLabel(s) {
  if (s >= 75) return { t: 'Très plausible', c: 'var(--p-green)', bg: 'var(--p-green-dim)', fill: 'var(--p-green)' };
  if (s >= 45) return { t: 'Plausible', c: 'var(--p-blue)', bg: 'var(--p-blue-dim)', fill: 'var(--p-blue)' };
  if (s >= 20) return { t: 'Improbable', c: 'var(--p-gold-text)', bg: 'var(--p-gold-dim)', fill: 'var(--p-gold)' };
  return { t: 'Scénario surprise', c: 'var(--p-red)', bg: 'var(--p-red-dim)', fill: 'var(--p-red)' };
}

export default function FormeCoalition() {
  const gate = useGuestGate();
  const { data: sondages = [] } = useQuery({ queryKey: ['coal-sondage'], queryFn: () => base44.entities.SondageSieges.list('-poll_date', 1) });
  const { data: listes = [] } = useQuery({ queryKey: ['coal-listes'], queryFn: () => base44.entities.Liste.filter({ is_active: true }) });

  const latest = sondages[0];
  const parties = useMemo(() => {
    const seatsById = new Map((latest?.seats_by_liste || []).map(s => [s.liste_id, s.seats]));
    return listes.map(l => ({ id: l.id, slug: l.slug, name: l.name_fr, color: l.color || '#6B7280', seats: seatsById.get(l.id) || 0 }))
      .filter(p => p.seats > 0).sort((a, b) => b.seats - a.seats);
  }, [listes, latest]);
  const bySlug = useMemo(() => Object.fromEntries(parties.map(p => [p.slug, p])), [parties]);
  // La garde reçoit les listes actives, pas `parties` : voir verifierFrictions.
  useEffect(() => { verifierFrictions(Object.fromEntries(listes.map(l => [l.slug, l]))); }, [listes]);

  const [selected, setSelected] = useState([]);
  const [result, setResult] = useState(null);

  const total = selected.reduce((s, slug) => s + (bySlug[slug]?.seats || 0), 0);
  const { score, active } = plausibility(selected);
  const label = plLabel(score);

  const toggle = (slug) => { setResult(null); setSelected(sel => sel.includes(slug) ? sel.filter(s => s !== slug) : [...sel, slug]); };
  const reset = () => { setSelected([]); setResult(null); };
  const check = () => { gate.record(); setResult({ majority: total >= MAJORITE, total, score }); };

  const majPct = (MAJORITE / 120) * 100;

  return (
    <MiniJeuShell
      icon={Landmark}
      titre="Forme ta coalition"
      chapo={<>Assemble <b style={{ color: 'var(--p-text)' }}>61 sièges</b>. En Israël <b>tout est possible</b> — mais avec quelle plausibilité ? À toi de le découvrir.</>}
    >
        {gate.blocked ? (
          <TrialWall plays={gate.plays} />
        ) : parties.length === 0 ? (
          <div className="p-card p-6 text-center"><p className="p-body text-sm">En attente d'un sondage sièges pour lancer le jeu.</p></div>
        ) : (
          <div className="p-card p-5">
            {/* sièges */}
            <div className="flex items-end justify-between mb-1">
              <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--p-text-40)' }}>Sièges</span>
              <span className="font-mono font-black text-2xl leading-none" style={{ color: total >= MAJORITE ? 'var(--p-green)' : 'var(--p-text)' }}>
                {total}<span className="text-sm" style={{ color: 'var(--p-text-40)' }}> / {MAJORITE}</span>
              </span>
            </div>
            <div className="relative h-2.5 rounded-full overflow-hidden mb-4" style={{ background: 'var(--p-text-10)' }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, (total / 120) * 100)}%`, background: total >= MAJORITE ? 'var(--p-green)' : 'var(--p-blue)' }} />
              <div className="absolute top-0 bottom-0" style={{ left: `${majPct}%`, width: 2, background: 'var(--p-gold)' }} title="Majorité 61" />
            </div>

            {/* plausibilité */}
            <div className="flex items-center justify-between mb-1">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--p-text-40)' }}>
                <Gauge className="w-3.5 h-3.5" /> Plausibilité
              </span>
              <span className="text-sm font-black" style={{ color: label.c }}>{selected.length ? `${score}% · ${label.t}` : '—'}</span>
            </div>
            <div className="h-2.5 rounded-full overflow-hidden mb-3" style={{ background: 'var(--p-text-10)' }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${selected.length ? score : 0}%`, background: label.fill }} />
            </div>

            {/* partis */}
            <div className="flex flex-wrap gap-2 mb-3">
              {parties.map(p => {
                const on = selected.includes(p.slug);
                return (
                  <button key={p.slug} onClick={() => toggle(p.slug)} aria-pressed={on}
                    className="inline-flex items-center gap-1.5 rounded-full pl-2 pr-2.5 py-1.5 transition-all"
                    style={{ background: on ? 'var(--p-blue-dim)' : 'var(--p-night-2)', border: `1px solid ${on ? 'var(--p-blue)' : 'var(--p-border)'}`, opacity: on ? 1 : 0.82 }}>
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: p.color }} />
                    <span className="text-xs font-semibold" style={{ color: 'var(--p-text)' }}>{p.name}</span>
                    <span className="text-xs font-mono font-bold" style={{ color: 'var(--p-text-40)' }}>{p.seats}</span>
                    {on && <Check className="w-3 h-3" style={{ color: 'var(--p-blue)' }} />}
                  </button>
                );
              })}
            </div>

            {/* ce qui plombe la plausibilité */}
            {active.length > 0 && (
              <div className="rounded-xl p-3 mb-4" style={{ background: 'var(--p-night-2)', border: '0.5px solid var(--p-border)' }}>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--p-text-40)' }}>Ce qui rend cette coalition moins probable</p>
                {active.slice(0, 4).map((f, i) => (
                  <div key={i} className="flex items-center justify-between gap-2 text-xs py-0.5">
                    <span style={{ color: 'var(--p-text)' }}>{f.reason || `${bySlug[f.a]?.name} ✕ ${bySlug[f.b]?.name}`}</span>
                    <span className="font-mono font-bold flex-shrink-0" style={{ color: 'var(--p-red)' }}>−{f.w}</span>
                  </div>
                ))}
                {/* Pas de troncature silencieuse : au-delà de 4, on dit combien
                    de frictions restent et ce qu'elles pèsent ensemble. */}
                {active.length > 4 && (
                  <div className="flex items-center justify-between gap-2 text-[11px] pt-1" style={{ color: 'var(--p-text-40)' }}>
                    <span>+ {active.length - 4} autres frictions</span>
                    <span className="font-mono font-bold flex-shrink-0">−{active.slice(4).reduce((s, f) => s + f.w, 0)}</span>
                  </div>
                )}
              </div>
            )}

            {/* verdict */}
            <AnimatePresence>
              {result && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} className="rounded-xl p-4 mb-4 text-center"
                  style={{ background: plLabel(result.score).bg, border: `0.5px solid ${plLabel(result.score).c}33` }}>
                  {result.majority ? (
                    <>
                      <Trophy className="w-6 h-6 mx-auto mb-1" style={{ color: plLabel(result.score).c }} />
                      <p className="font-bold text-sm" style={{ color: 'var(--p-text)' }}>
                        Majorité atteinte ({result.total}) — coalition <b style={{ color: plLabel(result.score).c }}>{plLabel(result.score).t.toLowerCase()}</b> ({result.score}%).
                      </p>
                    </>
                  ) : (
                    <p className="font-bold text-sm" style={{ color: 'var(--p-gold-text)' }}>Il manque {MAJORITE - result.total} sièges pour la majorité.</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center gap-3">
              <button onClick={check} disabled={selected.length === 0}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-[10px] font-bold text-sm flex-1 justify-center"
                style={{ background: selected.length ? 'linear-gradient(180deg,#ffe08a,#D4AF37)' : 'var(--p-text-10)', color: selected.length ? '#14203D' : 'var(--p-text-40)' }}>
                Vérifier ma coalition
              </button>
              <button onClick={reset} aria-label="Recommencer" title="Recommencer" className="inline-flex items-center px-4 py-3 rounded-[10px] font-semibold text-sm"
                style={{ background: 'transparent', border: '0.5px solid var(--p-border-hover)', color: 'var(--p-text-60)' }}>
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
    </MiniJeuShell>
  );
}
