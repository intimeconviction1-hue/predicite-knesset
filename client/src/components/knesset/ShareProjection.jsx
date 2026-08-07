import React from 'react';
import { BLOC_LABEL, BLOC_COLOR } from '@/lib/blocs';
import BoutonPartage from '@/components/knesset/BoutonPartage';
import { nouvelleCarte, entete, pied, LARGEUR, ENCRE_FORTE } from '@/lib/carte-partage';

// Partage « mon hémicycle » : une vraie image (canvas, 1200×630, format carte
// sociale) de la projection en sièges, aux couleurs de la marque. Aucune donnée
// inventée : on ne dessine que les sièges réellement passés en props.
//
// Le fond, le liseré, l'en-tête, le pied et la remise de l'image viennent du kit
// commun (lib/carte-partage.js) : ce fichier ne décrit plus que ce qu'il est
// seul à savoir dessiner — un hémicycle et trois totaux.

// Place `total` sièges en demi-cercle et renvoie les positions, ordonnées de la
// gauche vers la droite pour un remplissage couleur cohérent.
function seatPositions(total, cx, cy, rInner, rOuter, rows) {
  const radii = [];
  for (let r = 0; r < rows; r++) radii.push(rInner + (rOuter - rInner) * (rows === 1 ? 0 : r / (rows - 1)));
  const sum = radii.reduce((a, b) => a + b, 0) || 1;
  const counts = radii.map(r => Math.max(1, Math.round(total * r / sum)));
  let diff = total - counts.reduce((a, b) => a + b, 0);
  let ri = rows - 1;
  while (diff !== 0 && rows > 0) {
    counts[ri] += diff > 0 ? 1 : -1;
    diff += diff > 0 ? -1 : 1;
    ri = (ri - 1 + rows) % rows;
  }
  const pts = [];
  for (let r = 0; r < rows; r++) {
    const n = counts[r], rad = radii[r];
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0.5 : i / (n - 1);
      const ang = Math.PI - Math.PI * t;
      pts.push({ x: cx + rad * Math.cos(ang), y: cy - rad * Math.sin(ang), ang });
    }
  }
  pts.sort((a, b) => b.ang - a.ang);
  return pts;
}

function buildImage({ seatsByListe, pro, anti, arab, source }) {
  const { canvas, ctx } = nouvelleCarte();
  entete(ctx, { kicker: 'PRÉDICITÉ · PROJECTION KNESSET 2026', titre: 'Ma composition de la Knesset' });

  // Hémicycle
  const total = seatsByListe.reduce((s, l) => s + (l.seats || 0), 0);
  const cx = LARGEUR / 2, cy = 400, rInner = 96, rOuter = 250, rows = 6;
  const pts = total > 0 ? seatPositions(total, cx, cy, rInner, rOuter, rows) : [];
  const colors = [];
  seatsByListe.forEach(l => { for (let i = 0; i < (l.seats || 0); i++) colors.push(l.color || '#94a3b8'); });
  pts.forEach((p, i) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 7.5, 0, Math.PI * 2);
    ctx.fillStyle = colors[i] || '#94a3b8';
    ctx.fill();
  });

  // ligne de majorité 61 (repère central)
  if (total > 0) {
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = '700 16px system-ui, sans-serif';
    ctx.fillText('MAJORITÉ 61', cx, cy - rOuter - 14);
  }

  // Totaux des trois blocs. Les libellés viennent de lib/blocs.js : ils étaient
  // écrits en dur ici, si bien que le renommage du 2026-08-04 (« Bloc coalition »
  // / « Bloc opposition » décrivaient la 25e Knesset et se lisaient comme un
  // positionnement gauche-droite) n'avait pas atteint l'image qu'on partage —
  // l'endroit qui sort du site et qu'on ne peut plus corriger une fois envoyé.
  // Les partis arabes passent au même traitement que les deux camps, en plus
  // petit : ce sont eux le pivot, et ils étaient réduits à une mention.
  ctx.font = '800 40px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#2B5CE6'; ctx.fillText(`${pro}`, 150, 470);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#C8102E'; ctx.fillText(`${anti}`, LARGEUR - 150, 470);
  ctx.font = '600 18px system-ui, sans-serif';
  ctx.textAlign = 'left'; ctx.fillStyle = ENCRE_FORTE;
  ctx.fillText(BLOC_LABEL.pro_netanyahou.toUpperCase(), 150, 495);
  ctx.textAlign = 'right'; ctx.fillStyle = ENCRE_FORTE;
  ctx.fillText(BLOC_LABEL.anti_netanyahou.toUpperCase(), LARGEUR - 150, 495);
  if (arab > 0) {
    ctx.textAlign = 'center';
    ctx.fillStyle = BLOC_COLOR.partis_arabes;
    ctx.font = '800 28px system-ui, sans-serif';
    ctx.fillText(`${arab}`, cx, 470);
    ctx.font = '600 15px system-ui, sans-serif';
    ctx.fillStyle = ENCRE_FORTE;
    ctx.fillText(BLOC_LABEL.partis_arabes.toUpperCase(), cx, 493);
  }

  pied(ctx, { source });
  return canvas;
}

export default function ShareProjection({ seatsByListe = [], pro = 0, anti = 0, arab = 0, source, className = '' }) {
  const total = seatsByListe.reduce((s, l) => s + (l.seats || 0), 0);
  if (!total) return null;

  return (
    <BoutonPartage
      construire={() => buildImage({ seatsByListe, pro, anti, arab, source })}
      texte={`Ma projection pour la Knesset 2026 : ${BLOC_LABEL.pro_netanyahou} ${pro} · ${BLOC_LABEL.anti_netanyahou} ${anti}. Fais la tienne sur PrédiCité.`}
      chemin="/MaRepartition"
      via="projection"
      nomFichier="ma-projection-knesset.png"
      label="Partager ma projection"
      className={className}
    />
  );
}
