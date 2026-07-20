import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Target, BookOpen, BarChart3 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function CityExpertiseIndex({ city, userProgress, predictions = [], quizResponses = [] }) {
  // Calcul de l'indice d'expertise pour cette ville
  const cityPredictions = predictions.filter(p => p.city_id === city?.id);
  const cityQuizzes = quizResponses.filter(q => q.city_id === city?.id);
  const cityMastered = (userProgress?.cities_mastered || []).includes(city?.id);

  const predScore = Math.min(40, cityPredictions.length * 10);
  const quizScore = Math.min(30, cityQuizzes.length * 10);
  const learningScore = cityMastered ? 30 : 0;
  const totalScore = predScore + quizScore + learningScore;

  const getLevel = (score) => {
    if (score >= 80) return { label: 'Expert', color: 'text-emerald-600', bg: 'bg-emerald-50', barColor: 'bg-emerald-500' };
    if (score >= 50) return { label: 'Confirmé', color: 'text-[#034EA2]', bg: 'bg-blue-50', barColor: 'bg-[#034EA2]' };
    if (score >= 20) return { label: 'Initié', color: 'text-[#E1B530]', bg: 'bg-amber-50', barColor: 'bg-[#E1B530]' };
    return { label: 'Découverte', color: 'text-slate-500', bg: 'bg-slate-50', barColor: 'bg-slate-400' };
  };

  const level = getLevel(totalScore);

  const dimensions = [
    { icon: Target, label: 'Prédictions', value: predScore, max: 40, detail: `${cityPredictions.length} prédiction(s)` },
    { icon: BookOpen, label: 'Quiz', value: quizScore, max: 30, detail: `${cityQuizzes.length} quiz répondu(s)` },
    { icon: BarChart3, label: 'Apprentissage', value: learningScore, max: 30, detail: cityMastered ? 'Ville maîtrisée' : 'À explorer' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-[#034EA2]" />
          <h3 className="font-bold text-slate-800">Votre expertise — {city?.name}</h3>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${level.bg} ${level.color}`}>
          {level.label}
        </span>
      </div>

      <div className="mb-4">
        <div className="flex items-end justify-between mb-1.5">
          <span className="text-sm text-slate-500">Indice global</span>
          <span className="text-2xl font-bold text-slate-800">{totalScore}<span className="text-sm text-slate-400">/100</span></span>
        </div>
        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }} 
            animate={{ width: `${totalScore}%` }}
            transition={{ duration: 0.8 }}
            className={`h-full rounded-full ${level.barColor}`}
          />
        </div>
      </div>

      <div className="space-y-3">
        {dimensions.map((dim, idx) => (
          <div key={idx} className="flex items-center gap-3">
            <dim.icon className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <div className="flex-1">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-600">{dim.label}</span>
                <span className="text-slate-400">{dim.detail}</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${level.barColor}`} 
                  style={{ width: `${(dim.value / dim.max) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}