import React from 'react';

// Courbe de tendance lisible (SVG) : aire + ligne + points + valeur à chaque
// point. L'échelle Y s'adapte à l'amplitude des données (pas forcément depuis 0)
// pour que les variations de quelques sièges se voient vraiment. Remplace les
// anciennes barres, peu lisibles pour une évolution.
export default function TrendChart({ points = [], color = '#2B5CE6', height = 130 }) {
  if (!points.length) return null;

  const vals = points.map(p => Number(p.value) || 0);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const pad = Math.max(1, Math.round((max - min) * 0.25));
  const lo = Math.max(0, min - pad);
  const hi = max + pad;

  const W = 320, H = 110, mL = 10, mR = 10, mT = 18, mB = 22;
  const n = points.length;
  const xAt = (i) => (n === 1 ? W / 2 : mL + (i / (n - 1)) * (W - mL - mR));
  const yAt = (v) => H - mB - ((v - lo) / (hi - lo || 1)) * (H - mT - mB);

  const pts = points.map((p, i) => ({ x: xAt(i), y: yAt(Number(p.value) || 0), v: Number(p.value) || 0, label: p.label }));
  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const areaPath = `M ${pts[0].x.toFixed(1)} ${(H - mB).toFixed(1)} ` +
    pts.map(p => `L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') +
    ` L ${pts[n - 1].x.toFixed(1)} ${(H - mB).toFixed(1)} Z`;

  const gid = `grad-${Math.round(pts[0].y)}-${n}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={height} style={{ overflow: 'visible' }} role="img" aria-label="Courbe d'évolution des sièges">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {n > 1 && <path d={areaPath} fill={`url(#${gid})`} />}
      {n > 1 && <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />}

      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="3.2" fill="#fff" stroke={color} strokeWidth="2" />
          <text x={p.x} y={p.y - 8} textAnchor="middle" fontSize="11" fontWeight="700"
            fontFamily="'JetBrains Mono', monospace" fill="var(--p-text)">{p.v}</text>
          {p.label && (
            <text x={p.x} y={H - 6} textAnchor="middle" fontSize="9"
              fontFamily="'JetBrains Mono', monospace" fill="var(--p-text-40)">{p.label}</text>
          )}
        </g>
      ))}
    </svg>
  );
}
