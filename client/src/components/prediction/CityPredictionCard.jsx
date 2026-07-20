import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { MapPin, TrendingUp, Users, Zap, CheckCircle, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TensionIndex from '@/components/tension/TensionIndex.jsx';
import SurveyTrendline from './SurveyTrendline.jsx';
import PredictionForm from './PredictionForm.jsx';
import LoginPromptModal from '@/components/shared/LoginPromptModal.jsx';
import RevisionAlert from './RevisionAlert.jsx';

export default function CityPredictionCard({ city, hasPredicted, predCount = 0 }) {
  const [showPredictionForm, setShowPredictionForm] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(undefined);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => setCurrentUser(null));
  }, []);

  const handlePredictClick = () => {
    // Zero auth: on ouvre le formulaire même sans compte (l'invite se fait après soumission)
    setShowPredictionForm(true);
  };

  const { data: latestSurvey } = useQuery({
    queryKey: ['city-survey', city.id],
    queryFn: async () => {
      const surveys = await base44.entities.CitySurvey.filter({ city_id: city.id });
      return surveys.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    }
  });

  const { data: userPredictions = [] } = useQuery({
    queryKey: ['city-predictions', city.id],
    queryFn: async () => {
      const user = await base44.auth.me();
      if (!user) return [];
      return base44.entities.Prediction.filter({ 
        user_email: user.email,
        city_id: city.id,
        prediction_type: 'winner'
      });
    }
  });

  const userWinnerPrediction = userPredictions[0];

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow"
      >
        {/* City header with image */}
        <div className="relative h-32 bg-gradient-to-b from-slate-200 to-slate-100 overflow-hidden">
          {city.image_url && (
            <img 
              src={city.image_url} 
              alt={city.name}
              className="w-full h-full object-cover opacity-70"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          <div className="absolute bottom-3 left-3 right-3">
            <h3 className="text-white font-bold text-lg">{city.name}</h3>
            <p className="text-white/70 text-xs">{city.region}</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Tension Index */}
          {latestSurvey && (
            <TensionIndex survey={latestSurvey} city={city} compact />
          )}

          {/* Survey trend for top candidate */}
          {latestSurvey?.candidates && latestSurvey.candidates.length > 0 && (
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-4 h-4 text-slate-500" />
                <p className="text-xs font-semibold text-slate-600">
                  Tendance · {latestSurvey.candidates[0].name}
                </p>
              </div>
              <SurveyTrendline city={city} candidateName={latestSurvey.candidates[0].name} />
            </div>
          )}

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="bg-slate-50 rounded-lg p-2">
              <p className="text-slate-400">Population</p>
              <p className="font-semibold text-slate-800">{(city.population / 1000).toFixed(0)}K</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-2">
              <p className="text-slate-400">Maire</p>
              <p className="font-semibold text-slate-800 truncate">{city.current_mayor || '—'}</p>
            </div>
            <div className="bg-[#034EA2]/5 rounded-lg p-2 border border-[#034EA2]/10">
              <p className="text-slate-400">Pronostics</p>
              <p className="font-semibold text-[#034EA2]">{predCount}</p>
            </div>
          </div>

          {/* Prediction status */}
          {userWinnerPrediction ? (
            <div className="space-y-2">
              <div className={`border rounded-lg p-3 flex items-start gap-2 ${
                userWinnerPrediction.needs_revision
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-green-50 border-green-200'
              }`}>
                <CheckCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${userWinnerPrediction.needs_revision ? 'text-amber-500' : 'text-green-600'}`} />
                <div className="text-xs">
                  <p className={`font-semibold ${userWinnerPrediction.needs_revision ? 'text-amber-700' : 'text-green-700'}`}>
                    Pronostic enregistré
                  </p>
                  <p className={userWinnerPrediction.needs_revision ? 'text-amber-600' : 'text-green-600'}>
                    Gagnant : <strong>{userWinnerPrediction.predicted_winner}</strong>
                  </p>
                </div>
              </div>
              {userWinnerPrediction.needs_revision && (
                <RevisionAlert
                  prediction={userWinnerPrediction}
                  cityName={city.name}
                  citySlug={city.slug}
                />
              )}
            </div>
          ) : (
            <Button
              onClick={handlePredictClick}
              className="w-full bg-[#034EA2] hover:bg-[#023b7a] text-sm"
            >
              <Zap className="w-3.5 h-3.5 mr-1.5" />
              Jouer
            </Button>
          )}
        </div>
      </motion.div>

      {/* Login Prompt Modal */}
      <LoginPromptModal
        open={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        message="Créez un compte pour enregistrer votre anticipation et rejoindre le classement."
      />

      {/* Prediction Form Modal */}
      {showPredictionForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-white border-b border-slate-100 p-4 flex items-center justify-between">
              <h2 className="font-bold text-slate-800">{city.name}</h2>
              <button
                onClick={() => setShowPredictionForm(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              <PredictionForm
                city={city}
                onSubmit={() => setShowPredictionForm(false)}
                existingPredictions={userPredictions}
              />
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}