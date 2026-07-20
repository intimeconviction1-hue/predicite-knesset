import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Calendar, BarChart3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function SurveySnapshot({ survey, externalPoll }) {
  const latestSurvey = survey || externalPoll;
  
  if (!latestSurvey) return null;

  const candidates = latestSurvey.candidates || latestSurvey.results || [];
  const topCandidate = candidates?.reduce((max, c) => 
    (c.percentage || 0) > (max.percentage || 0) ? c : max
  , candidates[0]);

  const formatDate = (dateStr) => {
    try {
      return format(new Date(dateStr), 'd MMM yyyy', { locale: fr });
    } catch {
      return dateStr;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-3 border border-slate-200"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3 gap-2">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-[#034EA2]" />
          <div className="text-xs">
            <p className="font-semibold text-slate-700">Sondage du jour</p>
            <p className="text-slate-500">{latestSurvey.source_name || latestSurvey.institute || 'Institut'}</p>
          </div>
        </div>
        <span className="text-xs text-slate-500 flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {formatDate(latestSurvey.date)}
        </span>
      </div>

      {/* Top 3 candidates */}
      <div className="space-y-2">
        {candidates.slice(0, 3).map((candidate, i) => (
          <div key={i} className="flex items-center justify-between text-xs">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-slate-800 truncate">
                  {candidate.name}
                </span>
                {candidate.evolution !== undefined && candidate.evolution !== 0 && (
                  <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs ${
                    candidate.evolution > 0 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {candidate.evolution > 0 ? (
                      <TrendingUp className="w-2.5 h-2.5" />
                    ) : (
                      <TrendingDown className="w-2.5 h-2.5" />
                    )}
                    <span>{Math.abs(candidate.evolution)}%</span>
                  </div>
                )}
              </div>
              <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#034EA2]"
                  style={{ width: `${(candidate.percentage || 0) * 2}%` }}
                />
              </div>
            </div>
            <span className="font-bold text-slate-800 ml-2 min-w-fit">
              {candidate.percentage || 0}%
            </span>
          </div>
        ))}
      </div>

      {/* Participation */}
      {(latestSurvey.turnout !== undefined || latestSurvey.undecided !== undefined) && (
        <div className="mt-3 pt-3 border-t border-slate-200 flex items-center gap-3 text-xs">
          {latestSurvey.turnout !== undefined && (
            <div>
              <p className="text-slate-500">Participation</p>
              <p className="font-semibold text-slate-800">{latestSurvey.turnout}%</p>
            </div>
          )}
          {latestSurvey.undecided !== undefined && (
            <div>
              <p className="text-slate-500">Indécis</p>
              <p className="font-semibold text-slate-800">{latestSurvey.undecided}%</p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}