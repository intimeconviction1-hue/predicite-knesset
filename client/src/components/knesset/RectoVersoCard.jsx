import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Zap, HelpCircle, RotateCcw } from 'lucide-react';

// La carte recto/verso — signature des « vases communicants » : une FACE MARBRE
// (le fait, sobre, institutionnel, sourcé) qui se retourne au clic sur sa FACE
// JEU (le pari né du fait + un renvoi quiz). « Toute info se joue. »
//
// Données réelles uniquement : on n'affiche le pari que si un vrai marché est
// fourni (bet*). Sinon la face Jeu invite simplement à jouer/apprendre.

export default function RectoVersoCard({
  // Face Marbre (le fait)
  badge, title, fact, nums = [], source,
  // Face Jeu (né du fait)
  betQuestion, betCote, betTo,
  quizTo,
  className = '',
}) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div className={`[perspective:1600px] ${className}`}>
      <div
        onClick={() => setFlipped((f) => !f)}
        className="relative w-full cursor-pointer transition-transform duration-700 [transform-style:preserve-3d]"
        style={{ minHeight: 300, transform: flipped ? 'rotateY(180deg)' : 'none' }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setFlipped((f) => !f); } }}
        aria-label="Retourner la carte"
      >
        {/* FACE MARBRE */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden [backface-visibility:hidden] flex flex-col"
          style={{ background: 'linear-gradient(160deg,#00259a,#0038B8)', border: '0.5px solid rgba(255,255,255,0.14)', boxShadow: '0 24px 50px -26px rgba(0,32,120,0.7)' }}>
          <div className="p-tricolor"><div /><div /><div /></div>
          {/* Menorah filigrane */}
          <svg aria-hidden="true" viewBox="0 0 200 210" className="absolute -right-5 -top-2 w-44 pointer-events-none" style={{ opacity: 0.08, color: '#fff' }}
            fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round">
            <path d="M100,60 L100,176" /><path d="M54,60 A46,46 0 0 0 146,60" /><path d="M67,60 A33,33 0 0 0 133,60" /><path d="M80,60 A20,20 0 0 0 120,60" />
          </svg>
          <div className="relative p-5 flex flex-col h-full">
            {badge && (
              <span className="self-start text-[9.5px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.12)', border: '0.5px solid rgba(255,255,255,0.22)', color: '#fff' }}>{badge}</span>
            )}
            <h4 className="text-white font-black text-xl mt-3 mb-1.5" style={{ fontFamily: 'var(--font-display)' }}>{title}</h4>
            {fact && <p className="text-sm" style={{ color: 'rgba(255,255,255,0.85)' }}>{fact}</p>}
            {nums.length > 0 && (
              <div className="flex gap-5 mt-4">
                {nums.map((x, i) => (
                  <div key={i}>
                    <div className="font-mono font-bold text-2xl leading-none" style={{ color: '#ffd77a' }}>{x.n}</div>
                    <div className="text-[10px] uppercase tracking-wide mt-1" style={{ color: 'rgba(255,255,255,0.7)' }}>{x.label}</div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-auto pt-4">
              {source && <p className="text-[11px] mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>↳ {source}</p>}
              <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold" style={{ color: '#ffd77a' }}>
                <RotateCcw className="w-3.5 h-3.5" /> Retourne la carte — ça se joue
              </span>
            </div>
          </div>
        </div>

        {/* FACE JEU */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden [backface-visibility:hidden] [transform:rotateY(180deg)] flex flex-col"
          style={{ background: 'var(--p-card)', border: '1px solid var(--p-gold)', boxShadow: '0 24px 50px -26px rgba(212,175,55,0.5)' }}>
          <div className="p-5 flex flex-col h-full gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[9.5px] font-mono uppercase tracking-widest" style={{ color: 'var(--p-gold-text)' }}>◆ Ce fait se joue</span>
              <span className="text-[10px] font-mono" style={{ color: 'var(--p-text-40)' }}>recto ↺</span>
            </div>

            {betQuestion && (
              <Link to={betTo || '#'} onClick={(e) => e.stopPropagation()} className="rounded-xl px-3.5 py-3 block transition-transform hover:-translate-y-0.5" style={{ background: 'var(--p-night)', border: '0.5px solid var(--p-border)' }}>
                <div className="flex items-center gap-2 mb-1.5">
                  <Zap className="w-3.5 h-3.5" style={{ color: 'var(--p-blue)' }} />
                  <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--p-text-40)' }}>Le pari</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold" style={{ color: 'var(--p-text)', fontFamily: 'var(--font-display)' }}>{betQuestion}</span>
                  {betCote && <span className="font-mono font-bold text-sm text-white px-2 py-1 rounded-lg flex-shrink-0" style={{ background: 'var(--p-blue)' }}>×{betCote}</span>}
                </div>
              </Link>
            )}

            <Link to={quizTo || '#'} onClick={(e) => e.stopPropagation()} className="rounded-xl px-3.5 py-3 block transition-transform hover:-translate-y-0.5" style={{ background: 'var(--p-night)', border: '0.5px solid var(--p-border)' }}>
              <div className="flex items-center gap-2">
                <HelpCircle className="w-3.5 h-3.5" style={{ color: 'var(--p-gold-text)' }} />
                <span className="text-sm font-bold" style={{ color: 'var(--p-text)' }}>Teste-toi sur le sujet</span>
              </div>
            </Link>

            <p className="text-[11px] mt-auto" style={{ color: 'var(--p-text-40)' }}>↳ toujours relié à sa source · clique pour revenir au fait</p>
          </div>
        </div>
      </div>
    </div>
  );
}
