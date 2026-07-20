import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Target, MapPin, Trophy, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CityPredictionCard from '@/components/prediction/CityPredictionCard.jsx';
import PredictionLeaderboard from '@/components/leaderboard/PredictionLeaderboard.jsx';
import RevisionAlertBanner from '@/components/prediction/RevisionAlertBanner.jsx';

export default function PredictionsPage() {
  const [user, setUser] = useState(null);
  const [searchCity, setSearchCity] = useState('');
  const [activeTab, setActiveTab] = useState('cities');

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: cities = [], isLoading } = useQuery({
    queryKey: ['cities'],
    queryFn: () => base44.entities.City.list()
  });

  const { data: userPredictions = [] } = useQuery({
    queryKey: ['user-predictions', user?.email],
    queryFn: () => base44.entities.Prediction.filter({ user_email: user?.email }),
    enabled: !!user?.email
  });

  const { data: allPredictions = [] } = useQuery({
    queryKey: ['all-predictions-count'],
    queryFn: () => base44.entities.Prediction.list('-created_date', 500)
  });

  // Compteur de prédictions par ville
  const predCountByCity = allPredictions.reduce((acc, p) => {
    if (p.city_id && p.prediction_type === 'winner') {
      acc[p.city_id] = (acc[p.city_id] || 0) + 1;
    }
    return acc;
  }, {});

  const filteredCities = cities.filter(c => 
    c.name.toLowerCase().includes(searchCity.toLowerCase()) ||
    c.region.toLowerCase().includes(searchCity.toLowerCase())
  );

  const predictedCityIds = new Set(userPredictions.filter(p => p.prediction_type === 'winner').map(p => p.city_id));

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="bg-[#034EA2] text-white">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-3 mb-2">
              <Target className="w-6 h-6 text-white/70" />
              <h1 className="text-3xl font-bold">Pronostiquez les municipales</h1>
            </div>
            <p className="text-white/65 text-sm max-w-2xl">
              Faites vos prédictions pour chaque ville · gagnez des points · comparez-vous avec la communauté
            </p>
          </motion.div>
        </div>
      </div>

      {/* Revision alert banner */}
      {user && (
        <div className="max-w-6xl mx-auto px-4 mt-4">
          <RevisionAlertBanner user={user} cities={cities} />
        </div>
      )}

      {/* Stats bar */}
      <div className="max-w-6xl mx-auto px-4 -mt-2 md:-mt-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 grid md:grid-cols-3 gap-4"
        >
          <div>
            <p className="text-xs text-slate-400">Villes pronostiquées</p>
            <p className="text-2xl font-bold text-[#034EA2]">{predictedCityIds.size}/{cities.length}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Prédictions actives</p>
            <p className="text-2xl font-bold text-slate-800">{userPredictions.filter(p => p.prediction_type === 'winner').length}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Points potentiels</p>
            <p className="text-2xl font-bold text-[#E1B530]">+{userPredictions.length * 10 || 0}</p>
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md">
            <TabsTrigger value="cities" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Villes
            </TabsTrigger>
            <TabsTrigger value="classement" className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Classements
            </TabsTrigger>
          </TabsList>

          {/* Tab: Cities */}
          <TabsContent value="cities" className="space-y-4 mt-6">
            <div className="max-w-xl">
              <Input
                placeholder="Rechercher une ville, région..."
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                className="w-full"
              />
            </div>

            {isLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl h-64 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCities.map(city => (
                  <CityPredictionCard 
                    key={city.id} 
                    city={city}
                    hasPredicted={predictedCityIds.has(city.id)}
                    predCount={predCountByCity[city.id] || 0}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Tab: Leaderboards */}
          <TabsContent value="classement" className="mt-6">
            <PredictionLeaderboard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}