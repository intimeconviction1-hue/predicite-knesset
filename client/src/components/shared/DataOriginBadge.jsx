import React from 'react';
import { ShieldCheck, FlaskConical, Clock, PenLine } from 'lucide-react';

/**
 * Règle métier stricte :
 * - "official" ou "verified_press" + verification_status="verified" → badge vert vérifié
 * - "pending" → badge ambre en attente
 * - "synthetic_demo" → badge explicite "Données illustratives · IA"
 * - "manual" + unverified → badge neutre non vérifié
 * Jamais de badge "officiel" si data_origin = synthetic_demo
 */
const ORIGIN_CONFIG = {
  official: {
    verified: {
      label: 'Source officielle',
      icon: ShieldCheck,
      className: 'bg-emerald-900/40 text-emerald-300 border border-emerald-700/40',
    },
    pending: {
      label: 'Vérification en cours',
      icon: Clock,
      className: 'bg-amber-900/30 text-amber-300 border border-amber-700/30',
    },
    unverified: {
      label: 'Non vérifié',
      icon: Clock,
      className: 'bg-white/5 text-white/30 border border-white/10',
    },
  },
  verified_press: {
    verified: {
      label: 'Presse vérifiée',
      icon: ShieldCheck,
      className: 'bg-blue-900/40 text-blue-300 border border-blue-700/40',
    },
    pending: {
      label: 'Vérification en cours',
      icon: Clock,
      className: 'bg-amber-900/30 text-amber-300 border border-amber-700/30',
    },
    unverified: {
      label: 'Non vérifié',
      icon: Clock,
      className: 'bg-white/5 text-white/30 border border-white/10',
    },
  },
  synthetic_demo: {
    verified:   { label: 'Données illustratives · IA', icon: FlaskConical, className: 'bg-violet-900/30 text-violet-300 border border-violet-700/30' },
    pending:    { label: 'Données illustratives · IA', icon: FlaskConical, className: 'bg-violet-900/30 text-violet-300 border border-violet-700/30' },
    unverified: { label: 'Données illustratives · IA', icon: FlaskConical, className: 'bg-violet-900/30 text-violet-300 border border-violet-700/30' },
  },
  manual: {
    verified: {
      label: 'Saisi manuellement',
      icon: PenLine,
      className: 'bg-slate-800/50 text-slate-300 border border-slate-700/30',
    },
    pending: {
      label: 'En attente',
      icon: Clock,
      className: 'bg-amber-900/30 text-amber-300 border border-amber-700/30',
    },
    unverified: {
      label: 'Non vérifié',
      icon: PenLine,
      className: 'bg-white/5 text-white/30 border border-white/10',
    },
  },
};

export default function DataOriginBadge({ data_origin = 'synthetic_demo', verification_status = 'unverified', className = '' }) {
  const originConfig = ORIGIN_CONFIG[data_origin] || ORIGIN_CONFIG.synthetic_demo;
  const config = originConfig[verification_status] || originConfig.unverified;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wide ${config.className} ${className}`}>
      <Icon className="w-2.5 h-2.5 flex-shrink-0" />
      {config.label}
    </span>
  );
}

/**
 * Helper : retourne true si la donnée est digne d'être présentée comme "réelle"
 */
export function isVerifiedData(data_origin, verification_status) {
  if (!data_origin || data_origin === 'synthetic_demo') return false;
  return verification_status === 'verified';
}

/**
 * Helper : tri priorité verified > pending > unverified > synthetic
 */
export function getDataPriority(data_origin, verification_status) {
  if (data_origin === 'synthetic_demo') return 0;
  if (verification_status === 'verified') return 3;
  if (verification_status === 'pending') return 2;
  return 1;
}