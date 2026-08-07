import React from 'react';
import { probabiliteDepuisCote } from '@/components/knesset/CoteTile';
import { texteLisible } from '@/lib/couleurs';

/**
 * LA COURBE DE PROBABILITÉ D'UN MARCHÉ — l'inspiration Polymarket.
 *
 * Une cote seule ne dit que le présent. La courbe dit l'histoire : « il était à
 * 40 % avant les primaires ». C'est ce qui transforme un pari en récit, et c'est
 * ce qui manquait le plus au hub des paris.
 *
 * Les points viennent de `paris_cotes_snapshots`, écrits à l'ouverture du marché
 * puis après CHAQUE mise. Ce n'est pas un échantillonnage : dans
 * cote_i = (K + R) / (K·Pᵢ + Rᵢ), seuls Rᵢ et R bougent, et seulement à la prise
 * d'un pari. La courbe est donc exacte et complète, sans point interpolé.
 *
 * ⚠️ Honnêteté : tant qu'un seul point existe (marché ouvert, personne n'a
 * misé), il n'y a pas de courbe — et surtout pas une ligne plate qui laisserait
 * croire à une stabilité observée. Le composant se tait et laisse la page dire
 * qu'aucune mise n'a encore été placée.
 */

const COULEURS = ['var(--p-blue)', 'var(--p-red)', 'var(--p-green)', 'var(--p-gold-text)'];

export default function CourbeCote({ issues = [], hauteur = 96, className = '' }) {
  // Une série par issue, en probabilités (1 / cote), dans l'ordre chronologique.
  const series = issues
    .map((iss, i) => ({
      id: iss.id,
      label: iss.label,
      couleur: COULEURS[i % COULEURS.length],
      points: (iss.historique || [])
        .map(h => probabiliteDepuisCote(h.cote))
        .filter(p => p != null),
    }))
    .filter(s => s.points.length > 0);

  const maxPoints = Math.max(0, ...series.map(s => s.points.length));
  // Deux points au moins, sinon il n'y a rien à raconter.
  if (maxPoints < 2) return null;

  const W = 320, H = 84, mL = 4, mR = 46, mT = 8, mB = 14;
  const xAt = (i, n) => mL + (n <= 1 ? 0 : (i / (n - 1)) * (W - mL - mR));
  // Échelle fixe 0–100 % : une échelle auto-ajustée transformerait un mouvement
  // de deux points en falaise. Sur une probabilité, l'amplitude EST l'information.
  const yAt = (p) => H - mB - p * (H - mT - mB);

  return (
    <div className={className}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={hauteur} style={{ overflow: 'visible' }}
        role="img"
        aria-label={`Évolution des probabilités : ${series.map(s => `${s.label} ${Math.round(s.points[s.points.length - 1] * 100)} %`).join(', ')}`}>

        {/* Repère du 50 % — la ligne d'équilibre d'un marché */}
        <line x1={mL} x2={W - mR} y1={yAt(0.5)} y2={yAt(0.5)} stroke="var(--p-text-10)" strokeWidth="1" strokeDasharray="3 4" />
        <text x={W - mR + 4} y={yAt(0.5) + 3} fontSize="8" fontFamily="'JetBrains Mono', monospace" fill="var(--p-text-25)">50 %</text>

        {series.map((s) => {
          const n = s.points.length;
          const d = s.points.map((p, i) => `${i ? 'L' : 'M'} ${xAt(i, n).toFixed(1)} ${yAt(p).toFixed(1)}`).join(' ');
          const dernier = s.points[n - 1];
          return (
            <g key={s.id}>
              <path d={d} fill="none" stroke={s.couleur} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
              <circle cx={xAt(n - 1, n)} cy={yAt(dernier)} r="3" fill="#fff" stroke={s.couleur} strokeWidth="2" />
              {/* Étiquette directe : le dernier pourcentage, au bout de sa ligne */}
              <text x={W - mR + 4} y={yAt(dernier) + 3}
                fontSize="9.5" fontWeight="700" fontFamily="'JetBrains Mono', monospace"
                fill={texteLisible(s.couleur === 'var(--p-blue)' ? '#2B5CE6' : s.couleur === 'var(--p-red)' ? '#C8102E' : s.couleur === 'var(--p-green)' ? '#1A8C55' : '#7A5F1A')}>
                {Math.round(dernier * 100)} %
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
