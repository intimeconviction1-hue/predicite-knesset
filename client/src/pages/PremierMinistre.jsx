import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Crown, ChevronLeft, CheckCircle, Clock, Lock, Info } from 'lucide-react';
import CoalitionRulesModule from '@/components/election/CoalitionRulesModule';

const FALLBACK_DEADLINE_UTC = '2026-10-26T04:00:00Z';

function formatLocalDeadline(utcString) {
  const d = new Date(utcString);
  if (Number.isNaN(d.getTime())) return null;
  const date = d.toLocaleDateString('fr-FR', { timeZone: 'Asia/Jerusalem', day: 'numeric', month: 'long', year: 'numeric' });
  const time = d.toLocaleTimeString('fr-FR', { timeZone: 'Asia/Jerusalem', hour: '2-digit', minute: '2-digit' });
  return `${date} — ${time} (heure d'Israël)`;
}

export default function PremierMinistre() {
  const [user, setUser] = useState(null);
  const [selected, setSelected] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deadlineUtc, setDeadlineUtc] = useState(FALLBACK_DEADLINE_UTC);
  const [deadlineClosed, setDeadlineClosed] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  useEffect(() => {
    base44.entities.CampaignSettings.filter({ key: 'global' })
      .then(res => {
        const d = res?.[0]?.predictions_deadline_utc;
        const parsed = d && !Number.isNaN(new Date(d).getTime()) ? d : FALLBACK_DEADLINE_UTC;
        setDeadlineUtc(parsed);
        setDeadlineClosed(new Date() >= new Date(parsed));
      })
      .catch(() => setDeadlineClosed(new Date() >= new Date(FALLBACK_DEADLINE_UTC)));
  }, []);

  const { data: candidats = [], isLoading } = useQuery({
    queryKey: ['candidats-pm'],
    queryFn: () => base44.entities.CandidatPM.filter({ is_active: true }),
  });

  const { data: existingPred, refetch } = useQuery({
    queryKey: ['pronostic-pm', user?.email],
    queryFn: async () => {
      const res = await base44.entities.PronosticPM.filter({ user_email: user.email });
      return res?.[0] || null;
    },
    enabled: !!user?.email,
  });

  const handleSubmit = async () => {
    if (!user) { base44.auth.redirectToLogin(window.location.href); return; }
    if (!selected) return;
    setIsSubmitting(true);
    try {
      const payload = { candidat_pm_id: selected, submitted_at: new Date().toISOString() };
      if (existingPred) {
        await base44.entities.PronosticPM.update(existingPred.id, payload);
      } else {
        await base44.entities.PronosticPM.create({ ...payload, user_email: user.email, points_earned: 0 });
      }
      await refetch();
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCandidat = candidats.find(c => c.id === existingPred?.candidat_pm_id);

  return (
    <div className="min-h-screen" style={{ background: 'var(--p-night)' }}>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link to={createPageUrl('Listes')} className="inline-flex items-center gap-1 text-sm mb-6 hover:text-[var(--p-text)] transition-colors" style={{ color: 'var(--p-text-40)' }}>
          <ChevronLeft className="w-4 h-4" /> Toutes les listes
        </Link>

        {/* Header */}
        <div className="rounded-2xl border p-6 mb-6 text-center" style={{ borderColor: 'rgba(212,175,55,0.25)', background: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(212,175,55,0.08))' }}>
          <Crown className="w-8 h-8 mx-auto mb-3" style={{ color: 'var(--p-gold)' }} />
          <h1 className="text-2xl font-black mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--p-text)' }}>Qui sera Premier ministre ?</h1>
          <p className="text-sm max-w-xl mx-auto" style={{ color: 'var(--p-text-60)' }}>
            Ce pronostic ne se résout pas le soir du scrutin, mais au moment de l'investiture officielle du prochain gouvernement — parfois plusieurs semaines, voire plusieurs mois plus tard.
          </p>
        </div>

        <div className="flex items-center gap-2 px-4 py-2.5 text-xs rounded-xl mb-6"
          style={{ background: deadlineClosed ? 'rgba(217,43,43,0.1)' : 'rgba(212,175,55,0.08)', color: deadlineClosed ? 'var(--p-red)' : 'var(--p-gold-text)' }}>
          {deadlineClosed ? <Lock className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
          {deadlineClosed
            ? 'Pronostics clôturés'
            : <span>Verrouillage du choix : <strong>{formatLocalDeadline(deadlineUtc)}</strong> · résolution à l'investiture</span>}
        </div>

        {/* Formulaire */}
        <div className="rounded-2xl border p-6 mb-6" style={{ background: 'var(--p-card)', borderColor: 'var(--p-border)' }}>
          {existingPred ? (
            <div className="rounded-xl p-4 flex items-center justify-between" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)' }}>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 flex-shrink-0" style={{ color: '#16794A' }} />
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#16794A' }}>
                    Pronostic : {selectedCandidat?.name_fr || 'Autre'}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: '#16794A' }}>
                    {existingPred.resolved_at ? 'Résolu' : 'En attente de l\'investiture'}
                  </p>
                </div>
              </div>
              {!deadlineClosed && (
                <button
                  onClick={() => setSelected(existingPred.candidat_pm_id)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                  style={{ color: 'var(--p-blue)', border: '1px solid rgba(74,127,212,0.4)' }}
                >
                  Modifier
                </button>
              )}
            </div>
          ) : isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[...Array(6)].map((_, i) => <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: 'var(--p-border)' }} />)}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {candidats.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelected(c.id)}
                    className="rounded-xl p-4 text-center transition-all border"
                    style={{
                      background: selected === c.id ? 'rgba(212,175,55,0.12)' : 'var(--p-card)',
                      borderColor: selected === c.id ? 'rgba(212,175,55,0.5)' : 'var(--p-border)',
                    }}
                  >
                    <p className="text-sm font-semibold" style={{ color: 'var(--p-text)' }}>{c.name_fr}</p>
                  </button>
                ))}
                <button
                  onClick={() => setSelected('autre')}
                  className="rounded-xl p-4 text-center transition-all border"
                  style={{
                    background: selected === 'autre' ? 'rgba(212,175,55,0.12)' : 'var(--p-card)',
                    borderColor: selected === 'autre' ? 'rgba(212,175,55,0.5)' : 'var(--p-border)',
                  }}
                >
                  <p className="text-sm font-semibold" style={{ color: 'var(--p-text-60)' }}>Autre</p>
                </button>
              </div>

              <button
                onClick={handleSubmit}
                disabled={!selected || isSubmitting || deadlineClosed}
                className="w-full py-3 rounded-xl font-bold text-sm text-white disabled:opacity-40 transition-opacity"
                style={{ background: 'linear-gradient(135deg,#7C3AED,var(--p-gold))' }}
              >
                {isSubmitting ? 'Enregistrement...' : '✓ Valider mon pronostic'}
              </button>
            </div>
          )}

          <div className="flex items-start gap-2 mt-4 pt-4 border-t text-xs" style={{ borderColor: 'var(--p-border)', color: 'var(--p-text-40)' }}>
            <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <p>+100 points si votre pronostic correspond à la personne effectivement investie Premier ministre. Un chef de gouvernement de transition ne compte pas. Si personne n'est investi avant la deadline de résolution, le pronostic bascule automatiquement sur « Autre ».</p>
          </div>
        </div>

        <CoalitionRulesModule />
      </div>
    </div>
  );
}
