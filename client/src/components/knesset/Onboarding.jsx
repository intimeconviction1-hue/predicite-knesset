import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Vote, TrendingUp, Trophy, ArrowRight, X } from 'lucide-react';

// Onboarding « premier pronostic en 30 secondes » : modale 3 étapes au tout
// premier passage (drapeau localStorage), pour transformer le curieux en joueur
// dès la première minute. Skippable, thème clair, sur la marque.
const KEY = 'predicite_onboarded_v1';

const STEPS = [
  {
    icon: Vote, color: 'var(--p-blue)',
    title: 'Bienvenue sur PrédiCité',
    body: "L'observatoire francophone de la campagne israélienne — législatives du 27 octobre 2026. Gratuit, sans argent réel : que des points et de la fierté.",
  },
  {
    icon: TrendingUp, color: 'var(--p-gold-text)',
    title: 'Vis la campagne en direct',
    body: "Chaque sondage, chaque primaire, chaque rebondissement se joue. Pronostique les 120 sièges, parie tes jetons sur les événements — plus c'est audacieux, plus ça paie.",
  },
  {
    icon: Trophy, color: '#16794A',
    title: 'Grimpe jusqu’à Oracle',
    body: "Bons pronostics, quiz, séries : tu gagnes des points et tu montes au classement. Défie la communauté francophone et vise le titre d’Oracle.",
  },
];

export default function Onboarding() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    try { if (!localStorage.getItem(KEY)) setVisible(true); } catch { /* localStorage indispo : on n'affiche rien */ }
  }, []);

  const close = () => {
    try { localStorage.setItem(KEY, '1'); } catch { /* ignore */ }
    setVisible(false);
  };

  const s = STEPS[step];
  const last = step === STEPS.length - 1;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-3 sm:p-4"
          style={{ background: 'rgba(5,10,24,0.5)', backdropFilter: 'blur(2px)' }}
          onClick={close}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-2xl overflow-hidden"
            style={{ background: 'var(--p-card)', border: '0.5px solid var(--p-border)', boxShadow: '0 30px 70px -30px rgba(20,32,61,0.5)' }}
          >
            <div className="p-tricolor"><div /><div /><div /></div>
            <button onClick={close} aria-label="Passer" className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center hover:bg-[rgba(20,32,61,0.06)]" style={{ color: 'var(--p-text-40)' }}>
              <X className="w-4 h-4" />
            </button>

            <div className="px-6 pt-8 pb-6 text-center">
              <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: `color-mix(in srgb, ${s.color} 14%, transparent)`, border: `1px solid color-mix(in srgb, ${s.color} 35%, transparent)` }}>
                <s.icon className="w-7 h-7" style={{ color: s.color }} />
              </div>
              <AnimatePresence mode="wait">
                <motion.div key={step} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.22 }}>
                  <h2 className="text-xl md:text-2xl font-black mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--p-text)', letterSpacing: '-0.01em' }}>{s.title}</h2>
                  <p className="text-sm leading-relaxed max-w-sm mx-auto" style={{ color: 'var(--p-text-60)' }}>{s.body}</p>
                </motion.div>
              </AnimatePresence>

              <div className="flex items-center justify-center gap-1.5 mt-5">
                {STEPS.map((_, i) => (
                  <span key={i} className="h-1.5 rounded-full transition-all" style={{ width: i === step ? 20 : 6, background: i === step ? 'var(--p-blue)' : 'var(--p-text-10)' }} />
                ))}
              </div>
            </div>

            <div className="px-6 pb-6 flex items-center gap-3">
              <button onClick={close} className="text-sm hover:opacity-80 transition-opacity" style={{ color: 'var(--p-text-40)' }}>Passer</button>
              <div className="flex-1" />
              {last ? (
                <Link onClick={close} to={createPageUrl('MaRepartition')} className="p-btn-primary inline-flex items-center gap-2">
                  Faire mon premier pronostic <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <button onClick={() => setStep(step + 1)} className="inline-flex items-center gap-2 px-5 py-3 rounded-[10px] font-semibold text-sm text-white transition-transform hover:-translate-y-0.5" style={{ background: 'var(--p-blue)', boxShadow: '0 10px 24px -8px rgba(43,92,230,0.6)' }}>
                  Suivant <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
