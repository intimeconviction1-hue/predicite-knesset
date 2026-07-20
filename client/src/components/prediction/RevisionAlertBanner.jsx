import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';

/**
 * Bandeau global affiché en haut de la page Predictions si des prédictions
 * de l'utilisateur sont flaggées "needs_revision".
 * Récapitule toutes les villes concernées avec un CTA direct.
 */
export default function RevisionAlertBanner({ user, cities = [] }) {
  const queryClient = useQueryClient();

  const { data: flaggedPreds = [] } = useQuery({
    queryKey: ['flagged-predictions', user?.email],
    queryFn: () => base44.entities.Prediction.filter({ user_email: user?.email, needs_revision: true, prediction_type: 'winner' }),
    enabled: !!user?.email
  });

  if (!flaggedPreds.length) return null;

  const cityMap = Object.fromEntries(cities.map(c => [c.id, c]));
  const flaggedCities = [...new Set(flaggedPreds.map(p => p.city_id))]
    .map(cid => cityMap[cid])
    .filter(Boolean);

  const dismissAll = async () => {
    for (const pred of flaggedPreds) {
      await base44.entities.Prediction.update(pred.id, { needs_revision: false });
    }
    queryClient.invalidateQueries({ queryKey: ['flagged-predictions'] });
    queryClient.invalidateQueries({ queryKey: ['user-predictions'] });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-amber-900/25 border border-amber-500/35 rounded-xl px-4 py-3 flex flex-wrap items-center gap-3"
    >
      <div className="flex items-center gap-2 flex-shrink-0">
        <AlertTriangle className="w-4 h-4 text-amber-400" />
        <span className="text-amber-300 text-sm font-bold">
          {flaggedCities.length === 1
            ? `Votre prédiction sur ${flaggedCities[0].name} mérite une révision`
            : `${flaggedCities.length} de vos prédictions méritent une révision`}
        </span>
      </div>

      <div className="flex flex-wrap gap-2 flex-1">
        {flaggedCities.map(city => (
          <Link
            key={city.id}
            to={`${createPageUrl('City')}?slug=${city.slug}`}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-xs font-semibold border border-amber-500/25 transition-colors"
          >
            {city.name}
            <ArrowRight className="w-2.5 h-2.5" />
          </Link>
        ))}
      </div>

      <button
        onClick={dismissAll}
        className="text-[11px] text-amber-300/40 hover:text-amber-300 transition-colors ml-auto flex-shrink-0"
      >
        Ignorer tout
      </button>
    </motion.div>
  );
}