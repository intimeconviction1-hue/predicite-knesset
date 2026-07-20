import React from 'react';
import { motion } from 'framer-motion';
import { Award, TrendingUp, Target, BookOpen } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

const ROLE_CONFIG = {
  observateur_local: {
    name: 'Observateur Local',
    icon: '👀',
    color: 'from-slate-500 to-slate-600',
    description: 'Vous découvrez les municipales',
    nextRole: 'apprenti_citoyen',
    threshold: 0
  },
  apprenti_citoyen: {
    name: 'Apprenti Citoyen',
    icon: '📚',
    color: 'from-blue-500 to-blue-600',
    description: 'Vous comprenez les enjeux locaux',
    nextRole: 'expert_municipal',
    threshold: 100
  },
  expert_municipal: {
    name: 'Expert Municipal',
    icon: '🎯',
    color: 'from-purple-500 to-purple-600',
    description: 'Vous maîtrisez le système électoral',
    nextRole: 'historien_citoyen',
    threshold: 300
  },
  historien_citoyen: {
    name: 'Historien Citoyen',
    icon: '📖',
    color: 'from-amber-500 to-amber-600',
    description: "Vous connaissez l'histoire politique",
    nextRole: 'analyste_politique',
    threshold: 600
  },
  analyste_politique: {
    name: 'Analyste Politique',
    icon: '🏆',
    color: 'from-emerald-500 to-emerald-600',
    description: 'Vous êtes un expert reconnu',
    nextRole: null,
    threshold: 1000
  }
};

export default function RoleDisplay({ userProgress, compact = false }) {
  const role = userProgress?.role || 'observateur_local';
  const progress = userProgress?.role_progress || 0;
  const config = ROLE_CONFIG[role];
  
  const calculateProgress = () => {
    const points = userProgress?.total_points || 0;
    const quizzes = userProgress?.quizzes_completed || 0;
    const predictions = userProgress?.predictions_count || 0;
    const learning = userProgress?.learning_moments_count || 0;
    
    // Calcul du score de progression
    const score = points + (quizzes * 10) + (predictions * 5) + (learning * 15);
    
    if (!config.nextRole) return 100;
    
    const nextConfig = ROLE_CONFIG[config.nextRole];
    const progressPercent = Math.min(100, (score / nextConfig.threshold) * 100);
    
    return Math.round(progressPercent);
  };

  const progressPercent = calculateProgress();

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-2 bg-gradient-to-r ${config.color} text-white rounded-full px-4 py-2`}>
        <span className="text-lg">{config.icon}</span>
        <span className="font-medium text-sm">{config.name}</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`bg-gradient-to-r ${config.color} rounded-2xl p-4 text-3xl`}>
            {config.icon}
          </div>
          <div>
            <Badge className={`bg-gradient-to-r ${config.color} text-white mb-1`}>
              Votre rôle
            </Badge>
            <h3 className="text-2xl font-bold text-slate-800">{config.name}</h3>
            <p className="text-slate-600 text-sm">{config.description}</p>
          </div>
        </div>
        <Award className="w-6 h-6 text-slate-400" />
      </div>

      {config.nextRole && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Progression vers {ROLE_CONFIG[config.nextRole].name}</span>
            <span className="font-bold text-indigo-600">{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className="h-3" />
          
          <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-200">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-slate-600 text-xs mb-1">
                <Target className="w-3 h-3" />
                <span>Actions</span>
              </div>
              <p className="font-bold text-slate-800">{(userProgress?.predictions_count || 0) + (userProgress?.quizzes_completed || 0)}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-slate-600 text-xs mb-1">
                <BookOpen className="w-3 h-3" />
                <span>Apprentissages</span>
              </div>
              <p className="font-bold text-slate-800">{userProgress?.learning_moments_count || 0}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-slate-600 text-xs mb-1">
                <TrendingUp className="w-3 h-3" />
                <span>Points</span>
              </div>
              <p className="font-bold text-slate-800">{userProgress?.total_points || 0}</p>
            </div>
          </div>
        </div>
      )}

      {!config.nextRole && (
        <div className="text-center py-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl">
          <p className="text-emerald-700 font-medium">🎉 Niveau maximum atteint !</p>
          <p className="text-emerald-600 text-sm">Continuez à apprendre et partager vos connaissances</p>
        </div>
      )}
    </motion.div>
  );
}