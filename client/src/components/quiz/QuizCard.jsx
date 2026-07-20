import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, HelpCircle, ChevronDown, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function QuizCard({ quiz, onAnswer, alreadyAnswered = false, onNext }) {
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(alreadyAnswered);
  const [isCorrect, setIsCorrect] = useState(null);
  const [showFullExplanation, setShowFullExplanation] = useState(false);

  const difficultyColors = {
    facile: 'bg-green-100 text-green-700',
    moyen: 'bg-yellow-100 text-yellow-700',
    difficile: 'bg-red-100 text-red-700'
  };

  // Extract first sentence as short explanation
  const shortExplanation = quiz.explanation
    ? quiz.explanation.split(/[.!?]/)[0].trim() + '.'
    : null;
  const hasLongExplanation = quiz.explanation && quiz.explanation.length > (shortExplanation?.length || 0) + 5;

  const handleAnswer = (index) => {
    if (showResult) return;
    setSelectedAnswer(index);
  };

  const handleSubmit = async () => {
    if (selectedAnswer === null) return;
    const correct = selectedAnswer === quiz.correct_answer;
    setIsCorrect(correct);
    setShowResult(true);
    if (onAnswer) {
      await onAnswer(quiz.id, selectedAnswer, correct, correct ? (quiz.points || 10) : 0);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/10 overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.04)' }}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-white/8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-white/40" />
          <Badge className={`${difficultyColors[quiz.difficulty || 'moyen']} border-0 text-xs`}>
            {quiz.difficulty || 'moyen'}
          </Badge>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/25">
          <Award className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span className="text-[#D4AF37] font-bold text-xs">+{quiz.points || 10} pts</span>
        </div>
      </div>

      <div className="p-5">
        {/* Question */}
        <h3 className="text-base font-semibold text-white mb-5 leading-snug">{quiz.question}</h3>

        {/* Options */}
        <div className="space-y-2.5 mb-5">
          {quiz.options?.map((option, index) => (
            <motion.button
              key={index}
              whileHover={!showResult ? { scale: 1.005 } : {}}
              whileTap={!showResult ? { scale: 0.995 } : {}}
              onClick={() => handleAnswer(index)}
              disabled={showResult}
              className={`w-full p-3.5 rounded-xl border-2 text-left transition-all text-sm font-medium ${
                showResult
                  ? index === quiz.correct_answer
                    ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300'
                    : selectedAnswer === index
                    ? 'border-red-500 bg-red-500/15 text-red-300'
                    : 'border-white/8 text-white/30'
                  : selectedAnswer === index
                  ? 'border-[#D4AF37]/60 bg-[#D4AF37]/10 text-white'
                  : 'border-white/10 hover:border-white/25 hover:bg-white/5 text-white/80'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span>{option}</span>
                {showResult && index === quiz.correct_answer && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                )}
                {showResult && selectedAnswer === index && index !== quiz.correct_answer && (
                  <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                )}
              </div>
            </motion.button>
          ))}
        </div>

        {/* Result feedback — compact */}
        <AnimatePresence>
          {showResult && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 space-y-2"
            >
              {/* Verdict line */}
              <div className={`flex items-start gap-2.5 px-4 py-3 rounded-xl border ${
                isCorrect
                  ? 'border-emerald-500/30 bg-emerald-500/10'
                  : 'border-red-500/30 bg-red-500/10'
              }`}>
                <span className="text-lg shrink-0">{isCorrect ? '✅' : '❌'}</span>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-sm ${isCorrect ? 'text-emerald-300' : 'text-red-300'}`}>
                    {isCorrect
                      ? `Bonne réponse ! +${quiz.points || 10} points`
                      : `Mauvaise réponse — bonne : ${quiz.options?.[quiz.correct_answer]}`}
                  </p>
                  {/* Short explanation — always visible */}
                  {shortExplanation && (
                    <p className="text-white/55 text-xs mt-1 leading-relaxed">{shortExplanation}</p>
                  )}
                </div>
              </div>

              {/* "En savoir plus" expandable */}
              {hasLongExplanation && (
                <div>
                  <button
                    onClick={() => setShowFullExplanation(v => !v)}
                    className="flex items-center gap-1.5 text-[#D4AF37]/80 hover:text-[#D4AF37] text-xs font-medium transition-colors"
                  >
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFullExplanation ? 'rotate-180' : ''}`} />
                    {showFullExplanation ? 'Réduire' : 'En savoir plus'}
                  </button>
                  <AnimatePresence>
                    {showFullExplanation && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-2 px-3 py-2.5 rounded-lg bg-white/5 border border-white/8">
                          <p className="text-white/60 text-xs leading-relaxed">{quiz.explanation}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action buttons */}
        {!showResult ? (
          <Button
            onClick={handleSubmit}
            disabled={selectedAnswer === null}
            className="w-full font-bold text-sm"
            style={{ background: '#1E3A8A', color: '#F5F2ED' }}
          >
            Valider ma réponse
          </Button>
        ) : onNext ? (
          <Button
            onClick={onNext}
            className="w-full bg-[#034EA2] hover:bg-[#023b7a] flex items-center justify-center gap-2 text-sm font-bold"
          >
            Question suivante →
          </Button>
        ) : null}
      </div>
    </motion.div>
  );
}