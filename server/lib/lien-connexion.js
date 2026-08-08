/**
 * Les liens de connexion (magic link) — fabrication, vérification, garde-fous.
 *
 * Séparé de la route pour que ces règles soient testables sans monter un serveur
 * ni ouvrir une base : ce sont elles qui décident si quelqu'un entre.
 *
 * ── Le modèle de menace ──
 * Jusqu'ici, une session s'ouvrait sur la simple saisie d'une adresse. Sur un jeu
 * de pronostics gratuit, l'enjeu paraissait faible ; sur un scrutin polarisé avec
 * un classement public, il ne l'est pas. Quelqu'un pouvait se déclarer titulaire
 * de l'adresse d'un journaliste, d'un élu, ou simplement d'un autre joueur, et
 * apparaître sous son nom. Le lien envoyé par e-mail rétablit ce qui manquait :
 * la preuve qu'on lit bien la boîte dont on se réclame.
 *
 * ── Ce qui est tenu ici ──
 *   • Le jeton est aléatoire (32 octets), et seule son empreinte est conservée.
 *   • Il vaut UNE fois : la consommation et la vérification sont la même écriture
 *     SQL, donc deux clics simultanés ne peuvent pas ouvrir deux sessions.
 *   • Il expire en 20 minutes — assez pour aller chercher son courrier, trop peu
 *     pour qu'un lien oublié dans une boîte partagée serve six mois plus tard.
 *   • La destination du retour est fixée et validée à la DEMANDE, jamais lue
 *     dans l'URL de retour : un lien de connexion qui accepte « ...&return_to=
 *     https://ailleurs » est une redirection ouverte signée par nos soins.
 */
import { randomBytes, createHash, randomUUID } from 'node:crypto';
import { queryOne, queryAll, run } from '../db/index.js';

/** Durée de validité d'un lien. */
export const VALIDITE_MS = 20 * 60 * 1000;

/** Au-delà, on cesse d'envoyer : voir `tropDeDemandes`. */
export const MAX_DEMANDES = 4;
export const FENETRE_DEMANDES_MS = 15 * 60 * 1000;

/** L'empreinte d'un jeton — la seule forme sous laquelle il touche la base. */
export function empreinte(token) {
  return createHash('sha256').update(String(token)).digest('hex');
}

/** Une adresse plausible, normalisée. `null` si elle ne l'est pas. */
export function normaliserEmail(brut) {
  const email = String(brut || '').trim().toLowerCase();
  // Volontairement permissif : une expression rationnelle stricte rejette des
  // adresses valides, et le vrai contrôle est ailleurs — c'est l'e-mail lui-même
  // qui prouve l'adresse. On écarte seulement ce qui ne peut pas en être une.
  if (email.length < 6 || email.length > 254) return null;
  if (!/^[^\s@]+@[^\s@.]+\.[^\s@]+$/.test(email)) return null;
  return email;
}

/**
 * Une destination de retour sûre.
 *
 * N'accepte qu'un chemin interne. Sont refusés : les URL absolues
 * (`https://ailleurs`), les chemins protocol-relative (`//ailleurs`, que le
 * navigateur traite comme un autre site), les antislashs (que certains
 * navigateurs normalisent en barres obliques) et tout ce qui n'est pas ancré à
 * la racine. À défaut, la page d'accueil.
 */
export function retourSur(brut) {
  const v = String(brut || '');
  if (!v.startsWith('/')) return '/';
  if (v.startsWith('//')) return '/';
  if (v.includes('\\')) return '/';
  if (/[\r\n]/.test(v)) return '/';
  return v;
}

/**
 * Trop de demandes récentes pour cette adresse ?
 *
 * Deux raisons, également importantes. Sans limite, le formulaire devient un
 * moyen d'inonder la boîte de quelqu'un d'autre — on ne demande pas son
 * consentement pour lui écrire, puisque c'est le principe même de l'inscription.
 * Et sur un compte SMTP ordinaire, quelques centaines d'envois suffisent à faire
 * plafonner la journée pour tout le monde.
 */
export async function tropDeDemandes(email) {
  const depuis = new Date(Date.now() - FENETRE_DEMANDES_MS).toISOString();
  const { n } = await queryOne(
    'SELECT COUNT(*) AS n FROM liens_connexion WHERE email = ? AND cree_le >= ?',
    [email, depuis],
  );
  return Number(n) >= MAX_DEMANDES;
}

/**
 * Fabrique un lien et enregistre son empreinte.
 * @returns {Promise<string>} le jeton en clair — le seul exemplaire, à envoyer.
 */
export async function creerLien({ email, full_name, return_to }) {
  // base64url : passe sans encodage dans une URL, donc aucun client mail ne peut
  // le tronquer sur un caractère spécial. 32 octets = 256 bits.
  const token = randomBytes(32).toString('base64url');
  await run(
    `INSERT INTO liens_connexion (token_hash, email, full_name, return_to, expire_le)
     VALUES (?, ?, ?, ?, ?)`,
    [
      empreinte(token),
      email,
      (full_name || '').trim().slice(0, 80) || null,
      retourSur(return_to),
      new Date(Date.now() + VALIDITE_MS).toISOString(),
    ],
  );
  return token;
}

/**
 * Consomme un jeton. Rend la ligne si elle était valide, `null` sinon.
 *
 * La vérification et la consommation sont une SEULE écriture : le `WHERE` porte
 * sur `utilise_le IS NULL` et sur l'expiration, et c'est la mise à jour
 * elle-même qui décide. Lire d'abord puis écrire ensuite laisserait une fenêtre
 * — deux clics simultanés sur le même lien, ou un client mail qui pré-charge les
 * URL d'un message avant que la personne ne clique — pendant laquelle le jeton
 * vaudrait deux fois.
 */
export async function consommerLien(token) {
  if (!token || typeof token !== 'string' || token.length < 20) return null;
  const maintenant = new Date().toISOString();
  const lignes = await queryAll(
    `UPDATE liens_connexion
        SET utilise_le = ?
      WHERE token_hash = ?
        AND utilise_le IS NULL
        AND expire_le > ?
      RETURNING email, full_name, return_to`,
    [maintenant, empreinte(token), maintenant],
  );
  return lignes[0] || null;
}

/**
 * Efface les liens périmés depuis plus d'un jour.
 *
 * Appelé après chaque demande plutôt que par une tâche planifiée : il n'y a pas
 * d'ordonnanceur ici, et la table ne grossit qu'à la vitesse des connexions. On
 * garde une journée de marge pour que la table reste lisible si l'on doit
 * comprendre une connexion qui a échoué.
 */
export async function purgerLiensPerimes() {
  const seuil = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  await run('DELETE FROM liens_connexion WHERE expire_le < ?', [seuil]);
}

/**
 * Ouvre le compte s'il n'existe pas encore, et rend l'utilisateur.
 *
 * Un compte créé par ce chemin est vérifié par construction : on n'y arrive
 * qu'en ayant ouvert le message. Le rôle est TOUJOURS 'user' — aucune promotion
 * admin ne passe par ici, elle exige ADMIN_KEY (voir routes/auth.js). Un lien
 * magique envoyé à l'adresse d'un admin ouvre donc une session sur son compte
 * existant, mais n'en fabrique jamais un.
 */
export async function ouvrirCompte({ email, full_name }) {
  let user = await queryOne('SELECT * FROM users WHERE email = ?', [email]);
  if (user) return user;

  const id = randomUUID();
  await run(
    'INSERT INTO users (id, email, full_name, role) VALUES (?, ?, ?, ?)',
    [id, email, full_name || email.split('@')[0], 'user'],
  );

  // display_name est le SEUL nom exposé publiquement dans le classement : on
  // part du nom réellement saisi, jamais de la partie qui précède l'arobase, ce
  // qui reviendrait à réexposer l'adresse.
  const display_name = full_name || `Joueur ${createHash('md5').update(email).digest('hex').slice(0, 4)}`;
  await run(
    'INSERT INTO user_progress (id, user_email, display_name) VALUES (?, ?, ?) ON CONFLICT (user_email) DO NOTHING',
    [randomUUID(), email, display_name],
  );

  return queryOne('SELECT * FROM users WHERE id = ?', [id]);
}

/** Le corps du message. Texte et HTML disent la même chose, lien compris. */
export function messageDeConnexion(url) {
  const texte = [
    'Bonjour,',
    '',
    'Voici ton lien pour te connecter à PrédiCité :',
    '',
    url,
    '',
    'Il est valable 20 minutes et ne fonctionne qu\'une fois.',
    '',
    'Si tu n\'as pas demandé ce lien, ignore ce message : personne ne peut se',
    'connecter à ton adresse sans lui.',
    '',
    'PrédiCité — pronostics sur les législatives israéliennes du 27 octobre 2026.',
  ].join('\n');

  const html = `<!doctype html><html lang="fr"><body style="margin:0;padding:24px;background:#EDF1F9;font-family:system-ui,-apple-system,Segoe UI,sans-serif;color:#14203D">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:14px;padding:32px">
    <div style="height:4px;background:linear-gradient(90deg,#0038B8 33%,#fff 33% 66%,#0038B8 66%);border-radius:2px;margin-bottom:24px"></div>
    <p style="margin:0 0 18px;font-size:15px;line-height:1.6">Bonjour,</p>
    <p style="margin:0 0 22px;font-size:15px;line-height:1.6">Voici ton lien pour te connecter à PrédiCité :</p>
    <p style="margin:0 0 22px">
      <a href="${url}" style="display:inline-block;background:#0038B8;color:#fff;text-decoration:none;padding:13px 24px;border-radius:9px;font-weight:600;font-size:15px">Me connecter</a>
    </p>
    <p style="margin:0 0 22px;font-size:13px;line-height:1.6;color:#5A6480;word-break:break-all">
      Si le bouton ne fonctionne pas, copie cette adresse :<br><a href="${url}" style="color:#0038B8">${url}</a>
    </p>
    <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#5A6480">Il est valable 20 minutes et ne fonctionne qu'une fois.</p>
    <p style="margin:0 0 22px;font-size:13px;line-height:1.6;color:#5A6480">Si tu n'as pas demandé ce lien, ignore ce message : personne ne peut se connecter à ton adresse sans lui.</p>
    <p style="margin:0;font-size:12px;color:#8A93A8">PrédiCité — pronostics sur les législatives israéliennes du 27 octobre 2026.</p>
  </div>
</body></html>`;

  return { objet: 'Ton lien de connexion à PrédiCité', texte, html };
}
