import React from 'react';
import { Link } from 'react-router-dom';

// La colonne alternée : le fil (bleu → or) qui coud l'INFO (Marbre) et le JEU
// en zigzag. Rend visible le principe des vases communicants — « toute info se
// joue, tout jeu s'explique ». Items descriptifs + liens réels, aucune donnée
// inventée. Responsive : fil à gauche, cartes empilées, alternance d'accent.
//
// item : { type: 'info' | 'jeu', kicker, title, desc, linkLabel, to }

export default function ColonneAlternee({ items = [] }) {
  if (!items.length) return null;
  return (
    <div className="relative">
      <div className="absolute left-4 top-1 bottom-1 w-0.5 rounded-full" style={{ background: 'linear-gradient(180deg,#0038B8,#D4AF37)' }} />
      <div className="space-y-3 pl-10">
        {items.map((it, i) => {
          const isInfo = it.type === 'info';
          const accent = isInfo ? '#0038B8' : '#D4AF37';
          const accentText = isInfo ? 'var(--p-blue)' : 'var(--p-gold-text)';
          return (
            <div key={i} className="relative rounded-2xl p-4 transition-transform hover:-translate-y-0.5" style={{ background: 'var(--p-card)', border: '0.5px solid var(--p-border)', borderLeft: `3px solid ${accent}` }}>
              <span className="absolute w-3 h-3 rounded-full" style={{ left: '-1.68rem', top: '1.15rem', background: accent, border: '2px solid var(--p-night)' }} />
              <div className="text-[9px] font-mono uppercase tracking-widest mb-1" style={{ color: accentText }}>
                {isInfo ? '◆ Marbre · info' : '◆ Jeu'} · {it.kicker}
              </div>
              <div className="font-bold text-sm" style={{ fontFamily: 'var(--font-display)', color: 'var(--p-text)' }}>{it.title}</div>
              {it.desc && <div className="text-xs mt-0.5" style={{ color: 'var(--p-text-60)' }}>{it.desc}</div>}
              {it.to && (
                <Link to={it.to} className="text-[11px] font-bold mt-2 inline-flex items-center gap-1 hover:opacity-80 transition-opacity" style={{ color: isInfo ? 'var(--p-gold-text)' : 'var(--p-blue)' }}>
                  {isInfo ? '→' : '↩'} {it.linkLabel}
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
