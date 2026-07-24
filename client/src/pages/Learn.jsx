import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { ChevronRight, BookOpen } from 'lucide-react';
import KnessetRulesModule from '@/components/election/KnessetRulesModule';
import CoalitionRulesModule from '@/components/election/CoalitionRulesModule';

export default function Learn() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--p-night)' }}>
      <div className="relative border-b border-white/8" style={{ background: 'linear-gradient(180deg, rgba(30,58,138,0.15) 0%, transparent 100%)' }}>
        <div className="max-w-4xl mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex items-center gap-2 text-white/30 text-sm mb-6"
          >
            <Link to={createPageUrl('Home')} className="hover:text-white/60 transition-colors">Accueil</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-white/60">Comprendre</span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.06 }}
            className="flex items-center gap-2 mb-3"
          >
            <BookOpen className="w-4 h-4" style={{ color: 'var(--p-gold)' }} />
            <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--p-gold)' }}>Comprendre avant de pronostiquer</p>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.12 }}
            className="text-3xl md:text-4xl font-black text-white mb-4 leading-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Les législatives israéliennes, expliquées
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.18 }}
            className="text-white/50 text-base leading-relaxed max-w-2xl"
          >
            Le 27 octobre 2026, Israël élit les 120 membres de la 26ᵉ Knesset. Deux
            choses à comprendre avant de pronostiquer : comment les voix se
            transforment en sièges, et comment un gouvernement se forme une fois
            les résultats connus.
          </motion.p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-10">
        <KnessetRulesModule />
        <CoalitionRulesModule />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-10%' }}
          transition={{ duration: 0.4 }}
          className="rounded-2xl border border-white/10 p-8 text-center"
          style={{ background: 'rgba(30,58,138,0.15)' }}
        >
          <p className="text-white/50 text-sm mb-4">Prêt à mettre ça en pratique ?</p>
          <Link
            to={createPageUrl('Listes')}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-85"
            style={{ background: 'linear-gradient(135deg,#1E3A8A,#2B5CE6)' }}
          >
            Voir les listes et pronostiquer
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
