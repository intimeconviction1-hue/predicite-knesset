import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Zap, Flame, Coins, Trophy, ArrowRight, Target } from 'lucide-react';

// Le TERRAIN DE JEU — le contrepoids ludique du registre Marbre. Registre JEU :
// or, mouvement, arrondi, chiffres qui claquent. On y met ce qui se JOUE
// maintenant (cotes réelles + pronostic + quiz), pour donner envie d'agir tout
// de suite. Données réelles uniquement : pas de cote, pas de carte.

export default function TerrainDeJeu({ marches = [], jetons = null, streak = 0 }) {
  const cotes = marches
    .flatMap((m) => (m.issues || []).slice(0, m.type === 'evenement' ? 2 : 1).map((iss) => ({
      id: iss.id, question: m.question, label: iss.label, cote: iss.cote, evenement: m.type === 'evenement',
    })))
    .slice(0, 4);

  return (
    <div className="relative rounded-3xl overflow-hidden" style={{
      background: 'linear-gradient(150deg, #1a1408 0%, #2b2110 45%, #14203D 100%)',
      border: '1px solid var(--p-gold-strong)',
      boxShadow: '0 30px 70px -34px var(--p-gold-glow)',
    }}>
      {/* halos or animés — l'énergie du registre Jeu */}
      <motion.div className="absolute pointer-events-none" aria-hidden="true"
        style={{ width: 420, height: 420, borderRadius: '9999px', background: 'radial-gradient(circle,#D4AF37,transparent 70%)', opacity: 0.28, filter: 'blur(60px)', left: '-12%', top: '-40%' }}
        animate={{ x: [0, 30, 0], y: [0, 18, 0] }} transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.div className="absolute pointer-events-none" aria-hidden="true"
        style={{ width: 380, height: 380, borderRadius: '9999px', background: 'radial-gradient(circle,#2B5CE6,transparent 70%)', opacity: 0.3, filter: 'blur(60px)', right: '-10%', bottom: '-40%' }}
        animate={{ x: [0, -24, 0], y: [0, -14, 0] }} transition={{ duration: 17, repeat: Infinity, ease: 'easeInOut' }} />

      <div className="relative p-6 md:p-7">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-1">
          <div className="flex items-center gap-2">
            <motion.span animate={{ scale: [1, 1.18, 1] }} transition={{ duration: 1.6, repeat: Infinity }}>
              <Zap className="w-5 h-5" style={{ color: '#ffd77a' }} />
            </motion.span>
            <span className="text-[11px] font-black uppercase tracking-[0.18em]" style={{ color: '#ffd77a' }}>Le terrain de jeu</span>
          </div>
          {/* état joueur (réel) */}
          <div className="flex items-center gap-2">
            {streak > 1 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold font-mono" style={{ background: 'rgba(255,122,26,0.18)', color: '#ffb27a', border: '0.5px solid rgba(255,122,26,0.4)' }}>
                <Flame className="w-3.5 h-3.5" /> {streak}
              </span>
            )}
            {jetons != null && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold font-mono" style={{ background: 'var(--p-gold-dim)', color: '#ffd77a', border: '0.5px solid var(--p-gold-strong)' }}>
                <Coins className="w-3.5 h-3.5" /> {jetons.toLocaleString('fr-FR')}
              </span>
            )}
          </div>
        </div>

        <h2 className="text-2xl md:text-3xl font-black text-white mb-1" style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>
          À toi de jouer.
        </h2>
        <p className="text-sm mb-5" style={{ color: 'rgba(255,255,255,0.72)' }}>
          Tout ce qui bouge se joue — en jetons gratuits. Vise le titre d’<b style={{ color: '#ffd77a' }}>Oracle</b>.
        </p>

        {/* cotes du moment — cliquables */}
        {cotes.length > 0 && (
          <div className="grid sm:grid-cols-2 gap-2.5 mb-5">
            {cotes.map((c) => (
              <Link key={c.id} to={createPageUrl('Paris')}
                className="group rounded-2xl px-4 py-3 flex items-center justify-between gap-3 transition-transform hover:-translate-y-0.5"
                style={{ background: 'rgba(255,255,255,0.07)', border: '0.5px solid rgba(255,255,255,0.16)', backdropFilter: 'blur(6px)' }}>
                <div className="min-w-0">
                  <div className="text-[9px] font-bold uppercase tracking-widest mb-0.5" style={{ color: c.evenement ? '#ff9d6b' : '#9fc0ff' }}>
                    {c.evenement ? 'Événement' : 'Sondage'}
                  </div>
                  <div className="text-[13px] font-semibold text-white truncate">{c.label || c.question}</div>
                </div>
                <span className="font-mono font-black text-lg flex-shrink-0" style={{ color: '#ffd77a' }}>×{c.cote.toFixed(2)}</span>
              </Link>
            ))}
          </div>
        )}

        {/* actions — jouer en 1 clic */}
        <div className="flex flex-wrap gap-2.5">
          <Link to={createPageUrl('Paris')} className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-transform hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg,#ffd77a,#D4AF37)', color: '#2b2110', boxShadow: '0 12px 30px -10px var(--p-gold-glow)' }}>
            <Zap className="w-4 h-4" /> Place ta mise
          </Link>
          <Link to={createPageUrl('MaRepartition')} className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm text-white transition-transform hover:-translate-y-0.5"
            style={{ background: 'rgba(255,255,255,0.12)', border: '0.5px solid rgba(255,255,255,0.25)' }}>
            <Target className="w-4 h-4" /> Mon pronostic
          </Link>
          <Link to={createPageUrl('Leaderboard')} className="inline-flex items-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-opacity hover:opacity-80"
            style={{ color: 'rgba(255,255,255,0.8)' }}>
            <Trophy className="w-4 h-4" /> Classement <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
