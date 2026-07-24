import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

const TOTAL_SEATS = 120;
const MAJORITY = 61;
const NEUTRAL_COLOR = 'var(--p-text-10)';

/**
 * Dispose N points en arcs concentriques façon hémicycle parlementaire réel
 * (plus de sièges sur les arcs extérieurs, proportionnellement à leur longueur).
 */
function layoutSeats(total, rows = 7, rMin = 70, rMax = 200) {
  const radii = Array.from({ length: rows }, (_, i) => rMin + (i * (rMax - rMin)) / (rows - 1));
  const weights = radii.map(r => r);
  const weightSum = weights.reduce((a, b) => a + b, 0);

  let counts = weights.map(w => Math.round((w / weightSum) * total));
  let diff = total - counts.reduce((a, b) => a + b, 0);
  counts[counts.length - 1] += diff;

  const points = [];
  counts.forEach((count, rowIndex) => {
    const r = radii[rowIndex];
    const margin = 12;
    const span = 180 - margin * 2;
    for (let i = 0; i < count; i++) {
      const t = count === 1 ? 0.5 : i / (count - 1);
      const angleDeg = 180 - margin - t * span;
      const angleRad = (angleDeg * Math.PI) / 180;
      points.push({
        x: 250 + r * Math.cos(angleRad),
        y: 220 - r * Math.sin(angleRad),
        row: rowIndex,
      });
    }
  });
  return points;
}

export default function Hemicycle({ seatsByListe = [], listes = [], height = 240, showMajorityLine = true, animate = true }) {
  const points = useMemo(() => layoutSeats(TOTAL_SEATS), []);

  // Assigne à chaque point (dans l'ordre de la disposition) une couleur ET
  // le nom de la liste correspondante, en regroupant par bloc (coalition,
  // puis non-alignés/listes arabes, puis opposition) trié par sièges
  // décroissants — approximation raisonnable de l'ordre gauche-droite réel.
  const seatAssignments = useMemo(() => {
    const hasData = seatsByListe.length > 0 && seatsByListe.some(s => s.seats > 0);
    if (!hasData) return Array(TOTAL_SEATS).fill({ color: NEUTRAL_COLOR, name: null });

    const byListeId = new Map(listes.map(l => [l.id, l]));
    const blocOrder = { coalition: 0, non_alignee: 1, liste_arabe: 1, opposition: 2 };

    const enriched = seatsByListe
      .filter(s => s.seats > 0)
      .map(s => ({ ...s, liste: byListeId.get(s.liste_id) }))
      .sort((a, b) => {
        const ba = blocOrder[a.liste?.bloc] ?? 1.5;
        const bb = blocOrder[b.liste?.bloc] ?? 1.5;
        if (ba !== bb) return ba - bb;
        return (b.seats || 0) - (a.seats || 0);
      });

    const seq = [];
    for (const s of enriched) {
      const color = s.liste?.color || NEUTRAL_COLOR;
      const name = s.liste?.name_fr || null;
      for (let i = 0; i < s.seats; i++) seq.push({ color, name, seats: s.seats });
    }
    while (seq.length < TOTAL_SEATS) seq.push({ color: NEUTRAL_COLOR, name: null });
    return seq.slice(0, TOTAL_SEATS);
  }, [seatsByListe, listes]);

  const majorityAngle = 180 - (MAJORITY / TOTAL_SEATS) * 180;
  const majorityRad = (majorityAngle * Math.PI) / 180;
  const lineX2 = 250 + 210 * Math.cos(majorityRad);
  const lineY2 = 220 - 210 * Math.sin(majorityRad);

  return (
    <svg viewBox="0 0 500 240" width="100%" height={height} style={{ overflow: 'visible' }}>
      {showMajorityLine && (
        <motion.g
          opacity="0"
          animate={{ opacity: 0.5 }}
          transition={{ delay: animate ? 0.9 : 0, duration: 0.5 }}
        >
          <line x1="250" y1="220" x2={lineX2} y2={lineY2} stroke="var(--p-gold)" strokeWidth="1" strokeDasharray="3 4" />
          <text x={lineX2 + (lineX2 > 250 ? 6 : -6)} y={lineY2 - 4} fill="var(--p-gold)" fontSize="10" textAnchor={lineX2 > 250 ? 'start' : 'end'} fontFamily="var(--font-mono)">
            61
          </text>
        </motion.g>
      )}
      {points.map((p, i) => {
        const seat = seatAssignments[i];
        return (
          <motion.circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="6.2"
            fill={seat.color}
            style={{ cursor: seat.name ? 'pointer' : 'default' }}
            initial={animate ? { scale: 0, opacity: 0 } : false}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              delay: animate ? i * 0.0055 : 0,
              duration: 0.35,
              type: 'spring',
              stiffness: 320,
              damping: 14,
            }}
            whileHover={seat.name ? { scale: 1.5 } : {}}
          >
            {seat.name && <title>{seat.name} — {seat.seats} sièges</title>}
          </motion.circle>
        );
      })}
    </svg>
  );
}
