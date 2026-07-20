import React from 'react';
import { Flame, Minus, TrendingUp, AlertTriangle } from 'lucide-react';

/**
 * Calcule et affiche le niveau de tension d'une ville.
 * Basé sur les sondages disponibles : écart entre candidats, triangulaire, volatilité.
 */
export function computeTensionLevel(candidates = []) {
  if (!candidates || candidates.length < 2) return null;

  const sorted = [...candidates].sort((a, b) => (b.percentage || 0) - (a.percentage || 0));
  const gap = (sorted[0]?.percentage || 0) - (sorted[1]?.percentage || 0);
  const isTriangular = candidates.filter(c => (c.percentage || 0) >= 15).length >= 3;

  let score = 0;
  if (gap <= 3) score = 90;
  else if (gap <= 7) score = 72;
  else if (gap <= 15) score = 50;
  else score = 25;

  if (isTriangular) score = Math.min(100, score + 15);

  if (score >= 75) return { level: 'tendue', label: 'Tendue', color: 'text-red-600', bg: 'bg-red-50 border-red-200', icon: Flame, dot: 'bg-red-500', score };
  if (score >= 50) return { level: 'incertaine', label: 'Incertaine', color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200', icon: AlertTriangle, dot: 'bg-orange-400', score };
  if (score >= 30) return { level: 'stable', label: 'Stable', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', icon: TrendingUp, dot: 'bg-emerald-500', score };
  return { level: 'calme', label: 'Calme', color: 'text-slate-500', bg: 'bg-slate-50 border-slate-200', icon: Minus, dot: 'bg-slate-400', score };
}

export default function CityTensionBadge({ candidates = [], size = 'sm', showScore = false }) {
  const tension = computeTensionLevel(candidates);
  if (!tension) return null;

  const Icon = tension.icon;

  if (size === 'xs') {
    return (
      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[10px] font-medium ${tension.bg} ${tension.color}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${tension.dot}`} />
        {tension.label}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${tension.bg} ${tension.color}`}>
      <Icon className="w-3 h-3" />
      {tension.label}
      {showScore && <span className="opacity-60">· {tension.score}/100</span>}
    </span>
  );
}