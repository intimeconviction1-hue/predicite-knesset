import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Sparkles, BookOpen, HelpCircle, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LearningBoost({ userProgress }) {
  const learningCount = userProgress?.learning_moments_count || 0;
  const quizCount = userProgress?.quizzes_completed || 0;

  // Boost actif si quiz récent ou apprentissage récent
  const boostActive = quizCount > 0 || learningCount > 0;
  const boostMultiplier = boostActive ? Math.min(2.0, 1 + (quizCount * 0.1) + (learningCount * 0.05)) : 1.0;
  const boostPercent = Math.round((boostMultiplier - 1) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
    >
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#E1B530]" />
          <span className="font-semibold text-slate-800 text-sm">Multiplicateur d'apprentissage</span>
        </div>
        {boostActive && (
          <span className="text-xs font-bold text-[#E1B530] bg-[#E1B530]/10 px-2 py-0.5 rounded-full">
            ×{boostMultiplier.toFixed(1)}
          </span>
        )}
      </div>
      <div className="p-5">
      <div className="mb-3">

      <p className="text-sm text-slate-500">
        {boostActive 
          ? `Vos quiz complétés vous donnent ×${boostMultiplier.toFixed(1)} sur chaque prédiction.`
          : 'Complétez des quiz pour activer le multiplicateur de précision.'
        }
      </p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white rounded-xl p-3 text-center border border-slate-100">
          <HelpCircle className="w-5 h-5 text-[#034EA2] mx-auto mb-1" />
          <p className="text-lg font-bold text-slate-800">{quizCount}</p>
          <p className="text-xs text-slate-500">Quiz complétés</p>
        </div>
        <div className="bg-white rounded-xl p-3 text-center border border-slate-100">
          <BookOpen className="w-5 h-5 text-[#E1B530] mx-auto mb-1" />
          <p className="text-lg font-bold text-slate-800">{learningCount}</p>
          <p className="text-xs text-slate-500">Apprentissages</p>
        </div>
      </div>

      <div className="flex gap-2">
        <Link to={createPageUrl('Quiz')} className="flex-1">
          <Button size="sm" className="w-full bg-[#034EA2] hover:bg-[#034EA2]/90 text-xs gap-1.5">
            <HelpCircle className="w-3.5 h-3.5" />
            Quiz
          </Button>
        </Link>
        <Link to={createPageUrl('Learn')} className="flex-1">
          <Button size="sm" variant="outline" className="w-full text-xs border-slate-200 text-slate-600 gap-1.5">
            <BookOpen className="w-3.5 h-3.5" />
            Apprendre
          </Button>
        </Link>
      </div>
      </div>
    </motion.div>
  );
}