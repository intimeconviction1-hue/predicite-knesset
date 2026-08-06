import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, ChevronRight, ArrowRight } from 'lucide-react';
import Tooltip from '@/components/shared/Tooltip';
import BallotChip from '@/components/knesset/BallotChip';
import CountUp from '@/components/knesset/CountUp';
import { BLOC_LABEL, BLOC_COLOR } from '@/lib/blocs';
import { texteLisible } from '@/lib/couleurs';

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
              {liste.logo_url && (
                <div className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 p-1.5" style={{ background: '#FFFFFF', border: '1px solid var(--p-border)' }}>
                  <img src={liste.logo_url} alt="" className="max-w-full max-h-full object-contain" />
                </div>
              )}
              {liste.ballot_letters && (
                <motion.div whileHover={{ rotate: 0, scale: 1.06 }} transition={{ type: 'spring', stiffness: 300, damping: 12 }}>
                  <BallotChip letters={liste.ballot_letters} size="sm" />
                </motion.div>
              )}
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

          {/* Aujourd'hui → projeté.
              Les deux chiffres étaient là, mais pas à la même échelle : la
              projection en 24 px gras coloré, le sortant relégué en pied de
              carte, 11 px à l'opacité la plus faible du système, derrière une
              icône. On lisait donc un chiffre isolé et une note de bas de page,
              alors que l'information EST la comparaison — « 22 » ne dit rien
              sans « 32 » à côté. Les deux passent dans la même ligne, à la même
              échelle, séparés par une flèche : le mouvement se lit avant les
              chiffres. Le sortant reste plus discret que la projection (c'est
              le passé), mais lisible — plus une trace grise. */}
          <div className="py-3 border-t border-b" style={{ borderColor: 'var(--p-border)' }}>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--p-text-40)' }}>
                Sortants → projection
              </p>
              {delta != null && delta !== 0 && (
                <span className="flex items-center gap-1 text-xs font-bold" style={{ color: delta > 0 ? 'var(--p-green-text)' : 'var(--p-red)' }}>
                  {delta > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  {delta > 0 ? '+' : ''}{delta}
                </span>
              )}
              {liste.current_knesset_seats == null && (
                <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded"
                  style={{ background: 'var(--p-gold-dim)', color: 'var(--p-gold-text)' }}>
                  Nouvelle liste
                </span>
              )}
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black" style={{ fontFamily: 'monospace', color: 'var(--p-text-40)' }}>
                {liste.current_knesset_seats != null ? liste.current_knesset_seats : '—'}
              </span>
              <ArrowRight className="w-3.5 h-3.5 self-center shrink-0" style={{ color: 'var(--p-text-25)' }} />
              {belowThreshold ? (
                <span className="text-sm font-bold" style={{ color: 'var(--p-red)' }}>Sous le seuil (3,25 %)</span>
              ) : (
                <span className="text-2xl font-black" style={{ fontFamily: 'monospace', color: texteLisible(liste.color || blocColor) }}>
                  {projectedSeats != null ? <CountUp value={projectedSeats} duration={800} /> : '—'}
                  <span className="text-xs font-normal" style={{ color: 'var(--p-text-25)' }}> / 120</span>
                </span>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end pt-3">
            <div className="flex items-center gap-1 text-xs font-semibold group-hover:gap-1.5 transition-all" style={{ color: 'var(--p-blue)' }}>
              Pronostiquer <ChevronRight className="w-3 h-3" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
