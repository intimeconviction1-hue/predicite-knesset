import React from 'react';

// Courbe multi-lignes (SVG) : une ligne par parti, sa couleur. Les valeurs null
// (parti absent d'une période) créent une coupure plutôt qu'un faux zéro.
export default function TrendChartMulti({ series = [], labels = [], height = 200 }) {
  const all = series.flatMap(s => s.values).filter(v => v != null);
  if (all.length < 2 || labels.length < 2) return null;

  const min = Math.min(...all), max = Math.max(...all);
  const lo = Math.max(0, min - 2), hi = max + 2;
  const W = 340, H = 180, mL = 8, mR = 8, mT = 12, mB = 22;
  const n = labels.length;
  const xAt = (i) => mL + (i / (n - 1)) * (W - mL - mR);
  const yAt = (v) => H - mB - ((v - lo) / (hi - lo || 1)) * (H - mT - mB);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={height} style={{ overflow: 'visible' }} role="img" aria-label="Tendance des sondages par parti">
      {/* lignes de repère horizontales discrètes */}
      {[0.25, 0.5, 0.75].map((f, i) => (
        <line key={i} x1={mL} x2={W - mR} y1={mT + f * (H - mT - mB)} y2={mT + f * (H - mT - mB)} stroke="var(--p-text-10)" strokeWidth="1" />
      ))}

      {series.map((s, si) => {
        let d = ''; let started = false;
        s.values.forEach((v, i) => {
          if (v == null) { started = false; return; }
          d += `${started ? 'L' : 'M'} ${xAt(i).toFixed(1)} ${yAt(v).toFixed(1)} `;
          started = true;
        });
        return <path key={si} d={d} fill="none" stroke={s.color} strokeWidth="2.25" strokeLinejoin="round" strokeLinecap="round" opacity="0.95" />;
      })}

      {/* pastille + valeur au dernier point de chaque série */}
      {series.map((s, si) => {
        let li = -1;
        s.values.forEach((v, i) => { if (v != null) li = i; });
        if (li < 0) return null;
        const v = s.values[li];
        return (
          <g key={'d' + si}>
            <circle cx={xAt(li)} cy={yAt(v)} r="3" fill="#fff" stroke={s.color} strokeWidth="2" />
          </g>
        );
      })}

      {/* dates : début · milieu · fin */}
      {[0, Math.floor((n - 1) / 2), n - 1].map((i, k) => (
        <text key={k} x={xAt(i)} y={H - 6} textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}
          fontSize="9" fontFamily="'JetBrains Mono', monospace" fill="var(--p-text-40)">{labels[i]}</text>
      ))}
    </svg>
  );
}
