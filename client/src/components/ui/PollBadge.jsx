import React from 'react';
import { CheckCircle, Circle, AlertCircle } from 'lucide-react';

/**
 * Badge de fiabilité d'un sondage.
 * reliability: 1-5 étoiles
 * type: 'real' | 'simulation' | 'community'
 */
export function PollSourceBadge({ type = 'real', institute, className = '' }) {
  const configs = {
    real: {
      label: 'Sondage réel',
      bg: 'bg-emerald-50 border-emerald-200',
      text: 'text-emerald-700',
      dot: 'bg-emerald-500',
    },
    simulation: {
      label: 'Simulation interne',
      bg: 'bg-slate-50 border-slate-200',
      text: 'text-slate-500',
      dot: 'bg-slate-400',
    },
    community: {
      label: 'Sondage communauté',
      bg: 'bg-blue-50 border-blue-200',
      text: 'text-blue-700',
      dot: 'bg-blue-500',
    },
  };

  const c = configs[type] || configs.real;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${c.bg} ${c.text} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {institute ? `${institute} · ` : ''}{c.label}
    </span>
  );
}

/**
 * Score de fiabilité 1–5 étoiles
 */
export function ReliabilityScore({ score = 3, showLabel = true }) {
  const labels = { 1: 'Faible', 2: 'Modéré', 3: 'Sérieux', 4: 'Fiable', 5: 'Référence' };
  const colors = { 1: 'text-red-400', 2: 'text-orange-400', 3: 'text-yellow-500', 4: 'text-emerald-500', 5: 'text-emerald-600' };

  return (
    <div className="inline-flex items-center gap-1">
      <div className="flex">
        {[1, 2, 3, 4, 5].map(i => (
          <span key={i} className={`text-xs ${i <= score ? colors[score] : 'text-slate-200'}`}>★</span>
        ))}
      </div>
      {showLabel && <span className={`text-xs font-medium ${colors[score]}`}>{labels[score]}</span>}
    </div>
  );
}

/**
 * Citation normalisée d'un sondage
 */
export function PollCitation({ institute, client, dateFrom, dateTo, sampleSize, marginError, link }) {
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : null;

  return (
    <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-xs text-slate-600">
      <p className="font-medium text-slate-700 mb-1">Source</p>
      <p>
        <span className="font-semibold">{institute}</span>
        {client && <span> pour {client}</span>}
        {(dateFrom || dateTo) && <span> — terrain du {formatDate(dateFrom)}{dateTo && ` au ${formatDate(dateTo)}`}</span>}
        {sampleSize && <span> — {sampleSize.toLocaleString('fr-FR')} personnes</span>}
        {marginError && <span> — marge d'erreur ±{marginError}%</span>}
      </p>
      {link && (
        <a href={link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-1.5 text-[#034EA2] hover:underline font-medium">
          Lire la source originale →
        </a>
      )}
    </div>
  );
}