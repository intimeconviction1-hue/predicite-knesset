import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { base44 } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, BarChart3, Info } from 'lucide-react';
import PollCard from '@/components/polls/PollCard';
import LiveUpdateBadge from '@/components/shared/LiveUpdateBadge';

export default function RealPollsModule() {
  const { data: polls = [], isLoading } = useQuery({
    queryKey: ['real-polls-home'],
    queryFn: async () => {
      const featured = await base44.entities.RealPoll.filter({ is_featured: true, is_active: true });
      if (featured.length >= 3) return featured.slice(0, 3);
      const all = await base44.entities.RealPoll.list('-publication_date', 3);
      return all.filter(p => p.is_active !== false).slice(0, 3);
    }
  });

  const { data: pollSources = [] } = useQuery({
    queryKey: ['poll-sources'],
    queryFn: () => base44.entities.PollSource.list()
  });

  const { data: cities = [] } = useQuery({
    queryKey: ['cities'],
    queryFn: () => base44.entities.City.list()
  });

  const latestDate = polls[0]?.publication_date;

  return (
    <div className="bg-[#F4F5F7] border-y border-gray-200 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-end justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-xl font-bold text-[#1A3580]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Sondages officiels
              </h2>
              {latestDate && <LiveUpdateBadge updated_at={latestDate} />}
            </div>
            <p className="text-xs text-gray-500">Données issues de sondages d'instituts accrédités — sources citées</p>
          </div>
          <Link to={createPageUrl('Surveys')} className="hidden md:flex items-center gap-1 text-sm text-[#2B5CE6] font-medium hover:underline">
            Voir tous <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Cards */}
        {isLoading ? (
          <div className="grid md:grid-cols-3 gap-5">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-xl h-48 animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : polls.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-200 p-10 text-center">
            <BarChart3 className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Aucun sondage disponible pour l'instant.</p>
            <p className="text-gray-400 text-xs mt-1">Les sondages officiels apparaîtront ici dès leur publication.</p>
          </div>
        ) : (
          <div className="hidden md:grid md:grid-cols-3 gap-5">
            {polls.map((poll, i) => (
              <motion.div key={poll.id} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                <PollCard
                  poll={poll}
                  source={pollSources.find(s => s.id === poll.poll_source_id)}
                  city={cities.find(c => c.id === poll.city_id)}
                  compact={true}
                />
              </motion.div>
            ))}
          </div>
        )}

        {/* Mobile carousel */}
        {polls.length > 0 && (
          <div className="md:hidden flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory">
            {polls.map((poll) => (
              <div key={poll.id} className="snap-start shrink-0 w-80">
                <PollCard
                  poll={poll}
                  source={pollSources.find(s => s.id === poll.poll_source_id)}
                  city={cities.find(c => c.id === poll.city_id)}
                  compact={true}
                />
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-2 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Info className="w-3.5 h-3.5 shrink-0" />
            Méthodologie et sources détaillées disponibles sur chaque sondage
          </div>
          <Link to={createPageUrl('Surveys')} className="flex items-center gap-1 text-sm text-[#2B5CE6] font-medium hover:underline">
            Voir tous les sondages <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}