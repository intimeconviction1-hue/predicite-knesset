import React, { useState } from 'react';
import { Share2, Check, Download } from 'lucide-react';

// Partage « mon hémicycle » : génère une VRAIE image (canvas, 1200×630, format
// carte sociale) de la projection en sièges, aux couleurs de la marque, puis
// propose le partage natif (navigator.share avec fichier) ou, à défaut, le
// téléchargement + copie du lien. Aucune donnée inventée : on ne dessine que les
// sièges réellement passés en props.

const SITE = 'predicite-knesset.onrender.com';

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

function buildImage({ seatsByListe, coalition, opposition, arab, source }) {
  const W = 1200, H = 630;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');

  // Fond : bandeau bleu institutionnel en haut → blanc froid.
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#001B6B'); g.addColorStop(0.42, '#0038B8'); g.addColorStop(0.62, '#3f66d6'); g.addColorStop(0.9, '#EDF1F9');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

  // liseré tricolore
  ctx.fillStyle = '#0038B8'; ctx.fillRect(0, 0, W, 6);
  ctx.fillStyle = '#fff'; ctx.fillRect(W / 3, 0, W / 3, 6);
  ctx.fillStyle = '#0038B8'; ctx.fillRect(2 * W / 3, 0, W / 3, 6);

  // Titre
  ctx.textAlign = 'center'; ctx.fillStyle = '#fff';
  ctx.font = '700 30px system-ui, sans-serif';
  ctx.fillText('PRÉDICITÉ · PROJECTION KNESSET 2026', W / 2, 62);
  ctx.font = '800 46px system-ui, sans-serif';
  ctx.fillText('Ma composition de la Knesset', W / 2, 112);

  // Hémicycle
  const total = seatsByListe.reduce((s, l) => s + (l.seats || 0), 0);
  const cx = W / 2, cy = 400, rInner = 96, rOuter = 250, rows = 6;
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
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = '700 16px system-ui, sans-serif';
    ctx.fillText('MAJORITÉ 61', cx, cy - rOuter - 14);
  }

  // Totaux blocs
  ctx.font = '800 40px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#2B5CE6'; ctx.fillText(`${coalition}`, 150, 470);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#C8102E'; ctx.fillText(`${opposition}`, W - 150, 470);
  ctx.font = '600 18px system-ui, sans-serif';
  ctx.textAlign = 'left'; ctx.fillStyle = 'rgba(20,32,61,0.7)'; ctx.fillText('BLOC COALITION', 150, 495);
  ctx.textAlign = 'right'; ctx.fillStyle = 'rgba(20,32,61,0.7)'; ctx.fillText('BLOC OPPOSITION', W - 150, 495);
  if (arab > 0) {
    ctx.textAlign = 'center'; ctx.fillStyle = '#1A8C55';
    ctx.font = '700 18px system-ui, sans-serif';
    ctx.fillText(`+ ${arab} listes arabes`, cx, 470);
  }

  // Pied : source + site
  ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(20,32,61,0.55)';
  ctx.font = '500 17px system-ui, sans-serif';
  if (source) ctx.fillText(source, W / 2, 560);
  ctx.fillStyle = '#7A5F1A'; ctx.font = '700 19px system-ui, sans-serif';
  ctx.fillText(`Joue ta projection sur ${SITE}`, W / 2, 592);

  return canvas;
}

export default function ShareProjection({ seatsByListe = [], coalition = 0, opposition = 0, arab = 0, source, className = '' }) {
  const [state, setState] = useState('idle'); // idle | shared | downloaded | copied

  const total = seatsByListe.reduce((s, l) => s + (l.seats || 0), 0);
  if (!total) return null;

  const handle = async () => {
    const canvas = buildImage({ seatsByListe, coalition, opposition, arab, source });
    const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
    const shareText = `Ma projection pour la Knesset 2026 : coalition ${coalition} · opposition ${opposition}. Fais la tienne sur PrédiCité.`;
    const url = 'https://' + SITE;

    // 1) Partage natif avec image (mobile surtout)
    if (blob && navigator.canShare) {
      const file = new File([blob], 'ma-projection-knesset.png', { type: 'image/png' });
      if (navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: 'Ma projection Knesset 2026', text: shareText });
          setState('shared'); setTimeout(() => setState('idle'), 2500);
          return;
        } catch { /* annulé → on tente les fallbacks */ }
      }
    }
    // 2) Fallback : téléchargement de l'image + copie du lien
    try {
      const dl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = dl; a.download = 'ma-projection-knesset.png';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(dl), 4000);
      try { await navigator.clipboard.writeText(`${shareText} ${url}`); } catch { /* clipboard indispo */ }
      setState('downloaded'); setTimeout(() => setState('idle'), 2500);
    } catch {
      setState('idle');
    }
  };

  const label = state === 'shared' ? 'Partagé !'
    : state === 'downloaded' ? 'Image enregistrée'
    : 'Partager ma projection';
  const Icon = state === 'idle' ? Share2 : state === 'downloaded' ? Download : Check;

  return (
    <button
      onClick={handle}
      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-[10px] font-semibold text-[13px] transition-transform hover:-translate-y-0.5 ${className}`}
      style={{ background: 'var(--p-blue-dim)', color: 'var(--p-blue)', border: '0.5px solid var(--p-blue-border)' }}
    >
      <Icon className="w-4 h-4" /> {label}
    </button>
  );
}
