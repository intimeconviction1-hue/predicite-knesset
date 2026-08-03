import { filterEntity, createEntity, updateEntity } from '../db/index.js';
import { validerRepartition, SEUIL_PCT } from './repartitionSieges.js';

/**
 * Saisie MANUELLE des résultats du scrutin.
 *
 * Le collecteur automatique (resultatsKnessetCollector.js) ne sait rien parser :
 * le site de la commission électorale n'était pas en ligne à l'écriture. Le soir
 * du 27 octobre, le produit ne peut pas dépendre d'un scraping jamais éprouvé —
 * ce chemin-ci est donc le chemin PRINCIPAL, et le collecteur un confort.
 *
 * La validation (voir repartitionSieges.js, partagée avec les pronostics) est
 * stricte et bloquante : un résultat faux publié le soir du scrutin est pire
 * qu'un résultat publié dix minutes plus tard.
 */

export async function saveResultatsManuels(body = {}) {
  const validation = await validerRepartition(body.seats_by_liste);
  if (!validation.ok) {
    const err = new Error(validation.errors.join(' '));
    err.status = 400;
    err.validation = validation;
    throw err;
  }
  if (body.dry_run) {
    return { ok: true, dry_run: true, ...validation };
  }

  const is_final = body.is_final !== false; // final par défaut : c'est l'usage
  const election_date = (typeof body.election_date === 'string' && body.election_date.trim())
    ? body.election_date.trim()
    : '2026-10-27';

  const payload = {
    election_date,
    // Un résultat ne porte pas de justification : on ne garde que les sièges.
    seats_by_liste: validation.normalized.map(({ liste_id, seats }) => ({ liste_id, seats })),
    threshold_pct: SEUIL_PCT,
    source_url: typeof body.source_url === 'string' ? body.source_url.trim() : '',
    is_final,
    collected_at: new Date().toISOString(),
  };
  if (Number.isFinite(Number(body.turnout_pct))) payload.turnout_pct = Number(body.turnout_pct);

  // Un seul résultat final peut faire foi : le scoring lit le premier qu'il
  // trouve, deux lignes finales rendraient le score dépendant de l'ordre des
  // lignes en base.
  const existants = await filterEntity('ResultatSieges', { election_date });
  const dejaFinal = existants.find(r => r.is_final);

  let resultat;
  if (dejaFinal) {
    resultat = await updateEntity('ResultatSieges', dejaFinal.id, payload);
  } else {
    resultat = await createEntity('ResultatSieges', payload);
  }

  if (is_final) {
    for (const autre of existants) {
      if (autre.is_final && autre.id !== resultat.id) {
        await updateEntity('ResultatSieges', autre.id, { is_final: false });
      }
    }
  }

  return {
    ok: true,
    resultat_id: resultat.id,
    is_final,
    total: validation.total,
    warnings: validation.warnings,
    remplace: !!dejaFinal,
  };
}
