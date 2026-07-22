import React, { useMemo } from 'react';

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
  // Ajuste l'arrondi sur la rangée extérieure (la plus longue, absorbe l'écart sans se voir)
  counts[counts.length - 1] += diff;

  const points = [];
  counts.forEach((count, rowIndex) => {
    const r = radii[rowIndex];
    const margin = 12; // degrés de marge de chaque côté pour éviter les points collés au bord
    const span = 180 - margin * 2;
    for (let i = 0; i < count; i++) {
      const t = count === 1 ? 0.5 : i / (count - 1);
      const angleDeg = 180 - margin - t * span; // de droite (0°) vers gauche (180°)
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

export default function Hemicycle({ seatsByListe = [], listes = [], height = 240, showMajorityLine = true }) {
  const points = useMemo(() => layoutSeats(TOTAL_SEATS), []);

  // Construit la séquence ordonnée des couleurs à assigner siège par siège :
  // coalition puis non-alignés/listes arabes puis opposition, chaque bloc trié
  // par nombre de sièges décroissant — approximation raisonnable de l'ordre
  // gauche-droite d'un vrai hémicycle.
  const seatColorSequence = useMemo(() => {
    const hasData = seatsByListe.length > 0 && seatsByListe.some(s => s.seats > 0);
    if (!hasData) return Array(TOTAL_SEATS).fill(NEUTRAL_COLOR);

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
      for (let i = 0; i < s.seats; i++) seq.push(color);
    }
    while (seq.length < TOTAL_SEATS) seq.push(NEUTRAL_COLOR);
    return seq.slice(0, TOTAL_SEATS);
  }, [seatsByListe, listes]);

  const majorityAngle = 180 - (MAJORITY / TOTAL_SEATS) * 180;
  const majorityRad = (majorityAngle * Math.PI) / 180;
  const lineX2 = 250 + 210 * Math.cos(majorityRad);
  const lineY2 = 220 - 210 * Math.sin(majorityRad);

  return (
    <svg viewBox="0 0 500 240" width="100%" height={height} style={{ overflow: 'visible' }}>
      {showMajorityLine && (
        <g opacity="0.5">
          <line x1="250" y1="220" x2={lineX2} y2={lineY2} stroke="var(--p-gold)" strokeWidth="1" strokeDasharray="3 4" />
          <text x={lineX2 + (lineX2 > 250 ? 6 : -6)} y={lineY2 - 4} fill="var(--p-gold)" fontSize="10" textAnchor={lineX2 > 250 ? 'start' : 'end'} fontFamily="var(--font-mono)">
            61
          </text>
        </g>
      )}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="6.2" fill={seatColorSequence[i]} />
      ))}
    </svg>
  );
}
