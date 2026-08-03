import { listEntity } from '../db/index.js';

/**
 * Règle commune aux résultats réels et aux pronostics : une répartition des
 * 120 sièges de la Knesset.
 *
 * C'est le cœur de l'intérêt d'une proportionnelle nationale — donner un siège
 * à une liste, c'est le retirer à une autre. Tant que les pronostics étaient
 * indépendants et bornés 0–120 chacun, il n'y avait aucun arbitrage à faire,
 * donc pas de jeu. La contrainte de somme est ce qui le rend.
 */

export const TOTAL_SIEGES = 120;
export const SEUIL_PCT = 3.25;

// Seuil de 3,25 % sur 120 sièges : une liste qui le franchit obtient au moins
// 4 sièges. 1, 2 ou 3 sièges sont structurellement impossibles.
export const MIN_SIEGES_AU_SEUIL = Math.ceil((SEUIL_PCT / 100) * TOTAL_SIEGES);

/**
 * Valide une répartition sans rien écrire. Renvoie TOUTES les erreurs, pas la
 * première : une saisie corrigée erreur après erreur est insupportable le soir
 * du scrutin, et décourageante pour un joueur.
 */
export async function validerRepartition(seatsByListe) {
  const errors = [];
  const warnings = [];

  if (!Array.isArray(seatsByListe) || seatsByListe.length === 0) {
    return { ok: false, errors: ['Aucune répartition fournie.'], warnings, normalized: [], total: 0 };
  }

  const listes = await listEntity('Liste', { sort: 'name_fr', limit: 200 });
  const listeById = new Map(listes.map(l => [l.id, l]));
  const actives = listes.filter(l => l.is_active);

  const seen = new Set();
  const normalized = [];

  for (const entry of seatsByListe) {
    const liste_id = typeof entry?.liste_id === 'string' ? entry.liste_id.trim() : '';
    const liste = listeById.get(liste_id);

    if (!liste) {
      errors.push(`Liste inconnue : « ${liste_id || '(vide)'} ».`);
      continue;
    }
    if (seen.has(liste_id)) {
      errors.push(`${liste.name_fr} apparaît deux fois.`);
      continue;
    }
    seen.add(liste_id);

    const seats = Number(entry?.seats);
    if (!Number.isInteger(seats)) {
      errors.push(`${liste.name_fr} : nombre de sièges non entier (« ${entry?.seats} »).`);
      continue;
    }
    if (seats < 0 || seats > TOTAL_SIEGES) {
      errors.push(`${liste.name_fr} : ${seats} sièges hors des bornes 0–${TOTAL_SIEGES}.`);
      continue;
    }
    if (seats > 0 && seats < MIN_SIEGES_AU_SEUIL) {
      errors.push(
        `${liste.name_fr} : ${seats} siège(s) impossible(s). Le seuil de ${SEUIL_PCT} % ` +
        `impose au moins ${MIN_SIEGES_AU_SEUIL} sièges, ou 0.`
      );
      continue;
    }

    normalized.push({ liste_id, seats, justification: entry?.justification });
  }

  // Une liste active absente serait silencieusement comptée à 0 : on l'exige
  // explicitement plutôt que de deviner.
  const manquantes = actives.filter(l => !seen.has(l.id));
  if (manquantes.length > 0) {
    errors.push(`Liste(s) active(s) absente(s) de la saisie : ${manquantes.map(l => l.name_fr).join(', ')}.`);
  }

  const total = normalized.reduce((sum, r) => sum + r.seats, 0);
  if (errors.length === 0 && total !== TOTAL_SIEGES) {
    const ecart = total - TOTAL_SIEGES;
    errors.push(
      `Total de ${total} sièges au lieu de ${TOTAL_SIEGES} ` +
      `(${ecart > 0 ? `${ecart} de trop` : `${-ecart} manquant(s)`}).`
    );
  }

  const sousLeSeuil = normalized.filter(r => r.seats === 0).length;
  if (sousLeSeuil > 0) {
    warnings.push(`${sousLeSeuil} liste(s) à 0 siège (sous le seuil).`);
  }

  return { ok: errors.length === 0, errors, warnings, normalized, total };
}
