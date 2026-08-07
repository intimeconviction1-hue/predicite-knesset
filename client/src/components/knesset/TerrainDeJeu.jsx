import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Zap, Flame, Coins, Trophy, ArrowRight, Target } from 'lucide-react';
import CoteTile from '@/components/knesset/CoteTile';

// Le TERRAIN DE JEU — le contrepoids ludique du registre Marbre. Registre JEU :
// or, mouvement, arrondi, chiffres qui claquent. On y met ce qui se JOUE
// maintenant (cotes réelles), pour donner envie d'agir tout de suite.
// Données réelles uniquement : pas de cote, pas de carte.
//
// 2026-08-07 — les cotes se lisaient mal, et c'était un défaut de fond, pas de
// style : la tuile affichait `issue.label` seul. Sur un marché d'événement, cela
// donnait « Oui ×2,22 » — oui à QUOI ? La question, elle, n'apparaissait nulle
// part. Les cotes sont désormais groupées PAR MARCHÉ, la question au-dessus de
// ses issues, comme sur n'importe quel tableau de cotes : on lit d'abord sur
// quoi l'on parie, ensuite à combien.

const NB_MARCHES = 2;      // deux marchés, quatre cotes : de quoi choisir sans noyer
const TRONQUE = 74;

const trunc = (s, n = TRONQUE) => (s && s.length > n ? `${s.slice(0, n - 1)}…` : s);

export default function TerrainDeJeu({ marches = [], jetons = null, streak = 0 }) {
  const parisUrl = createPageUrl('Paris');
  const ouverts = marches.filter(m => (m.issues || []).length > 0).slice(0, NB_MARCHES);

  return (
    <div className="relative rounded-3xl overflow-hidden" style={{
      background: 'var(--p-jeu-surface)',
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
            <span aria-hidden="true" className="p-live-dot" />
            <span className="text-[11px] font-black uppercase tracking-[0.18em]" style={{ color: 'var(--p-gold-bright)' }}>Le terrain de jeu</span>
          </div>
          {/* état joueur (réel) */}
          <div className="flex items-center gap-2">
            {streak > 1 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold font-mono" style={{ background: 'rgba(255,122,26,0.18)', color: '#ffb27a', border: '0.5px solid rgba(255,122,26,0.4)' }}>
                <Flame className="w-3.5 h-3.5" /> {streak}
              </span>
            )}
            {jetons != null && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold font-mono" style={{ background: 'var(--p-gold-dim)', color: 'var(--p-gold-bright)', border: '0.5px solid var(--p-gold-strong)' }}>
                <Coins className="w-3.5 h-3.5" /> {jetons.toLocaleString('fr-FR')}
              </span>
            )}
          </div>
        </div>

        <h2 className="text-2xl md:text-3xl font-black text-white mb-1" style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>
          À toi de jouer.
        </h2>
        <p className="text-sm mb-5" style={{ color: 'var(--p-jeu-text)' }}>
          Tout ce qui bouge se joue — en jetons gratuits. Vise le titre d’<b style={{ color: 'var(--p-gold-bright)' }}>Oracle</b>.
        </p>

        {/* Les marchés ouverts : la question, puis ses cotes. */}
        {ouverts.length > 0 && (
          <div className="grid sm:grid-cols-2 gap-4 mb-5">
            {ouverts.map((m) => (
              <div key={m.id}>
                <div className="flex items-start gap-2 mb-2">
                  <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5"
                    style={{
                      color: m.type === 'evenement' ? '#ff9d6b' : '#9fc0ff',
                      border: `0.5px solid ${m.type === 'evenement' ? 'rgba(255,157,107,.4)' : 'rgba(159,192,255,.4)'}`,
                    }}>
                    {m.type === 'evenement' ? 'Événement' : 'Sondage'}
                  </span>
                  <p className="text-[12.5px] font-semibold leading-snug" style={{ color: 'var(--p-jeu-text)' }}>{trunc(m.question)}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {m.issues.slice(0, 2).map((iss) => (
                    <CoteTile key={iss.id} registre="sombre" taille="sm"
                      label={iss.label} cote={iss.cote} to={parisUrl} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* actions — jouer en 1 clic */}
        <div className="flex flex-wrap gap-2.5">
          <Link to={parisUrl} className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-transform hover:-translate-y-0.5 active:translate-y-0 active:scale-[.98]"
            style={{ background: 'var(--p-grad-gold)', color: '#2b2110', boxShadow: '0 12px 30px -10px var(--p-gold-glow)' }}>
            <Zap className="w-4 h-4" /> Place ta mise
          </Link>
          <Link to={createPageUrl('MaRepartition')} className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm text-white transition-transform hover:-translate-y-0.5 active:translate-y-0 active:scale-[.98]"
            style={{ background: 'var(--p-jeu-tile-hi)', border: '1px solid var(--p-jeu-brd-hi)' }}>
            <Target className="w-4 h-4" /> Mon pronostic
          </Link>
          <Link to={createPageUrl('Leaderboard')} className="inline-flex items-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-opacity hover:opacity-80"
            style={{ color: 'var(--p-jeu-text)' }}>
            <Trophy className="w-4 h-4" /> Classement <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
