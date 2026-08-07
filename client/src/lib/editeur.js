/**
 * Qui édite le site, et sur quelle infrastructure.
 *
 * Ces quelques lignes sont la seule partie des mentions légales qui ne se déduit
 * pas du dépôt : le reste (ce qu'on collecte, pourquoi, combien de temps) se lit
 * dans schema.sql et dans les routes. L'identité de l'éditeur, elle, n'existe
 * nulle part dans le code — et c'est justement ce qu'une mention légale doit
 * dire.
 *
 * Elles sont donc laissées à NULL plutôt que remplies d'un nom plausible. Une
 * mention légale inventée est pire que pas de mention du tout : elle a la forme
 * d'un engagement juridique. Tant que ces valeurs sont vides, la page l'annonce
 * franchement au lieu d'afficher un blanc — voir pages/Mentions.jsx.
 *
 * À REMPLIR AVANT DIFFUSION. Les quatre champs de `EDITEUR` suffisent ; le reste
 * du fichier est déjà exact.
 */

export const EDITEUR = {
  /** Nom de l'éditeur : personne physique (« Prénom Nom ») ou morale. */
  nom: null,
  /**
   * Statut : « particulier », « association loi 1901 », « SAS », etc.
   * Un site édité par un particulier à titre non professionnel n'a pas à publier
   * son adresse postale (art. 6 III-2 de la LCEN) — il lui suffit de nommer son
   * hébergeur, qui la détient. D'où l'absence volontaire de champ « adresse ».
   */
  statut: null,
  /** Adresse de contact — celle par laquelle on exerce ses droits RGPD. */
  contact: null,
  /**
   * Directeur de la publication. Souvent la même personne que l'éditeur ; le
   * champ est distinct parce que la loi les distingue.
   */
  directeurPublication: null,
};

/** L'éditeur est-il renseigné ? Sinon la page le dit plutôt que d'afficher un vide. */
export const EDITEUR_RENSEIGNE = Object.values(EDITEUR).every(v => typeof v === 'string' && v.trim().length > 0);

/**
 * L'hébergement. Ces valeurs-là sont connues du dépôt (README, déploiement du
 * 2026-07-24) et vérifiables : le serveur Express et le build client tournent
 * sur Render, la base Postgres est chez Neon. Les deux sont américains, ce qui
 * fait de tout stockage un transfert hors Union européenne — c'est le point que
 * la politique de confidentialité doit énoncer, pas contourner.
 */
export const HEBERGEUR = {
  application: {
    nom: 'Render Services, Inc.',
    lieu: 'San Francisco, Californie, États-Unis',
    site: 'https://render.com',
  },
  base: {
    nom: 'Neon Inc.',
    lieu: 'États-Unis',
    site: 'https://neon.tech',
  },
};
