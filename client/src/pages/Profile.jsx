import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  User, Trophy, Target, Flame, Award, MapPin, 
  TrendingUp, LogOut, ChevronRight, BarChart2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import BadgeDisplay from '@/components/badges/BadgeDisplay';
import UserStatsBar from '@/components/stats/UserStatsBar';
import PredictionGamification from '@/components/prediction/PredictionGamification';

export default function Profile() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: progress } = useQuery({
    queryKey: ['user-progress', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const p = await base44.entities.UserProgress.filter({ user_email: user.email });
      return p[0];
    },
    enabled: !!user?.email
  });

  const { data: predictions = [] } = useQuery({
    queryKey: ['user-predictions', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      try {
        return await base44.entities.Prediction.filter({ user_email: user.email });
      } catch (e) {
        console.error('Failed to fetch predictions:', e);
        return [];
      }
    },
    enabled: !!user?.email
  });

  const { data: cities = [] } = useQuery({
    queryKey: ['cities'],
    queryFn: () => base44.entities.City.list()
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: async () => {
      try {
        return await base44.entities.UserProgress.list('-total_points');
      } catch (e) {
        console.error('Failed to fetch user list:', e);
        return [];
      }
    }
  });

  const userRank = allUsers && allUsers.length > 0 ? allUsers.findIndex(u => u.user_email === user?.email) + 1 : 0;

  const getCityName = (cityId) => {
    const city = cities.find(c => c.id === cityId);
    return city?.name || 'Ville inconnue';
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md">
          <User className="w-12 h-12 mx-auto text-indigo-600 mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Mon profil</h2>
          <p className="text-slate-500 mb-6">
            Connectez-vous pour voir votre profil et vos statistiques.
          </p>
          <Button onClick={() => base44.auth.redirectToLogin()}>
            Se connecter
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-[#034EA2] text-white">
        <div className="max-w-4xl mx-auto px-4 py-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row items-center gap-5"
          >
            <div className="w-16 h-16 rounded-full bg-white/15 flex items-center justify-center text-2xl font-bold border border-white/20">
              {user.full_name?.charAt(0) || user.email?.charAt(0).toUpperCase()}
            </div>
            <div className="text-center md:text-left">
              <h1 className="text-xl font-bold">
                {user.full_name || user.email?.split('@')[0]}
              </h1>
              <p className="text-white/60 text-sm">{user.email}</p>
              {userRank > 0 && (
                <div className="flex items-center justify-center md:justify-start gap-1.5 mt-1.5">
                  <Trophy className="w-3.5 h-3.5 text-[#E1B530]" />
                  <span className="text-sm text-white/80">#{userRank} — Indice citoyen</span>
                </div>
              )}
            </div>
            <div className="ml-auto">
              <Button
                variant="ghost"
                onClick={() => base44.auth.logout()}
                className="text-white/70 hover:bg-white/10 text-sm"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Déconnexion
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-4xl mx-auto px-4 -mt-6">
        <UserStatsBar progress={progress} />
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-600" />
              <h2 className="font-bold text-slate-800">Mes badges</h2>
            </div>
            <Badge variant="outline">
              {progress?.badges?.length || 0} / {Object.keys({premier_pas:1,oracle:1,grand_oracle:1,tireur_d_elite:1,serie_de_feu:1,invincible:1,expert_municipal:1,historien_local:1,rapide:1,fidele:1,marathonien:1,leader:1,champion:1,social:1}).length}
            </Badge>
          </div>
          <BadgeDisplay badges={progress?.badges || []} showAll={true} />
        </motion.div>

        {/* Gamification prédictions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6"
        >
          <div className="flex items-center gap-2 mb-5">
            <BarChart2 className="w-5 h-5 text-purple-600" />
            <h2 className="font-bold text-slate-800">Module Pronostiquer</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 border border-purple-200 font-medium ml-auto">Pronostiquer</span>
          </div>
          <PredictionGamification progress={progress} predictions={predictions} />
        </motion.div>

        {/* Recent predictions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-orange-500" />
              <h2 className="font-bold text-slate-800">Mes prédictions</h2>
            </div>
            <Badge variant="outline">
              {predictions.length} prédiction{predictions.length > 1 ? 's' : ''}
            </Badge>
          </div>

          {predictions.length === 0 ? (
            <div className="text-center py-8">
              <Target className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-slate-500">Aucune prédiction pour le moment</p>
              <Link to={createPageUrl('Cities')}>
                <Button className="mt-4" variant="outline">
                  Faire ma première prédiction
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {predictions.slice(0, 5).map((pred, index) => (
                <motion.div
                  key={pred.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">{getCityName(pred.city_id)}</p>
                      <p className="text-xs text-slate-500">
                        {pred.prediction_type === 'winner' && `Vainqueur: ${pred.predicted_winner}`}
                        {pred.prediction_type === 'percentage' && `Score: ${pred.predicted_percentage}%`}
                        {pred.prediction_type === 'turnout' && `Participation: ${pred.predicted_turnout}%`}
                      </p>
                    </div>
                  </div>
                  {pred.is_correct !== undefined && (
                    <Badge className={pred.is_correct ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                      {pred.is_correct ? '✓ Correct' : '✗ Incorrect'}
                    </Badge>
                  )}
                </motion.div>
              ))}
              
              {predictions.length > 5 && (
                <p className="text-center text-sm text-slate-500">
                  Et {predictions.length - 5} autres prédictions...
                </p>
              )}
            </div>
          )}
        </motion.div>

        {/* Quick actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid md:grid-cols-2 gap-4"
        >
          <Link to={createPageUrl('Leaderboard')}>
            <div className="bg-[#034EA2] rounded-2xl p-5 text-white hover:bg-[#023b7a] transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Trophy className="w-5 h-5 text-[#E1B530]" />
                  <div>
                    <h3 className="font-semibold">Indice citoyen</h3>
                    <p className="text-white/60 text-xs">Ma position au classement</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-white/40" />
              </div>
            </div>
          </Link>

          <Link to={createPageUrl('Leagues')}>
            <div className="bg-white rounded-2xl p-5 border border-slate-100 hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-[#034EA2]" />
                  <div>
                    <h3 className="font-semibold text-slate-800">Cercles citoyens</h3>
                    <p className="text-slate-500 text-xs">Gérer mes cercles</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300" />
              </div>
            </div>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}