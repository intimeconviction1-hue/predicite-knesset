import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { TrendingUp, ChevronRight, Trophy, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function HomePredictionCTA({ variant = 'mid' }) {
  if (variant === 'bottom') {
    return (
      <div className="bg-[#07122A] border-t border-white/8 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#D4A017]/15 border border-[#D4A017]/30 mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4A017] animate-pulse" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#D4A017]">
                Clôture le 15 mars 2026 · 8h00
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Votre pronostic fait la différence.
            </h2>
            <p className="text-white/50 text-sm mb-8 max-w-lg mx-auto leading-relaxed">
              Plus de 30 villes à analyser. Gagnez des points sur la précision de vos prédictions — gagnant, pourcentage, participation.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to={createPageUrl('Predictions')}>
                <button className="group flex items-center gap-2 px-8 py-3.5 rounded-xl bg-[#034EA2] hover:bg-[#023882] text-white font-bold text-sm transition-all shadow-lg shadow-[#034EA2]/40 hover:scale-[1.02]">
                  <TrendingUp className="w-4 h-4" />
                  Faire mes pronostics
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </Link>
              <Link to={createPageUrl('Leaderboard')}>
                <button className="flex items-center gap-2 px-8 py-3.5 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-white font-semibold text-sm transition-all">
                  <Trophy className="w-4 h-4 text-[#D4A017]" />
                  Voir le classement
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // mid variant — between polls and leaderboard
  return (
    <div className="bg-[#EAF0FF] border-y border-[#034EA2]/15 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#034EA2] flex items-center justify-center shrink-0">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-[#1A3580] font-bold text-base" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Les sondages sont là. Vos pronostics aussi ?
              </p>
              <p className="text-[#1A3580]/60 text-sm mt-0.5">
                Prédisez le gagnant, le pourcentage, la participation — et montez dans le classement.
              </p>
            </div>
          </div>
          <Link to={createPageUrl('Predictions')} className="shrink-0">
            <button className="group flex items-center gap-2 px-6 py-3 rounded-xl bg-[#034EA2] hover:bg-[#023882] text-white font-bold text-sm transition-all shadow-md shadow-[#034EA2]/25 hover:scale-[1.02]">
              <BarChart3 className="w-4 h-4" />
              Faire mes pronostics
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}