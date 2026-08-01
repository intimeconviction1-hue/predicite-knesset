import React from 'react';
import { base44 } from '@/api/client';
import { Lock, ArrowRight, Trophy, Coins } from 'lucide-react';

// Mur d'inscription — s'affiche quand un invité a épuisé ses parties d'essai.
// Ton positif (« tu as testé, la suite est gratuite »), pas punitif.
export default function TrialWall({ plays = 0 }) {
  return (
    <div className="p-card p-6 md:p-7 text-center">
      <span className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: 'var(--p-blue-dim)' }}>
        <Lock className="w-5 h-5" style={{ color: 'var(--p-blue)' }} />
      </span>
      <p className="text-[11px] font-black uppercase tracking-widest mb-1" style={{ color: 'var(--p-text-40)' }}>Fin de la découverte</p>
      <h3 className="p-title text-xl mb-2">Crée ton compte pour continuer</h3>
      <p className="p-body text-sm mb-5">
        Tu as testé {plays} partie{plays > 1 ? 's' : ''} 🎯 La suite est <b>gratuite</b> — et là, tout compte pour de vrai.
      </p>

      <div className="flex flex-col gap-2.5 mb-6 text-left max-w-xs mx-auto">
        <div className="flex items-center gap-2.5">
          <Trophy className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--p-gold-text)' }} />
          <span className="p-body text-sm" style={{ color: 'var(--p-text)' }}>Ton score sauvegardé + le classement</span>
        </div>
        <div className="flex items-center gap-2.5">
          <Coins className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--p-blue)' }} />
          <span className="p-body text-sm" style={{ color: 'var(--p-text)' }}>Tes jetons de la semaine à miser</span>
        </div>
      </div>

      <button onClick={() => base44.auth.redirectToLogin()}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-[10px] font-bold text-[15px] text-white"
        style={{ background: 'var(--p-blue)', boxShadow: '0 12px 30px -10px rgba(43,92,230,0.6)' }}>
        Créer mon compte gratuit <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
