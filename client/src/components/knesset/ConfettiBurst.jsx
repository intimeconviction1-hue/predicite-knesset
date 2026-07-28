import React, { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

// Micro-célébration maison : une salve de confettis aux couleurs de la marque,
// tirée à chaque incrément de `trigger` (bonne réponse, pari gagné, série…).
// Léger (DOM + framer-motion, pas de lib externe), et coupé sous
// prefers-reduced-motion (règle d'accessibilité globale).

const COLORS = ['#2B5CE6', '#D4AF37', '#C8102E', '#1A8C55', '#0038B8', '#ffffff'];

export default function ConfettiBurst({ trigger = 0, count = 30, originY = '42%' }) {
  const reduced = useReducedMotion();
  const [pieces, setPieces] = useState([]);
  const seq = useRef(0);

  useEffect(() => {
    if (!trigger || reduced) return;
    seq.current += 1;
    const batch = seq.current;
    const next = Array.from({ length: count }, (_, i) => ({
      id: `b${batch}-${i}`,
      dx: (Math.random() - 0.5) * 620,
      dy: 140 + Math.random() * 420,
      rot: (Math.random() - 0.5) * 700,
      size: 6 + Math.random() * 6,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      dur: 0.9 + Math.random() * 0.6,
      delay: Math.random() * 0.08,
    }));
    setPieces((prev) => [...prev, ...next]);
    const t = setTimeout(() => {
      setPieces((prev) => prev.filter((p) => !p.id.startsWith(`b${batch}-`)));
    }, 1700);
    return () => clearTimeout(t);
  }, [trigger, count, reduced]);

  if (!pieces.length) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 70 }} aria-hidden="true">
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          initial={{ opacity: 1, x: 0, y: 0, rotate: 0 }}
          animate={{ opacity: 0, x: p.dx, y: p.dy, rotate: p.rot }}
          transition={{ duration: p.dur, ease: 'easeOut', delay: p.delay }}
          style={{
            position: 'absolute', left: '50%', top: originY,
            width: p.size, height: p.size * 0.6, background: p.color, borderRadius: 2,
          }}
        />
      ))}
    </div>
  );
}
