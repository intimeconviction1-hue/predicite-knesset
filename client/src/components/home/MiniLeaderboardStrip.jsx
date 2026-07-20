import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { base44 } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Users, ChevronRight, Medal } from 'lucide-react';

const MEDALS = ['🥇', '🥈', '🥉'];

export default function MiniLeaderboardStrip({ user }) {
  const { data: leaderboard = [] } = useQuery({
    queryKey: ['leaderboard-mini'],
    queryFn: () => base44.entities.UserProgress.list('-total_points', 5)
  });

  const { data: userLeague } = useQuery({
    queryKey: ['user-league', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const leagues = await base44.entities.League.filter({});
      return leagues.find(l => l.members?.includes(user.email)) || null;
    },
    enabled: !!user?.email
  });

  const userRank = user?.email ? leaderboard.findIndex(u => u.user_email === user.email) + 1 : 0;

  return (
    <div className="py-10 border-t border-white/8" style={{ background: 'rgba(7,18,42,0.6)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-5 gap-8">

          {/* Leaderboard — 3 cols */}
          <div className="md:col-span-3">
            <div className="flex items-end justify-between mb-4">
              <h2 className="text-xl font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                <Trophy className="inline w-5 h-5 text-[#D4AF37] mr-1.5 mb-0.5" />
                Classement
              </h2>
              <Link to={createPageUrl('Leaderboard')} className="text-sm text-[#4A7FD4] font-medium hover:text-white flex items-center gap-0.5 transition-colors">
                Complet <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="space-y-2">
              {leaderboard.slice(0, 5).map((entry, i) => {
                const isCurrentUser = entry.user_email === user?.email;
                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: -12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.06 }}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all ${
                      isCurrentUser ? 'bg-[#1E3A8A]/30 border-[#4A7FD4]/30' : 'border-white/8'
                    }`}
                  >
                    <span className="text-lg w-6 text-center">{MEDALS[i] || `#${i+1}`}</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-white/80 truncate">
                        {entry.user_email?.split('@')[0]}
                        {isCurrentUser && <span className="text-[#4A7FD4] text-xs ml-1">(vous)</span>}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-[#D4AF37] text-sm">
                      {(entry.total_points || 0).toLocaleString('fr-FR')} pts
                    </span>
                  </motion.div>
                );
              })}
              {userRank > 5 && user && (
                <div className="text-xs text-center text-white/30 py-1">Votre rang : #{userRank}</div>
              )}
            </div>
          </div>

          {/* Leagues — 2 cols */}
          <div className="md:col-span-2 border-l border-white/8 pl-0 md:pl-8">
            <h2 className="text-xl font-bold text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              <Users className="inline w-5 h-5 text-[#2B5CE6] mr-1.5 mb-0.5" />
              Cercles
            </h2>
            {!user ? (
              <div className="rounded-xl p-5 text-center border border-white/8" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <p className="text-white/50 text-sm mb-3">Rejoins une ligue pour comparer tes analyses</p>
                <Link to={createPageUrl('Leagues')}>
                  <button className="px-4 py-2 bg-[#1E3A8A] text-white rounded-lg text-sm font-semibold hover:bg-[#2B5CE6] transition-colors">
                    Voir les cercles
                  </button>
                </Link>
              </div>
            ) : userLeague ? (
              <div className="rounded-xl p-5 border border-[#4A7FD4]/25" style={{ background: 'rgba(30,58,138,0.25)' }}>
                <p className="text-white font-semibold text-sm mb-1">{userLeague.name}</p>
                <p className="text-white/40 text-xs mb-3">{userLeague.members?.length || 0} membres</p>
                <Link to={createPageUrl('Leagues')}>
                  <button className="w-full px-4 py-2 bg-[#1E3A8A] text-white rounded-lg text-sm font-medium hover:bg-[#2B5CE6] transition-colors flex items-center justify-center gap-1">
                    Voir ma ligue <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </Link>
              </div>
            ) : (
              <div className="rounded-xl p-5 text-center border border-white/8" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <p className="text-white/50 text-sm mb-3">Rejoins une ligue pour comparer tes analyses</p>
                <Link to={createPageUrl('Leagues')}>
                  <button className="w-full px-4 py-2 bg-[#1E3A8A] text-white rounded-lg text-sm font-semibold hover:bg-[#2B5CE6] transition-colors">
                    Créer ou rejoindre <ChevronRight className="inline w-3.5 h-3.5" />
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}