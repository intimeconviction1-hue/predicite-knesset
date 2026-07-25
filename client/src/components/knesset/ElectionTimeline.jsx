import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

// Dates réelles du processus électoral (zéro donnée inventée, même principe
// que la page Méthodologie) : dissolution effective, deadline PrédiCité déjà
// utilisée ailleurs dans l'app (Liste.jsx/PremierMinistre.jsx), jour du
// scrutin fixé par la loi. L'investiture n'a pas de date : elle dépend des
// négociations de coalition post-scrutin (voir CoalitionRulesModule).
const MILESTONES = [
  { id: 'dissolution', label: 'Dissolution de la Knesset', date: '2026-07-17', dateLabel: '17 juillet 2026' },
  { id: 'campagne', label: 'Campagne électorale', date: null, dateLabel: 'En cours' },
  { id: 'cloture', label: 'Clôture des pronostics', date: '2026-10-26', dateLabel: '26 octobre 2026' },
  { id: 'scrutin', label: 'Jour du scrutin', date: '2026-10-27', dateLabel: '27 octobre 2026' },
  { id: 'investiture', label: 'Formation du gouvernement', date: null, dateLabel: 'Date à venir' },
];

function computeStatuses(milestones, now) {
  let lastDoneIdx = -1;
  milestones.forEach((m, i) => {
    if (m.date && new Date(m.date) <= now) lastDoneIdx = i;
  });
  return milestones.map((_, i) => {
    if (i <= lastDoneIdx) return 'done';
    if (i === lastDoneIdx + 1) return 'current';
    return 'upcoming';
  });
}

export default function ElectionTimeline() {
  const statuses = computeStatuses(MILESTONES, new Date());

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-start gap-6 sm:gap-2">
        {MILESTONES.map((m, i) => {
          const status = statuses[i];
          const isLast = i === MILESTONES.length - 1;
          return (
            <React.Fragment key={m.id}>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-10%' }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="flex sm:flex-col items-center sm:items-center gap-3 sm:gap-2 sm:flex-1 sm:text-center"
              >
                <div className="relative flex-shrink-0">
                  {status === 'current' && (
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      style={{ background: 'var(--p-gold)' }}
                      animate={{ scale: [1, 1.8], opacity: [0.5, 0] }}
                      transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
                    />
                  )}
                  <div
                    className="relative w-8 h-8 rounded-full flex items-center justify-center border-2"
                    style={{
                      background: status === 'done' ? 'var(--p-gold)' : status === 'current' ? 'var(--p-card)' : 'var(--p-card)',
                      borderColor: status === 'upcoming' ? 'var(--p-border-hover)' : 'var(--p-gold)',
                    }}
                  >
                    {status === 'done' ? (
                      <Check className="w-4 h-4" style={{ color: 'var(--p-ink)' }} />
                    ) : (
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: status === 'current' ? 'var(--p-gold)' : 'var(--p-text-10)' }} />
                    )}
                  </div>
                </div>
                <div className="sm:mt-1">
                  <p className="text-sm font-bold" style={{ color: status === 'upcoming' ? 'var(--p-text-40)' : 'var(--p-text)' }}>{m.label}</p>
                  <p className="text-xs mt-0.5" style={{ color: status === 'current' ? 'var(--p-gold-text)' : 'var(--p-text-40)' }}>{m.dateLabel}</p>
                </div>
              </motion.div>
              {!isLast && (
                <div
                  className="hidden sm:block flex-1 h-0.5 mt-4"
                  style={{ background: status === 'done' ? 'var(--p-gold)' : 'var(--p-border-hover)' }}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
