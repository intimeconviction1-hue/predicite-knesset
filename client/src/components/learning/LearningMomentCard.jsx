import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, CheckCircle, BookOpen, Lock } from 'lucide-react';

const COUNTDOWN_SECS = 8;

const TYPE_CONFIG = {
  quiz:       { icon: '❓', title: "Ce que vous venez d'apprendre", accent: '#A78BFA' },
  prediction: { icon: '🎯', title: 'Prédiction & apprentissage',    accent: '#4A7FD4' },
  challenge:  { icon: '⚡', title: 'Défi complété — Leçon clé',     accent: '#E07B1A' },
  survey:     { icon: '📊', title: 'Résultats du sondage',           accent: '#22C55E' },
  default:    { icon: '💡', title: "Moment d'apprentissage",         accent: '#D4AF37' },
};

export default function LearningMomentCard({ type, content, onClose }) {
  const [secs, setSecs] = useState(COUNTDOWN_SECS);
  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.default;

  useEffect(() => {
    if (secs <= 0) return;
    const id = setTimeout(() => setSecs(s => s - 1), 1000);
    return () => clearTimeout(id);
  }, [secs]);

  const canClose = secs <= 0;
  const progress = ((COUNTDOWN_SECS - secs) / COUNTDOWN_SECS) * 100;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(3,5,12,0.82)', backdropFilter: 'blur(12px)' }}
    >
      <motion.div
        initial={{ scale: 1.15, opacity: 0, filter: 'blur(6px)' }}
        animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
        exit={{ scale: 0.92, opacity: 0 }}
        transition={{ duration: 0.38, ease: 'easeOut' }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-xl rounded-3xl border border-white/10 overflow-hidden"
        style={{ background: 'linear-gradient(160deg,#0A1628,#060D1F)', boxShadow: '0 0 80px rgba(0,0,0,0.7)' }}
      >
        {/* Progress bar */}
        <div className="h-0.5 bg-white/8 w-full">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: cfg.accent }}
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.9, ease: 'linear' }}
          />
        </div>

        <div className="p-7">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0"
              style={{ background: `${cfg.accent}18`, border: `1px solid ${cfg.accent}30` }}
            >
              {cfg.icon}
            </div>
            <div>
              <motion.h3
                initial={{ scale: 1.3, opacity: 0, filter: 'blur(4px)' }}
                animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
                transition={{ duration: 0.35, ease: 'easeOut', delay: 0.1 }}
                className="text-xl font-bold"
                style={{ color: '#F5F2ED', fontFamily: "'Space Grotesk','Inter',sans-serif" }}
              >
                {cfg.title}
              </motion.h3>
              <p className="text-white/35 text-xs mt-0.5">Jouer = Apprendre · chaque action compte</p>
            </div>
          </div>

          {/* Sections */}
          <div className="space-y-3">
            {content?.educational_summary && (
              <div className="rounded-2xl p-4 border border-white/8" style={{ background: 'rgba(74,127,212,0.08)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="w-4 h-4" style={{ color: '#4A7FD4' }} />
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#4A7FD4' }}>Contexte</span>
                </div>
                <p className="text-white/65 text-sm leading-relaxed">{content.educational_summary}</p>
              </div>
            )}

            {content?.key_takeaway && (
              <div className="rounded-2xl p-4 border" style={{ background: 'rgba(212,175,55,0.07)', borderColor: 'rgba(212,175,55,0.2)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="w-4 h-4" style={{ color: '#D4AF37' }} />
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#D4AF37' }}>À retenir</span>
                </div>
                <p className="text-white/80 text-sm font-medium leading-relaxed">{content.key_takeaway}</p>
              </div>
            )}

            {content?.lesson_learned && !content?.key_takeaway && (
              <div className="rounded-2xl p-4 border border-white/8" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <p className="text-white/65 text-sm leading-relaxed">{content.lesson_learned}</p>
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="mt-6">
            <motion.button
              whileHover={canClose ? { scale: 1.02 } : {}}
              whileTap={canClose ? { scale: 0.98 } : {}}
              onClick={canClose ? onClose : undefined}
              disabled={!canClose}
              className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
              style={{
                background: canClose ? '#1E3A8A' : 'rgba(255,255,255,0.06)',
                color: canClose ? '#F5F2ED' : 'rgba(255,255,255,0.3)',
                cursor: canClose ? 'pointer' : 'not-allowed',
                border: canClose ? 'none' : '1px solid rgba(255,255,255,0.1)',
              }}
            >
              {canClose ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  J'ai compris !
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  Lecture obligatoire · {secs}s
                </>
              )}
            </motion.button>
            <p className="text-center text-[10px] text-white/20 mt-3">
              Vos apprentissages sont sauvegardés dans votre profil
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}