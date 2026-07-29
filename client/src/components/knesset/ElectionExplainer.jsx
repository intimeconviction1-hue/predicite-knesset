import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Vote, AlertTriangle, Scale, Landmark, Crown, RotateCcw, Play, Pause } from 'lucide-react';

// Explainer animé « de la voix au siège » : une mini-séquence qui se joue comme
// une vidéo (auto-avance, barre de progression, replay), mais 100 % code — aucun
// fichier ni droit à gérer. Ne contient que des FAITS STABLES du système
// électoral israélien (rien d'inventé, rien de daté).
//
// Accessibilité : sous prefers-reduced-motion, on n'auto-joue pas — toutes les
// étapes sont empilées, lisibles d'un coup.

const STEPS = [
  { icon: Vote,          color: '#2B5CE6', kicker: 'Le vote',    stat: '1 liste',        title: 'Des millions de voix',       text: 'Chaque électeur vote pour UNE liste (pas un nom) — au scrutin proportionnel national.' },
  { icon: AlertTriangle, color: '#C8102E', kicker: 'Le filtre',  stat: '3,25 %',         title: "Le seuil d'entrée",          text: "Une liste sous 3,25 % des voix n'obtient aucun siège. Souvent, tout se joue là." },
  { icon: Scale,         color: '#7A5F1A', kicker: 'Le calcul',  stat: 'proportionnel',  title: 'La répartition des sièges',  text: 'Les 120 sièges se répartissent à la proportionnelle (méthode Bader-Ofer), avec accords d’excédents.' },
  { icon: Landmark,      color: '#0EA5E9', kicker: "L'assemblée", stat: '120',           title: 'Les sièges de la Knesset',   text: 'La Knesset compte 120 sièges à pourvoir.' },
  { icon: Crown,         color: '#D4AF37', kicker: 'Gouverner',  stat: '61',             title: 'La majorité',                text: 'Il faut réunir 61 sièges — une coalition — pour former un gouvernement.' },
];

const STEP_MS = 3400;

function StepVisual({ i, color }) {
  // Petit visuel par étape, sobre (registre Marbre).
  if (i === 1) {
    return (
      <div className="w-full h-2 rounded-full mt-4" style={{ background: 'var(--p-text-10)' }}>
        <motion.div className="h-full rounded-full" style={{ background: color }} initial={{ width: 0 }} animate={{ width: '3.25%' }} transition={{ duration: 1, ease: 'easeOut' }} />
      </div>
    );
  }
  // dots (voix / sièges) pour les autres étapes
  const n = i === 0 ? 24 : i === 3 ? 30 : i === 4 ? 30 : 18;
  const lit = i === 4 ? 16 : n; // pour « 61 », on illumine ~la majorité
  return (
    <div className="flex flex-wrap gap-1 mt-4 max-w-[240px]">
      {Array.from({ length: n }).map((_, k) => (
        <motion.span key={k}
          className="w-2 h-2 rounded-full"
          style={{ background: k < lit ? color : 'var(--p-text-10)' }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: k * 0.015, duration: 0.2 }}
        />
      ))}
    </div>
  );
}

export default function ElectionExplainer() {
  const reduced = useReducedMotion();
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);
  const finished = step >= STEPS.length - 1 && !playing;

  useEffect(() => {
    if (reduced || !playing) return undefined;
    if (step >= STEPS.length - 1) { setPlaying(false); return undefined; }
    const id = setTimeout(() => setStep((s) => s + 1), STEP_MS);
    return () => clearTimeout(id);
  }, [step, playing, reduced]);

  // Repli accessible : tout empilé, pas d'auto-play.
  if (reduced) {
    return (
      <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--p-card)', borderColor: 'var(--p-border)' }}>
        <div className="p-tricolor"><div /><div /><div /></div>
        <div className="p-5 space-y-4">
          <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--p-gold-text)' }}>De la voix au siège</p>
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${s.color}18`, border: `1px solid ${s.color}40` }}>
                <s.icon className="w-4 h-4" style={{ color: s.color }} />
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: 'var(--p-text)' }}>{s.title} <span className="font-mono ml-1" style={{ color: s.color }}>{s.stat}</span></p>
                <p className="text-xs" style={{ color: 'var(--p-text-60)' }}>{s.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const s = STEPS[step];

  return (
    <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--p-card)', borderColor: 'var(--p-border)' }}>
      <div className="p-tricolor"><div /><div /><div /></div>

      {/* barre de progression segmentée */}
      <div className="flex gap-1 px-5 pt-4">
        {STEPS.map((_, i) => (
          <div key={i} className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'var(--p-text-10)' }}>
            <motion.div className="h-full" style={{ background: STEPS[i].color }}
              initial={false}
              animate={{ width: i < step ? '100%' : i === step ? '100%' : '0%' }}
              transition={{ duration: i === step && playing ? STEP_MS / 1000 : 0.3, ease: 'linear' }}
            />
          </div>
        ))}
      </div>

      <div className="px-5 pb-3 pt-4 flex items-center justify-between">
        <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--p-gold-text)' }}>De la voix au siège · en 20 s</p>
        <button
          onClick={() => { if (finished) { setStep(0); setPlaying(true); } else { setPlaying((p) => !p); } }}
          className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-[rgba(20,32,61,0.06)]"
          aria-label={finished ? 'Revoir' : playing ? 'Pause' : 'Jouer'}
          style={{ color: 'var(--p-text-40)' }}
        >
          {finished ? <RotateCcw className="w-4 h-4" /> : playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>
      </div>

      <div className="px-5 pb-6 min-h-[180px]">
        <AnimatePresence mode="wait">
          <motion.div key={step}
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.35 }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${s.color}18`, border: `1px solid ${s.color}40` }}>
                <s.icon className="w-6 h-6" style={{ color: s.color }} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: s.color }}>{s.kicker}</p>
                <h3 className="text-xl font-black" style={{ fontFamily: 'var(--font-display)', color: 'var(--p-text)' }}>{s.title}</h3>
              </div>
              <div className="ml-auto text-3xl font-black font-mono" style={{ color: s.color }}>{s.stat}</div>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--p-text-60)' }}>{s.text}</p>
            <StepVisual i={step} color={s.color} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
