import React from 'react';
import BoutonPartage from '@/components/knesset/BoutonPartage';
import { nouvelleCarte, entete, pied, panneau, LARGEUR, ENCRE, ENCRE_FORTE } from '@/lib/carte-partage';
import { COULEUR_PARTI_INCONNU } from '@/lib/blocs';

// La carte de la Boussole : « voilà de quel parti je suis le plus proche ».
//
// C'est le résultat le plus personnel que produit le site, donc celui qu'on
// montre. Deux précautions, qui sont les mêmes qu'à l'écran :
//   • les ex æquo sont tous nommés — couronner un seul parti quand les données
//     sont indiscernables ferait dire aux réponses plus qu'elles ne disent ;
//   • le dénominateur voyage avec le pourcentage. « 100 % d'affinité » seul est
//     un chiffre trompeur ; « 100 % sur 4 affirmations » est un chiffre vrai. Et
//     une carte partagée est exactement l'endroit où le premier circulerait sans
//     le second.
//
// Aucune réponse n'est écrite sur l'image ni envoyée nulle part : une opinion
// politique reste dans le navigateur de qui l'exprime (voir pages/Mentions.jsx).


// Le panneau clair du classement ne remonte jamais au-dessus de cette ligne,
// même quand un seul parti est nommé : plus haut, le dégradé est encore bleu et
// le texte sombre du classement y perdrait son contraste.
const HAUTEUR_PANNEAU_MIN = 372;

export function construire({ exAequo, matches, statements }) {
  const { canvas, ctx } = nouvelleCarte();
  entete(ctx, { kicker: 'PRÉDICITÉ · BOUSSOLE POLITIQUE', titre: 'Le parti qui me ressemble' });

  // ── Le résultat, dans la partie sombre du dégradé ──
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255,255,255,0.72)';
  ctx.font = '600 17px system-ui, sans-serif';
  ctx.fillText(
    (exAequo.length > 1 ? `${exAequo.length} PARTIS À ÉGALITÉ` : 'MON PARTI LE PLUS PROCHE').toUpperCase(),
    LARGEUR / 2, 178,
  );

  // Les noms : un seul en grand, plusieurs en plus petit pour qu'ils tiennent.
  const taille = exAequo.length > 2 ? 34 : exAequo.length > 1 ? 40 : 52;
  exAequo.slice(0, 3).forEach((m, i) => {
    const y = 232 + i * (taille + 10);
    ctx.font = `800 ${taille}px system-ui, sans-serif`;
    const nom = m.liste.name_fr;
    const largeurNom = ctx.measureText(nom).width;
    // La pastille de couleur, collée au nom, comme à l'écran.
    const rayon = taille * 0.22;
    const xPastille = LARGEUR / 2 - largeurNom / 2 - rayon - 14;
    ctx.beginPath();
    ctx.arc(xPastille, y - taille * 0.32, rayon, 0, Math.PI * 2);
    ctx.fillStyle = m.liste.color || COULEUR_PARTI_INCONNU;
    ctx.fill();
    // Un liseré clair autour de la pastille. Sans lui, les partis dont la
    // couleur est un bleu nuit — le Likoud le premier — disparaissent purement
    // et simplement dans le dégradé, à l'endroit le plus important de l'image.
    // Le contour ne change rien aux couleurs vives et sauve les sombres.
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText(nom, LARGEUR / 2 + rayon + 7, y);
  });

  const premier = exAequo[0];
  const bas = 232 + Math.min(exAequo.length, 3) * (taille + 10);
  ctx.font = '600 20px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillText(
    `${premier.pct} % d'affinité, sur ${premier.rel} affirmation${premier.rel > 1 ? 's' : ''} où ${exAequo.length > 1 ? 'ces partis se positionnent' : 'ce parti se positionne'}`,
    LARGEUR / 2, bas + 4,
  );

  // ── Le classement, sur un panneau clair ──
  const suite = matches.slice(0, 4);
  const hauteurPanneau = 26 + suite.length * 34;
  const yPanneau = Math.max(bas + 26, HAUTEUR_PANNEAU_MIN);
  panneau(ctx, { x: 150, y: yPanneau, largeur: LARGEUR - 300, hauteur: hauteurPanneau });

  suite.forEach((m, i) => {
    const y = yPanneau + 30 + i * 34;
    ctx.textAlign = 'left';
    ctx.font = `${i === 0 ? 700 : 500} 16px system-ui, sans-serif`;
    ctx.fillStyle = ENCRE_FORTE;
    ctx.fillText(m.liste.name_fr, 176, y);

    // Le dénominateur est calé sur le bord INTÉRIEUR du panneau, et le
    // pourcentage se place à sa gauche. Écrit dans l'autre sens, il partait de
    // 34 px après le pourcentage et débordait du panneau blanc : « 87 % /11 »
    // laissait le « /11 » retomber sur le dégradé, hors de son cadre. C'est
    // précisément le chiffre qui empêche de lire « 87 % » comme une certitude,
    // donc celui qu'on ne peut pas laisser s'échapper de l'image.
    const droite = LARGEUR - 176;
    ctx.textAlign = 'right';
    ctx.font = '500 13px system-ui, sans-serif';
    ctx.fillStyle = ENCRE;
    const denominateur = `/${m.rel}`;
    ctx.fillText(denominateur, droite, y);
    const largeurDenominateur = ctx.measureText(denominateur).width;
    ctx.font = '700 16px system-ui, sans-serif';
    ctx.fillStyle = ENCRE_FORTE;
    ctx.fillText(`${m.pct} %`, droite - largeurDenominateur - 7, y);

    // La barre, sous le libellé.
    const xBarre = 176, largeurBarre = LARGEUR - 352 - 60;
    ctx.fillStyle = 'rgba(20,32,61,0.10)';
    ctx.fillRect(xBarre, y + 6, largeurBarre, 5);
    ctx.fillStyle = m.liste.color || COULEUR_PARTI_INCONNU;
    ctx.fillRect(xBarre, y + 6, (largeurBarre * Math.max(0, Math.min(100, m.pct))) / 100, 5);
  });

  pied(ctx, {
    source: `Résultat indicatif · ${statements} affirmations · ni un conseil de vote, ni une position de PrédiCité`,
    appel: 'Fais le test sur',
  });
  return canvas;
}

export default function ShareBoussole({ exAequo = [], matches = [], statements, className = '' }) {
  if (!exAequo.length || !matches.length) return null;

  const noms = exAequo.map(m => m.liste.name_fr).join(', ');
  const texte = exAequo.length > 1
    ? `Ma boussole politique israélienne me place à égalité entre ${noms} (${exAequo[0].pct} % d'affinité sur ${exAequo[0].rel} affirmations). Et toi ?`
    : `Ma boussole politique israélienne me rapproche de ${noms} — ${exAequo[0].pct} % d'affinité sur ${exAequo[0].rel} affirmations. Et toi ?`;

  return (
    <BoutonPartage
      construire={() => construire({ exAequo, matches, statements })}
      texte={texte}
      chemin="/Boussole"
      via="boussole"
      nomFichier="ma-boussole-politique.png"
      label="Partager mon résultat"
      className={className}
    />
  );
}
