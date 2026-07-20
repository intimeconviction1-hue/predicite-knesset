import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, ChevronDown, ChevronUp, Target, HelpCircle, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function SurveyBanner() {
  const [isExpanded, setIsExpanded] = useState(false);

  const { data: surveyResult } = useQuery({
    queryKey: ['daily-city-survey'],
    queryFn: async () => {
      const surveys = await base44.entities.CitySurvey.filter({ is_daily: true });
      // Garde : exactement 1 sondage is_daily=true attendu
      if (surveys.length === 0) {
        console.warn('[SurveyBanner] Aucun CitySurvey avec is_daily=true');
        return { survey: null, multipleError: false };
      }
      if (surveys.length > 1) {
        console.error(`[SurveyBanner] ${surveys.length} CitySurvey avec is_daily=true — attendu: 1. IDs: ${surveys.map(s => s.id).join(', ')}`);
        return { survey: null, multipleError: true };
      }
      return { survey: surveys[0], multipleError: false };
    }
  });

  const dailySurvey = surveyResult?.survey;
  const multipleError = surveyResult?.multipleError;

  const { data: city } = useQuery({
    queryKey: ['survey-city', dailySurvey?.city_id],
    queryFn: async () => {
      const allCities = await base44.entities.City.list();
      return allCities.find(c => c.id === dailySurvey.city_id) || null;
    },
    enabled: !!dailySurvey?.city_id
  });

  const { data: source } = useQuery({
    queryKey: ['survey-source', dailySurvey?.survey_source_id],
    queryFn: () => base44.entities.SurveySource.filter({ id: dailySurvey.survey_source_id }).then(s => s[0]),
    enabled: !!dailySurvey?.survey_source_id
  });

  // Fallback count > 1 : erreur de cohérence is_daily
  if (multipleError) {
    return (
      <div className="bg-amber-600 text-white text-xs text-center py-1.5 px-4">
        ⚠ Configuration sondage du jour incorrecte — vérifier les données (is_daily)
      </div>
    );
  }

  // Fallback count = 0 : ne rien afficher si donnée manquante
  if (surveyResult && !dailySurvey) {
    return null;
  }

  if (!dailySurvey || !city) return null;

  const candidates = dailySurvey?.candidates || [];
  const topCandidate = candidates.length > 0
    ? candidates.reduce((max, c) => (c.percentage > max.percentage ? c : max), candidates[0])
    : null;

  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4">
        {/* Collapsed state */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full py-3 flex items-center justify-between hover:bg-white/10 transition-colors rounded"
        >
          <div className="flex items-center gap-3">
            <BarChart3 className="w-5 h-5" />
            <span className="font-semibold">📊 SONDAGE DU JOUR</span>
            <span className="hidden md:inline text-white/90">▸ Qui gagnera à {city.name} ?</span>
            {topCandidate && (
              <Badge className="bg-white/20 text-white border-0 hidden md:inline-flex">
                {topCandidate.name} : {topCandidate.percentage}%
                {topCandidate.evolution !== undefined && (
                  <span className="ml-1">
                    {topCandidate.evolution > 0 ? '▲' : topCandidate.evolution < 0 ? '▼' : '='}{Math.abs(topCandidate.evolution)}
                  </span>
                )}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-white/80 hidden md:inline">
              {isExpanded ? 'Réduire' : 'Voir détails'}
            </span>
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </button>

        {/* Expanded state */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pb-4 pt-2 space-y-3">
                {/* Candidates */}
                <div className="grid md:grid-cols-2 gap-2">
                  {dailySurvey.candidates?.slice(0, 4).map((candidate, i) => (
                    <div key={i} className="bg-white/10 rounded-lg p-2 flex items-center justify-between">
                      <span className="font-medium">{candidate.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{candidate.percentage}%</span>
                        {candidate.evolution !== undefined && candidate.evolution !== 0 && (
                          <Badge className={`${
                            candidate.evolution > 0 ? 'bg-green-500' : 'bg-red-500'
                          } text-white border-0 text-xs`}>
                            {candidate.evolution > 0 ? '▲' : '▼'}{Math.abs(candidate.evolution)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Source */}
                {source && (
                  <div className="text-xs text-white/70 border-t border-white/20 pt-2">
                    📊 Source : {source.institute} {source.client && `pour ${source.client}`} ({source.date_from})
                    {source.sample_size && ` • Échantillon: ${source.sample_size} pers.`}
                    {source.margin_error && ` • Marge: ±${source.margin_error}%`}
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  <Link to={createPageUrl('City') + `?slug=${city.slug}`}>
                    <Button size="sm" className="bg-white text-blue-700 hover:bg-white/90">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Voir résultats
                    </Button>
                  </Link>
                  <Link to={createPageUrl('City') + `?slug=${city.slug}&tab=prediction`}>
                    <Button size="sm" variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20">
                      <Target className="w-4 h-4 mr-2" />
                      Anticiper
                    </Button>
                  </Link>
                  <Link to={createPageUrl('City') + `?slug=${city.slug}`}>
                    <Button size="sm" variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20">
                      <MapPin className="w-4 h-4 mr-2" />
                      Voir la ville
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}