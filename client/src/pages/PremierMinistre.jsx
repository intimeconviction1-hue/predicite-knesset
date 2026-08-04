import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useSearchParams } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Crown, ChevronLeft, CheckCircle, Clock, Lock, Info } from 'lucide-react';
import Modale from '@/components/knesset/Modale';
import CoalitionRulesModule from '@/components/election/CoalitionRulesModule';
import CinematicHero from '@/components/knesset/CinematicHero';
import PlayLearnBar from '@/components/knesset/PlayLearnBar';
import { FALLBACK_DEADLINE_UTC, formatLocalDeadline } from '@/lib/echeances';

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

  // Paris RÉELS impliquant les partis des candidats PM (issue.match_value ===
  // liste_id d'un candidat) — correspondance exacte, jamais inventée.
  const { data: parisData } = useQuery({
    queryKey: ['pm-paris'],
    queryFn: () => base44.paris.marches(),
    staleTime: 60 * 1000,
  });
  const candListeIds = new Set(candidats.map(c => c.liste_id).filter(Boolean));
  const pmBets = (parisData?.marches || [])
    .filter(m => (m.issues || []).some(i => candListeIds.has(i.match_value)))
    .slice(0, 3)
    .map(m => {
      const iss = (m.issues || []).find(i => candListeIds.has(i.match_value)) || m.issues[0];
      return { question: m.question, cote: iss.cote.toFixed(2), to: createPageUrl('Paris') };
    });

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

        {/* Hero cinématique institutionnel (composant maison CinematicHero) */}
        <CinematicHero
          size="md"
          photos={['/images/pm-hero.jpg']}
          position="center 22%"
          title={<>Qui sera <span className="p-gradient-gold">Premier ministre</span> ?</>}
          subtitle="Ce pronostic ne se résout pas le soir du scrutin, mais au moment de l'investiture officielle du prochain gouvernement — parfois plusieurs semaines, voire plusieurs mois plus tard."
          className="p-elev-2 rounded-2xl mb-6"
        />

        {/* Vase communicant : la course au PM se joue (paris sur les partis) et
            se teste (quiz), en plus du pronostic ci-dessous. */}
        <PlayLearnBar
          className="p-reveal mb-6"
          title="Joue la course au Premier ministre"
          subtitle="Au-delà de ton pronostic ci-dessous : parie sur les partis en lice, ou teste-toi."
          bets={pmBets}
          quizTo={createPageUrl('Quiz')}
        />

        <div className="flex items-center gap-2 px-4 py-2.5 text-xs rounded-xl mb-6"
          style={{ background: deadlineClosed ? 'rgba(217,43,43,0.1)' : 'rgba(212,175,55,0.08)', color: deadlineClosed ? 'var(--p-red)' : 'var(--p-gold-text)' }}>
          {deadlineClosed ? <Lock className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
          {deadlineClosed
            ? 'Pronostics clôturés'
            : <span>Verrouillage du choix : <strong>{formatLocalDeadline(deadlineUtc)}</strong> · résolution à l'investiture</span>}
        </div>

        {/* Formulaire */}
        <div className="p-reveal p-elev-1 rounded-2xl border p-6 mb-6" style={{ background: 'var(--p-card)', borderColor: 'var(--p-border)' }}>
          {existingPred ? (
            <div className="rounded-xl p-4 flex items-center justify-between" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)' }}>
              <div className="flex items-center gap-3">
                {selectedCandidat?.photo_url ? (
                  <img src={selectedCandidat.photo_url} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" style={{ border: '1px solid rgba(34,197,94,0.4)' }} />
                ) : (
                  <CheckCircle className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--p-green-text)' }} />
                )}
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--p-green-text)' }}>
                    Pronostic : {selectedCandidat?.name_fr || 'Autre'}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--p-green-text)' }}>
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
                {/* La carte portait tout le vocabulaire de la sélection (badge
                    « Choisi », bordure or, fond doré) mais son clic ouvrait la
                    biographie : l'affordance disait « sélectionne-moi », le
                    comportement disait « lis-moi ». L'utilisateur cliquait,
                    lisait, fermait, et croyait avoir choisi — pendant que le
                    bouton de validation restait grisé sans explication.
                    La carte sélectionne. La bio a son propre bouton, posé en
                    FRÈRE et non en enfant : un <button> dans un <button> est du
                    HTML invalide. */}
                {candidats.map(c => (
                  <div key={c.id} className="relative">
                    <motion.button
                      onClick={() => setSelected(c.id)}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      aria-pressed={selected === c.id}
                      className="w-full relative rounded-xl p-4 text-center transition-colors border flex flex-col items-center gap-2"
                      style={{
                        background: selected === c.id ? 'rgba(212,175,55,0.12)' : 'var(--p-card)',
                        borderColor: selected === c.id ? 'rgba(212,175,55,0.5)' : 'var(--p-border)',
                      }}
                      aria-label={`Choisir ${c.name_fr} comme Premier ministre`}
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
                          width="64"
                          height="64"
                          loading="lazy"
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
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: listeById.get(c.liste_id).color || 'var(--p-text-25)' }} />
                          {listeById.get(c.liste_id).name_fr}
                        </span>
                      )}
                    </motion.button>
                    <button
                      type="button"
                      onClick={() => setBioCandidat(c)}
                      aria-label={`Biographie de ${c.name_fr}`}
                      className="absolute bottom-1 left-1 w-11 h-11 rounded-full justify-center transition-colors hover:bg-[rgba(20,32,61,0.06)]"
                      style={{ color: 'var(--p-text-40)' }}
                    >
                      <Info className="w-4 h-4" />
                    </button>
                  </div>
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
                className="p-btn-gold-solid w-full justify-center disabled:opacity-40"
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

      {bioCandidat && (
          <Modale
            ouverte={!!bioCandidat}
            onClose={() => setBioCandidat(null)}
            titre={`Biographie de ${bioCandidat.name_fr}`}
            largeur="max-w-sm"
          >
            <div className="p-glow-gold p-6">
              <div className="flex flex-col items-center text-center">
                {bioCandidat.photo_url ? (
                  <img src={bioCandidat.photo_url} alt="" width="80" height="80" className="w-20 h-20 rounded-full object-cover mb-3" style={{ border: '2px solid var(--p-gold)' }} />
                ) : (
                  <div className="w-20 h-20 rounded-full flex items-center justify-center mb-3" style={{ background: 'var(--p-night-2)' }}>
                    <Crown className="w-7 h-7" style={{ color: 'var(--p-text-25)' }} />
                  </div>
                )}
                <h3 className="p-title text-lg mb-3">{bioCandidat.name_fr}</h3>
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
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: listeById.get(bioCandidat.liste_id).color || 'var(--p-text-25)' }} />
                    Voir la liste {listeById.get(bioCandidat.liste_id).name_fr} →
                  </Link>
                )}
                {/* Raccourci conservé : la carte sélectionne déjà, mais on ne
                    force pas l'utilisateur à refermer pour agir sur ce qu'il
                    vient de lire. */}
                {!deadlineClosed && (
                  <button
                    onClick={() => { setSelected(bioCandidat.id); setBioCandidat(null); }}
                    className="w-full justify-center mt-4 py-3 rounded-[10px] font-semibold text-sm text-white transition-transform hover:-translate-y-0.5"
                    style={{ background: selected === bioCandidat.id ? 'var(--p-green-text)' : 'var(--p-blue)' }}
                  >
                    {selected === bioCandidat.id ? '✓ Choisi pour ton pronostic' : 'Choisir ce candidat'}
                  </button>
                )}
              </div>
            </div>
          </Modale>
      )}
    </div>
  );
}
