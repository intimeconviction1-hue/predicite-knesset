/**
 * L'envoi d'e-mails — la seule porte par laquelle le site écrit à quelqu'un.
 *
 * Tout le reste du code appelle `envoyerCourriel()` et ignore par quoi il passe.
 * C'est délibéré : ce fichier est destiné à être remplacé. Le choix du 2026-08-07
 * est le SMTP d'une boîte existante, parce qu'il ne demande aucune inscription ;
 * ses limites sont connues et écrites plus bas. Le jour où l'on passe à un
 * service dédié (Resend, Postmark, Brevo), c'est ce fichier qu'on réécrit, et
 * lui seul — aucune route, aucun test, aucune page ne le sait.
 *
 * ── Ce que le SMTP d'une boîte ordinaire coûte ──
 * Gmail plafonne autour de 500 destinataires par jour, et surtout : un message
 * envoyé depuis une adresse @gmail.com par un serveur qui n'est pas Google passe
 * mal les filtres. Or un lien de connexion qui atterrit en indésirable n'est pas
 * un e-mail en retard, c'est une inscription perdue — la personne ne saura même
 * pas qu'elle doit aller le chercher. D'où les précautions ci-dessous, qui ne
 * sont pas cosmétiques :
 *   • une version texte ET une version HTML (un message HTML seul est suspect) ;
 *   • un objet explicite, sans majuscules ni ponctuation d'alerte ;
 *   • le lien en clair, jamais raccourci ni masqué derrière un bouton seul ;
 *   • `From` identique au compte SMTP, sinon le message est réécrit ou rejeté.
 *
 * ── Jamais d'échec silencieux ──
 * Une panne d'envoi rend la connexion impossible pour tout le monde, et c'est
 * invisible depuis le site : personne ne se plaint d'un e-mail qu'il ignore
 * attendre. `envoyerCourriel()` lève donc plutôt que d'avaler l'erreur, et
 * l'appelant décide quoi en dire.
 */
import nodemailer from 'nodemailer';

const IS_PROD = process.env.NODE_ENV === 'production';

/**
 * La configuration, entièrement en variables d'environnement — un mot de passe
 * SMTP n'a rien à faire dans un dépôt, a fortiori public.
 *
 * SMTP_SECURE : true pour le port 465 (TLS d'emblée), false pour 587 (STARTTLS).
 * On le déduit du port plutôt que de demander une variable de plus, tout en
 * laissant la possibilité de forcer.
 */
function config() {
  const port = Number(process.env.SMTP_PORT || 587);
  return {
    host: process.env.SMTP_HOST,
    port,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : port === 465,
    // L'expéditeur affiché. À défaut, le compte SMTP lui-même : c'est la valeur
    // qui a le plus de chances de passer, puisque c'est celle que le serveur
    // d'envoi est autorisé à utiliser.
    from: process.env.MAIL_FROM || (process.env.SMTP_USER ? `PrédiCité <${process.env.SMTP_USER}>` : null),
  };
}

/** L'envoi est-il configuré ? */
export function envoiConfigure() {
  const c = config();
  return Boolean(c.host && c.user && c.pass && c.from);
}

let transport = null;
function getTransport() {
  if (!transport) {
    const c = config();
    transport = nodemailer.createTransport({
      host: c.host,
      port: c.port,
      secure: c.secure,
      auth: { user: c.user, pass: c.pass },
    });
  }
  return transport;
}

/**
 * Envoie un message. Lève si l'envoi échoue ou n'est pas configuré en production.
 *
 * En développement sans configuration SMTP, le message est écrit dans la console
 * au lieu d'être envoyé : on peut donc dérouler entièrement une connexion par
 * lien magique en local, sans compte d'envoi et sans écrire à personne. C'est un
 * repli de développement, jamais de production — d'où le refus explicite quand
 * NODE_ENV vaut production.
 *
 * @param {{a: string, objet: string, texte: string, html?: string}} message
 */
export async function envoyerCourriel({ a, objet, texte, html }) {
  if (!envoiConfigure()) {
    if (IS_PROD) {
      throw new Error(
        "Envoi d'e-mails non configuré (SMTP_HOST, SMTP_USER, SMTP_PASS, MAIL_FROM).",
      );
    }
    console.log(`\n──────── COURRIEL (non envoyé : SMTP non configuré) ────────\n`
      + `À      : ${a}\nObjet  : ${objet}\n\n${texte}\n`
      + `────────────────────────────────────────────────────────────\n`);
    return { simule: true };
  }

  const c = config();
  await getTransport().sendMail({
    from: c.from,
    to: a,
    subject: objet,
    text: texte,
    // Un message qui n'a qu'une version HTML est un signal de spam classique.
    // Les deux voyagent donc toujours ensemble, avec le même contenu.
    html: html || undefined,
  });
  return { simule: false };
}

/**
 * Vérifie que le serveur SMTP répond et accepte les identifiants.
 *
 * Sert au démarrage : une configuration fausse (mot de passe d'application
 * expiré, port bloqué) doit se voir dans les journaux de déploiement, et non le
 * jour où quelqu'un essaie de se connecter. On journalise sans faire échouer le
 * démarrage : un site lisible dont la connexion est en panne vaut mieux qu'un
 * site éteint.
 */
export async function verifierEnvoi() {
  if (!envoiConfigure()) {
    console.warn('[courriel] SMTP non configuré — la connexion par lien est indisponible.'
      + (IS_PROD ? ' EN PRODUCTION : personne ne peut créer de compte.' : ' (dev : les liens sont affichés dans la console)'));
    return false;
  }
  try {
    await getTransport().verify();
    console.log('[courriel] SMTP joignable, identifiants acceptés.');
    return true;
  } catch (e) {
    console.error('[courriel] SMTP INJOIGNABLE — la connexion par lien est en panne :', e.message);
    return false;
  }
}
