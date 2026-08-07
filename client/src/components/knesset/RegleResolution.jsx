import React from 'react';
import { Scale, ChevronDown } from 'lucide-react';
import { MIN_SIEGES_AU_SEUIL, SEUIL_PCT, MAJORITE } from '@/lib/knesset';

/**
 * LA RÈGLE DE RÉSOLUTION — l'autre inspiration Polymarket, et celle qui colle
 * le mieux à la règle d'honnêteté du site.
 *
 * Polymarket publie toujours, en toutes lettres : « ce marché se résout à Oui
 * si… », avec la source qui tranche. Ici, l'interface disait seulement « résolu
 * au prochain sondage » — alors que le serveur, lui, sait exactement : le
 * `resolver_kind`, ses `resolver_args`, la date de clôture, et une fois le
 * marché tranché, l'identifiant du sondage qui l'a fait (`resolved_by`).
 *
 * Tout cela voyageait DÉJÀ dans la charge utile de l'API sans jamais être
 * affiché. Le site crédite chaque sondage mais taisait la règle qui décide qui
 * gagne : c'est justement ce qu'un joueur veut pouvoir vérifier AVANT de miser.
 *
 * Replié par défaut (<details>) : la règle doit être disponible, pas encombrante.
 */

function phrase(market, listeById) {
  const args = market.resolver_args || {};
  switch (market.resolver_kind) {
    case 'liste_rang': {
      const noms = (args.candidate_ids || [])
        .map(id => listeById?.get(id)?.name_fr)
        .filter(Boolean);
      return {
        quand: 'À la publication du prochain sondage sièges collecté par le site.',
        comment: noms.length
          ? `L'issue gagnante est celle des ${noms.length} listes en lice — ${noms.join(', ')} — qui y obtient le plus de sièges.`
          : 'L\'issue gagnante est la liste qui y obtient le plus de sièges parmi celles proposées.',
        qui: 'Automatique : aucune décision humaine n\'intervient.',
      };
    }
    case 'liste_seuil':
      return {
        quand: 'À la publication du prochain sondage sièges collecté par le site.',
        comment: `Se résout à « Oui » si la liste y est créditée d'au moins ${MIN_SIEGES_AU_SEUIL} sièges, c'est-à-dire si elle franchit le seuil de ${String(SEUIL_PCT).replace('.', ',')} %.`,
        qui: 'Automatique : aucune décision humaine n\'intervient.',
      };
    case 'bloc_majorite':
      return {
        quand: 'À la publication du prochain sondage sièges collecté par le site.',
        comment: `Se résout selon qu'un bloc atteint ou non les ${MAJORITE} sièges de la majorité absolue dans ce sondage.`,
        qui: 'Automatique : aucune décision humaine n\'intervient.',
      };
    case 'manuel':
    default:
      return {
        quand: market.closes_at
          ? 'Quand l\'événement a lieu, et au plus tard à la date de clôture ci-dessous.'
          : 'Quand l\'événement a lieu — ou quand il devient certain qu\'il n\'aura pas lieu.',
        comment: 'Se résout sur la foi d\'une source publique (média israélien, communiqué officiel, site de la Knesset), citée au moment de la résolution.',
        qui: 'Décision humaine de l\'équipe du site. Si le fait reste ambigu, le marché est annulé et les mises remboursées.',
      };
  }
}

const dateFr = (d) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

export default function RegleResolution({ market, listeById, className = '' }) {
  if (!market) return null;
  const r = phrase(market, listeById);

  return (
    <details className={`group ${className}`}>
      <summary className="flex items-center gap-1.5 cursor-pointer list-none text-[11px] font-semibold select-none"
        style={{ color: 'var(--p-text-40)' }}>
        <Scale className="w-3.5 h-3.5 flex-shrink-0" />
        Comment ce pari se tranche
        <ChevronDown className="w-3.5 h-3.5 transition-transform group-open:rotate-180" />
      </summary>

      <div className="mt-2.5 rounded-xl px-3.5 py-3 space-y-2 text-[12px] leading-relaxed"
        style={{ background: 'var(--p-night)', border: '0.5px solid var(--p-border)', color: 'var(--p-text-60)' }}>
        <p><b style={{ color: 'var(--p-text)' }}>Quand&nbsp;:</b> {r.quand}</p>
        <p><b style={{ color: 'var(--p-text)' }}>Sur quoi&nbsp;:</b> {r.comment}</p>
        <p><b style={{ color: 'var(--p-text)' }}>Par qui&nbsp;:</b> {r.qui}</p>
        {market.closes_at && (
          <p><b style={{ color: 'var(--p-text)' }}>Clôture des mises&nbsp;:</b> {dateFr(market.closes_at)}</p>
        )}
        <p className="pt-1" style={{ color: 'var(--p-text-40)', borderTop: '0.5px dashed var(--p-border)' }}>
          Ta cote est verrouillée à la seconde où tu mises : elle ne bougera plus, quoi que fassent les autres joueurs ensuite.
        </p>
      </div>
    </details>
  );
}
