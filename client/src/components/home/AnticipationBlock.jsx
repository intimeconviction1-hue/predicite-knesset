import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Target, ChevronRight, BarChart3, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function AnticipationBlock({ user }) {
  const { data: cities = [] } = useQuery({
    queryKey: ['cities'],
    queryFn: () => base44.entities.City.list()
  });

  const { data: citySurveys = [] } = useQuery({
    queryKey: ['city-surveys-hero'],
    queryFn: () => base44.entities.CitySurvey.list('-date', 30)
  });

  // Ville la plus incertaine = plus petit écart entre les 2 premiers candidats
  const cityData = useMemo(() => {
    const latestByCity = {};
    for (const s of citySurveys) {
      if (!latestByCity[s.city_id]) latestByCity[s.city_id] = s;
    }
    const ranked = cities
      .filter(c => latestByCity[c.id])
      .map(c => {
        const survey = latestByCity[c.id];
        const cands = survey.candidates || [];
        const gap = cands.length >= 2 ? cands[0].percentage - cands[1].percentage : 99;
        return { city: c, survey, gap };
      })
      .sort((a, b) => a.gap - b.gap);
    return ranked[0] || null;
  }, [cities, citySurveys]);

  if (!cityData) return null;

  const { city, survey, gap } = cityData;
  const top = survey.candidates?.[0];
  const second = survey.candidates?.[1];

  const handleAnticiper = (e) => {
    if (!user) {
      e.preventDefault();
      base44.auth.redirectToLogin(window.location.origin + '/City?slug=' + city.slug + '&tab=prediction');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-[#034EA2] to-[#0a2f7a] rounded-2xl p-5 md:p-6 text-white overflow-hidden relative mb-6"
    >
      <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '20px 20px' }} />

      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-3.5 h-3.5 text-[#E1B530]" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-white/50">Ville à fort enjeu · Pronostiquez</span>
          </div>

          <h2 className="text-xl md:text-2xl font-bold truncate">{city.name}</h2>
          <p className="text-white/50 text-xs mt-0.5 mb-3">{city.region}</p>

          {top && second && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-white">{top.name.split(' ').slice(-1)[0]}</span>
              <span className="font-mono font-bold text-[#E1B530] text-sm">{top.percentage}%</span>
              <span className="text-white/30 text-xs">vs</span>
              <span className="text-sm text-white/70">{second.name.split(' ').slice(-1)[0]}</span>
              <span className="font-mono text-white/60 text-sm">{second.percentage}%</span>
              <Badge className={`${gap <= 5 ? 'bg-red-500/30 text-red-200 border-red-400/30' : 'bg-amber-500/20 text-amber-200 border-amber-400/20'} border text-[10px] px-2 py-0`}>
                {gap <= 5 ? '🔴 Très serré' : `Écart ${gap.toFixed(1)} pts`}
              </Badge>
            </div>
          )}
        </div>

        <div className="flex gap-2 shrink-0 w-full sm:w-auto">
          <Link
            to={createPageUrl('City') + `?slug=${city.slug}&tab=prediction`}
            className="flex-1 sm:flex-none"
            onClick={handleAnticiper}
          >
            <Button className="w-full sm:w-auto bg-[#E1B530] hover:bg-[#c9a12b] text-[#034EA2] font-bold px-5 gap-2 h-9">
              <Target className="w-4 h-4" />
              Anticiper
            </Button>
          </Link>
          <Link to={createPageUrl('City') + `?slug=${city.slug}`} className="flex-1 sm:flex-none">
            <Button variant="ghost" className="w-full sm:w-auto text-white/70 hover:text-white hover:bg-white/10 gap-1.5 h-9 px-3 text-sm">
              <BarChart3 className="w-3.5 h-3.5" />
              Sondages
              <ChevronRight className="w-3 h-3" />
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}