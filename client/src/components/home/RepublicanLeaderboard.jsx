import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Trophy, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function RepublicanLeaderboard({ users = [], currentUserEmail }) {
  const topThree = users.slice(0, 3);
  
  const getUserRank = () => {
    const index = users.findIndex(u => u.user_email === currentUserEmail);
    return index >= 0 ? index + 1 : null;
  };

  const rank = getUserRank();
  const previousRank = rank ? rank - 3 : null; // Simulation

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.4 }}
      className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200"
    >
      <h2 className="text-2xl font-bold text-gray-800 flex items-center mb-6">
        <Trophy className="w-7 h-7 text-[#E1B530] mr-2" />
        🏆 CLASSEMENT CITOYEN
      </h2>
      
      <div className="space-y-3">
        {topThree.map((player, idx) => (
          <div key={player.user_email} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:shadow-md transition">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                idx === 0 ? 'bg-[#E1B530] text-[#034EA2]' :
                idx === 1 ? 'bg-gray-300 text-gray-700' :
                'bg-amber-700 text-white'
              }`}>
                {idx + 1}
              </div>
              <div>
                <span className="font-bold text-lg">{player.user_email?.split('@')[0]}</span>
                <span className="ml-2 text-xl">{idx === 0 ? '👑' : idx === 1 ? '⚡' : '🔥'}</span>
              </div>
            </div>
            <span className="font-bold text-xl text-[#034EA2]">{player.total_points || 0} pts</span>
          </div>
        ))}
      </div>
      
      {rank && (
        <div className="mt-6 p-4 bg-[#034EA2]/10 rounded-xl border-2 border-[#034EA2]/20">
          <div className="flex items-center justify-between">
            <span className="font-bold text-lg">👤 Votre position</span>
            <div className="flex items-center gap-3">
              <span className="font-bold text-2xl text-[#034EA2]">#{rank}</span>
              {previousRank && rank < previousRank && (
                <Badge className="bg-green-100 text-green-700 font-bold">
                  +{previousRank - rank}
                </Badge>
              )}
            </div>
          </div>
        </div>
      )}
      
      <Link to={createPageUrl('Leaderboard')}>
        <button className="mt-6 text-[#034EA2] font-bold flex items-center hover:underline text-lg w-full justify-center">
          VOIR LE CLASSEMENT COMPLET
          <ChevronRight className="w-5 h-5 ml-1" />
        </button>
      </Link>
    </motion.div>
  );
}