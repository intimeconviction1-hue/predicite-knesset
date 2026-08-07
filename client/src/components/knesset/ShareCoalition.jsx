import React from 'react';
import BoutonPartage from '@/components/knesset/BoutonPartage';
import { nouvelleCarte, entete, pied, panneau, LARGEUR, ENCRE_FORTE } from '@/lib/carte-partage';
import { COULEUR_PARTI_INCONNU } from '@/lib/blocs';

// La carte de « Forme ta coalition » : les listes qu'on a assemblées, le total
// de sièges, et la plausibilité que le jeu leur attribue.
//
// La plausibilité est un chiffre fragile : elle vient d'un barème de frictions
// documentées (voir lib/frictions.js et docs/FRICTIONS_SOURCES.md), pas d'un
// sondage. Sur l'image, elle est donc toujours accompagnée de ce qu'elle est —
// « d'après les frictions documentées entre ces listes ». Un « 82 % plausible »
// qui circulerait seul se lirait comme une prévision, ce qu'il n'est pas.


function construire({ listes, total, majorite, totalSieges, score, libelle }) {
  const { canvas, ctx } = nouvelleCarte();
  entete(ctx, { kicker: 'PRÉDICITÉ · FORME TA COALITION', titre: 'Ma coalition pour la Knesset' });

  // ── Le total, en grand ──
  ctx.textAlign = 'center';
  ctx.font = '800 76px system-ui, sans-serif';
  ctx.fillStyle = total >= majorite ? '#8FE3B0' : '#fff';
  ctx.fillText(`${total}`, LARGEUR / 2, 226);
  ctx.font = '600 20px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.fillText(
    total >= majorite ? `sièges — la majorité de ${majorite} est atteinte` : `sièges — il en manque ${majorite - total} pour la majorité`,
    LARGEUR / 2, 258,
  );

  // ── La barre empilée : une part par liste, à l'échelle des 120 sièges ──
  const xBarre = 150, largeurBarre = LARGEUR - 300, yBarre = 288, hauteurBarre = 26;
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.fillRect(xBarre, yBarre, largeurBarre, hauteurBarre);
  let x = xBarre;
  listes.forEach(l => {
    const largeur = (largeurBarre * (l.seats || 0)) / totalSieges;
    ctx.fillStyle = l.color || COULEUR_PARTI_INCONNU;
    ctx.fillRect(x, yBarre, largeur, hauteurBarre);
    x += largeur;
  });
  // Le repère de majorité, sur la barre elle-même.
  const xMajorite = xBarre + (largeurBarre * majorite) / totalSieges;
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.fillRect(xMajorite - 1.5, yBarre - 7, 3, hauteurBarre + 14);
  ctx.font = '700 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${majorite}`, xMajorite, yBarre - 13);

  // ── Le panneau clair : les listes retenues, puis la plausibilité ──
  const colonnes = listes.length > 6 ? 2 : 1;
  const parColonne = Math.ceil(listes.length / colonnes);
  const yPanneau = 336;
  const hauteurPanneau = 30 + parColonne * 26 + 44;
  panneau(ctx, { x: 150, y: yPanneau, largeur: largeurBarre, hauteur: hauteurPanneau });

  listes.forEach((l, i) => {
    const col = Math.floor(i / parColonne);
    const ligne = i % parColonne;
    const xCol = 178 + col * (largeurBarre / colonnes);
    const y = yPanneau + 30 + ligne * 26;
    ctx.beginPath();
    ctx.arc(xCol + 5, y - 5, 5, 0, Math.PI * 2);
    ctx.fillStyle = l.color || COULEUR_PARTI_INCONNU;
    ctx.fill();
    ctx.textAlign = 'left';
    ctx.font = '600 15px system-ui, sans-serif';
    ctx.fillStyle = ENCRE_FORTE;
    ctx.fillText(l.name_fr, xCol + 18, y);
    ctx.textAlign = 'right';
    ctx.font = '700 15px system-ui, sans-serif';
    ctx.fillText(`${l.seats}`, xCol + largeurBarre / colonnes - 56, y);
  });

  // La plausibilité, séparée du reste par un filet : c'est un jugement, pas un
  // décompte, et l'image doit le montrer autrement qu'en le disant.
  const yVerdict = yPanneau + hauteurPanneau - 30;
  ctx.fillStyle = 'rgba(20,32,61,0.10)';
  ctx.fillRect(178, yVerdict - 24, largeurBarre - 56, 1);
  ctx.textAlign = 'center';
  ctx.font = '700 17px system-ui, sans-serif';
  ctx.fillStyle = ENCRE_FORTE;
  ctx.fillText(`Coalition ${libelle.toLowerCase()} — ${score} %`, LARGEUR / 2, yVerdict);

  pied(ctx, {
    source: "D'après les frictions documentées entre ces listes — un jugement du jeu, pas une prévision",
    appel: 'Assemble la tienne sur',
  });
  return canvas;
}

export default function ShareCoalition({
  listes = [], total = 0, majorite, totalSieges, score = 0, libelle = '', className = '',
}) {
  if (!listes.length) return null;

  const noms = listes.map(l => l.name_fr).join(' + ');
  const texte = total >= majorite
    ? `J'ai formé une coalition à ${total} sièges pour la Knesset 2026 (${noms}) — ${libelle.toLowerCase()}, ${score} %. À toi.`
    : `Ma coalition pour la Knesset 2026 s'arrête à ${total} sièges (${noms}) — il en manque ${majorite - total}. Fais mieux.`;

  return (
    <BoutonPartage
      construire={() => construire({ listes, total, majorite, totalSieges, score, libelle })}
      texte={texte}
      chemin="/FormeCoalition"
      via="coalition"
      nomFichier="ma-coalition-knesset.png"
      label="Partager ma coalition"
      className={className}
    />
  );
}
