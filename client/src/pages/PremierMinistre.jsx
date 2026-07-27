import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useSearchParams } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Crown, ChevronLeft, CheckCircle, Clock, Lock, Info, X } from 'lucide-react';
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
  const [bioCandidat, setBioCandidat] = useState(null);
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

  // Listes, pour le lien permanent candidat -> fiche de sa liste.
  const { data: listes = [] } = useQuery({
    queryKey: ['pm-listes'],
    queryFn: () => base44.entities.Liste.filter({ is_active: true }),
  });
  const listeById = new Map(listes.map(l => [l.id, l]));

  // Deep-link depuis une fiche liste (?candidat=ID) : ouvre la bio du candidat.
  const [searchParams] = useSearchParams();
  useEffect(() => {
    const id = searchParams.get('candidat');
    if (id && candidats.length) {
      const c = candidats.find(x => x.id === id);
      if (c) setBioCandidat(c);
    }
  }, [candidats, searchParams]);

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
    <div className="min-h-screen" style={{ background: 'transparent' }}>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link to={createPageUrl('Listes')} className="inline-flex items-center gap-1 text-sm mb-6 hover:text-[var(--p-text)] transition-colors" style={{ color: 'var(--p-text-40)' }}>
          <ChevronLeft className="w-4 h-4" /> Toutes les listes
        </Link>

        {/* Header — statue de la Menorah devant la Knesset, de nuit (libre, Wikimedia Commons) */}
        <div className="relative overflow-hidden rounded-2xl border p-6 md:p-8 mb-6 text-center" style={{ background: 'var(--p-card)', borderColor: 'var(--p-gold-border)' }}>
          <div className="absolute inset-x-0 top-0 h-40 pointer-events-none" style={{ background: 'radial-gradient(ellipse 70% 100% at 50% 0%, rgba(212,175,55,0.16), transparent 62%)' }} />
          <div className="relative">
            <Crown className="w-8 h-8 mx-auto mb-3" style={{ color: 'var(--p-gold-text)' }} />
            <h1 className="text-2xl md:text-3xl font-black mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--p-text)', letterSpacing: '-0.01em' }}>Qui sera Premier ministre ?</h1>
            <p className="text-sm max-w-xl mx-auto" style={{ color: 'var(--p-text-60)' }}>
              Ce pronostic ne se résout pas le soir du scrutin, mais au moment de l'investiture officielle du prochain gouvernement — parfois plusieurs semaines, voire plusieurs mois plus tard.
            </p>
          </div>
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
              <div className="flex items-center gap-3">
                {selectedCandidat?.photo_url ? (
                  <img src={selectedCandidat.photo_url} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" style={{ border: '1px solid rgba(34,197,94,0.4)' }} />
                ) : (
                  <CheckCircle className="w-5 h-5 flex-shrink-0" style={{ color: '#16794A' }} />
                )}
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
                  <motion.button
                    key={c.id}
                    onClick={() => setBioCandidat(c)}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    className="relative rounded-xl p-4 text-center transition-colors border flex flex-col items-center gap-2"
                    style={{
                      background: selected === c.id ? 'rgba(212,175,55,0.12)' : 'var(--p-card)',
                      borderColor: selected === c.id ? 'rgba(212,175,55,0.5)' : 'var(--p-border)',
                    }}
                    aria-label={`Fiche de ${c.name_fr}`}
                  >
                    {selected === c.id && (
                      <span className="absolute top-1.5 right-1.5 text-[9px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded-full" style={{ background: 'var(--p-gold-dim)', color: 'var(--p-gold-text)' }}>
                        Choisi
                      </span>
                    )}
                    {c.photo_url ? (
                      <img
                        src={c.photo_url}
                        alt=""
                        className="w-16 h-16 rounded-full object-cover"
                        style={{ border: selected === c.id ? '2px solid var(--p-gold)' : '1px solid var(--p-border-hover)' }}
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'var(--p-night-2)' }}>
                        <Crown className="w-6 h-6" style={{ color: 'var(--p-text-25)' }} />
                      </div>
                    )}
                    <p className="text-sm font-semibold" style={{ color: 'var(--p-text)' }}>{c.name_fr}</p>
                    {listeById.get(c.liste_id) && (
                      <span className="inline-flex items-center gap-1 text-[11px]" style={{ color: 'var(--p-text-40)' }}>
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: listeById.get(c.liste_id).color || '#6B7280' }} />
                        {listeById.get(c.liste_id).name_fr}
                      </span>
                    )}
                  </motion.button>
                ))}
                <motion.button
                  onClick={() => setSelected('autre')}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  className="rounded-xl p-4 text-center transition-colors border flex flex-col items-center gap-2"
                  style={{
                    background: selected === 'autre' ? 'rgba(212,175,55,0.12)' : 'var(--p-card)',
                    borderColor: selected === 'autre' ? 'rgba(212,175,55,0.5)' : 'var(--p-border)',
                  }}
                >
                  <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'var(--p-night-2)' }}>
                    <Crown className="w-6 h-6" style={{ color: 'var(--p-text-25)' }} />
                  </div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--p-text-60)' }}>Autre</p>
                </motion.button>
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

      <AnimatePresence>
        {bioCandidat && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-4"
            style={{ background: 'rgba(5,10,24,0.6)' }}
            onClick={() => setBioCandidat(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.97 }}
              transition={{ duration: 0.18 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl p-6 relative"
              style={{ background: 'var(--p-card)', border: '1px solid var(--p-border)' }}
            >
              <button
                onClick={() => setBioCandidat(null)}
                className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center hover:bg-[rgba(20,32,61,0.06)]"
                aria-label="Fermer"
              >
                <X className="w-4 h-4" style={{ color: 'var(--p-text-40)' }} />
              </button>
              <div className="flex flex-col items-center text-center">
                {bioCandidat.photo_url ? (
                  <img src={bioCandidat.photo_url} alt="" className="w-20 h-20 rounded-full object-cover mb-3" style={{ border: '2px solid var(--p-gold)' }} />
                ) : (
                  <div className="w-20 h-20 rounded-full flex items-center justify-center mb-3" style={{ background: 'var(--p-night-2)' }}>
                    <Crown className="w-7 h-7" style={{ color: 'var(--p-text-25)' }} />
                  </div>
                )}
                <h3 className="font-bold text-lg mb-3" style={{ fontFamily: 'var(--font-display)', color: 'var(--p-text)' }}>{bioCandidat.name_fr}</h3>
                <p className="text-sm leading-relaxed text-left" style={{ color: 'var(--p-text-60)' }}>{bioCandidat.bio}</p>
                {bioCandidat.bio_source && (
                  <a href={bioCandidat.bio_source} target="_blank" rel="noopener noreferrer" className="text-xs mt-3 inline-block hover:opacity-80 transition-opacity" style={{ color: 'var(--p-blue)' }}>
                    Source ↗
                  </a>
                )}
                {listeById.get(bioCandidat.liste_id) && (
                  <Link
                    to={`${createPageUrl('Liste')}?slug=${listeById.get(bioCandidat.liste_id).slug}`}
                    className="flex items-center justify-center gap-2 mt-4 pt-4 border-t text-sm font-semibold hover:opacity-80 transition-opacity"
                    style={{ borderColor: 'var(--p-border)', color: 'var(--p-blue)' }}
                  >
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: listeById.get(bioCandidat.liste_id).color || '#6B7280' }} />
                    Voir la liste {listeById.get(bioCandidat.liste_id).name_fr} →
                  </Link>
                )}
                {!deadlineClosed && (
                  <button
                    onClick={() => { setSelected(bioCandidat.id); setBioCandidat(null); }}
                    className="w-full mt-4 py-3 rounded-[10px] font-semibold text-sm text-white transition-transform hover:-translate-y-0.5"
                    style={{ background: selected === bioCandidat.id ? '#16794A' : 'var(--p-blue)' }}
                  >
                    {selected === bioCandidat.id ? '✓ Choisi pour ton pronostic' : 'Choisir ce candidat'}
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
