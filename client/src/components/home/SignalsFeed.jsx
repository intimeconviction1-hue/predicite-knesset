import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import { Zap, TrendingUp, HelpCircle, Users, ArrowRight, Calendar, MapPin, ShieldCheck, Clock } from 'lucide-react';

const TYPE_CONFIG = {
  poll:           { label: 'Sondage',       color: 'text-amber-300',  bg: 'bg-amber-900/30',  border: 'border-amber-700/30' },
  alliance:       { label: 'Alliance',      color: 'text-purple-300', bg: 'bg-purple-900/30', border: 'border-purple-700/30' },
  withdrawal:     { label: 'Retrait',       color: 'text-slate-300',  bg: 'bg-slate-800/50',  border: 'border-slate-600/30' },
  campaign_event: { label: 'Campagne',      color: 'text-blue-300',   bg: 'bg-blue-900/30',   border: 'border-blue-700/30' },
  scandal:        { label: 'Controverse',   color: 'text-red-300',    bg: 'bg-red-900/30',    border: 'border-red-700/30' },
};

const DIRECTION_CONFIG = {
  left_up:     { icon: TrendingUp, label: 'Gauche ↑',        color: 'text-rose-400' },
  right_up:    { icon: TrendingUp, label: 'Droite ↑',        color: 'text-blue-400' },
  center_up:   { icon: TrendingUp, label: 'Centre ↑',        color: 'text-cyan-400' },
  uncertain:   { icon: HelpCircle, label: 'Incertain',       color: 'text-amber-400' },
  turnout_up:  { icon: Users,      label: 'Participation ↑', color: 'text-green-400' },
  turnout_down:{ icon: Users,      label: 'Participation ↓', color: 'text-orange-400' },
};

function ImpactDots({ level }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className={`w-1.5 h-1.5 rounded-full ${i <= level ? 'bg-[#E1B530]' : 'bg-white/15'}`} />
      ))}
    </div>
  );
}

function VerifBadge({ origin, status }) {
  if (origin === 'official' || status === 'verified') {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-green-900/40 text-green-400 border border-green-700/30">
        <ShieldCheck className="w-2.5 h-2.5" /> Officiel
      </span>
    );
  }
  if (origin === 'verified_press' || status === 'pending') {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-900/40 text-blue-300 border border-blue-700/30">
        <Clock className="w-2.5 h-2.5" /> En vérification
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] bg-white/5 text-white/30 border border-white/10">
      Source manuelle
    </span>
  );
}

export default function SignalsFeed() {
  const { data: dbSignals = [], isLoading } = useQuery({
    queryKey: ['political-signals'],
    queryFn: () => base44.entities.PoliticalSignal.filter({ is_active: true }, '-date', 20),
  });

  // Filtrer : uniquement données non-synthétiques
  const realSignals = dbSignals.filter(s => s.data_origin !== 'synthetic_demo');

  // Trier : verified > pending > manual, puis par date
  const sortedSignals = [...realSignals].sort((a, b) => {
    const rank = { verified: 3, pending: 2, unverified: 1 };
    const ra = rank[a.verification_status] || 1;
    const rb = rank[b.verification_status] || 1;
    if (rb !== ra) return rb - ra;
    return new Date(b.date) - new Date(a.date);
  }).slice(0, 6);

  const isEmpty = sortedSignals.length === 0;

  return (
    <div className="border-y border-white/8 py-10" style={{ background: 'rgba(6,16,31,0.6)', backdropFilter: 'blur(6px)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex items-end justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-[#E1B530]/15 border border-[#E1B530]/30 flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-[#E1B530]" />
              </div>
              <h2 className="text-xl font-bold text-white">Signaux politiques</h2>
            </div>
            <p className="text-xs text-white/35 ml-9">
              Informations vérifiées — chaque signal peut affecter vos prédictions
            </p>
          </div>
          <Link
            to={createPageUrl('Predictions')}
            className="hidden sm:flex items-center gap-1.5 text-xs text-[#4A7FD4] hover:text-white transition-colors"
          >
            Mes prédictions <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* État vide */}
        {isEmpty ? (
          <div className="text-center py-12 border border-white/8 rounded-xl bg-white/2">
            <ShieldCheck className="w-8 h-8 text-white/20 mx-auto mb-3" />
            <p className="text-white/40 text-sm font-medium">Aucune nouvelle information vérifiée pour le moment.</p>
            <p className="text-white/20 text-xs mt-1">Les signaux apparaîtront ici dès qu'une information sera publiée et identifiée.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedSignals.map((signal, i) => {
              const typeConf = TYPE_CONFIG[signal.type] || { label: 'Signal', color: 'text-white/60', bg: 'bg-white/5', border: 'border-white/10' };
              const impactAccent = signal.impact_level >= 4 ? 'bg-[#E1B530]' : 'bg-white/10';
              const predictUrl = `${createPageUrl('Predictions')}?city=${encodeURIComponent(signal.city || '')}`;

              return (
                <motion.div
                  key={signal.id}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  className="group relative rounded-xl border border-white/10 bg-white/4 hover:bg-white/7 hover:border-white/20 transition-all p-4 flex flex-col gap-3"
                >
                  {/* Accent stripe */}
                  <div className={`absolute left-0 top-4 bottom-4 w-0.5 rounded-r ${impactAccent}`} />

                  {/* Top row */}
                  <div className="flex items-center justify-between gap-2 pl-3 flex-wrap">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${typeConf.bg} ${typeConf.color} ${typeConf.border}`}>
                      <Zap className="w-2.5 h-2.5" />
                      {typeConf.label}
                    </span>
                    <VerifBadge origin={signal.data_origin} status={signal.verification_status} />
                  </div>

                  {/* Title */}
                  <h3 className="font-semibold text-sm leading-snug line-clamp-2 pl-3 text-white">
                    {signal.title}
                  </h3>

                  {/* Summary */}
                  <p className="text-white/40 text-xs leading-relaxed line-clamp-2 flex-1 pl-3">
                    {signal.summary}
                  </p>

                  {/* Meta */}
                  <div className="flex items-center gap-3 pl-3 flex-wrap">
                    <div className="flex items-center gap-1 text-white/30 text-[10px]">
                      <MapPin className="w-2.5 h-2.5" />
                      {signal.city}
                    </div>
                    <div className="flex items-center gap-1 text-white/30 text-[10px]">
                      <Calendar className="w-2.5 h-2.5" />
                      {signal.date ? new Date(signal.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '—'}
                    </div>
                    {signal.source_name && (
                      <div className="text-white/20 text-[10px] truncate max-w-[80px]">{signal.source_name}</div>
                    )}
                    <div className="ml-auto flex items-center gap-1">
                      <span className="text-white/25 text-[10px]">Impact</span>
                      <ImpactDots level={signal.impact_level} />
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="pl-3 pt-1 border-t border-white/8">
                    <Link
                      to={predictUrl}
                      className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#4A7FD4] hover:text-white transition-colors group-hover:gap-2"
                    >
                      <Zap className="w-3 h-3 text-[#E1B530]" />
                      Ajuster ma prédiction
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}