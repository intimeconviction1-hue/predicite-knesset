import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { BarChart3, ChevronRight, TrendingUp, TrendingDown, Users, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function CitySurveyDaily({ user }) {
  const queryClient = useQueryClient();

  const { data: surveyResult } = useQuery({
    queryKey: ['daily-city-survey'],
    queryFn: async () => {
      const surveys = await base44.entities.CitySurvey.filter({ is_daily: true });
      if (surveys.length === 0) return null;
      if (surveys.length > 1) {
        console.error(`[is_daily] ${surveys.length} CitySurvey actifs — IDs: ${surveys.map(s => s.id).join(', ')}`);
        return surveys.sort((a, b) => b.date.localeCompare(a.date))[0];
      }
      return surveys[0];
    }
  });
  const dailyCitySurvey = surveyResult ?? null;

  const { data: city } = useQuery({
    queryKey: ['survey-city', dailyCitySurvey?.city_id],
    queryFn: async () => {
      const allCities = await base44.entities.City.list();
      return allCities.find(c => c.id === dailyCitySurvey.city_id) || null;
    },
    enabled: !!dailyCitySurvey?.city_id
  });

  const { data: responses = [] } = useQuery({
    queryKey: ['user-survey-responses', dailyCitySurvey?.id],
    queryFn: () => base44.entities.UserSurveyResponse.filter({ survey_id: dailyCitySurvey.id }),
    enabled: !!dailyCitySurvey?.id
  });

  const hasVoted = responses.some(r => r.user_email === user?.email);

  const voteCandidate = useMutation({
    mutationFn: async (candidateName) => {
      if (!user?.email) return;
      await base44.entities.UserSurveyResponse.create({
        user_email: user.email,
        survey_id: dailyCitySurvey.id,
        selected_candidate: candidateName
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['user-survey-responses']);
    }
  });

  if (!dailyCitySurvey || !city) return null;

  const totalVotes = responses.length;

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
    >
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-[#034EA2]" />
          <span className="font-semibold text-slate-800 text-sm">Sondage communauté</span>
          <Badge className="bg-[#034EA2]/10 text-[#034EA2] text-xs border-0">PARIVOTE</Badge>
        </div>
        <Badge className="bg-emerald-50 text-emerald-700 border-0 text-xs">
          {totalVotes} vote{totalVotes > 1 ? 's' : ''}
        </Badge>
      </div>

      <div className="p-5">
      <div className="mb-4">
        <h3 className="font-bold text-slate-800">Qui remportera le 1er tour à {city.name} ?</h3>
        <p className="text-xs text-slate-400 mt-0.5">Votes de la communauté PRÉDICITÉ</p>
      </div>
      
      <div className="space-y-3 mb-4">
        {dailyCitySurvey.candidates?.slice(0, 3).map((candidate, idx) => {
          const candidateVotes = responses.filter(r => r.selected_candidate === candidate.name).length;
          const percentage = totalVotes > 0 ? Math.round((candidateVotes / totalVotes) * 100) : 0;
          
          return (
            <div key={idx} className="group">
              <div className="flex items-center mb-2">
                <div className="flex-1">
                  <span className="font-medium text-gray-800">{candidate.name}</span>
                  <span className="text-sm text-gray-500 ml-2">({candidate.party})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#034EA2] text-lg">{percentage}%</span>
                  {candidate.evolution !== undefined && candidate.evolution !== 0 && (
                    <Badge className={`text-xs ${
                      candidate.evolution > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {candidate.evolution > 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                      {Math.abs(candidate.evolution)}%
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-10 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.8, delay: idx * 0.1 }}
                    className="h-full bg-gradient-to-r from-[#034EA2] to-[#E1B530] flex items-center justify-end pr-3 text-white text-sm font-bold"
                  >
                    {percentage > 10 && `${percentage}%`}
                  </motion.div>
                </div>
                {!hasVoted ? (
                  <Button 
                    size="sm"
                    onClick={() => voteCandidate.mutate(candidate.name)}
                    disabled={voteCandidate.isPending || !user}
                    className="bg-[#034EA2] hover:bg-[#023b7a] text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    VOTER
                  </Button>
                ) : (
                  responses.find(r => r.user_email === user?.email && r.selected_candidate === candidate.name) && (
                    <Badge className="bg-green-100 text-green-700">
                      ✓ Votre choix
                    </Badge>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Ponts contextuels */}
      <div className="flex gap-2 flex-wrap mt-2">
        {city && (
          <Link to={`/city/${city.slug}`} className="flex-1">
            <Button size="sm" className="w-full bg-[#034EA2] hover:bg-[#023b7a] text-white text-xs gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              Analyser {city.name}
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        )}
        <Link to={createPageUrl('Surveys')}>
          <Button size="sm" variant="outline" className="text-xs border-slate-200 text-slate-600 gap-1.5">
            <BarChart3 className="w-3.5 h-3.5" />
            Sondages officiels
          </Button>
        </Link>
      </div>
      </div>
    </motion.section>
  );
}