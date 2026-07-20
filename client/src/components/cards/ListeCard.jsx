import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Users, TrendingUp, TrendingDown, ChevronRight } from 'lucide-react';
import Tooltip from '@/components/shared/Tooltip';

const BLOC_LABEL = {
  coalition: 'Coalition sortante',
  opposition: 'Opposition',
  liste_arabe: 'Liste arabe',
  non_alignee: 'Non alignée',
};

const BLOC_COLOR = {
  coalition: '#3B82F6',
  opposition: '#D92B2B',
  liste_arabe: '#22C55E',
  non_alignee: '#9CA3AF',
};

export default function ListeCard({ liste, latestPoll, index = 0 }) {
  const projectedSeats = latestPoll?.seats_by_liste?.find(s => s.liste_id === liste.id)?.seats ?? null;
  const delta = projectedSeats != null && liste.current_knesset_seats != null
    ? projectedSeats - liste.current_knesset_seats
    : null;
  const blocColor = BLOC_COLOR[liste.bloc] || '#6B7280';
  const belowThreshold = projectedSeats === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -3, transition: { duration: 0.18 } }}
    >
      <Link to={`/Liste?slug=${liste.slug}`}>
        <div
          className="group overflow-hidden rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300 p-4"
          style={{ background: 'rgba(10,18,42,0.85)', backdropFilter: 'blur(8px)' }}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: liste.color || blocColor }} />
              <div>
                <h3 className="text-white font-bold text-base leading-tight">{liste.name_fr}</h3>
                <p className="text-[11px] mt-0.5" style={{ color: 'rgba(245,240,232,0.4)' }}>{liste.leader_name}</p>
              </div>
            </div>
            <Tooltip text="Classement descriptif, pas un jugement politique." position="bottom">
              <span
                className="text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-full cursor-help"
                style={{ background: `${blocColor}18`, color: blocColor, border: `1px solid ${blocColor}40` }}
              >
                {BLOC_LABEL[liste.bloc] || '—'}
              </span>
            </Tooltip>
          </div>

          {/* Projection sièges */}
          <div className="flex items-end justify-between py-3 border-t border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <div>
              <p className="text-[10px] uppercase tracking-wide" style={{ color: 'rgba(245,240,232,0.35)' }}>Projection sièges</p>
              {belowThreshold ? (
                <p className="text-sm font-bold mt-0.5" style={{ color: '#F47090' }}>Sous le seuil (3,25%)</p>
              ) : (
                <p className="text-2xl font-black mt-0.5" style={{ fontFamily: 'monospace', color: liste.color || blocColor }}>
                  {projectedSeats != null ? projectedSeats : '—'}
                  <span className="text-xs font-normal" style={{ color: 'rgba(245,240,232,0.3)' }}> / 120</span>
                </p>
              )}
            </div>
            {delta != null && delta !== 0 && (
              <div className="flex items-center gap-1 text-xs font-bold" style={{ color: delta > 0 ? '#22C55E' : '#D92B2B' }}>
                {delta > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {delta > 0 ? '+' : ''}{delta}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3">
            <div className="flex items-center gap-1.5 text-white/30 text-[11px]">
              <Users className="w-3 h-3" />
              {liste.current_knesset_seats != null ? `${liste.current_knesset_seats} sièges sortants` : 'Nouvelle liste'}
            </div>
            <div className="flex items-center gap-1 text-[#4A7FD4] text-xs font-semibold group-hover:gap-1.5 transition-all">
              Pronostiquer <ChevronRight className="w-3 h-3" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
