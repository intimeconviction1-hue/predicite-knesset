import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Landmark, Check, X, RotateCcw, AlertTriangle, Trophy } from 'lucide-react';
import { useGuestGate } from '@/lib/useGuestGate';
import TrialWall from '@/components/knesset/TrialWall';

const MAJORITE = 61;

// ⚠️ RÈGLES À VALIDER — incompatibilités de coalition (brouillon documenté).
// Chaque paire = deux listes qui refusent de siéger ensemble. À corriger avec
// David : c'est le contenu sensible du jeu, pas la mécanique.
const CONFLICTS = [
  // Le « mur anti-Netanyahou » : le bloc du changement refuse le Likoud tant
  // qu'il est mené par Netanyahou.
  ['likoud', 'yashar-gadi-eisenkot'], ['likoud', 'ensemble-bennett-lapid'],
  ['likoud', 'yachad-bennett'], ['likoud', 'les-democrates'],
  ['likoud', 'unite-nationale'], ['likoud', 'yisrael-beytenou'],
  // Lieberman (Yisrael Beiteinu) refuse les partis ultra-orthodoxes.
  ['yisrael-beytenou', 'shas'], ['yisrael-beytenou', 'judaisme-unifie-de-la-torah'],
  // Extrême-droite ⊥ partis arabes.
  ['otzma-yehudit', 'hadash-ta-al-liste-commune'], ['otzma-yehudit', 'ra-am'],
  ['sionisme-religieux', 'hadash-ta-al-liste-commune'], ['sionisme-religieux', 'ra-am'],
  // Les partis arabes ne rejoignent pas un gouvernement Netanyahou.
  ['likoud', 'hadash-ta-al-liste-commune'], ['likoud', 'ra-am'],
];

function conflictsWithin(slugs) {
  const set = new Set(slugs);
  const out = [];
  for (const [a, b] of CONFLICTS) if (set.has(a) && set.has(b)) out.push([a, b]);
  return out;
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

  const [selected, setSelected] = useState([]);   // slugs
  const [result, setResult] = useState(null);      // { viable, total, conflicts }

  const total = selected.reduce((s, slug) => s + (bySlug[slug]?.seats || 0), 0);
  const liveConflicts = conflictsWithin(selected);

  const toggle = (slug) => {
    setResult(null);
    setSelected(sel => sel.includes(slug) ? sel.filter(s => s !== slug) : [...sel, slug]);
  };
  const reset = () => { setSelected([]); setResult(null); };
  const check = () => {
    const conflicts = conflictsWithin(selected);
    gate.record();
    setResult({ viable: total >= MAJORITE && conflicts.length === 0, total, conflicts });
  };

  const gold = 'var(--p-gold-text)';
  const pct = Math.min(100, (total / 120) * 100);
  const majPct = (MAJORITE / 120) * 100;

  return (
    <div className="min-h-screen" style={{ background: 'transparent' }}>
      <div className="p-tricolor"><div /><div /><div /></div>
      <div className="max-w-xl mx-auto px-4 pt-8 pb-4 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-3" style={{ background: 'var(--p-gold-dim)', border: '0.5px solid var(--p-gold-border)' }}>
          <Landmark className="w-3.5 h-3.5" style={{ color: gold }} />
          <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: gold }}>Jeu · mode découverte</span>
        </div>
        <h1 className="p-display text-3xl md:text-4xl mb-2">Forme ta coalition</h1>
        <p className="p-body text-sm max-w-md mx-auto">
          Assemble <b style={{ color: 'var(--p-text)' }}>61 sièges</b> pour gouverner — mais attention : certains partis <b>refusent</b> de siéger ensemble.
        </p>
      </div>

      <div className="max-w-md mx-auto px-4 pb-16">
        {gate.blocked ? (
          <TrialWall plays={gate.plays} />
        ) : parties.length === 0 ? (
          <div className="p-card p-6 text-center"><p className="p-body text-sm">En attente d'un sondage sièges pour lancer le jeu.</p></div>
        ) : (
          <div className="p-card p-5">
            {/* compteur */}
            <div className="flex items-end justify-between mb-1">
              <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--p-text-40)' }}>Ta coalition</span>
              <span className="font-mono font-black text-2xl leading-none" style={{ color: total >= MAJORITE ? 'var(--p-green)' : 'var(--p-text)' }}>
                {total}<span className="text-sm" style={{ color: 'var(--p-text-40)' }}> / {MAJORITE}</span>
              </span>
            </div>
            <div className="relative h-2.5 rounded-full overflow-hidden mb-1" style={{ background: 'var(--p-text-10)' }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: total >= MAJORITE ? 'var(--p-green)' : 'var(--p-blue)' }} />
              <div className="absolute top-0 bottom-0" style={{ left: `${majPct}%`, width: 2, background: 'var(--p-gold-text)' }} title="Majorité 61" />
            </div>
            <p className="text-[10px] mb-4" style={{ color: 'var(--p-text-25)' }}>Le trait doré = la majorité (61).</p>

            {/* partis */}
            <div className="flex flex-wrap gap-2 mb-4">
              {parties.map(p => {
                const on = selected.includes(p.slug);
                const inConflict = on && liveConflicts.some(([a, b]) => a === p.slug || b === p.slug);
                return (
                  <button key={p.slug} onClick={() => toggle(p.slug)}
                    className="inline-flex items-center gap-1.5 rounded-full pl-2 pr-2.5 py-1.5 transition-all"
                    style={{
                      background: on ? (inConflict ? 'var(--p-red-dim)' : 'var(--p-blue-dim)') : 'var(--p-night-2)',
                      border: `1px solid ${on ? (inConflict ? 'var(--p-red)' : 'var(--p-blue)') : 'var(--p-border)'}`,
                      opacity: on ? 1 : 0.85,
                    }}>
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: p.color }} />
                    <span className="text-xs font-semibold" style={{ color: inConflict ? 'var(--p-red)' : 'var(--p-text)' }}>{p.name}</span>
                    <span className="text-xs font-mono font-bold" style={{ color: 'var(--p-text-40)' }}>{p.seats}</span>
                    {on && (inConflict ? <AlertTriangle className="w-3 h-3" style={{ color: 'var(--p-red)' }} /> : <Check className="w-3 h-3" style={{ color: 'var(--p-blue)' }} />)}
                  </button>
                );
              })}
            </div>

            {/* conflits en direct */}
            {liveConflicts.length > 0 && (
              <div className="rounded-xl p-3 mb-4" style={{ background: 'var(--p-red-dim)', border: '0.5px solid rgba(200,16,46,0.3)' }}>
                <p className="text-xs font-bold mb-1" style={{ color: 'var(--p-red)' }}>Incompatibilités :</p>
                {liveConflicts.map(([a, b], i) => (
                  <p key={i} className="text-xs" style={{ color: 'var(--p-text)' }}>
                    {bySlug[a]?.name} <X className="w-3 h-3 inline" style={{ color: 'var(--p-red)' }} /> {bySlug[b]?.name}
                  </p>
                ))}
              </div>
            )}

            {/* verdict */}
            <AnimatePresence>
              {result && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl p-4 mb-4 text-center"
                  style={{ background: result.viable ? 'var(--p-green-dim)' : 'var(--p-gold-dim)', border: `0.5px solid ${result.viable ? 'rgba(26,140,85,0.3)' : 'var(--p-gold-border)'}` }}>
                  {result.viable ? (
                    <><Trophy className="w-6 h-6 mx-auto mb-1" style={{ color: 'var(--p-green)' }} /><p className="font-bold text-sm" style={{ color: '#16794A' }}>Coalition viable ! {result.total} sièges, zéro conflit 🎉</p></>
                  ) : (
                    <p className="font-bold text-sm" style={{ color: gold }}>
                      {result.conflicts.length > 0 ? 'Coalition impossible : des partis refusent de siéger ensemble.' : `Il manque ${MAJORITE - result.total} sièges pour la majorité.`}
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center gap-3">
              <button onClick={check} disabled={selected.length === 0}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-[10px] font-bold text-sm text-white flex-1 justify-center"
                style={{ background: selected.length ? 'linear-gradient(180deg,#ffe08a,#D4AF37)' : 'var(--p-text-10)', color: selected.length ? '#14203D' : 'var(--p-text-40)' }}>
                Vérifier ma coalition
              </button>
              <button onClick={reset} className="inline-flex items-center gap-1.5 px-4 py-3 rounded-[10px] font-semibold text-sm"
                style={{ background: 'transparent', border: '0.5px solid var(--p-border-hover)', color: 'var(--p-text-60)' }}>
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
