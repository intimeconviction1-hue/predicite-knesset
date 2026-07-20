import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, Users, MapPin, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function LiveStatsBar() {
  const [countdown, setCountdown] = useState({ d: 0, h: 0, m: 0, s: 0 });

  useEffect(() => {
    const tick = () => {
      const diff = new Date('2026-03-15T08:00:00') - new Date();
      if (diff <= 0) return;
      setCountdown({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const { data: totalPredictions = 0 } = useQuery({
    queryKey: ['total-predictions'],
    queryFn: async () => {
      const preds = await base44.entities.Prediction.list('-created_date', 500);
      return preds.length;
    },
    refetchInterval: 5 * 60 * 1000,
  });

  const { data: citiesAnalyzed = 0 } = useQuery({
    queryKey: ['cities-analyzed'],
    queryFn: async () => {
      const preds = await base44.entities.Prediction.list('-created_date', 500);
      return new Set(preds.map(p => p.city_id).filter(Boolean)).size;
    },
    refetchInterval: 10 * 60 * 1000,
  });

  const { data: activeUsers = 0 } = useQuery({
    queryKey: ['active-users-count'],
    queryFn: async () => {
      const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString().split('T')[0];
      const all = await base44.entities.UserProgress.list('-last_activity_date', 200);
      return all.filter(u => u.last_activity_date >= weekAgo).length;
    },
    refetchInterval: 5 * 60 * 1000,
  });

  const stats = [
    {
      icon: TrendingUp,
      value: totalPredictions.toLocaleString('fr-FR'),
      label: 'pronostics soumis',
      color: '#4A7FD4',
      accent: 'rgba(74,127,212,0.15)',
      link: createPageUrl('Predictions'),
    },
    {
      icon: Users,
      value: activeUsers.toLocaleString('fr-FR'),
      label: 'analystes actifs (7j)',
      color: '#22C55E',
      accent: 'rgba(34,197,94,0.12)',
      link: createPageUrl('Leaderboard'),
    },
    {
      icon: MapPin,
      value: citiesAnalyzed.toLocaleString('fr-FR'),
      label: 'villes pronostiquées',
      color: '#D4A017',
      accent: 'rgba(212,160,23,0.12)',
      link: createPageUrl('Cities'),
    },
    {
      icon: Clock,
      value: `J-${countdown.d}`,
      label: `${String(countdown.h).padStart(2,'0')}h ${String(countdown.m).padStart(2,'0')}m ${String(countdown.s).padStart(2,'0')}s · 1er tour`,
      color: '#C8102E',
      accent: 'rgba(200,16,46,0.12)',
      mono: true,
      link: null,
    },
  ];

  return (
    <div className="border-y border-white/8 bg-[#050C1A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            const inner = (
              <motion.div
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border border-white/8 w-full ${stat.link ? 'hover:border-white/20 cursor-pointer transition-colors' : ''}`}
                style={{ background: stat.accent }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${stat.color}20` }}>
                  <Icon className="w-4 h-4" style={{ color: stat.color }} />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-xl leading-tight font-mono" style={{ color: stat.color }}>
                    {stat.value}
                  </div>
                  <div className="text-[10px] text-white/35 leading-tight truncate">{stat.label}</div>
                </div>
              </motion.div>
            );
            return stat.link ? (
              <Link key={i} to={stat.link}>{inner}</Link>
            ) : (
              <div key={i}>{inner}</div>
            );
          })}
        </div>
      </div>
    </div>
  );
}