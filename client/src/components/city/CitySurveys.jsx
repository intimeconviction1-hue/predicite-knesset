import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import { 
  BarChart3, Calendar, TrendingUp, TrendingDown, 
  ExternalLink, ChevronRight, Target, HelpCircle 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PollSourceBadge, ReliabilityScore, PollCitation } from '@/components/ui/PollBadge';

export default function CitySurveys({ city, onPredictClick }) {
  const { data: surveys = [] } = useQuery({
    queryKey: ['city-surveys', city.id],
    queryFn: () => base44.entities.CitySurvey.filter({ city_id: city.id }),
    enabled: !!city.id
  });

  const { data: sources = [] } = useQuery({
    queryKey: ['survey-sources'],
    queryFn: () => base44.entities.SurveySource.list()
  });

  const getSource = (sourceId) => sources.find(s => s.id === sourceId);

  if (surveys.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
        <BarChart3 className="w-12 h-12 mx-auto text-slate-300 mb-3" />
        <h3 className="font-semibold text-slate-700 mb-2">Aucun sondage disponible</h3>
        <p className="text-slate-500 text-sm">
          Les sondages pour {city.name} seront publiés prochainement.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Sondages réels — {city.name}</h3>
            <p className="text-sm text-slate-500 mt-0.5">Sources officielles · Données vérifiées</p>
          </div>
          <div className="flex items-center gap-2">
            <PollSourceBadge type="real" />
          </div>
        </div>
      </div>

      {/* Surveys list */}
      {surveys.map((survey, index) => {
        const source = getSource(survey.survey_source_id);
        const topCandidate = survey.candidates?.reduce((max, c) => 
          c.percentage > max.percentage ? c : max
        , survey.candidates[0]);

        return (
          <motion.div
            key={survey.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <BarChart3 className="w-5 h-5 text-[#034EA2]" />
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-slate-800">
                      {source?.institute || 'Institut'}
                    </h4>
                    <PollSourceBadge type="real" />
                    {survey.is_daily && <Badge className="bg-amber-100 text-amber-700 text-xs">Du jour</Badge>}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-500 mt-1 flex-wrap">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(survey.date).toLocaleDateString('fr-FR')}</span>
                    {source?.client && <span>· {source.client}</span>}
                    {source && <ReliabilityScore score={4} showLabel={false} />}
                  </div>
                </div>
              </div>
              {topCandidate && (
                <Badge className="bg-[#034EA2]/10 text-[#034EA2] text-xs">
                  En tête : {topCandidate.name} ({topCandidate.percentage}%)
                </Badge>
              )}
            </div>

            {/* Candidates */}
            <div className="space-y-3 mb-4">
              {survey.candidates?.map((candidate, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-800">{candidate.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#034EA2]">{candidate.percentage}%</span>
                        {candidate.evolution !== undefined && candidate.evolution !== 0 && (
                          <Badge className={`text-xs ${
                            candidate.evolution > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {candidate.evolution > 0 ? (
                              <TrendingUp className="w-3 h-3 mr-1" />
                            ) : (
                              <TrendingDown className="w-3 h-3 mr-1" />
                            )}
                            {Math.abs(candidate.evolution)}%
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-[#034EA2] to-[#E1B530]"
                        style={{ width: `${candidate.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Citation normalisée */}
            {source && (
              <div className="mb-4">
                <PollCitation
                  institute={source.institute}
                  client={source.client}
                  dateFrom={source.date_from}
                  dateTo={source.date_to}
                  sampleSize={source.sample_size}
                  marginError={source.margin_error}
                  link={source.link}
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              <Link to={`/city/${city.slug}?tab=prediction`}>
                <Button size="sm" className="bg-[#034EA2] hover:bg-[#023b7a]">
                  <Target className="w-4 h-4 mr-2" />
                  Faire ma projection
                </Button>
              </Link>
              <Link to={createPageUrl('Quiz')}>
                <Button size="sm" variant="outline">
                  <HelpCircle className="w-4 h-4 mr-2" />
                  Quiz associé
                </Button>
              </Link>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}