import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import { 
  BarChart3, Building2, Calendar, Users, ExternalLink, AlertCircle, ChevronRight, BookOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PollSourceBadge, PollCitation } from '@/components/ui/PollBadge';

export default function ExternalPollCard() {
  const { data: poll, isLoading } = useQuery({
    queryKey: ['external-poll-daily'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const polls = await base44.entities.ExternalPoll.filter({ date: today, is_daily: true });
      if (polls.length > 0) return polls[0];
      
      // Fallback to latest external poll
      const latest = await base44.entities.ExternalPoll.list('-date', 1);
      return latest[0];
    }
  });

  const { data: city } = useQuery({
    queryKey: ['city', poll?.city_id],
    queryFn: async () => {
      const cities = await base44.entities.City.filter({ id: poll.city_id });
      return cities[0];
    },
    enabled: !!poll?.city_id
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200 animate-pulse">
        <div className="h-8 bg-gray-200 rounded mb-4 w-3/4" />
        <div className="h-4 bg-gray-200 rounded mb-2 w-1/2" />
        <div className="space-y-3 mt-6">
          <div className="h-16 bg-gray-200 rounded" />
          <div className="h-16 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="bg-gradient-to-br from-gray-50 to-slate-100 rounded-2xl shadow-lg p-8 border-2 border-gray-200 text-center">
        <BarChart3 className="w-12 h-12 mx-auto text-gray-400 mb-3" />
        <h3 className="font-bold text-gray-700 mb-2">Aucun sondage externe aujourd'hui</h3>
        <p className="text-gray-500 text-sm">
          Les sondages d'instituts seront publiés régulièrement
        </p>
        <Link to={createPageUrl('Surveys')}>
          <Button variant="outline" className="mt-4">
            Consulter les archives
          </Button>
        </Link>
      </div>
    );
  }

  const topResult = poll.results?.reduce((max, r) => 
    r.percentage > max.percentage ? r : max
  , poll.results[0]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-slate-600" />
          <span className="font-semibold text-slate-800 text-sm">Sondage officiel</span>
          <PollSourceBadge type="real" institute={poll.source_name} />
        </div>
        <span className="text-xs text-slate-400">{new Date(poll.date).toLocaleDateString('fr-FR')}</span>
      </div>

      <div className="p-5">
      <div className="mb-4">
        <h3 className="font-bold text-slate-800">{poll.question}</h3>
        <PollCitation
          institute={poll.source_name}
          client={poll.client}
          sampleSize={poll.sample_size}
          marginError={null}
        />
      </div>

      {/* Results */}
      <div className="space-y-2 mb-4">
        {poll.results?.map((result, idx) => (
          <div key={idx}>
            <div className="flex items-center justify-between mb-1">
              <div>
                <span className="font-semibold text-slate-800 text-sm">{result.candidate}</span>
                <span className="text-xs text-slate-400 ml-2">{result.party}</span>
              </div>
              <span className="font-bold text-slate-700">{result.percentage}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${result.percentage}%` }}
                transition={{ duration: 0.8, delay: idx * 0.1 }}
                className="h-full bg-[#034EA2] rounded-full"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Educational note */}
      {poll.educational_note && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-4 flex items-start gap-2">
          <BookOpen className="w-4 h-4 text-[#034EA2] mt-0.5 flex-shrink-0" />
          <p className="text-xs text-slate-600">{poll.educational_note}</p>
        </div>
      )}

      {/* Ponts contextuels */}
      <div className="flex gap-2 flex-wrap">
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
            Tous les sondages
          </Button>
        </Link>
      </div>
      </div>
    </motion.div>
  );
}