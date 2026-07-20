import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Target, Flame, Award, TrendingUp } from 'lucide-react';

export default function UserStatsBar({ progress }) {
  const stats = [
    {
      icon: Trophy,
      label: 'Points',
      value: progress?.total_points || 0,
      color: 'text-yellow-600',
      bg: 'bg-yellow-50'
    },
    {
      icon: Target,
      label: 'Prédictions',
      value: progress?.predictions_count || 0,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50'
    },
    {
      icon: TrendingUp,
      label: 'Précision',
      value: progress?.predictions_count > 0 
        ? `${Math.round((progress?.correct_predictions || 0) / progress.predictions_count * 100)}%`
        : '–',
      color: 'text-emerald-600',
      bg: 'bg-emerald-50'
    },
    {
      icon: Flame,
      label: 'Série',
      value: `${progress?.daily_streak || 0}j`,
      color: 'text-orange-600',
      bg: 'bg-orange-50'
    },
    {
      icon: Award,
      label: 'Badges',
      value: progress?.badges?.length || 0,
      color: 'text-purple-600',
      bg: 'bg-purple-50'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4"
    >
      <div className="grid grid-cols-5 gap-2">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.1 }}
            className="flex flex-col items-center text-center"
          >
            <div className={`${stat.bg} rounded-xl p-2 mb-1`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <p className="font-bold text-slate-800 text-sm">{stat.value}</p>
            <p className="text-xs text-slate-500">{stat.label}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}