import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Sparkles } from 'lucide-react';
import { computeScore, titleForScore, nextTitle } from '@/lib/score';
import ConfettiBurst from '@/components/knesset/ConfettiBurst';

// Progression vers le palier suivant : « plus que X pts avant Analyste ».
// Rend la montée en grade DÉSIRABLE (registre Jeu) et la CÉLÈBRE : quand le
// titre change par rapport au dernier vu (mémorisé en localStorage), on tire
// une salve de confettis et on affiche « Nouveau palier ! ».
// N'affiche rien sans progression réelle (aucune donnée inventée).

const KEY = 'predicite_last_title';

export default function ProgressionPalier({ progress, compact = false }) {
  const [celebrate, setCelebrate] = useState(0);
  const [justLeveled, setJustLeveled] = useState(false);

  const score = computeScore(progress);
  const title = titleForScore(score);
  const next = nextTitle(score);

  useEffect(() => {
    if (!progress) return;
    try {
      const last = localStorage.getItem(KEY);
      if (last && last !== title.label) {
        setCelebrate((c) => c + 1);
        setJustLeveled(true);
        setTimeout(() => setJustLeveled(false), 6000);
      }
      localStorage.setItem(KEY, title.label);
    } catch { /* localStorage indispo */ }
  }, [title.label, progress]);

  if (!progress) return null;

  // Progression au sein du palier courant (borne basse → borne haute).
  const from = title.min;
  const to = next ? next.min : Math.max(score, title.min);
  const pct = next ? Math.min(100, Math.round(((score - from) / Math.max(1, to - from)) * 100)) : 100;
  const reste = next ? Math.max(0, next.min - score) : 0;

  return (
    <div className={`rounded-2xl ${compact ? 'p-4' : 'p-5'}`} style={{ background: 'var(--p-card)', border: `0.5px solid ${title.color}55` }}>
      <ConfettiBurst trigger={celebrate} />
      <div className="flex items-center justify-between gap-3 mb-2.5 flex-wrap">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4" style={{ color: title.text }} />
          <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: title.text }}>
            {justLeveled ? 'Nouveau palier !' : 'Ta progression'}
          </span>
          {justLeveled && <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--p-gold-text)' }} />}
        </div>
        <span className="font-mono font-bold text-sm" style={{ color: 'var(--p-text)' }}>{score.toLocaleString('fr-FR')} pts</span>
      </div>

      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-lg font-black" style={{ fontFamily: 'var(--font-display)', color: title.text }}>{title.label}</span>
        {next && <span className="text-xs" style={{ color: 'var(--p-text-40)' }}>→ {next.label}</span>}
      </div>

      <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--p-text-10)' }}>
        <motion.div className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${title.color}, ${next ? next.color : title.color})` }}
          initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.9, ease: 'easeOut' }} />
      </div>

      <p className="text-xs mt-2" style={{ color: 'var(--p-text-60)' }}>
        {next
          ? <>Plus que <b style={{ color: 'var(--p-text)' }}>{reste.toLocaleString('fr-FR')} pts</b> avant <b style={{ color: next.text }}>{next.label}</b>.</>
          : <>Palier maximal atteint — tu es <b style={{ color: title.text }}>Oracle</b>.</>}
      </p>
    </div>
  );
}
