import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ChevronDown, ArrowRight, RotateCcw, History, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/client';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Badge de révision avec niveau de criticité (minor/major/critical).
 * Couleurs : critical=rouge, major=orange, minor=jaune.
 */

const LEVEL_STYLES = {
  critical: {
    border: 'border-red-500/40',
    bg: 'bg-red-900/20',
    headerHover: 'hover:bg-red-900/15',
    badge: 'text-red-400',
    badgeBg: 'bg-red-500/15',
    text: 'text-red-300',
    textMuted: 'text-red-200/50',
    ctaPrimary: 'bg-red-500 hover:bg-red-400 text-white',
    ctaSecondary: 'bg-white/8 hover:bg-white/12 text-red-200 border border-red-500/25',
    dot: 'bg-red-500/60',
    divider: 'border-red-500/15',
    label: 'CRITIQUE',
  },
  major: {
    border: 'border-orange-500/40',
    bg: 'bg-orange-900/20',
    headerHover: 'hover:bg-orange-900/15',
    badge: 'text-orange-400',
    badgeBg: 'bg-orange-500/15',
    text: 'text-orange-300',
    textMuted: 'text-orange-200/50',
    ctaPrimary: 'bg-orange-500 hover:bg-orange-400 text-white',
    ctaSecondary: 'bg-white/8 hover:bg-white/12 text-orange-200 border border-orange-500/25',
    dot: 'bg-orange-500/60',
    divider: 'border-orange-500/15',
    label: 'IMPORTANT',
  },
  minor: {
    border: 'border-amber-500/40',
    bg: 'bg-amber-900/20',
    headerHover: 'hover:bg-amber-900/15',
    badge: 'text-amber-400',
    badgeBg: 'bg-amber-500/15',
    text: 'text-amber-300',
    textMuted: 'text-amber-200/50',
    ctaPrimary: 'bg-amber-500 hover:bg-amber-400 text-[#07122A]',
    ctaSecondary: 'bg-white/8 hover:bg-white/12 text-amber-200 border border-amber-500/25',
    dot: 'bg-amber-500/50',
    divider: 'border-amber-500/15',
    label: 'À VÉRIFIER',
  },
};

export default function RevisionAlert({ prediction, cityName, citySlug, onDismiss }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  if (!prediction?.needs_revision) return null;

  const level = prediction.revision_level || 'minor';
  const styles = LEVEL_STYLES[level] || LEVEL_STYLES.minor;
  const history = prediction.revision_history || [];
  const flaggedAt = prediction.revision_flagged_at
    ? new Date(prediction.revision_flagged_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    : null;
  const expiresAt = prediction.revision_expires_at
    ? new Date(prediction.revision_expires_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
    : null;

  const handleDismiss = async () => {
    await base44.entities.Prediction.update(prediction.id, {
      needs_revision: false,
      revision_history: [
        ...(prediction.revision_history || []).slice(-9),
        {
          revised_at: new Date().toISOString(),
          signal_id: prediction.revision_signal_id,
          signal_type: null,
          revision_level: level,
          old_value: prediction.predicted_winner || null,
          new_value: null,
          signal_title: prediction.revision_reason,
          action_user: 'ignored'
        }
      ].slice(-10)
    });
    queryClient.invalidateQueries({ queryKey: ['city-predictions'] });
    queryClient.invalidateQueries({ queryKey: ['flagged-predictions'] });
    if (onDismiss) onDismiss();
  };

  return (
    <div className={`rounded-xl border ${styles.border} ${styles.bg} overflow-hidden`}>
      {/* Header */}
      <button
        onClick={() => setOpen(v => !v)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 text-left ${styles.headerHover} transition-colors`}
      >
        <div className={`w-6 h-6 rounded-md ${styles.badgeBg} flex items-center justify-center flex-shrink-0`}>
          <AlertTriangle className={`w-3 h-3 ${styles.badge}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className={`text-[9px] font-black uppercase tracking-widest ${styles.badge}`}>{styles.label}</span>
          </div>
          <p className={`${styles.text} text-[11px] font-semibold truncate`}>
            Votre prédiction mérite une révision
          </p>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 ${styles.badge} flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Panneau détail */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className={`px-3 pb-3 space-y-3 border-t ${styles.divider} pt-3`}>
              {/* Contexte */}
              {prediction.revision_reason && (
                <p className={`${styles.textMuted} text-[11px] leading-relaxed`}>
                  Signal déclencheur : <strong className={styles.text}>« {prediction.revision_reason} »</strong>
                  {flaggedAt && <span className="opacity-50 ml-1">— {flaggedAt}</span>}
                  {expiresAt && <span className="opacity-40 ml-1">· expire le {expiresAt}</span>}
                </p>
              )}

              {/* CTAs */}
              <div className="flex flex-wrap gap-2">
                <Link
                  to={`${createPageUrl('City')}?slug=${citySlug}`}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${styles.ctaPrimary}`}
                >
                  Voir pourquoi
                  <ArrowRight className="w-3 h-3" />
                </Link>
                <Link
                  to={createPageUrl('Predictions')}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors ${styles.ctaSecondary}`}
                >
                  <RotateCcw className="w-3 h-3" />
                  Réviser ma prédiction
                </Link>
                <button
                  onClick={handleDismiss}
                  className={`inline-flex items-center gap-1 px-2 py-1.5 rounded-lg ${styles.textMuted} hover:opacity-80 text-[10px] transition-colors ml-auto`}
                >
                  <X className="w-2.5 h-2.5" /> Ignorer
                </button>
              </div>

              {/* Historique */}
              {history.length > 0 && (
                <div>
                  <div className={`flex items-center gap-1.5 text-[9px] ${styles.textMuted} uppercase tracking-wider mb-1.5`}>
                    <History className="w-2.5 h-2.5" />
                    Historique des révisions
                  </div>
                  <div className="space-y-1">
                    {history.slice(-4).map((h, i) => (
                      <div key={i} className="flex items-start gap-2 text-[10px]">
                        <div className={`w-1 h-1 rounded-full ${styles.dot} mt-1.5 flex-shrink-0`} />
                        <div className={`${styles.textMuted} leading-snug`}>
                          {h.revised_at && (
                            <span className="opacity-50 mr-1">
                              {new Date(h.revised_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                            </span>
                          )}
                          {h.revision_level && (
                            <span className="opacity-60 mr-1 uppercase text-[9px]">[{h.revision_level}]</span>
                          )}
                          {h.action_user === 'ignored'
                            ? <span className="opacity-50 italic">Ignoré par l'utilisateur</span>
                            : h.old_value && h.new_value
                              ? <span><span className="line-through opacity-40">{h.old_value}</span> → <strong>{h.new_value}</strong></span>
                              : <span>{h.signal_title || 'Ajustement'}</span>
                          }
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}