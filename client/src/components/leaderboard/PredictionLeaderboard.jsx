import React, { useState } from 'react';
import { base44 } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Trophy, Medal, Zap, MapPin, Search } from 'lucide-react';
import { Input } from '@/components/ui/input.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx';

export default function PredictionLeaderboard() {
  const [searchUser, setSearchUser] = useState('');
  const [selectedCity, setSelectedCity] = useState(null);

  const { data: predictions = [], isLoading } = useQuery({
    queryKey: ['all-predictions'],
    queryFn: () => base44.entities.Prediction.filter({ prediction_type: 'winner' })
  });

  const { data: cities = [] } = useQuery({
    queryKey: ['cities-for-leaderboard'],
    queryFn: () => base44.entities.City.list()
  });

  // Calculate global leaderboard
  const calculateGlobalLeaderboard = () => {
    const userScores = {};
    
    predictions.forEach(pred => {
      if (!userScores[pred.user_email]) {
        userScores[pred.user_email] = {
          email: pred.user_email,
          predictions: 0,
          points: 0
        };
      }
      userScores[pred.user_email].predictions += 1;
      userScores[pred.user_email].points += pred.points_earned || 0;
    });

    return Object.values(userScores)
      .sort((a, b) => b.points - a.points || b.predictions - a.predictions)
      .slice(0, 50);
  };

  // Calculate city-specific leaderboard
  const calculateCityLeaderboard = (cityId) => {
    const userScores = {};
    
    predictions
      .filter(p => p.city_id === cityId)
      .forEach(pred => {
        if (!userScores[pred.user_email]) {
          userScores[pred.user_email] = {
            email: pred.user_email,
            predictions: 0,
            points: 0
          };
        }
        userScores[pred.user_email].predictions += 1;
        userScores[pred.user_email].points += pred.points_earned || 0;
      });

    return Object.values(userScores)
      .sort((a, b) => b.points - a.points || b.predictions - a.predictions);
  };

  const globalLeaderboard = calculateGlobalLeaderboard();
  const cityLeaderboard = selectedCity ? calculateCityLeaderboard(selectedCity) : [];

  const getMedalIcon = (rank) => {
    if (rank === 0) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (rank === 1) return <Medal className="w-5 h-5 text-slate-400" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-orange-600" />;
    return <span className="text-xs font-bold text-slate-400 w-5 text-center">#{rank + 1}</span>;
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="global" className="w-full">
        <TabsList className="grid w-full max-w-md">
          <TabsTrigger value="global" className="flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            Global
          </TabsTrigger>
          <TabsTrigger value="cities" className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Par ville
          </TabsTrigger>
        </TabsList>

        {/* Global Leaderboard */}
        <TabsContent value="global" className="mt-6 space-y-4">
          <div className="max-w-xl">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Rechercher un utilisateur..."
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg h-16 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {globalLeaderboard
                .filter(u => u.email.toLowerCase().includes(searchUser.toLowerCase()))
                .map((user, idx) => (
                  <motion.div
                    key={user.email}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`bg-white border rounded-lg p-4 flex items-center justify-between ${
                      idx < 3 ? 'border-yellow-200 bg-yellow-50/30' : 'border-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex items-center justify-center w-10">
                        {getMedalIcon(idx)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-800">
                          {user.email.split('@')[0]}
                        </p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="font-bold text-lg text-[#034EA2]">{user.points} pts</p>
                      <p className="text-xs text-slate-500">{user.predictions} prédictions</p>
                    </div>
                  </motion.div>
                ))}
            </div>
          )}
        </TabsContent>

        {/* City Leaderboards */}
        <TabsContent value="cities" className="mt-6 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {cities.slice(0, 12).map(city => (
              <button
                key={city.id}
                onClick={() => setSelectedCity(selectedCity === city.id ? null : city.id)}
                className={`p-3 rounded-lg border transition-all ${
                  selectedCity === city.id
                    ? 'bg-[#034EA2] text-white border-[#034EA2]'
                    : 'bg-white border-slate-100 text-slate-700 hover:border-slate-300'
                }`}
              >
                <p className="text-sm font-semibold">{city.name}</p>
                <p className="text-xs opacity-60">{city.region}</p>
              </button>
            ))}
          </div>

          {selectedCity && (
            <div className="space-y-2 mt-6">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Top prédicteurs - {cities.find(c => c.id === selectedCity)?.name}
              </h3>

              {cityLeaderboard.length === 0 ? (
                <div className="bg-slate-50 rounded-lg p-8 text-center text-slate-500">
                  <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Aucune prédiction encore sur cette ville</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {cityLeaderboard.map((user, idx) => (
                    <motion.div
                      key={user.email}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`bg-white border rounded-lg p-4 flex items-center justify-between ${
                        idx < 3 ? 'border-yellow-200 bg-yellow-50/30' : 'border-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex items-center justify-center w-10">
                          {getMedalIcon(idx)}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-slate-800">
                            {user.email.split('@')[0]}
                          </p>
                          <p className="text-xs text-slate-500">{user.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-800">{user.points} pts</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}