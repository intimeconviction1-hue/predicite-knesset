import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { CheckCircle, BookOpen, Target, TrendingUp, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PredictionFeedback({ city, predictions, onClose }) {
  const hasWinner = predictions.some(p => p.prediction_type === 'winner');
  const hasTurnout = predictions.some(p => p.prediction_type === 'turnout');

  const tips = [];
  if (hasWinner) {
    tips.push({
      icon: BookOpen,
      text: `Découvrez l'histoire politique de ${city.name} pour affiner vos prédictions.`,
      link: `/city/${city.slug}`,
      linkLabel: 'Explorer'
    });
  }
  if (hasTurnout) {
    tips.push({
      icon: TrendingUp,
      text: 'La participation moyenne aux municipales est de ~50%. Comparez avec les sondages.',
      link: createPageUrl('Surveys'),
      linkLabel: 'Sondages'
    });
  }
  tips.push({
    icon: Target,
    text: 'Complétez un quiz pour gagner un boost de +20% sur vos prochains points.',
    link: createPageUrl('Quiz'),
    linkLabel: 'Quiz'
  });

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden"
    >
      <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-5 text-center">
        <CheckCircle className="w-10 h-10 text-white mx-auto mb-2" />
        <h3 className="text-white font-bold text-lg">Prédictions enregistrées !</h3>
        <p className="text-white/80 text-sm mt-1">
          +{predictions.length * 10} points gagnés
        </p>
      </div>

      <div className="p-5 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-[#E1B530]" />
          <span className="text-sm font-semibold text-slate-700">Pour aller plus loin</span>
        </div>

        {tips.map((tip, idx) => (
          <div key={idx} className="flex items-start gap-3 bg-slate-50 rounded-xl p-3">
            <tip.icon className="w-5 h-5 text-[#034EA2] mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-slate-600">{tip.text}</p>
              <Link to={tip.link} className="text-xs text-[#034EA2] font-medium flex items-center gap-1 mt-1 hover:underline">
                {tip.linkLabel} <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div className="px-5 pb-5">
        <Button onClick={onClose} variant="outline" className="w-full">
          Fermer
        </Button>
      </div>
    </motion.div>
  );
}