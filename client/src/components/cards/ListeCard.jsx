import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Users, TrendingUp, TrendingDown, ChevronRight } from 'lucide-react';
import Tooltip from '@/components/shared/Tooltip';
import BallotChip from '@/components/knesset/BallotChip';
import CountUp from '@/components/knesset/CountUp';
import { BLOC_LABEL, BLOC_COLOR } from '@/lib/blocs';

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
          className="group overflow-hidden rounded-2xl border p-4 transition-colors duration-300"
          style={{ background: 'var(--p-card)', borderColor: 'var(--p-border)' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = `${blocColor}55`; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--p-border)'; }}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <motion.div whileHover={{ rotate: 0, scale: 1.06 }} transition={{ type: 'spring', stiffness: 300, damping: 12 }}>
                <BallotChip letters={liste.ballot_letters} size="sm" />
              </motion.div>
              <div>
                <h3 className="font-bold text-base leading-tight" style={{ color: 'var(--p-text)' }}>{liste.name_fr}</h3>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--p-text-40)' }}>{liste.leader_name}</p>
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
          <div className="flex items-end justify-between py-3 border-t border-b" style={{ borderColor: 'var(--p-border)' }}>
            <div>
              <p className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--p-text-40)' }}>Projection sièges</p>
              {belowThreshold ? (
                <p className="text-sm font-bold mt-0.5" style={{ color: 'var(--p-red)' }}>Sous le seuil (3,25%)</p>
              ) : (
                <p className="text-2xl font-black mt-0.5" style={{ fontFamily: 'monospace', color: liste.color || blocColor }}>
                  {projectedSeats != null ? <CountUp value={projectedSeats} duration={800} /> : '—'}
                  <span className="text-xs font-normal" style={{ color: 'var(--p-text-25)' }}> / 120</span>
                </p>
              )}
            </div>
            {delta != null && delta !== 0 && (
              <div className="flex items-center gap-1 text-xs font-bold" style={{ color: delta > 0 ? '#16794A' : 'var(--p-red)' }}>
                {delta > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {delta > 0 ? '+' : ''}{delta}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3">
            <div className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--p-text-25)' }}>
              <Users className="w-3 h-3" />
              {liste.current_knesset_seats != null ? `${liste.current_knesset_seats} sièges sortants` : 'Nouvelle liste'}
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold group-hover:gap-1.5 transition-all" style={{ color: 'var(--p-blue)' }}>
              Pronostiquer <ChevronRight className="w-3 h-3" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
