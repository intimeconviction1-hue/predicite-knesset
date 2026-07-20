import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { base44 } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight } from 'lucide-react';
import CityCard from '@/components/cards/CityCard';

export default function CitiesTeaser() {
  const { data: cities = [], isLoading } = useQuery({
    queryKey: ['cities'],
    queryFn: () => base44.entities.City.list()
  });

  const { data: citySurveys = [] } = useQuery({
    queryKey: ['city-surveys-teaser'],
    queryFn: () => base44.entities.CitySurvey.list('-date', 40)
  });

  // Compute tension for each city
  const latestByCity = {};
  for (const s of citySurveys) {
    if (!latestByCity[s.city_id]) latestByCity[s.city_id] = s;
  }

  const sorted = [...cities]
    .map(c => {
      const survey = latestByCity[c.id];
      const tension = survey?.candidates?.length >= 2
        ? survey.candidates[0].percentage - survey.candidates[1].percentage
        : 99;
      return { city: c, tension };
    })
    .sort((a, b) => a.tension - b.tension)
    .slice(0, 6);

  return (
    <div className="py-10 border-t border-white/8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-6">
          <h2 className="text-xl font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Les villes à surveiller
          </h2>
          <Link to={createPageUrl('Cities')} className="hidden md:flex items-center gap-1 text-sm text-[#4A7FD4] font-medium hover:text-white transition-colors">
            Voir toutes <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="bg-gray-100 rounded-xl h-40 animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sorted.map(({ city }, i) => (
              <motion.div
                key={city.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className={i === 0 ? 'sm:col-span-2 lg:col-span-1' : ''}
              >
                <CityCard city={city} index={i} />
              </motion.div>
            ))}
          </div>
        )}

        <div className="mt-5 flex justify-center md:hidden">
          <Link to={createPageUrl('Cities')}>
            <button className="px-5 py-2.5 bg-[#1E3A8A] text-white rounded-lg text-sm font-semibold hover:bg-[#2B5CE6] transition-colors">
              Voir toutes les villes
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}