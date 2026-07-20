import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Target, HelpCircle, Trophy, BarChart3, MapPin, BookOpen } from 'lucide-react';

const TILES = [
  { icon: Target, label: 'Mes prédictions', page: 'Predictions', color: 'text-[#2B5CE6]', bg: 'hover:bg-[#EAF0FF]' },
  { icon: HelpCircle, label: 'Quiz du jour', page: 'Quiz', color: 'text-[#1A8C55]', bg: 'hover:bg-green-50', badge: 'Nouveau' },
  { icon: Trophy, label: 'Classement', page: 'Leaderboard', color: 'text-[#D4A017]', bg: 'hover:bg-amber-50' },
  { icon: BarChart3, label: 'Tous les sondages', page: 'Surveys', color: 'text-[#1A3580]', bg: 'hover:bg-slate-50' },
  { icon: MapPin, label: 'Explorer les villes', page: 'Cities', color: 'text-[#D92B2B]', bg: 'hover:bg-red-50' },
  { icon: BookOpen, label: 'Apprendre', page: 'Learn', color: 'text-[#7C3AED]', bg: 'hover:bg-purple-50' },
];

export default function QuickAccessGrid() {
  return (
    <div className="bg-[#F4F5F7] py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-4">Accès rapide</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {TILES.map(({ icon: Icon, label, page, color, bg, badge }, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <Link to={createPageUrl(page)}>
                <div className={`relative bg-white border border-gray-200 rounded-xl p-4 flex flex-col items-center gap-2 text-center cursor-pointer transition-all predicite-card ${bg}`}>
                  {badge && (
                    <span className="absolute -top-1.5 -right-1.5 bg-[#D92B2B] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{badge}</span>
                  )}
                  <Icon className={`w-6 h-6 ${color}`} />
                  <span className="text-xs font-medium text-gray-700 leading-tight">{label}</span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}