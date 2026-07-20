import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ChevronRight, BookOpen } from 'lucide-react';
import KnessetRulesModule from '@/components/election/KnessetRulesModule';
import CoalitionRulesModule from '@/components/election/CoalitionRulesModule';

export default function Learn() {
  return (
    <div className="min-h-screen" style={{ background: '#050A18' }}>
      <div className="relative border-b border-white/8" style={{ background: 'linear-gradient(180deg, rgba(30,58,138,0.15) 0%, transparent 100%)' }}>
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="flex items-center gap-2 text-white/30 text-sm mb-6">
            <Link to={createPageUrl('Home')} className="hover:text-white/60 transition-colors">Accueil</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-white/60">Comprendre</span>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4" style={{ color: '#D4AF37' }} />
            <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: '#D4AF37' }}>Comprendre avant de pronostiquer</p>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white mb-4 leading-tight" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>
            Les législatives israéliennes, expliquées
          </h1>
          <p className="text-white/50 text-base leading-relaxed max-w-2xl">
            Le 27 octobre 2026, Israël élit les 120 membres de la 26ᵉ Knesset. Deux
            choses à comprendre avant de pronostiquer : comment les voix se
            transforment en sièges, et comment un gouvernement se forme une fois
            les résultats connus.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-10">
        <KnessetRulesModule />
        <CoalitionRulesModule />

        <div className="rounded-2xl border border-white/10 p-8 text-center" style={{ background: 'rgba(30,58,138,0.15)' }}>
          <p className="text-white/50 text-sm mb-4">Prêt à mettre ça en pratique ?</p>
          <Link
            to={createPageUrl('Listes')}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-85"
            style={{ background: 'linear-gradient(135deg,#1E3A8A,#2B5CE6)' }}
          >
            Voir les listes et pronostiquer
          </Link>
        </div>
      </div>
    </div>
  );
}
