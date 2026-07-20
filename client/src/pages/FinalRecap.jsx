import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Lock, Calendar, Trophy, Target, BookOpen, 
  CheckCircle, XCircle, ChevronRight, Star, Award
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function FinalRecap() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: cities = [] } = useQuery({
    queryKey: ['cities-recap'],
    queryFn: () => base44.entities.City.list()
  });

  const { data: predictions = [] } = useQuery({
    queryKey: ['predictions-recap', user?.email],
    queryFn: () => base44.entities.Prediction.filter({ user_email: user.email }),
    enabled: !!user?.email
  });

  const { data: progress } = useQuery({
    queryKey: ['progress-recap', user?.email],
    queryFn: async () => {
      const res = await base44.entities.UserProgress.filter({ user_email: user.email });
      return res[0];
    },
    enabled: !!user?.email
  });

  const { data: learningMoments = [] } = useQuery({
    queryKey: ['learning-moments-recap', user?.email],
    queryFn: () => base44.entities.LearningMoment.filter({ user_email: user.email }),
    enabled: !!user?.email
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['all-users-recap'],
    queryFn: () => base44.entities.UserProgress.list('-total_points', 200)
  });

  // Résultats 2026 disponibles ?
  const citiesWithResults = cities.filter(c => (c.previous_results || []).some(r => r.year === 2026));
  const hasResults = citiesWithResults.length > 0;

  const cityMap = Object.fromEntries(cities.map(c => [c.id, c]));
  const userRank = allUsers.findIndex(u => u.user_email === user?.email) + 1;

  const winnerPreds = predictions.filter(p => 
    p.prediction_type === 'winner' && p.is_correct !== null && p.is_correct !== undefined
  );
  const correctPreds = winnerPreds.filter(p => p.is_correct);
  const accuracy = winnerPreds.length > 0 
    ? Math.round((correctPreds.length / winnerPreds.length) * 100) 
    : null;

  // Locked si pas de résultats
  if (!hasResults) {
    return (
      <div className="min-h-screen bg-[#07122A] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6">
            <Lock className="w-6 h-6 text-white/40" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Bilan final</h1>
          <p className="text-white/45 text-sm leading-relaxed mb-2">
            Votre récapitulatif personnel sera disponible après la publication des résultats officiels.
          </p>
          <div className="flex items-center justify-center gap-1.5 text-[#E1B530] text-sm font-medium mb-8">
            <Calendar className="w-4 h-4" />
            Après le 22 mars 2026
          </div>
          <Link to={createPageUrl('Home')}>
            <button className="flex items-center gap-1.5 text-white/50 hover:text-white/80 text-sm transition-colors mx-auto">
              <ChevronRight className="w-4 h-4 rotate-180" />
              Retour à l'accueil
            </button>
          </Link>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#07122A] flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-white/60 mb-4">Connectez-vous pour voir votre bilan</p>
          <button 
            onClick={() => base44.auth.redirectToLogin()} 
            className="bg-[#034EA2] text-white px-4 py-2 rounded-lg"
          >
            Se connecter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07122A]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#034EA2] to-[#0a2f7a] text-white py-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="text-5xl mb-4">🏅</div>
            <h1 className="text-3xl font-bold mb-2">Votre bilan — Municipales 2026</h1>
            <p className="text-white/60 text-sm">Campagne du 1er janvier au 22 mars 2026</p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* Statistiques clés */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Rang final', value: userRank ? `#${userRank}` : '—', icon: Trophy, color: 'text-[#E1B530]' },
            { label: 'Précision', value: accuracy !== null ? `${accuracy}%` : '—', icon: Target, color: 'text-emerald-400' },
            { label: 'Moments appris', value: learningMoments.length, icon: BookOpen, color: 'text-blue-400' },
            { label: 'Points totaux', value: (progress?.total_points || 0).toLocaleString('fr-FR'), icon: Star, color: 'text-[#E1B530]' },
          ].map(({ label, value, icon: Icon, color }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center"
            >
              <Icon className={`w-5 h-5 mx-auto mb-2 ${color}`} />
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-white/40 text-xs mt-1">{label}</p>
            </motion.div>
          ))}
        </div>

        {/* Rôle atteint */}
        {progress?.role && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center gap-4"
          >
            <div className="text-3xl">🎖️</div>
            <div>
              <p className="text-white font-bold text-lg capitalize">{progress.role.replace(/_/g, ' ')}</p>
              <p className="text-white/50 text-sm">Rôle atteint pendant la campagne</p>
            </div>
            {progress.daily_streak > 0 && (
              <div className="ml-auto text-center">
                <p className="text-orange-400 font-bold text-xl">{progress.daily_streak}j</p>
                <p className="text-white/40 text-xs">série max</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Badge spécial Municipales 2026 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-[#E1B530]/20 to-[#C8102E]/20 border border-[#E1B530]/30 rounded-2xl p-6 text-center"
        >
          <div className="text-4xl mb-3">🏆</div>
          <p className="text-[#E1B530] font-bold text-lg">Badge · Analyste des Municipales 2026</p>
          <p className="text-white/50 text-sm mt-1">
            Vous avez participé à la 1ère campagne citoyenne PrédiCité
          </p>
        </motion.div>

        {/* Prédictions détaillées */}
        {winnerPreds.length > 0 && (
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-white font-bold flex items-center gap-2">
                <Target className="w-4 h-4 text-[#E1B530]" />
                Villes pronostiquées
              </h2>
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                {correctPreds.length}/{winnerPreds.length} correctes
              </Badge>
            </div>
            <div className="divide-y divide-white/10">
              {winnerPreds.map(pred => {
                const city = cityMap[pred.city_id];
                return (
                  <div key={pred.id} className="px-5 py-3 flex items-center gap-3">
                    {pred.is_correct
                      ? <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      : <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    }
                    <span className="text-white text-sm flex-1">{city?.name || 'Ville'}</span>
                    <span className="text-white/50 text-xs">{pred.predicted_winner}</span>
                    {pred.points_earned > 0 && (
                      <span className="text-[#E1B530] text-xs font-mono font-bold">+{pred.points_earned}pts</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Ce que vous avez appris */}
        {learningMoments.length > 0 && (
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10">
              <h2 className="text-white font-bold flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-400" />
                Ce que vous avez appris pendant la campagne
              </h2>
              <p className="text-white/40 text-xs mt-1">{learningMoments.length} moments d'apprentissage</p>
            </div>
            <div className="divide-y divide-white/10 max-h-64 overflow-y-auto">
              {learningMoments.slice(0, 10).map(moment => (
                <div key={moment.id} className="px-5 py-3">
                  <p className="text-white/70 text-sm">{moment.key_takeaway}</p>
                  {moment.lesson_learned && (
                    <p className="text-white/30 text-xs mt-0.5">{moment.lesson_learned.slice(0, 80)}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-center pt-4">
          <Link to={createPageUrl('Leaderboard')}>
            <button className="text-[#034EA2] hover:text-blue-300 text-sm transition-colors flex items-center gap-1.5 mx-auto mb-3">
              <Trophy className="w-4 h-4" />
              Voir le classement final
            </button>
          </Link>
          <Link to={createPageUrl('Home')}>
            <button className="text-white/40 hover:text-white/70 text-sm transition-colors flex items-center gap-1.5 mx-auto">
              <ChevronRight className="w-4 h-4 rotate-180" />
              Retour à l'accueil
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}