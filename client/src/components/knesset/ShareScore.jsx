import React from 'react';
import BoutonPartage from '@/components/knesset/BoutonPartage';
import { nouvelleCarte, entete, pied, panneau, LARGEUR, ENCRE_FORTE } from '@/lib/carte-partage';

// La carte de score des mini-jeux à manches — « Le sens du vent », « Vrai ou
// Fake ? », et tout jeu qui finira par se compter en X bonnes réponses sur N.
//
// Un score ne se partage que s'il se compare : c'est pourquoi le total voyage
// avec lui, en toutes lettres dans le texte comme sur l'image. « J'ai fait 8 »
// ne se relève pas ; « 8 sur 10 » est un défi.

const VERT = '#1A8C55';
const ROUGE = '#C8102E';

export function construire({ titre, kicker, score, total, serie, source }) {
  const { canvas, ctx } = nouvelleCarte();
  entete(ctx, { kicker, titre });

  // ── Le score, en grand ──
  ctx.textAlign = 'center';
  ctx.font = '800 92px system-ui, sans-serif';
  ctx.fillStyle = '#fff';
  const chiffre = `${score}`;
  const largeurChiffre = ctx.measureText(chiffre).width;
  ctx.font = '600 40px system-ui, sans-serif';
  const largeurSuite = ctx.measureText(` / ${total}`).width;
  const depart = LARGEUR / 2 - (largeurChiffre + largeurSuite) / 2;

  ctx.textAlign = 'left';
  ctx.font = '800 92px system-ui, sans-serif';
  ctx.fillStyle = '#fff';
  ctx.fillText(chiffre, depart, 262);
  ctx.font = '600 40px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.fillText(` / ${total}`, depart + largeurChiffre, 262);

  // ── Une pastille par manche : vert pour juste, rouge pour raté ──
  // Le détail manche par manche n'est pas connu ici, et l'inventer serait
  // dessiner un déroulé qui n'a pas eu lieu. On ne montre donc que la
  // PROPORTION — autant de pastilles pleines que de bonnes réponses — sans
  // prétendre dire lesquelles.
  const rayon = 11, ecart = 30;
  const largeurRangee = (total - 1) * ecart;
  const xDepart = LARGEUR / 2 - largeurRangee / 2;
  for (let i = 0; i < total; i++) {
    ctx.beginPath();
    ctx.arc(xDepart + i * ecart, 306, rayon, 0, Math.PI * 2);
    ctx.fillStyle = i < score ? VERT : ROUGE;
    ctx.globalAlpha = i < score ? 1 : 0.45;
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // ── Le panneau clair : la meilleure série, s'il y en a une ──
  if (serie > 0) {
    panneau(ctx, { x: LARGEUR / 2 - 200, y: 358, largeur: 400, hauteur: 68, rayon: 16 });
    ctx.textAlign = 'center';
    ctx.font = '600 15px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(20,32,61,0.55)';
    ctx.fillText('MEILLEURE SÉRIE', LARGEUR / 2, 386);
    ctx.font = '800 26px system-ui, sans-serif';
    ctx.fillStyle = ENCRE_FORTE;
    ctx.fillText(`${serie} d'affilée`, LARGEUR / 2, 414);
  }

  pied(ctx, { source, appel: 'Bats-moi sur' });
  return canvas;
}

export default function ShareScore({
  titre, kicker, chemin, via, nomFichier,
  score = 0, total = 0, serie = 0, source, defi, className = '',
}) {
  if (!total) return null;

  const texte = defi || `${score} sur ${total} à « ${titre} » sur PrédiCité. Fais mieux.`;

  return (
    <BoutonPartage
      construire={() => construire({ titre, kicker, score, total, serie, source })}
      texte={texte}
      chemin={chemin}
      via={via}
      nomFichier={nomFichier}
      label="Partager mon score"
      className={className}
    />
  );
}
