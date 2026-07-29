import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Zap, HelpCircle, ArrowRight } from 'lucide-react';

// Barre « joue-le / apprends-le » : la mécanique des vases communicants rendue
// permanente et cliquable. Posée sur une fiche (liste, PM, événement…), elle
// offre le PARI (registre Jeu) et le QUIZ né du contenu, reliés en un clic.
//
// Honnêteté des liens : `bets` ne doit contenir que des marchés RÉELS qui
// référencent exactement cette entité (jamais de rapprochement inventé). Si
// aucun pari n'existe, on ne fabrique rien — on renvoie vers le hub des paris.

export default function PlayLearnBar({
  title = 'Joue-le',
  subtitle,
  bets = [],
  quizTo,
  parisHref,
  className = '',
}) {
  const hub = parisHref || createPageUrl('Paris');
  const hasBets = bets.length > 0;

  return (
    <div className={`rounded-2xl p-5 ${className}`} style={{ background: 'var(--p-blue-dim)', border: '0.5px solid var(--p-blue-border)' }}>
      <div className="flex items-center gap-2 mb-1">
        <Zap className="w-4 h-4" style={{ color: 'var(--p-gold-text)' }} />
        <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--p-gold-text)' }}>{title}</span>
      </div>
      {subtitle && <p className="text-xs mb-3" style={{ color: 'var(--p-text-60)' }}>{subtitle}</p>}

      {hasBets ? (
        <div className="space-y-2 mb-3">
          {bets.map((b, i) => (
            <Link key={i} to={b.to} className="flex items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 transition-transform hover:-translate-y-0.5" style={{ background: 'var(--p-card)', border: '0.5px solid var(--p-border)' }}>
              <span className="text-sm font-semibold" style={{ color: 'var(--p-text)' }}>{b.question}</span>
              <span className="font-mono font-bold text-sm flex-shrink-0" style={{ color: 'var(--p-blue)' }}>×{b.cote}</span>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-xs mb-3" style={{ color: 'var(--p-text-40)' }}>
          Aucun pari ouvert sur cette fiche pour l'instant — <Link to={hub} className="underline hover:opacity-80" style={{ color: 'var(--p-blue)' }}>voir tous les paris ouverts</Link>.
        </p>
      )}

      <div className="flex items-center gap-4 flex-wrap">
        {hasBets && (
          <Link to={hub} className="inline-flex items-center gap-1.5 text-sm font-semibold hover:opacity-80 transition-opacity" style={{ color: 'var(--p-blue)' }}>
            Tous les paris <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
        {quizTo && (
          <Link to={quizTo} className="inline-flex items-center gap-1.5 text-sm font-semibold hover:opacity-80 transition-opacity" style={{ color: 'var(--p-gold-text)' }}>
            <HelpCircle className="w-3.5 h-3.5" /> Teste tes connaissances
          </Link>
        )}
      </div>
    </div>
  );
}
