import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Trophy, Medal, Crown, Users, Target, Flame, Search, BookOpen } from 'lucide-react';
import CountUp from '@/components/knesset/CountUp';

const formatFr = (v) => Math.round(v).toLocaleString('fr-FR');

export default function Leaderboard() {
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: allUsers = [], isLoading } = useQuery({
    queryKey: ['leaderboard-full'],
    queryFn: () => base44.entities.UserProgress.list('-total_points', 100)
  });

  const filteredUsers = allUsers.filter(u =>
    u.user_email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentUserRank = allUsers.findIndex(u => u.user_email === user?.email) + 1;
  const currentUserProgress = allUsers.find(u => u.user_email === user?.email);
  const topThree = filteredUsers.slice(0, 3);
  const rest = filteredUsers.slice(3);

  const getMedalColor = (position) => {
    if (position === 1) return 'var(--p-gold)';
    if (position === 2) return '#B0B8C8';
    if (position === 3) return '#CD7F32';
    return 'var(--p-text-25)';
  };

  const getPrecision = (player) => {
    if (!player.predictions_count) return '–';
    return `${Math.round((player.correct_predictions || 0) / player.predictions_count * 100)}%`;
  };

  const getScore = (player) => player.citizen_index ?? player.total_points ?? 0;
  const getScoreLabel = (player) => player.citizen_index != null ? 'indice' : 'pts';

  return (
    <div className="min-h-screen" style={{ background: 'var(--p-night)' }}>

      {/* Header */}
      <div style={{ background: 'var(--p-night-2)', borderBottom: '0.5px solid var(--p-border)' }}>
        <div className="max-w-4xl mx-auto px-4 py-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-3">
              <Trophy className="w-7 h-7" style={{ color: 'var(--p-gold)' }} />
              <h1 className="p-display text-3xl">Classement citoyen</h1>
            </div>
            <p className="p-body text-sm max-w-xl mb-5">
              Indice citoyen = précision ×40% + apprentissage ×30% + régularité ×30%
            </p>
            <div className="flex items-center gap-6 flex-wrap">
              {[
                { icon: Target,   label: 'Précision × 40%',    color: 'var(--p-red)' },
                { icon: BookOpen, label: 'Apprentissage × 30%', color: 'var(--p-gold)' },
                { icon: Flame,    label: 'Régularité × 30%',   color: '#F97316' },
              ].map(({ icon: Icon, label, color }) => (
                <div key={label} className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--p-text-60)' }}>
                  <Icon className="w-4 h-4" style={{ color }} />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Ma position */}
      {currentUserProgress && (
        <div className="max-w-4xl mx-auto px-4 -mt-5 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-4"
            style={{ background: 'var(--p-card)', border: '0.5px solid var(--p-gold-border)' }}
          >
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl p-2.5" style={{ background: 'var(--p-gold-dim)' }}>
                  <Trophy className="w-5 h-5" style={{ color: 'var(--p-gold)' }} />
                </div>
                <div>
                  <p className="text-xs" style={{ color: 'var(--p-text-40)' }}>Votre classement</p>
                  <p className="text-xl font-bold p-mono">
                    #{currentUserRank}
                    <span className="text-sm font-normal ml-1" style={{ color: 'var(--p-text-40)' }}>
                      sur {allUsers.length}
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6 text-center">
                {[
                  { label: 'Points', count: currentUserProgress.total_points || 0 },
                  { label: 'Prédictions', count: currentUserProgress.predictions_count || 0 },
                  { label: 'Précision', value: getPrecision(currentUserProgress), color: 'var(--p-green)' },
                  { label: 'Série', value: `${currentUserProgress.daily_streak || 0}j`, color: '#F97316' },
                ].map(({ label, value, count, color }) => (
                  <div key={label}>
                    <p className="text-xs" style={{ color: 'var(--p-text-40)' }}>{label}</p>
                    <p className="font-bold p-mono text-sm" style={{ color: color || 'var(--p-text)' }}>
                      {count != null ? <CountUp value={count} duration={800} formatter={formatFr} /> : value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Podium */}
      {topThree.length >= 3 && !searchQuery && (
        <div className="max-w-4xl mx-auto px-4 mt-10 mb-8">
          <div className="flex items-end justify-center gap-6">
            {/* 2e */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col items-center"
            >
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold mb-2"
                style={{ background: 'rgba(176,184,200,0.15)', border: '0.5px solid rgba(176,184,200,0.3)', color: '#B0B8C8', fontFamily: 'var(--font-display)' }}>
                {topThree[1]?.user_email?.charAt(0).toUpperCase()}
              </div>
              <p className="text-sm font-medium truncate max-w-[90px] text-center" style={{ color: 'var(--p-text-60)' }}>
                {topThree[1]?.user_email?.split('@')[0]}
              </p>
              <p className="p-mono text-sm" style={{ color: '#B0B8C8' }}>
                <CountUp value={getScore(topThree[1])} duration={900} delay={200} formatter={formatFr} /> <span className="text-xs" style={{ color: 'var(--p-text-25)' }}>{getScoreLabel(topThree[1])}</span>
              </p>
              <div className="w-20 h-16 rounded-t-lg mt-2 flex items-center justify-center"
                style={{ background: 'rgba(176,184,200,0.08)', border: '0.5px solid rgba(176,184,200,0.15)' }}>
                <Medal className="w-6 h-6" style={{ color: '#B0B8C8' }} />
              </div>
            </motion.div>

            {/* 1er */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex flex-col items-center"
            >
              <Crown className="w-7 h-7 mb-2" style={{ color: 'var(--p-gold)' }} />
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold mb-2"
                style={{ background: 'var(--p-gold-dim)', border: '2px solid var(--p-gold)', color: 'var(--p-gold)', fontFamily: 'var(--font-display)' }}>
                {topThree[0]?.user_email?.charAt(0).toUpperCase()}
              </div>
              <p className="font-bold truncate max-w-[110px] text-center" style={{ color: 'var(--p-text)', fontFamily: 'var(--font-display)' }}>
                {topThree[0]?.user_email?.split('@')[0]}
              </p>
              <p className="p-mono text-base" style={{ color: 'var(--p-gold)' }}>
                <CountUp value={getScore(topThree[0])} duration={900} delay={100} formatter={formatFr} /> <span className="text-xs" style={{ color: 'var(--p-text-25)' }}>{getScoreLabel(topThree[0])}</span>
              </p>
              <div className="w-24 h-24 rounded-t-lg mt-2 flex items-center justify-center"
                style={{ background: 'var(--p-gold-dim)', border: '0.5px solid var(--p-gold-border)' }}>
                <Trophy className="w-10 h-10" style={{ color: 'var(--p-gold)' }} />
              </div>
            </motion.div>

            {/* 3e */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col items-center"
            >
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold mb-2"
                style={{ background: 'rgba(205,127,50,0.15)', border: '0.5px solid rgba(205,127,50,0.3)', color: '#CD7F32', fontFamily: 'var(--font-display)' }}>
                {topThree[2]?.user_email?.charAt(0).toUpperCase()}
              </div>
              <p className="text-sm font-medium truncate max-w-[90px] text-center" style={{ color: 'var(--p-text-60)' }}>
                {topThree[2]?.user_email?.split('@')[0]}
              </p>
              <p className="p-mono text-sm" style={{ color: '#CD7F32' }}>
                <CountUp value={getScore(topThree[2])} duration={900} delay={300} formatter={formatFr} /> <span className="text-xs" style={{ color: 'var(--p-text-25)' }}>{getScoreLabel(topThree[2])}</span>
              </p>
              <div className="w-20 h-12 rounded-t-lg mt-2 flex items-center justify-center"
                style={{ background: 'rgba(205,127,50,0.08)', border: '0.5px solid rgba(205,127,50,0.15)' }}>
                <Medal className="w-6 h-6" style={{ color: '#CD7F32' }} />
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {/* Recherche */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--p-text-25)' }} />
          <input
            placeholder="Rechercher un joueur..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Rechercher un joueur"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none"
            style={{
              background: 'var(--p-card)',
              border: '0.5px solid var(--p-border)',
              color: 'var(--p-text)',
              fontFamily: 'var(--font-body)',
            }}
          />
        </div>
      </div>

      {/* Liste */}
      <div className="max-w-4xl mx-auto px-4 pb-16">
        <div className="rounded-2xl overflow-hidden" style={{ border: '0.5px solid var(--p-border)' }}>

          {/* En-tête */}
          <div className="px-4 py-3 flex items-center justify-between text-[10px] uppercase tracking-widest"
            style={{ background: 'var(--p-card)', borderBottom: '0.5px solid var(--p-border)', color: 'var(--p-text-25)' }}>
            <span>Analyste citoyen</span>
            <div className="flex items-center gap-8">
              <span className="hidden md:block">Précision</span>
              <span className="hidden md:block">Série</span>
              <span>Score</span>
            </div>
          </div>

          <div style={{ background: 'var(--p-night)' }}>
            {isLoading ? (
              [...Array(8)].map((_, i) => (
                <div key={i} className="p-4" style={{ borderBottom: '0.5px solid var(--p-border)' }}>
                  <div className="h-10 rounded-xl animate-pulse" style={{ background: 'var(--p-card)' }} />
                </div>
              ))
            ) : (searchQuery ? filteredUsers : rest).map((player, index) => {
              const position = searchQuery
                ? allUsers.findIndex(u => u.user_email === player.user_email) + 1
                : index + 4;
              const isCurrentUser = player.user_email === user?.email;

              return (
                <motion.div
                  key={player.user_email}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className={`px-4 py-3 flex items-center gap-4 transition-colors duration-300 ${!isCurrentUser ? 'hover:bg-white/[0.03]' : ''}`}
                  style={{
                    borderBottom: '0.5px solid var(--p-border)',
                    borderLeft: isCurrentUser ? '2px solid var(--p-gold)' : 'none',
                    background: isCurrentUser ? 'var(--p-gold-dim)' : 'transparent',
                    cursor: 'default',
                  }}
                >
                  {/* Rang */}
                  <div className="w-7 flex justify-center shrink-0">
                    {position <= 3 ? (
                      position === 1 ? <Crown className="w-5 h-5" style={{ color: 'var(--p-gold)' }} />
                      : <Medal className="w-5 h-5" style={{ color: getMedalColor(position) }} />
                    ) : (
                      <span className="text-sm font-bold" style={{ color: 'var(--p-text-25)', fontFamily: 'var(--font-mono)' }}>{position}</span>
                    )}
                  </div>

                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                    style={{ background: isCurrentUser ? 'var(--p-gold)' : 'var(--p-card)', color: isCurrentUser ? 'var(--p-night)' : 'var(--p-text-60)', fontFamily: 'var(--font-display)' }}>
                    {player.user_email?.charAt(0).toUpperCase()}
                  </div>

                  {/* Nom */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate text-sm" style={{ color: 'var(--p-text)', fontFamily: 'var(--font-body)' }}>
                        {player.user_email?.split('@')[0]}
                      </p>
                      {isCurrentUser && (
                        <span className="p-badge p-badge-gold text-[9px] px-2 py-0.5">Vous</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs md:hidden mt-0.5" style={{ color: 'var(--p-text-40)' }}>
                      <Target className="w-3 h-3" />
                      <span>{player.predictions_count || 0}</span>
                      <Flame className="w-3 h-3" style={{ color: '#F97316' }} />
                      <span>{player.daily_streak || 0}j</span>
                    </div>
                  </div>

                  {/* Stats desktop */}
                  <div className="hidden md:flex items-center gap-8">
                    <p className="text-sm font-bold" style={{ color: 'var(--p-green)', fontFamily: 'var(--font-mono)' }}>
                      {getPrecision(player)}
                    </p>
                    <div className="flex items-center gap-1" style={{ color: 'var(--p-text-60)' }}>
                      <Flame className="w-4 h-4" style={{ color: '#F97316' }} />
                      <span className="text-sm" style={{ fontFamily: 'var(--font-mono)' }}>{player.daily_streak || 0}j</span>
                    </div>
                  </div>

                  {/* Score */}
                  <div className="text-right shrink-0">
                    <p className="font-bold p-mono" style={{ color: isCurrentUser ? 'var(--p-gold)' : 'var(--p-text)' }}>
                      <CountUp value={getScore(player)} duration={700} delay={index * 20} formatter={formatFr} />
                    </p>
                    <p className="text-[10px]" style={{ color: 'var(--p-text-25)' }}>{getScoreLabel(player)}</p>
                  </div>
                </motion.div>
              );
            })}

            {filteredUsers.length === 0 && !isLoading && (
              <div className="py-16 text-center">
                <Users className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--p-text-25)' }} />
                <p style={{ color: 'var(--p-text-40)' }}>Aucun joueur trouvé</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}