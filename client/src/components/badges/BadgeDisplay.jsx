import React from 'react';
import { motion } from 'framer-motion';
import { Award, Star, Target, Flame, Brain, MapPin, Trophy, Users, Zap, Crown } from 'lucide-react';

const BADGES_CONFIG = {
  // Prédiction
  'premier_pas': {
    icon: Star,
    name: 'Premier pas',
    description: 'Première prédiction enregistrée',
    color: 'from-yellow-400 to-orange-500',
    category: 'prediction'
  },
  'oracle': {
    icon: Target,
    name: 'Oracle',
    description: '5 prédictions de vainqueur correctes',
    color: 'from-indigo-500 to-purple-600',
    category: 'prediction'
  },
  'grand_oracle': {
    icon: Crown,
    name: 'Grand Oracle',
    description: '10 prédictions correctes',
    color: 'from-purple-500 to-pink-600',
    category: 'prediction'
  },
  'tireur_d_elite': {
    icon: Zap,
    name: 'Tireur d\'élite',
    description: 'Précision > 80% sur les scores',
    color: 'from-cyan-500 to-blue-600',
    category: 'prediction'
  },
  'serie_de_feu': {
    icon: Flame,
    name: 'Série de feu',
    description: '5 prédictions correctes d\'affilée',
    color: 'from-orange-500 to-red-600',
    category: 'prediction'
  },
  'invincible': {
    icon: Trophy,
    name: 'Invincible',
    description: '10 prédictions correctes d\'affilée',
    color: 'from-yellow-500 to-amber-600',
    category: 'prediction'
  },
  // Quiz / apprentissage
  'expert_municipal': {
    icon: Brain,
    name: 'Expert municipal',
    description: '10 quiz réussis',
    color: 'from-purple-500 to-indigo-600',
    category: 'learning'
  },
  'historien_local': {
    icon: MapPin,
    name: 'Historien local',
    description: 'Quiz histoire complétés pour 5 villes',
    color: 'from-emerald-500 to-teal-600',
    category: 'learning'
  },
  'rapide': {
    icon: Zap,
    name: 'Éclair',
    description: 'Quiz complété en moins de 10 secondes',
    color: 'from-cyan-500 to-blue-500',
    category: 'learning'
  },
  // Régularité
  'fidele': {
    icon: Flame,
    name: 'Fidèle',
    description: 'Connecté 7 jours consécutifs',
    color: 'from-orange-400 to-red-500',
    category: 'streak'
  },
  'marathonien': {
    icon: Flame,
    name: 'Marathonien',
    description: 'Connecté 30 jours consécutifs',
    color: 'from-red-500 to-pink-600',
    category: 'streak'
  },
  // Social / classement
  'leader': {
    icon: Crown,
    name: 'Leader',
    description: 'Top 10 du classement général',
    color: 'from-yellow-500 to-amber-600',
    category: 'ranking'
  },
  'champion': {
    icon: Trophy,
    name: 'Champion',
    description: '1000 points atteints',
    color: 'from-amber-500 to-yellow-500',
    category: 'ranking'
  },
  'social': {
    icon: Users,
    name: 'Social',
    description: 'Membre d\'une ligue',
    color: 'from-blue-500 to-cyan-500',
    category: 'social'
  },
};

const CATEGORY_LABELS = {
  prediction: { label: 'Prédictions', color: 'text-purple-600' },
  learning: { label: 'Apprentissage', color: 'text-blue-600' },
  streak: { label: 'Régularité', color: 'text-orange-600' },
  ranking: { label: 'Classement', color: 'text-yellow-600' },
  social: { label: 'Social', color: 'text-cyan-600' },
};

function BadgeItem({ badgeId, isUnlocked, showAll, index }) {
  const config = BADGES_CONFIG[badgeId];
  if (!config) return null;
  const Icon = config.icon;

  return (
    <motion.div
      key={badgeId}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.04 }}
      className={`relative group ${!isUnlocked && showAll ? 'opacity-35' : ''}`}
    >
      <div className={`
        p-4 rounded-2xl text-center transition-all duration-300
        ${isUnlocked 
          ? `bg-gradient-to-br ${config.color} shadow-md hover:shadow-lg hover:scale-105` 
          : 'bg-slate-100'
        }
      `}>
        <div className={`
          w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-2
          ${isUnlocked ? 'bg-white/20' : 'bg-slate-200'}
        `}>
          <Icon className={`w-6 h-6 ${isUnlocked ? 'text-white' : 'text-slate-400'}`} />
        </div>
        <p className={`font-semibold text-xs leading-tight ${isUnlocked ? 'text-white' : 'text-slate-500'}`}>
          {config.name}
        </p>
        {!isUnlocked && showAll && (
          <span className="absolute -top-1 -right-1 text-base">🔒</span>
        )}
        {isUnlocked && (
          <span className="absolute -top-1 -right-1 text-base">✨</span>
        )}
      </div>
      
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none max-w-[180px] text-center">
        {config.description}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
      </div>
    </motion.div>
  );
}

export default function BadgeDisplay({ badges = [], showAll = false }) {
  const userBadges = badges.filter(b => BADGES_CONFIG[b]);

  if (!showAll && userBadges.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <Award className="w-12 h-12 mx-auto mb-3 text-slate-300" />
        <p className="font-medium">Aucun badge pour le moment</p>
        <p className="text-sm mt-1">Jouez pour débloquer vos premiers badges !</p>
      </div>
    );
  }

  if (!showAll) {
    return (
      <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
        {userBadges.map((badgeId, index) => (
          <BadgeItem key={badgeId} badgeId={badgeId} isUnlocked={true} showAll={false} index={index} />
        ))}
      </div>
    );
  }

  // Grouped by category
  const categories = Object.keys(CATEGORY_LABELS);
  return (
    <div className="space-y-5">
      {categories.map(cat => {
        const catBadges = Object.entries(BADGES_CONFIG).filter(([, v]) => v.category === cat).map(([k]) => k);
        const meta = CATEGORY_LABELS[cat];
        const unlockedInCat = catBadges.filter(b => badges.includes(b)).length;
        return (
          <div key={cat}>
            <div className="flex items-center gap-2 mb-2">
              <p className={`text-xs font-semibold uppercase tracking-wider ${meta.color}`}>{meta.label}</p>
              <span className="text-xs text-slate-400">{unlockedInCat}/{catBadges.length}</span>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3">
              {catBadges.map((badgeId, index) => (
                <BadgeItem
                  key={badgeId}
                  badgeId={badgeId}
                  isUnlocked={badges.includes(badgeId)}
                  showAll={true}
                  index={index}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}