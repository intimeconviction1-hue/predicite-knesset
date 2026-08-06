import React, { useState, useMemo, useEffect } from 'react';
import { base44 } from '@/api/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, CheckCircle2, XCircle, Sparkles } from 'lucide-react';
import ConfettiBurst from '@/components/knesset/ConfettiBurst';

// Niveaux : mêmes points que le barème serveur (quizScoring.js).
const NIVEAUX = [
  { key: 'decouverte', label: 'Découverte', pts: 10, color: 'var(--p-green-text)' },
  { key: 'connaisseur', label: 'Connaisseur', pts: 25, color: 'var(--p-blue)' },
  { key: 'expert', label: 'Expert', pts: 50, color: 'var(--p-gold-text)' },
];

export default function QuizWidget({ theme, title }) {
  const [user, setUser] = useState(null);
  const [round, setRound] = useState(0);
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState(null);
  const [difficulte, setDifficulte] = useState('connaisseur');
  const [celebrate, setCelebrate] = useState(0);
  const queryClient = useQueryClient();

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: questions = [] } = useQuery({
    queryKey: ['quiz-questions', theme || 'all'],
    queryFn: () => base44.entities.QuizQuestion.filter(theme ? { theme } : {}),
  });

  const { data: answered = [] } = useQuery({
    queryKey: ['quiz-reponses', user?.email],
    queryFn: () => base44.entities.QuizReponse.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  const niveau = NIVEAUX.find(n => n.key === difficulte) || NIVEAUX[1];

  const question = useMemo(() => {
    const atLevel = questions.filter(q => (q.difficulte || 'connaisseur') === difficulte);
    if (atLevel.length === 0) return null;
    const answeredIds = new Set(answered.map(a => a.question_id));
    const pool = atLevel.filter(q => !answeredIds.has(q.id));
    const source = pool.length > 0 ? pool : atLevel;
    return source[Math.floor(Math.random() * source.length)];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions, answered.length, round, difficulte]);

  // Aucune question du tout pour cette catégorie : le widget s'efface.
  if (questions.length === 0) return null;

  const changeNiveau = (key) => { setDifficulte(key); setSelected(null); setResult(null); setRound(r => r + 1); };

  const handleSelect = async (idx) => {
    if (result || !question) return;
    setSelected(idx);
    if (user) {
      try {
        const res = await base44.functions.invoke('submitQuizAnswer', { question_id: question.id, chosen_index: idx });
        setResult(res);
        if (res?.is_correct) setCelebrate(c => c + 1);
        queryClient.invalidateQueries({ queryKey: ['quiz-reponses', user.email] });
        queryClient.invalidateQueries({ queryKey: ['home-user-progress'] });
        queryClient.invalidateQueries({ queryKey: ['defi-serie'] });
      } catch {
        const ok = idx === question.correct_index;
        setResult({ is_correct: ok, correct_index: question.correct_index, explanation: question.explanation });
        if (ok) setCelebrate(c => c + 1);
      }
    } else {
      const ok = idx === question.correct_index;
      setResult({ is_correct: ok, correct_index: question.correct_index, explanation: question.explanation });
      if (ok) setCelebrate(c => c + 1);
    }
  };

  const handleNext = () => { setSelected(null); setResult(null); setRound(r => r + 1); };
  const gained = result?.points_earned ?? niveau.pts;

  return (
    <div className="rounded-2xl border p-5" style={{ background: 'var(--p-card)', borderColor: 'var(--p-border)' }}>
      <ConfettiBurst trigger={celebrate} />
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4" style={{ color: 'var(--p-gold-text)' }} />
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--p-gold-text)' }}>
            {title || 'Quiz éclair'}
          </span>
        </div>
        <span className="text-[10px] font-semibold" style={{ color: 'var(--p-text-25)' }}>+{niveau.pts} pts{user ? '' : ' si logué'}</span>
      </div>

      {/* Sélecteur de difficulté */}
      <div className="flex gap-1.5 mb-4">
        {NIVEAUX.map(n => {
          const active = n.key === difficulte;
          return (
            <button
              key={n.key} onClick={() => changeNiveau(n.key)}
              className="flex-1 rounded-lg py-1.5 text-[11px] font-bold transition-colors"
              style={{
                background: active ? n.color : 'transparent',
                color: active ? '#fff' : 'var(--p-text-40)',
                border: `0.5px solid ${active ? n.color : 'var(--p-border)'}`,
              }}
            >
              {n.label} <span style={{ opacity: 0.8 }}>+{n.pts}</span>
            </button>
          );
        })}
      </div>

      {!question ? (
        <p className="text-sm py-4 text-center" style={{ color: 'var(--p-text-40)' }}>
          Pas encore de question <b style={{ color: niveau.color }}>{niveau.label}</b> ici — d'autres niveaux sont dispo, ou reviens bientôt.
        </p>
      ) : (
        <>
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
                  {isCorrectChoice && <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--p-green-text)' }} />}
                  {isWrongSelected && <XCircle className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--p-red)' }} />}
                </button>
              );
            })}
          </div>

          <AnimatePresence>
            {result && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="mt-4 pt-4 border-t text-xs space-y-2" style={{ borderColor: 'var(--p-border)' }}>
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 font-bold"
                    style={{
                      background: result.is_correct ? 'rgba(34,197,94,0.1)' : 'rgba(217,43,43,0.08)',
                      color: result.is_correct ? 'var(--p-green)' : 'var(--p-red)',
                    }}
                  >
                    {result.is_correct ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    <span>{result.is_correct ? 'Bonne réponse !' : 'Pas tout à fait'}</span>
                    {result.is_correct && user && !result.already_answered && (
                      <span className="ml-auto flex items-center gap-1 text-xs" style={{ color: 'var(--p-gold-text)' }}>
                        <Sparkles className="w-3.5 h-3.5" /> +{gained} pts
                      </span>
                    )}
                  </motion.div>
                  {result.defi && (
                    <div className="rounded-lg px-3 py-2 font-semibold flex items-center gap-2" style={{
                      background: result.defi.defi === 'gagne' ? 'var(--p-gold-dim)' : result.defi.defi === 'perdu' ? 'rgba(217,43,43,0.08)' : 'var(--p-blue-dim)',
                      color: result.defi.defi === 'gagne' ? 'var(--p-gold-text)' : result.defi.defi === 'perdu' ? 'var(--p-red)' : 'var(--p-blue)',
                    }}>
                      {result.defi.defi === 'gagne' && `🔥 Défi série réussi ! +${result.defi.gain} jetons`}
                      {result.defi.defi === 'perdu' && 'Défi série perdu — la série est interrompue.'}
                      {result.defi.defi === 'en_cours' && `Défi série : ${result.defi.progres}/${result.defi.objectif} bonnes réponses`}
                    </div>
                  )}
                  {result.already_answered && <p style={{ color: 'var(--p-text-40)' }}>Déjà répondu précédemment — pas de points supplémentaires.</p>}
                  {!user && <p style={{ color: 'var(--p-text-40)' }}>Connecte-toi pour gagner des points d'apprentissage à chaque bonne réponse.</p>}
                  {result.explanation && <p style={{ color: 'var(--p-text-60)' }}>{result.explanation}</p>}
                  <button onClick={handleNext} className="text-xs font-semibold hover:opacity-80 transition-opacity" style={{ color: 'var(--p-blue)' }}>
                    Question suivante →
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
