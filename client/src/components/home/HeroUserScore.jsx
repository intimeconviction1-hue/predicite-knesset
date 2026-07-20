import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Trophy, Target, Flame, TrendingUp, ChevronRight } from 'lucide-react';

export default function HeroUserScore({ userProgress, user }) {
  if (!user || !userProgress) return null;

  const accuracy = userProgress.predictions_count > 0
    ? Math.round((userProgress.correct_predictions || 0) / userProgress.predictions_count * 100)
    : null;

  return (
    <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-4 mt-6">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-white/60 uppercase tracking-wider font-medium">Mon score</span>
        <Link to={createPageUrl('Profile')} className="text-xs text-white/50 hover:text-white flex items-center gap-1 transition-colors">
          Voir profil <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="grid grid-cols-4 gap-3">
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <Trophy className="w-4 h-4 text-[#E1B530]" />
          </div>
          <p className="text-xl font-bold text-white">{userProgress.total_points || 0}</p>
          <p className="text-xs text-white/50">Points</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <Target className="w-4 h-4 text-[#C8102E]" />
          </div>
          <p className="text-xl font-bold text-white">{userProgress.predictions_count || 0}</p>
          <p className="text-xs text-white/50">Prédictions</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <TrendingUp className="w-4 h-4 text-green-400" />
          </div>
          <p className="text-xl font-bold text-white">{accuracy !== null ? `${accuracy}%` : '–'}</p>
          <p className="text-xs text-white/50">Précision</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <Flame className="w-4 h-4 text-orange-400" />
          </div>
          <p className="text-xl font-bold text-white">{userProgress.daily_streak || 0}j</p>
          <p className="text-xs text-white/50">Série</p>
        </div>
      </div>
    </div>
  );
}