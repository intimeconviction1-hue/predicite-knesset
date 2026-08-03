/**
 * Les dates du scrutin, definies UNE seule fois.
 *
 * Elles etaient auparavant recopiees dans six fichiers, avec deux valeurs
 * differentes et la meme erreur de fuseau commise deux fois. Un fichier avait
 * ete oublie lors d'une correction, et personne ne l'a vu : la page Premier
 * ministre fermait les pronostics un jour avant les autres.
 *
 * LE CALCUL, une bonne fois. Les bureaux de vote ouvrent le 27 octobre 2026 a
 * 07h00, heure d'Israel. L'heure d'ete israelienne se termine le dimanche
 * 25 octobre 2026 : le pays est donc a UTC+2 le jour du scrutin, et non UTC+3.
 * D'ou 05:00Z, et non 04:00Z.
 *
 * Le serveur porte la meme valeur dans server/functions/prediciteScoringSieges.js
 * (il ne peut pas importer ce fichier) : les deux doivent rester synchronises.
 * En production, CampaignSettings.predictions_deadline_utc les ecrase toutes
 * les deux si la ligne existe.
 */

export const OUVERTURE_BUREAUX_UTC = '2026-10-27T05:00:00Z';

// La cloture des pronostics, c'est l'ouverture des bureaux : on joue jusqu'au
// dernier moment ou aucune information de vote n'a fuite.
export const FALLBACK_DEADLINE_UTC = OUVERTURE_BUREAUX_UTC;

/** Nombre de jours entiers restant avant le scrutin (jamais negatif). */
export function joursAvantScrutin() {
  const reste = new Date(OUVERTURE_BUREAUX_UTC).getTime() - Date.now();
  return Math.max(0, Math.ceil(reste / 86400000));
}

/** Formate une echeance UTC en heure d'Israel, lisible en francais. */
export function formatLocalDeadline(utcString) {
  const d = new Date(utcString);
  if (Number.isNaN(d.getTime())) return null;
  const date = d.toLocaleDateString('fr-FR', { timeZone: 'Asia/Jerusalem', day: 'numeric', month: 'long', year: 'numeric' });
  const time = d.toLocaleTimeString('fr-FR', { timeZone: 'Asia/Jerusalem', hour: '2-digit', minute: '2-digit' });
  return `${date} — ${time} (heure d'Israël)`;
}
