import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, Brain, Trophy, Filter, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';

import QuizCard from '@/components/quiz/QuizCard';
import LearningMomentCard from '@/components/learning/LearningMomentCard';
import { toast } from 'sonner';

export default function QuizPage() {
  const [user, setUser] = useState(null);
  const [category, setCategory] = useState('all');
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [sessionScore, setSessionScore] = useState(0);
  const [answeredQuizzes, setAnsweredQuizzes] = useState(new Set());
  const [nextReady, setNextReady] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [learningMoment, setLearningMoment] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: quizzes = [], isLoading } = useQuery({
    queryKey: ['quizzes', category],
    queryFn: async () => {
      if (category === 'all') {
        return base44.entities.Quiz.list();
      }
      return base44.entities.Quiz.filter({ category });
    }
  });

  const { data: responses = [] } = useQuery({
    queryKey: ['quiz-responses', user?.email],
    queryFn: () => base44.entities.QuizResponse.filter({ user_email: user.email }),
    enabled: !!user?.email
  });

  const { data: userProgress } = useQuery({
    queryKey: ['user-progress', user?.email],
    queryFn: () => base44.entities.UserProgress.filter({ user_email: user.email }).then(res => res?.[0]),
    enabled: !!user?.email
  });

  const answeredIds = new Set(responses.map(r => r.quiz_id));
  // On garde la question courante visible même après avoir répondu — on la retire seulement au clic "Suivant"
  const unansweredQuizzes = quizzes.filter(q => !answeredIds.has(q.id));

  const saveResponse = useMutation({
    mutationFn: async ({ quizId, selectedAnswer, isCorrect, points, timeTaken }) => {
      if (!user?.email) return;
      
      await base44.entities.QuizResponse.create({
        user_email: user.email,
        quiz_id: quizId,
        selected_answer: selectedAnswer,
        is_correct: isCorrect,
        points_earned: points,
        time_taken_seconds: timeTaken || null
      });

      // Update user progress
      const progress = await base44.entities.UserProgress.filter({ user_email: user.email });
      if (progress[0]) {
        await base44.entities.UserProgress.update(progress[0].id, {
          quizzes_completed: (progress[0].quizzes_completed || 0) + 1,
          total_points: (progress[0].total_points || 0) + points,
          last_activity_date: new Date().toISOString().split('T')[0]
        });
      }

      // Update streak & check badges
      const extra = timeTaken && timeTaken < 10 ? { fast_quiz: true } : {};
      const res = await base44.functions.invoke('updateStreakAndBadges', { extra });

      // Learning moment
      if (isCorrect) {
        try {
          await base44.entities.LearningMoment.create({
            user_email: user.email,
            type: 'quiz',
            lesson_learned: `Quiz complété avec succès`,
            educational_summary: `En répondant correctement à ce quiz, vous avez renforcé votre connaissance des enjeux électoraux.`,
            key_takeaway: `Les quiz citoyens augmentent votre précision de pronostic sur les villes.`
          });
          await base44.entities.UserProgress.update(progress[0]?.id || '', {
            learning_moments_count: ((progress[0]?.learning_moments_count || 0) + 1)
          });
          return { ...res.data, show_learning: true };
        } catch {}
      }
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['quiz-responses']);
      queryClient.invalidateQueries(['user-progress']);
      if (data?.new_badges?.length > 0) {
        data.new_badges.forEach(badge => {
          toast.success(`🏅 Badge débloqué : ${badge.replace(/_/g, ' ')}`, { duration: 4000 });
        });
      }
      if (data?.show_learning) {
        setLearningMoment({
          type: 'quiz',
          educational_summary: 'En répondant correctement à ce quiz, vous renforcez votre analyse politique et augmentez votre score d\'apprentissage.',
          key_takeaway: 'Chaque quiz complété améliore votre indice citoyen (+5 pts sur le score d\'apprentissage).'
        });
      }
    }
  });

  const handleAnswer = async (quizId, selectedAnswer, isCorrect, points) => {
    setAnsweredQuizzes(prev => new Set([...prev, quizId]));
    if (isCorrect) {
      setSessionScore(prev => prev + points);
    }
    
    if (user?.email) {
      await saveResponse.mutateAsync({ quizId, selectedAnswer, isCorrect, points });
    }

    // Allow immediate navigation — explanation is readable inline
    setNextReady(true);
    setCountdown(0);
  };

  const handleNext = () => {
    setNextReady(false);
    setCountdown(0);
    setCurrentQuizIndex(prev => prev + 1);
  };

  const safeIndex = Math.min(currentQuizIndex, Math.max(0, unansweredQuizzes.length - 1));
  const currentQuiz = unansweredQuizzes[safeIndex];
  const progress = quizzes.length > 0 
    ? ((answeredIds.size + answeredQuizzes.size) / quizzes.length) * 100 
    : 0;

  const categories = [
    { value: 'all', label: 'Toutes' },
    { value: 'histoire', label: '📚 Histoire' },
    { value: 'institutions', label: '🏛️ Institutions' },
    { value: 'villes', label: '🏙️ Villes' },
    { value: 'candidats', label: '👤 Candidats' },
    { value: 'anecdotes', label: '💡 Anecdotes' }
  ];

  return (
    <div className="min-h-screen" style={{ background: '#050505' }}>
      {learningMoment && (
        <LearningMomentCard
          type="quiz"
          content={learningMoment}
          onClose={() => setLearningMoment(null)}
        />
      )}
      {/* Header */}
      <div className="bg-[#07122A] border-b border-white/10 text-white">
        <div className="max-w-4xl mx-auto px-4 py-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-3 mb-2">
              <Brain className="w-6 h-6 text-white/70" />
              <h1 className="text-2xl font-bold">Quiz citoyen</h1>
            </div>
            <p className="text-white/65 text-sm max-w-xl">
              Renforcez vos connaissances sur les municipales · chaque quiz complété augmente votre multiplicateur de prédictions
            </p>
          </motion.div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="max-w-4xl mx-auto px-4 -mt-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-white/10 p-4"
          style={{ background: 'rgba(255,255,255,0.04)' }}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-xs text-white/40">Score total</p>
                <p className="text-xl font-bold text-[#D4AF37]" style={{ fontFamily: "'JetBrains Mono',monospace" }}>{(userProgress?.total_points || 0) + sessionScore} pts</p>
              </div>
              <div>
                <p className="text-xs text-white/40">Quiz répondus</p>
                <p className="text-xl font-bold text-white" style={{ fontFamily: "'JetBrains Mono',monospace" }}>
                  {answeredIds.size + answeredQuizzes.size}<span className="text-white/30 font-normal text-sm">/{quizzes.length}</span>
                </p>
              </div>
              <div>
                <p className="text-xs text-white/40">Multiplicateur</p>
                <p className="text-xl font-bold text-[#D4AF37]" style={{ fontFamily: "'JetBrains Mono',monospace" }}>×{Math.min(2.0, 1 + ((answeredIds.size + answeredQuizzes.size) * 0.1)).toFixed(1)}</p>
              </div>
            </div>
            <div className="flex-1 max-w-xs">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-white/40">Progression</span>
                <span className="font-medium text-[#D4AF37]">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-1.5" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="w-4 h-4 text-white/30" />
          <span className="text-sm text-white/50">Catégorie:</span>
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <Button
                key={cat.value}
                variant={category === cat.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setCategory(cat.value);
                  setCurrentQuizIndex(0);
                }}
                className={category === cat.value ? 'bg-[#034EA2]' : ''}
              >
                {cat.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Quiz content */}
      <div className="max-w-2xl mx-auto px-4 pb-12">
        {isLoading ? (
          <div className="bg-white rounded-2xl h-96 animate-pulse" />
        ) : unansweredQuizzes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-8 text-center text-white"
          >
            <Trophy className="w-16 h-16 mx-auto mb-4 text-yellow-300" />
            <h2 className="text-2xl font-bold mb-2">Félicitations ! 🎉</h2>
            <p className="text-white/90 mb-6">
              Vous avez répondu à tous les quiz de cette catégorie !
            </p>
            {category !== 'all' && (
              <Button 
                onClick={() => setCategory('all')}
                className="bg-white text-emerald-600 hover:bg-white/90"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Voir tous les quiz
              </Button>
            )}
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuiz?.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
            >
              <QuizCard 
                quiz={currentQuiz}
                onAnswer={handleAnswer}
              />
              
              {answeredQuizzes.has(currentQuiz?.id) && safeIndex < unansweredQuizzes.length - 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4"
                >
                  <Button
                    onClick={handleNext}
                    disabled={!nextReady}
                    className="w-full bg-[#034EA2] hover:bg-[#023b7a] disabled:opacity-60"
                  >
                    {nextReady ? (
                      <>Question suivante <ChevronRight className="w-4 h-4 ml-2" /></>
                    ) : (
                      <>Lisez l'explication… ({countdown}s)</>
                    )}
                  </Button>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Quiz navigation dots */}
        {unansweredQuizzes.length > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            {unansweredQuizzes.slice(0, 10).map((q, i) => (
              <button
                key={q.id}
                onClick={() => setCurrentQuizIndex(i)}
                className={`w-3 h-3 rounded-full transition-all ${
                  i === safeIndex 
                    ? 'bg-[#034EA2] scale-125' 
                    : answeredQuizzes.has(q.id)
                    ? 'bg-green-400'
                    : 'bg-slate-300'
                }`}
              />
            ))}
            {unansweredQuizzes.length > 10 && (
              <span className="text-slate-400 text-sm">+{unansweredQuizzes.length - 10}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}