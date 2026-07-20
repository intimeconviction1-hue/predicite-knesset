import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Zap, Flame, Crown, Sparkles, AlertCircle, Trophy } from 'lucide-react';

const ELECTION_DATE = new Date('2026-03-15T08:00:00');
const SECOND_ROUND = new Date('2026-03-22T08:00:00');

export function getCampaignPhase() {
  const now = new Date();
  const daysUntilElection = Math.ceil((ELECTION_DATE - now) / (1000 * 60 * 60 * 24));
  
  if (now >= SECOND_ROUND) {
    return 'post_election';
  }
  
  if (now >= ELECTION_DATE && now < SECOND_ROUND) {
    return 'between_rounds';
  }
  
  if (now.toDateString() === ELECTION_DATE.toDateString()) {
    return 'election_day';
  }
  
  if (daysUntilElection === 1) {
    return 'eve';
  }
  
  if (daysUntilElection <= 7) {
    return 'final_week';
  }
  
  if (daysUntilElection <= 30) {
    return 'intense';
  }
  
  return 'campaign_start';
}

export const PHASE_CONFIG = {
  campaign_start: {
    name: 'Début de campagne',
    icon: Calendar,
    color: 'from-blue-500 to-indigo-600',
    bg: 'from-blue-50 to-indigo-50',
    message: 'Découvrez les candidats et faites vos premières prédictions !',
    emoji: '📅',
    intensity: 1
  },
  intense: {
    name: 'Campagne intense',
    icon: Flame,
    color: 'from-orange-500 to-red-600',
    bg: 'from-orange-50 to-red-50',
    message: 'La campagne bat son plein ! Affinez vos prédictions.',
    emoji: '⚡',
    intensity: 2
  },
  final_week: {
    name: 'Dernière ligne droite',
    icon: Zap,
    color: 'from-red-500 to-pink-600',
    bg: 'from-red-50 to-pink-50',
    message: 'Plus qu\'une semaine ! Dernières prédictions avant le scrutin.',
    emoji: '🔥',
    intensity: 3
  },
  eve: {
    name: 'Veille du scrutin',
    icon: AlertCircle,
    color: 'from-purple-600 to-indigo-700',
    bg: 'from-purple-50 to-indigo-50',
    message: 'Demain, c\'est le grand jour ! Prédictions closes à minuit.',
    emoji: '⏰',
    intensity: 4
  },
  election_day: {
    name: 'Jour des élections',
    icon: Crown,
    color: 'from-yellow-500 to-amber-600',
    bg: 'from-yellow-50 to-amber-50',
    message: 'C\'est aujourd\'hui ! Résultats en direct ce soir à partir de 20h.',
    emoji: '🗳️',
    intensity: 5
  },
  between_rounds: {
    name: 'Entre deux tours',
    icon: Sparkles,
    color: 'from-teal-500 to-cyan-600',
    bg: 'from-teal-50 to-cyan-50',
    message: 'Découvrez les résultats du 1er tour et préparez le second !',
    emoji: '🎯',
    intensity: 3
  },
  post_election: {
    name: 'Après les élections',
    icon: Trophy,
    color: 'from-emerald-500 to-teal-600',
    bg: 'from-emerald-50 to-teal-50',
    message: 'Élections terminées ! Consultez vos scores finaux.',
    emoji: '🏆',
    intensity: 1
  }
};

export default function CampaignPhase({ compact = false }) {
  const [phase, setPhase] = useState(getCampaignPhase());
  
  useEffect(() => {
    const interval = setInterval(() => {
      setPhase(getCampaignPhase());
    }, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const config = PHASE_CONFIG[phase];
  const Icon = config.icon;

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-2 bg-gradient-to-r ${config.color} text-white rounded-full px-4 py-2`}>
        <Icon className="w-4 h-4 animate-pulse" />
        <span className="font-medium text-sm">{config.name}</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`bg-gradient-to-r ${config.color} rounded-2xl p-6 shadow-xl`}
    >
      <div className="flex items-center gap-3 mb-3">
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 10, -10, 0] 
          }}
          transition={{ 
            repeat: Infinity, 
            duration: 2,
            repeatDelay: 1
          }}
        >
          <Icon className="w-8 h-8 text-white" />
        </motion.div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-white font-bold text-xl">{config.name}</h3>
            <span className="text-2xl">{config.emoji}</span>
          </div>
          <p className="text-white/90 text-sm mt-1">{config.message}</p>
        </div>
      </div>
      
      {/* Intensity indicator */}
      <div className="flex gap-1 mt-4">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full ${
              i < config.intensity ? 'bg-white' : 'bg-white/30'
            }`}
          />
        ))}
      </div>
    </motion.div>
  );
}