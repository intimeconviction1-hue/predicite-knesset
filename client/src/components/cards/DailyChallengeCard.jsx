import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Zap, Trophy, Target, HelpCircle, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function DailyChallengeCard({ challenge, isCompleted = false }) {
  const typeConfig = {
    quiz: { icon: HelpCircle, color: 'from-purple-500 to-indigo-600', label: 'Quiz' },
    prediction: { icon: Target, color: 'from-orange-500 to-red-500', label: 'Prédiction' },
    survey: { icon: Star, color: 'from-blue-500 to-cyan-500', label: 'Sondage' },
    special: { icon: Zap, color: 'from-yellow-500 to-orange-500', label: 'Spécial' }
  };

  const config = typeConfig[challenge?.challenge_type] || typeConfig.quiz;
  const Icon = config.icon;

  if (!challenge) {
    return (
      <div className="bg-gradient-to-r from-slate-100 to-slate-200 rounded-2xl p-6 animate-pulse">
        <div className="h-6 bg-slate-300 rounded w-1/3 mb-4" />
        <div className="h-4 bg-slate-300 rounded w-2/3" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${config.color} p-6 shadow-lg`}
    >
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <Badge className="bg-white/20 text-white border-0 mb-1">
                {config.label} du jour
              </Badge>
              <h3 className="text-white font-bold text-lg">{challenge.title}</h3>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
            <Trophy className="w-4 h-4 text-yellow-300" />
            <span className="text-white font-bold text-sm">+{challenge.points_reward || 50}</span>
          </div>
        </div>

        <p className="text-white/90 mb-4 text-sm">{challenge.description}</p>

        {isCompleted ? (
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-3">
            <Trophy className="w-5 h-5 text-yellow-300" />
            <span className="text-white font-medium">Défi complété ! 🎉</span>
          </div>
        ) : (
          <Link to={createPageUrl(`DailyChallenge?id=${challenge.id}`)}>
            <Button className="w-full bg-white text-slate-800 hover:bg-white/90 font-semibold">
              <Zap className="w-4 h-4 mr-2" />
              Relever le défi
            </Button>
          </Link>
        )}

        {challenge.is_special_event && (
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute top-2 right-2"
          >
            <span className="text-2xl">⭐</span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}