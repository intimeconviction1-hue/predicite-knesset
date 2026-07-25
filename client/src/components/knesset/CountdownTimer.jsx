import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

// Jour du scrutin, 07:00 heure d'Israël (même convention que
// FALLBACK_DEADLINE_UTC dans PremierMinistre.jsx/Liste.jsx, qui fixe déjà la
// clôture des pronostics à la veille 07:00 Israël — l'ouverture des bureaux
// de vote suit historiquement le même horaire matinal).
const ELECTION_DAY_UTC = '2026-10-27T04:00:00Z';

function getRemaining(targetUtc) {
  const diff = new Date(targetUtc).getTime() - Date.now();
  if (diff <= 0) return null;
  const totalSeconds = Math.floor(diff / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

const UNITS = [
  { key: 'days', label: 'jours' },
  { key: 'hours', label: 'heures' },
  { key: 'minutes', label: 'min' },
  { key: 'seconds', label: 'sec' },
];

export default function CountdownTimer({ targetUtc = ELECTION_DAY_UTC, className, style }) {
  const [remaining, setRemaining] = useState(() => getRemaining(targetUtc));

  useEffect(() => {
    const id = setInterval(() => setRemaining(getRemaining(targetUtc)), 1000);
    return () => clearInterval(id);
  }, [targetUtc]);

  if (!remaining) {
    return (
      <div className={className} style={style}>
        <p className="text-sm font-semibold" style={{ color: 'var(--p-gold-text)' }}>Le scrutin a eu lieu</p>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 sm:gap-5 ${className || ''}`} style={style}>
      {UNITS.map((u, i) => (
        <React.Fragment key={u.key}>
          <div className="text-center">
            <motion.p
              key={remaining[u.key]}
              initial={{ opacity: 0.4, y: -2 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="text-2xl sm:text-4xl font-black leading-none"
              style={{ fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', color: 'var(--p-gold-text)' }}
            >
              {String(remaining[u.key]).padStart(2, '0')}
            </motion.p>
            <p className="text-[9px] sm:text-[10px] uppercase tracking-widest mt-1" style={{ color: 'var(--p-text-40)' }}>{u.label}</p>
          </div>
          {i < UNITS.length - 1 && (
            <span className="text-xl sm:text-2xl font-black -mt-3" style={{ color: 'var(--p-text-10)' }}>:</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
