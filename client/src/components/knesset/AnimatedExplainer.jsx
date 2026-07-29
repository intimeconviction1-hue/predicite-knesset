import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Vote, AlertTriangle, Scale, Landmark, Crown,
  Target, TrendingUp, HelpCircle, Trophy,
  RotateCcw, Play, Pause,
} from 'lucide-react';

// Explainer animé réutilisable : une mini-séquence qui se joue comme une vidéo
// (auto-avance, barre de progression, pause/replay), 100 % code — aucun fichier
// ni droit. Sert à TOUTE pédagogie du site : le fonctionnement des élections ET
// nos propres règles de jeu. Évolutif : on ajoute un preset de `steps`.
//
// Un step : { icon, color, kicker, stat, title, text, bar?, dots? }
//  - bar  : nombre 0..100 → une barre qui se remplit jusqu'à ce %
//  - dots : { n, lit }      → n pastilles, `lit` colorées
// Accessibilité : sous prefers-reduced-motion, tout est empilé (pas d'auto-play).

// Preset « de la voix au siège » (faits stables du système électoral israélien).
export const ELECTION_STEPS = [
  { icon: Vote,          color: '#2B5CE6', kicker: 'Le vote',     stat: '1 liste',       title: 'Des millions de voix',      text: 'Chaque électeur vote pour UNE liste (pas un nom) — au scrutin proportionnel national.', dots: { n: 24, lit: 24 } },
  { icon: AlertTriangle, color: '#C8102E', kicker: 'Le filtre',   stat: '3,25 %',        title: "Le seuil d'entrée",         text: "Une liste sous 3,25 % des voix n'obtient aucun siège. Souvent, tout se joue là.", bar: 3.25 },
  { icon: Scale,         color: '#7A5F1A', kicker: 'Le calcul',   stat: 'proportionnel', title: 'La répartition des sièges', text: 'Les 120 sièges se répartissent à la proportionnelle (méthode Bader-Ofer), avec accords d’excédents.', dots: { n: 18, lit: 18 } },
  { icon: Landmark,      color: '#0EA5E9', kicker: "L'assemblée", stat: '120',           title: 'Les sièges de la Knesset',  text: 'La Knesset compte 120 sièges à pourvoir.', dots: { n: 30, lit: 30 } },
  { icon: Crown,         color: '#D4AF37', kicker: 'Gouverner',   stat: '61',            title: 'La majorité',               text: 'Il faut réunir 61 sièges — une coalition — pour former un gouvernement.', dots: { n: 30, lit: 16 } },
];

// Preset « comment jouer » (NOS règles à nous — pédagogie du jeu).
export const GAME_STEPS = [
  { icon: Target,     color: '#2B5CE6', kicker: 'Anticipe', stat: '120',   title: 'Pronostique les sièges', text: 'Pour chaque liste, prédis un nombre de sièges. Au dépouillement, plus tu es juste, plus tu marques (jusqu’à +150 par liste).' },
  { icon: TrendingUp, color: '#0EA5E9', kicker: 'Parie',    stat: 'cotes', title: 'Parie sur la campagne',  text: 'Sondages et événements, 100 % en jetons gratuits. Bien parier fait monter ton Score — pas seulement tes jetons.' },
  { icon: HelpCircle, color: '#7A5F1A', kicker: 'Apprends', stat: 'quiz',  title: 'Teste-toi, apprends',    text: 'Chaque bonne réponse rapporte (plafonné). Tente un défi série pour miser tes jetons sur une série.' },
  { icon: Trophy,     color: '#D4AF37', kicker: 'Grimpe',   stat: 'Oracle', title: 'Monte au classement',   text: 'Un seul Score décide de ton rang, de Citoyen à Oracle — ici comme dans tes ligues privées.' },
];

const STEP_MS = 3400;

function StepVisual({ step }) {
  if (typeof step.bar === 'number') {
    return (
      <div className="w-full h-2 rounded-full mt-4" style={{ background: 'var(--p-text-10)' }}>
        <motion.div className="h-full rounded-full" style={{ background: step.color }} initial={{ width: 0 }} animate={{ width: `${step.bar}%` }} transition={{ duration: 1, ease: 'easeOut' }} />
      </div>
    );
  }
  if (step.dots) {
    const { n, lit } = step.dots;
    return (
      <div className="flex flex-wrap gap-1 mt-4 max-w-[240px]">
        {Array.from({ length: n }).map((_, k) => (
          <motion.span key={k} className="w-2 h-2 rounded-full"
            style={{ background: k < lit ? step.color : 'var(--p-text-10)' }}
            initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: k * 0.015, duration: 0.2 }} />
        ))}
      </div>
    );
  }
  return null;
}

export default function AnimatedExplainer({ steps = ELECTION_STEPS, label = 'De la voix au siège · en 20 s' }) {
  const reduced = useReducedMotion();
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);
  const finished = step >= steps.length - 1 && !playing;

  useEffect(() => {
    if (reduced || !playing) return undefined;
    if (step >= steps.length - 1) { setPlaying(false); return undefined; }
    const id = setTimeout(() => setStep((s) => s + 1), STEP_MS);
    return () => clearTimeout(id);
  }, [step, playing, reduced, steps.length]);

  if (reduced) {
    return (
      <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--p-card)', borderColor: 'var(--p-border)' }}>
        <div className="p-tricolor"><div /><div /><div /></div>
        <div className="p-5 space-y-4">
          <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--p-gold-text)' }}>{label}</p>
          {steps.map((s, i) => (
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

  const s = steps[step];

  return (
    <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--p-card)', borderColor: 'var(--p-border)' }}>
      <div className="p-tricolor"><div /><div /><div /></div>

      <div className="flex gap-1 px-5 pt-4">
        {steps.map((st, i) => (
          <div key={i} className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'var(--p-text-10)' }}>
            <motion.div className="h-full" style={{ background: st.color }}
              initial={false}
              animate={{ width: i <= step ? '100%' : '0%' }}
              transition={{ duration: i === step && playing ? STEP_MS / 1000 : 0.3, ease: 'linear' }} />
          </div>
        ))}
      </div>

      <div className="px-5 pb-3 pt-4 flex items-center justify-between">
        <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--p-gold-text)' }}>{label}</p>
        <button
          onClick={() => { if (finished) { setStep(0); setPlaying(true); } else { setPlaying((p) => !p); } }}
          className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-[rgba(20,32,61,0.06)]"
          aria-label={finished ? 'Revoir' : playing ? 'Pause' : 'Jouer'}
          style={{ color: 'var(--p-text-40)' }}
        >
          {finished ? <RotateCcw className="w-4 h-4" /> : playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>
      </div>

      <div className="px-5 pb-6 min-h-[176px]">
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
              <div className="ml-auto text-2xl md:text-3xl font-black font-mono" style={{ color: s.color }}>{s.stat}</div>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--p-text-60)' }}>{s.text}</p>
            <StepVisual step={s} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
