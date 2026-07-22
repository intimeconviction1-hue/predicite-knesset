import React from 'react';

/**
 * En Israël, on ne vote pas pour un nom : dans l'isoloir, on prend un petit
 * bulletin en papier imprimé avec 1 à 4 lettres hébraïques (le "ballot_letters"
 * de la liste) et on le glisse dans l'enveloppe. Ce composant reproduit ce
 * geste très concret — c'est le détail le plus spécifiquement israélien qu'on
 * puisse mettre dans l'UI, plutôt qu'une carte générique.
 */
export default function BallotChip({ letters, size = 'md' }) {
  const dims = {
    sm: { w: 44, h: 30, font: 15 },
    md: { w: 56, h: 38, font: 19 },
    lg: { w: 72, h: 48, font: 24 },
  }[size] || { w: 56, h: 38, font: 19 };

  const hasLetters = !!letters;

  return (
    <div
      title={hasLetters ? `Lettres de bulletin : ${letters}` : 'Lettres de bulletin pas encore attribuées'}
      style={{
        width: dims.w,
        height: dims.h,
        background: 'var(--p-paper)',
        borderRadius: 3,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 1px 0 rgba(0,0,0,0.25), 0 2px 5px rgba(0,0,0,0.35)',
        transform: 'rotate(-1.2deg)',
        flexShrink: 0,
        position: 'relative',
      }}
    >
      {/* Perforation factice, comme un vrai talon de bulletin */}
      <div style={{ position: 'absolute', left: 4, top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ width: 2, height: 2, borderRadius: '50%', background: 'rgba(5,10,24,0.15)' }} />
        ))}
      </div>
      {hasLetters ? (
        <span
          dir="rtl"
          style={{
            fontFamily: "'Arial Hebrew','Noto Sans Hebrew',sans-serif",
            fontWeight: 800,
            fontSize: dims.font,
            color: 'var(--p-ink)',
            letterSpacing: '0.5px',
          }}
        >
          {letters}
        </span>
      ) : (
        <span style={{ fontSize: dims.font * 0.55, color: 'rgba(20,32,61,0.35)', fontWeight: 700, letterSpacing: 2 }}>
          · ·
        </span>
      )}
    </div>
  );
}
