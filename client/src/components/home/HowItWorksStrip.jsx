import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Target, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const STEPS = [
  {
    icon: BarChart3,
    num: '01',
    label: 'COMPRENDRE',
    title: 'Analyser les données',
    sub: 'Sondages officiels IFOP, OpinionWay — sources citées, tensions identifiées en temps réel.',
    color: '#4A7FD4',
    glow: 'rgba(74,127,212,0.15)',
    anchor: 'comprendre',
  },
  {
    icon: Target,
    num: '02',
    label: 'ANTICIPER',
    title: 'Pronostiquer les résultats',
    sub: 'Vainqueur, score, participation — avant la deadline. Chaque prédiction compte dans votre score.',
    color: '#D4AF37',
    glow: 'rgba(212,175,55,0.12)',
    anchor: 'anticiper',
  },
  {
    icon: Trophy,
    num: '03',
    label: 'COMPARER',
    title: 'Monter au classement',
    sub: 'Affrontez les meilleurs analystes civiques. Votre indice citoyen mesure votre précision réelle.',
    color: '#22C55E',
    glow: 'rgba(34,197,94,0.12)',
    anchor: 'comparer',
  },
];

export default function HowItWorksStrip() {
  return (
    <section className="relative py-20 overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-px bg-white/10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, scale: 1.3 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="text-center mb-12"
        >
          <p className="text-[11px] uppercase tracking-[0.22em] font-bold mb-3" style={{ color: '#D4AF37' }}>
            La boucle de jeu
          </p>
          <h2
            className="font-black uppercase tracking-[0.06em] text-white mb-3"
            style={{ fontFamily: "'Space Grotesk','Outfit',sans-serif", fontSize: 'clamp(1.6rem,3.5vw,2.4rem)' }}
          >
            Comment ça marche ?
          </h2>
          <p className="text-white/60 text-sm max-w-md mx-auto leading-relaxed">
            Anticipez. Apprenez. Gagnez.
          </p>
        </motion.div>

        {/* 3 columns */}
        <div className="grid md:grid-cols-3 gap-5 mb-12">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1, ease: 'easeOut' }}
              >
                <Link
                  to={`${createPageUrl('ReglesDuJeu')}#${step.anchor}`}
                  className="block relative rounded-3xl border border-white/10 p-6 group hover:border-white/20 transition-all"
                  style={{ background: 'rgba(255,255,255,0.04)' }}
                >
                  {/* Glow on hover */}
                  <div
                    className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                    style={{ background: `radial-gradient(ellipse at 30% 30%, ${step.glow} 0%, transparent 70%)` }}
                  />

                  {/* Number badge */}
                  <div className="flex items-center justify-between mb-5">
                    <span
                      className="text-[11px] font-black tracking-[0.2em] uppercase"
                      style={{ fontFamily: "'JetBrains Mono',monospace", color: step.color }}
                    >
                      {step.num}
                    </span>
                    <span
                      className="text-[9px] font-bold tracking-[0.18em] uppercase px-2 py-0.5 rounded-full border"
                      style={{ color: step.color, borderColor: step.color + '40', background: step.color + '12' }}
                    >
                      {step.label}
                    </span>
                  </div>

                  {/* Icon */}
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: step.color + '18', border: `1px solid ${step.color}30` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: step.color }} />
                  </div>

                  <h3 className="font-bold text-white text-base mb-2 leading-snug">{step.title}</h3>
                  <p className="text-white/60 text-sm leading-relaxed">{step.sub}</p>
                  <p className="text-xs mt-3 font-semibold transition-colors" style={{ color: step.color }}>
                    En savoir plus →
                  </p>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="flex justify-center"
        >
          <Link to={createPageUrl('Predictions')}>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-[0.12em]"
              style={{
                background: 'linear-gradient(135deg, #1E3A8A 0%, #2B5CE6 100%)',
                color: '#F5F2ED',
                boxShadow: '0 0 40px rgba(43,92,230,0.35), 0 0 80px rgba(43,92,230,0.15)',
                fontFamily: "'Space Grotesk','Outfit',sans-serif",
                letterSpacing: '0.1em',
              }}
            >
              Rejoindre l'arène stratégique →
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}