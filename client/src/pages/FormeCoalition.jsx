import React, { useState, useMemo, useEffect } from 'react';
import { base44 } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Landmark, Check, RotateCcw, Trophy, Gauge } from 'lucide-react';
import { useGuestGate } from '@/lib/useGuestGate';
import TrialWall from '@/components/knesset/TrialWall';
import MiniJeuShell from '@/components/knesset/MiniJeuShell';
import { MAJORITE, TOTAL_SIEGES } from '@/lib/knesset';
import { useProjection } from '@/lib/projection';
import { verifierFrictions, plausibility } from '@/lib/frictions';

function plLabel(s) {
  if (s >= 75) return { t: 'Très plausible', c: 'var(--p-green)', bg: 'var(--p-green-dim)', fill: 'var(--p-green)' };
  if (s >= 45) return { t: 'Plausible', c: 'var(--p-blue)', bg: 'var(--p-blue-dim)', fill: 'var(--p-blue)' };
  if (s >= 20) return { t: 'Improbable', c: 'var(--p-gold-text)', bg: 'var(--p-gold-dim)', fill: 'var(--p-gold)' };
  return { t: 'Scénario surprise', c: 'var(--p-red)', bg: 'var(--p-red-dim)', fill: 'var(--p-red)' };
}

export default function FormeCoalition() {
  const gate = useGuestGate();
  const { data: listes = [] } = useQuery({ queryKey: ['coal-listes'], queryFn: () => base44.entities.Liste.filter({ is_active: true }) });

  // Le plateau vient de la projection PARTAGÉE (lib/projection.js) — c'est ici
  // qu'elle a été inventée, elle sert maintenant tout le site.
  //
  // Ce que la moyenne ne répare PAS, contrairement à ce qu'on a d'abord cru :
  // ramener Unité nationale (Gantz). Vérifié sur les 20 derniers sondages de
  // prod le 2026-08-06 — Gantz est crédité une fois sur vingt. Il est réellement
  // sous le seuil, ce n'est pas un artefact d'échantillonnage. Son absence du
  // plateau est juste, et la friction likoud/unite-nationale doit rester en
  // sommeil : elle attend un sursaut réel, pas un lissage.
  const { projection: parties, sondages, provenance } = useProjection(listes);
  const bySlug = useMemo(() => Object.fromEntries(parties.map(p => [p.slug, p])), [parties]);
  // La garde reçoit les listes actives, pas `parties` : voir verifierFrictions.
  useEffect(() => { verifierFrictions(Object.fromEntries(listes.map(l => [l.slug, l]))); }, [listes]);

  const [selected, setSelected] = useState([]);
  const [result, setResult] = useState(null);

  const total = selected.reduce((s, slug) => s + (bySlug[slug]?.seats || 0), 0);
  const { score, active } = plausibility(selected);
  const label = plLabel(score);
  // La plausibilité ne se montre qu'après « Vérifier » : le chapô promet une
  // découverte (« À toi de le découvrir »), et une jauge en direct vidait le
  // clic de son enjeu — le verdict n'apprenait rien. Toucher un parti après
  // coup remet le suspense (toggle → setResult(null)).
  const revele = result !== null;

  const toggle = (slug) => { setResult(null); setSelected(sel => sel.includes(slug) ? sel.filter(s => s !== slug) : [...sel, slug]); };
  const reset = () => { setSelected([]); setResult(null); };
  const check = () => { gate.record(); setResult({ majority: total >= MAJORITE, total, score }); };

  const majPct = (MAJORITE / TOTAL_SIEGES) * 100;


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
            <div className="relative h-2.5 rounded-full overflow-hidden mb-4" style={{ background: 'var(--p-text-10)' }}
              role="progressbar" aria-label="Sièges de la coalition" aria-valuemin={0} aria-valuemax={TOTAL_SIEGES} aria-valuenow={total}>
              <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, (total / TOTAL_SIEGES) * 100)}%`, background: total >= MAJORITE ? 'var(--p-green)' : 'var(--p-blue)' }} />
              <div className="absolute top-0 bottom-0" style={{ left: `${majPct}%`, width: 2, background: 'var(--p-gold)' }} title="Majorité 61" />
            </div>

            {/* plausibilité */}
            <div className="flex items-center justify-between mb-1">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--p-text-40)' }}>
                <Gauge className="w-3.5 h-3.5" /> Plausibilité
              </span>
              <span className="text-sm font-black" style={{ color: revele ? label.c : 'var(--p-text-40)' }}>
                {revele ? `${score}% · ${label.t}` : selected.length ? '?' : '—'}
              </span>
            </div>
            <div className="h-2.5 rounded-full overflow-hidden mb-3" style={{ background: 'var(--p-text-10)' }}
              role="progressbar" aria-label="Plausibilité de la coalition" aria-valuemin={0} aria-valuemax={100} aria-valuenow={revele ? score : 0}>
              <div className="h-full rounded-full transition-all" style={{ width: `${revele ? score : 0}%`, background: label.fill }} />
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
            {provenance && <p className="text-[10px] mb-3" style={{ color: 'var(--p-text-40)' }}>{provenance}</p>}

            {/* ce qui plombe la plausibilité — après révélation seulement : la
                liste des frictions EST la réponse, l'afficher pendant la
                sélection revenait à donner le résultat avant le clic. */}
            {revele && active.length > 0 && (
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
                    <p className="font-bold text-sm" style={{ color: 'var(--p-gold-text)' }}>
                      Il manque {MAJORITE - result.total} sièges pour la majorité — et telle quelle, cette coalition serait <b style={{ color: plLabel(result.score).c }}>{plLabel(result.score).t.toLowerCase()}</b> ({result.score}%).
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center gap-3">
              <button onClick={check} disabled={selected.length === 0 || revele}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-[10px] font-bold text-sm flex-1 justify-center"
                style={{ background: selected.length && !revele ? 'linear-gradient(180deg,#ffe08a,#D4AF37)' : 'var(--p-text-10)', color: selected.length && !revele ? '#14203D' : 'var(--p-text-40)' }}>
                {revele ? 'Change une liste pour rejouer' : 'Vérifier ma coalition'}
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
