import React, { useState, useMemo, useEffect } from 'react';
import { base44 } from '@/api/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, CheckCircle2, XCircle } from 'lucide-react';

const CATEGORY_LABEL = { regles: 'Règles du jeu', historique: 'Historique', actualite: 'Actualité' };

export default function QuizWidget({ category, title }) {
  const [user, setUser] = useState(null);
  const [round, setRound] = useState(0);
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: questions = [] } = useQuery({
    queryKey: ['quiz-questions', category || 'all'],
    queryFn: () => base44.entities.QuizQuestion.filter(category ? { category } : {}),
  });

  const { data: answered = [] } = useQuery({
    queryKey: ['quiz-reponses', user?.email],
    queryFn: () => base44.entities.QuizReponse.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  const question = useMemo(() => {
    if (questions.length === 0) return null;
    const answeredIds = new Set(answered.map(a => a.question_id));
    const pool = questions.filter(q => !answeredIds.has(q.id));
    const source = pool.length > 0 ? pool : questions;
    return source[Math.floor(Math.random() * source.length)];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions, answered.length, round]);

  if (!question) return null;

  const handleSelect = async (idx) => {
    if (result) return;
    setSelected(idx);
    if (user) {
      try {
        const res = await base44.functions.invoke('submitQuizAnswer', { question_id: question.id, chosen_index: idx });
        setResult(res);
        queryClient.invalidateQueries({ queryKey: ['quiz-reponses', user.email] });
        queryClient.invalidateQueries({ queryKey: ['home-user-progress'] });
      } catch {
        setResult({ is_correct: idx === question.correct_index, correct_index: question.correct_index, explanation: question.explanation });
      }
    } else {
      setResult({ is_correct: idx === question.correct_index, correct_index: question.correct_index, explanation: question.explanation });
    }
  };

  const handleNext = () => { setSelected(null); setResult(null); setRound(r => r + 1); };

  return (
    <div className="rounded-2xl border p-5" style={{ background: 'var(--p-card)', borderColor: 'var(--p-border)' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4" style={{ color: 'var(--p-gold-text)' }} />
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--p-gold-text)' }}>
            {title || (category ? CATEGORY_LABEL[category] : 'Quiz éclair')}
          </span>
        </div>
        {user && <span className="text-[10px] font-semibold" style={{ color: 'var(--p-text-25)' }}>+10 pts si logué</span>}
      </div>

      <p className="text-sm font-semibold mb-4" style={{ color: 'var(--p-text)' }}>{question.question}</p>

      <div className="space-y-2">
        {question.choices.map((choice, idx) => {
          const isCorrectChoice = result && idx === result.correct_index;
          const isWrongSelected = result && selected === idx && !result.is_correct;
          return (
            <button
              key={idx}
              disabled={!!result}
              onClick={() => handleSelect(idx)}
              className="w-full text-left px-4 py-2.5 rounded-lg border text-sm transition-colors flex items-center justify-between gap-2"
              style={{
                borderColor: isCorrectChoice ? 'var(--p-green)' : isWrongSelected ? 'var(--p-red)' : 'var(--p-border)',
                background: isCorrectChoice ? 'rgba(34,197,94,0.08)' : isWrongSelected ? 'rgba(217,43,43,0.08)' : 'transparent',
                color: 'var(--p-text)',
                cursor: result ? 'default' : 'pointer',
              }}
            >
              <span>{choice}</span>
              {isCorrectChoice && <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--p-green)' }} />}
              {isWrongSelected && <XCircle className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--p-red)' }} />}
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="mt-4 pt-4 border-t text-xs space-y-2" style={{ borderColor: 'var(--p-border)' }}>
              {result.already_answered && <p style={{ color: 'var(--p-text-40)' }}>Déjà répondu précédemment — pas de points supplémentaires.</p>}
              {result.explanation && <p style={{ color: 'var(--p-text-60)' }}>{result.explanation}</p>}
              <button onClick={handleNext} className="text-xs font-semibold hover:opacity-80 transition-opacity" style={{ color: 'var(--p-blue)' }}>
                Question suivante →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
