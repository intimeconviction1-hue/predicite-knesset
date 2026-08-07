import React from 'react';
import { texteLisible } from '@/lib/couleurs';

/**
 * Courbe multi-lignes (SVG) : une ligne par parti, sa couleur.
 *
 * 2026-08-07 — la couleur seule ne suffisait plus, et ce n'est pas une question
 * de goût : sur les treize listes actives, la base en compte QUATRE bleues
 * (#0038B8 Likoud, #1E3A8A Otzma Yehudit, #3B82F6 Ensemble, #0EA5E9 Yisrael
 * Beytenou) et QUATRE vertes (#059669 Ra'am, #22C55E Yashar, #84CC16 Les
 * Démocrates, #0D9488 Sionisme religieux). Le graphique en affiche six ; il y
 * avait donc, presque toujours, deux ou trois bleus côte à côte. La légende
 * sous le graphique demandait de mémoriser une nuance pour la retrouver deux
 * centimètres plus haut — un exercice, pas une lecture.
 *
 * Les couleurs de partis viennent de la base et ne s'inventent pas : on ne les
 * change donc pas. On ARRÊTE simplement de leur faire porter seules
 * l'information. Chaque courbe est étiquetée à son extrémité droite, avec son
 * nom et son dernier chiffre — c'est la règle WCAG 1.4.1 (ne jamais faire
 * reposer une information sur la seule couleur), et c'est surtout ce qu'un œil
 * fait naturellement : lire la fin d'une courbe.
 *
 * Les étiquettes se repoussent verticalement quand deux courbes finissent au
 * même niveau, sinon elles se superposeraient exactement dans le cas le plus
 * intéressant : l'égalité.
 */

// Un nom de parti tient rarement dans la marge. On coupe au premier segment
// utile plutôt qu'au caractère : « Yashar (Gadi Eisenkot) » → « Yashar »,
// « Hadash-Ta'al / Liste commune » → « Hadash-Ta'al ».
function nomCourt(nom = '') {
  const base = nom.split(/\s*[(/]/)[0].trim() || nom;
  return base.length > 15 ? `${base.slice(0, 14)}…` : base;
}

// Écarte les étiquettes qui se chevauchent, en gardant l'ordre vertical des
// courbes : on ne déplace jamais une étiquette au-dessus de sa voisine.
function espacer(points, ecartMin) {
  const tries = [...points].sort((a, b) => a.y - b.y);
  for (let i = 1; i < tries.length; i++) {
    const delta = tries[i].y - tries[i - 1].y;
    if (delta < ecartMin) tries[i].y = tries[i - 1].y + ecartMin;
  }
  return tries;
}

export default function TrendChartMulti({ series = [], labels = [], height = 200 }) {
  const all = series.flatMap(s => s.values).filter(v => v != null);
  if (all.length < 2 || labels.length < 2) return null;

  const min = Math.min(...all), max = Math.max(...all);
  const lo = Math.max(0, min - 2), hi = max + 2;
  // La marge droite passe de 8 à 92 : c'est la place des étiquettes. Le tracé
  // se resserre d'autant, ce qui n'enlève rien — la forme d'une courbe se lit
  // à sa pente, pas à sa largeur.
  const W = 340, H = 180, mL = 8, mR = 92, mT = 12, mB = 22;
  const n = labels.length;
  const xAt = (i) => mL + (i / (n - 1)) * (W - mL - mR);
  const yAt = (v) => H - mB - ((v - lo) / (hi - lo || 1)) * (H - mT - mB);

  // Dernier point réel de chaque série (une série peut s'arrêter avant la fin).
  const fins = series.map((s, si) => {
    let li = -1;
    s.values.forEach((v, i) => { if (v != null) li = i; });
    return li < 0 ? null : { si, s, li, x: xAt(li), y: yAt(s.values[li]), valeur: s.values[li] };
  }).filter(Boolean);

  const etiquettes = espacer(fins.map(f => ({ ...f })), 12);

  return (
    <svg className="p-trend-draw" viewBox={`0 0 ${W} ${H}`} width="100%" height={height} style={{ overflow: 'visible' }}
      role="img"
      aria-label={`Tendance des sondages : ${series.map(s => `${s.name} ${s.latest ?? '?'} sièges`).join(', ')}`}>
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
        // pathLength="1" normalise la longueur du tracé : le dash/offset devient
        // une fraction (0 → 1), donc l'animation de dessin n'a pas besoin de
        // mesurer quoi que ce soit en JavaScript. Voir .p-trend-line/.p-trend-draw.
        return <path key={si} className="p-trend-line" pathLength="1" d={d} fill="none" stroke={s.color} strokeWidth="2.25" strokeLinejoin="round" strokeLinecap="round" opacity="0.95" />;
      })}

      {/* pastille au dernier point de chaque série */}
      {fins.map(f => (
        <circle key={`d${f.si}`} cx={f.x} cy={f.y} r="3.2" fill="#fff" stroke={f.s.color} strokeWidth="2" />
      ))}

      {/* étiquettes directes : le nom et le dernier chiffre, dans la marge */}
      {etiquettes.map(e => (
        <g key={`e${e.si}`}>
          {/* Le filet qui relie la pastille à son étiquette quand celle-ci a dû
              être décalée : sans lui, une étiquette repoussée de 12 px désigne
              la mauvaise courbe. */}
          <path d={`M ${e.x + 4} ${fins.find(f => f.si === e.si).y} L ${W - mR + 5} ${e.y}`}
            fill="none" stroke={e.s.color} strokeWidth="1" opacity="0.45" />
          <text x={W - mR + 8} y={e.y + 3.2}
            fontSize="9.5" fontFamily="var(--font-body), system-ui" fontWeight="600"
            fill={texteLisible(e.s.color)}>
            {nomCourt(e.s.name)}
            <tspan fontFamily="'JetBrains Mono', monospace" fontWeight="700" dx="4">{e.valeur}</tspan>
          </text>
        </g>
      ))}

      {/* dates : début · milieu · fin */}
      {[0, Math.floor((n - 1) / 2), n - 1].map((i, k) => (
        <text key={k} x={xAt(i)} y={H - 6} textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}
          fontSize="9" fontFamily="'JetBrains Mono', monospace" fill="var(--p-text-40)">{labels[i]}</text>
      ))}
    </svg>
  );
}
