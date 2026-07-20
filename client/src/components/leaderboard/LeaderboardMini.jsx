import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Trophy, Medal, Crown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LeaderboardMini({ users = [], currentUserEmail }) {
  const getMedalIcon = (position) => {
    if (position === 0) return <Crown className="w-5 h-5 text-yellow-500" />;
    if (position === 1) return <Medal className="w-5 h-5 text-slate-400" />;
    if (position === 2) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="w-5 h-5 flex items-center justify-center text-slate-500 font-bold text-sm">{position + 1}</span>;
  };

  const getPositionStyle = (position) => {
    if (position === 0) return 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200';
    if (position === 1) return 'bg-gradient-to-r from-slate-50 to-gray-50 border-slate-200';
    if (position === 2) return 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200';
    return 'bg-white border-slate-100';
  };

  const topUsers = users.slice(0, 5);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-300" />
            <h3 className="text-white font-bold">Classement</h3>
          </div>
          <Link to={createPageUrl('Leaderboard')}>
            <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10">
              Voir tout
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="p-3 space-y-2">
        {topUsers.length === 0 ? (
          <div className="text-center py-6 text-slate-500">
            <Trophy className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-sm">Aucun classement pour le moment</p>
          </div>
        ) : (
          topUsers.map((user, index) => (
            <motion.div
              key={user.user_email}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-center gap-3 p-3 rounded-xl border ${getPositionStyle(index)} ${
                user.user_email === currentUserEmail ? 'ring-2 ring-indigo-400' : ''
              }`}
            >
              {getMedalIcon(index)}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-800 truncate text-sm">
                  {user.user_email?.split('@')[0] || 'Joueur'}
                  {user.user_email === currentUserEmail && (
                    <span className="text-indigo-600 ml-1">(vous)</span>
                  )}
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>{user.predictions_count || 0} prédictions</span>
                  <span>•</span>
                  <span>{user.daily_streak || 0}🔥</span>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-indigo-600">{user.total_points?.toLocaleString('fr-FR') || 0}</p>
                <p className="text-xs text-slate-500">pts</p>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}