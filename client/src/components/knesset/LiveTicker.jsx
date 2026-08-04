import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Pause, Play } from 'lucide-react';

// Bandeau live défilant : le « flux d'infos » de la campagne, en continu. On ne
// passe QUE des items réels (dernier sondage, cotes du moment, événements, actu) —
// jamais de contenu inventé ; si une source est vide, on ne fabrique rien.
//
// Chaque item : { emoji, text, value?, valueColor?, to?|href? }.
// - to   → lien interne (react-router)
// - href → lien externe (nouvel onglet)
// - sinon texte simple.

function TickerItem({ it }) {
  const inner = (
    <span className="inline-flex items-center gap-1.5 px-4 text-[13px]" style={{ color: 'var(--p-text-60)' }}>
      <span aria-hidden="true">{it.emoji}</span>
      <span className="font-medium" style={{ color: 'var(--p-text)' }}>{it.text}</span>
      {it.value != null && (
        <span className="font-mono font-bold" style={{ color: it.valueColor || 'var(--p-blue)' }}>{it.value}</span>
      )}
      <span aria-hidden="true" style={{ color: 'var(--p-text-10)' }}>•</span>
    </span>
  );
  if (it.to) return <Link to={it.to} className="hover:opacity-70 transition-opacity">{inner}</Link>;
  if (it.href) return <a href={it.href} target="_blank" rel="noopener noreferrer" className="hover:opacity-70 transition-opacity">{inner}</a>;
  return inner;
}

export default function LiveTicker({ items = [], label = 'En direct' }) {
  // La pause n'existait qu'au :hover — qui n'existe pas au doigt. Sur mobile,
  // une info intéressante défilait sans qu'on puisse la viser, et un mouvement
  // perpétuel sans contrôle d'arrêt viole WCAG 2.2.2. Le bouton règle les deux.
  const [enPause, setEnPause] = useState(false);

  if (!items.length) return null;

  // Vitesse ~ proportionnelle au volume, bornée pour rester lisible.
  const duration = Math.min(120, Math.max(28, items.length * 4.5));

  const row = (dup) => items.map((it, i) => (
    <TickerItem key={`${dup ? 'b' : 'a'}-${i}`} it={it} />
  ));

  return (
    <div className="relative w-full border-y" style={{ background: 'var(--p-card)', borderColor: 'var(--p-border)' }}>
      <div className="flex items-stretch">
        {/* étiquette fixe « En direct » + contrôle d'arrêt */}
        <div className="flex items-center gap-1.5 pl-3 pr-1 flex-shrink-0 z-10" style={{ background: 'var(--p-card)', borderRight: '0.5px solid var(--p-border)' }}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse flex-shrink-0" style={{ background: 'var(--p-red)' }} />
          <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--p-red)' }}>{label}</span>
          <button
            type="button"
            onClick={() => setEnPause(p => !p)}
            aria-pressed={enPause}
            aria-label={enPause ? 'Reprendre le défilement des actualités' : 'Mettre en pause le défilement des actualités'}
            className="w-11 h-11 rounded-full justify-center transition-colors hover:bg-[rgba(20,32,61,0.06)]"
            style={{ color: 'var(--p-text-40)' }}
          >
            {enPause ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>
        </div>
        {/* piste défilante (deux copies pour une boucle sans couture) */}
        <div className="p-marquee overflow-hidden flex-1 py-2.5">
          <div
            className="p-marquee-track"
            style={{ animationDuration: `${duration}s`, animationPlayState: enPause ? 'paused' : 'running' }}
          >
            <span className="inline-flex items-center">{row(false)}</span>
            <span className="inline-flex items-center p-marquee-dup" aria-hidden="true">{row(true)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
