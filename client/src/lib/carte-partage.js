/**
 * Le kit des cartes de partage — le fond, l'en-tête, le pied, et la remise.
 *
 * D'où ça vient. Toute cette plomberie vivait dans ShareProjection.jsx, qui
 * dessinait la seule carte du site : l'hémicycle. Le jour où l'on veut partager
 * autre chose — son résultat de Boussole, son score de quiz, la coalition qu'on
 * a assemblée — recopier ce fichier serait garantir que les cartes divergent :
 * un liseré qui glisse, un pied qui cite l'ancien domaine, une marque qui n'est
 * plus la même selon la page d'où l'on a partagé. Or ces images sont ce que le
 * site montre de lui-même à des gens qui ne le connaissent pas, et on ne peut
 * plus les corriger une fois envoyées.
 *
 * Ce que chaque page fournit : le milieu de l'image, et rien d'autre.
 *
 * Une carte fait 1200×630. Ce n'est pas un choix esthétique : c'est le format
 * qu'attendent les aperçus des réseaux, le même que celui de og:image.
 */

export const LARGEUR = 1200;
export const HAUTEUR = 630;

/** Les couleurs de marque, en dur. Un canvas ne lit pas les variables CSS. */
export const ENCRE = 'rgba(20,32,61,0.55)';
export const ENCRE_FORTE = 'rgba(20,32,61,0.7)';
export const OR = '#7A5F1A';
export const BLEU = '#0038B8';

/**
 * L'hôte du site, tel que le navigateur le connaît.
 *
 * Il était écrit en dur (« predicite-knesset.onrender.com »). Le pied de chaque
 * carte partagée aurait donc continué d'envoyer les gens sur l'adresse Render le
 * jour du vrai nom de domaine — et sur des images déjà envoyées, qu'on ne
 * rattrape pas. Le serveur avait déjà réglé la même question pour les balises
 * Open Graph en lisant l'origine de la requête (voir server/lib/meta-html.js) ;
 * le client la lit dans window.location.
 */
export function hote() {
  return window.location.host;
}

/** L'URL à faire figurer sur une carte et dans le texte du partage. */
export function urlDePartage(chemin = '/', via) {
  const url = new URL(chemin, window.location.origin);
  // `via` dit d'où vient le clic : la Boussole, une ligue, un score de quiz.
  // C'est ce qui permet de savoir laquelle de ces cartes ramène réellement du
  // monde, sans traceur ni cookie — voir server/routes/audience.js. Le canonical
  // de la page l'ignore, donc ce paramètre ne crée pas d'URL concurrente aux
  // yeux d'un moteur (voir server/lib/meta-html.js).
  if (via) url.searchParams.set('via', via);
  return url.href;
}

/**
 * Un canvas neuf, fond posé : dégradé bleu institutionnel vers blanc froid, et
 * le liseré de marque en haut.
 * @returns {{canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D}}
 */
export function nouvelleCarte() {
  const canvas = document.createElement('canvas');
  canvas.width = LARGEUR;
  canvas.height = HAUTEUR;
  const ctx = canvas.getContext('2d');

  const g = ctx.createLinearGradient(0, 0, 0, HAUTEUR);
  g.addColorStop(0, '#001B6B');
  g.addColorStop(0.42, '#0038B8');
  g.addColorStop(0.62, '#3f66d6');
  g.addColorStop(0.9, '#EDF1F9');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, LARGEUR, HAUTEUR);

  ctx.fillStyle = BLEU; ctx.fillRect(0, 0, LARGEUR, 6);
  ctx.fillStyle = '#fff'; ctx.fillRect(LARGEUR / 3, 0, LARGEUR / 3, 6);
  ctx.fillStyle = BLEU; ctx.fillRect((2 * LARGEUR) / 3, 0, LARGEUR / 3, 6);

  return { canvas, ctx };
}

/**
 * L'en-tête : la ligne de marque, puis le titre de la carte.
 * Le titre est réduit s'il déborde, plutôt que rogné : une carte est une image,
 * personne ne pourra faire défiler le mot coupé.
 */
export function entete(ctx, { kicker = 'PRÉDICITÉ · KNESSET 2026', titre }) {
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff';
  ctx.font = '700 30px system-ui, sans-serif';
  ctx.fillText(kicker, LARGEUR / 2, 62);

  let taille = 46;
  ctx.font = `800 ${taille}px system-ui, sans-serif`;
  while (ctx.measureText(titre).width > LARGEUR - 120 && taille > 26) {
    taille -= 2;
    ctx.font = `800 ${taille}px system-ui, sans-serif`;
  }
  ctx.fillText(titre, LARGEUR / 2, 112);
}

/**
 * Le pied : la source affichée telle quelle (elle doit rester vérifiable), puis
 * l'invitation à venir jouer.
 */
export function pied(ctx, { source, appel = 'Joue ta projection sur' } = {}) {
  ctx.textAlign = 'center';
  if (source) {
    ctx.fillStyle = ENCRE;
    ctx.font = '500 17px system-ui, sans-serif';
    ctx.fillText(source, LARGEUR / 2, 560);
  }
  ctx.fillStyle = OR;
  ctx.font = '700 19px system-ui, sans-serif';
  ctx.fillText(`${appel} ${hote()}`, LARGEUR / 2, 592);
}

/**
 * Un panneau clair posé sur le dégradé.
 *
 * Le fond passe du bleu nuit au blanc froid entre le haut et le bas de l'image :
 * un texte sombre est illisible dans le tiers haut, un texte clair l'est dans le
 * tiers bas, et la limite se déplace selon la hauteur du contenu de chaque
 * carte. Poser un panneau plutôt que d'ajuster la couleur du texte au jugé rend
 * le contraste indépendant de l'endroit où l'on dessine.
 */
export function panneau(ctx, { x, y, largeur, hauteur, rayon = 20, fond = 'rgba(255,255,255,0.94)' }) {
  ctx.save();
  ctx.beginPath();
  // roundRect est récent : sur un navigateur qui ne l'a pas, on préfère des
  // angles droits à une carte qui ne se dessine pas du tout.
  if (typeof ctx.roundRect === 'function') ctx.roundRect(x, y, largeur, hauteur, rayon);
  else ctx.rect(x, y, largeur, hauteur);
  ctx.fillStyle = fond;
  ctx.fill();
  ctx.restore();
}

/**
 * Écrit un texte sur plusieurs lignes, centré, dans une largeur donnée.
 * Utile aux cartes dont le milieu est une phrase (Boussole, coalition) plutôt
 * qu'un graphique.
 * @returns {number} l'ordonnée juste sous la dernière ligne écrite
 */
export function texteMultiligne(ctx, texte, { x, y, largeurMax, interligne }) {
  const mots = String(texte).split(' ');
  const lignes = [];
  let courante = '';
  for (const mot of mots) {
    const essai = courante ? `${courante} ${mot}` : mot;
    if (ctx.measureText(essai).width > largeurMax && courante) {
      lignes.push(courante);
      courante = mot;
    } else {
      courante = essai;
    }
  }
  if (courante) lignes.push(courante);
  lignes.forEach((ligne, i) => ctx.fillText(ligne, x, y + i * interligne));
  return y + lignes.length * interligne;
}

/**
 * Remet la carte à qui la partage.
 *
 * Trois chemins, dans cet ordre : le partage natif avec le fichier (mobile, où
 * l'image atterrit directement dans la conversation), puis le téléchargement de
 * l'image accompagné du lien copié dans le presse-papiers (bureau), et enfin
 * rien du tout si le navigateur refuse les deux — auquel cas on le dit au lieu
 * de laisser un bouton qui semble avoir marché.
 *
 * Le lien accompagne le texte dans LES DEUX chemins. Il ne le faisait que dans
 * le second : le partage natif n'envoyait que la phrase et l'image, sans jamais
 * l'adresse du site. C'est-à-dire que sur mobile — le cas de très loin le plus
 * fréquent, et le seul où l'image arrive directement dans la conversation — on
 * partageait une belle carte que personne ne pouvait suivre.
 *
 * @returns {Promise<'partage'|'telecharge'|'echec'>}
 */
export async function partagerCarte(canvas, { texte, chemin = '/', via, nomFichier = 'predicite.png' }) {
  const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
  if (!blob) return 'echec';
  const url = urlDePartage(chemin, via);

  if (navigator.canShare) {
    const fichier = new File([blob], nomFichier, { type: 'image/png' });
    if (navigator.canShare({ files: [fichier] })) {
      try {
        await navigator.share({ files: [fichier], text: `${texte} ${url}` });
        return 'partage';
      } catch {
        // Annulé par l'utilisateur, ou refusé : on tente le repli.
      }
    }
  }

  try {
    const lien = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = lien;
    a.download = nomFichier;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(lien), 4000);
    try {
      await navigator.clipboard.writeText(`${texte} ${url}`);
    } catch {
      // Presse-papiers indisponible (contexte non sécurisé, permission refusée) :
      // l'image est enregistrée, c'est l'essentiel.
    }
    return 'telecharge';
  } catch {
    return 'echec';
  }
}
