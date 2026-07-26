import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  ChevronLeft, Users, TrendingUp, CheckCircle, PenLine, Lock, Clock, Trophy, ExternalLink
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import KnessetRulesModule from '@/components/election/KnessetRulesModule';
import BallotChip from '@/components/knesset/BallotChip';
import { BLOC_LABEL, BLOC_COLOR } from '@/lib/blocs';

const FALLBACK_DEADLINE_UTC = '2026-10-26T04:00:00Z'; // veille du scrutin, 07:00 Israël

function formatLocalDeadline(utcString) {
  const d = new Date(utcString);
  if (Number.isNaN(d.getTime())) return null;
  const date = d.toLocaleDateString('fr-FR', { timeZone: 'Asia/Jerusalem', day: 'numeric', month: 'long', year: 'numeric' });
  const time = d.toLocaleTimeString('fr-FR', { timeZone: 'Asia/Jerusalem', hour: '2-digit', minute: '2-digit' });
  return `${date} — ${time} (heure d'Israël)`;
}

export default function ListePage() {
  const [user, setUser] = useState(null);
  const urlParams = new URLSearchParams(window.location.search);
  const slug = urlParams.get('slug') || '';
  const queryClient = useQueryClient();

  const [seats, setSeats] = useState([10]);
  const [justification, setJustification] = useState('');
  const [showJustification, setShowJustification] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [deadlineUtc, setDeadlineUtc] = useState(FALLBACK_DEADLINE_UTC);
  const [deadlineClosed, setDeadlineClosed] = useState(false);

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

  const { data: liste, isLoading } = useQuery({
    queryKey: ['liste', slug],
    queryFn: async () => {
      const res = await base44.entities.Liste.filter({ slug });
      return res[0];
    },
    enabled: !!slug,
  });

  useEffect(() => {
    if (!liste) return;
    document.title = `${liste.name_fr} — Knesset 2026 | PrédiCité`;
  }, [liste]);

  const { data: sondages = [] } = useQuery({
    queryKey: ['sondages-sieges', liste?.id],
    queryFn: () => base44.entities.SondageSieges.list('-poll_date', 12),
    enabled: !!liste?.id,
  });

  const history = sondages
    .map(s => ({
      date: s.poll_date,
      institute: s.institute,
      seats: s.seats_by_liste?.find(x => x.liste_id === liste.id)?.seats ?? null,
      source_url: s.source_url,
    }))
    .filter(h => h.seats != null)
    .reverse();

  const latest = history[history.length - 1] || null;
  const maxSeats = Math.max(40, ...history.map(h => h.seats));

  const { data: existingPred } = useQuery({
    queryKey: ['pronostic-sieges', liste?.id, user?.email],
    queryFn: async () => {
      const res = await base44.entities.PronosticSieges.filter({ liste_id: liste.id, user_email: user.email });
      return res?.[0] || null;
    },
    enabled: !!liste?.id && !!user?.email,
  });

  const handleSubmit = async () => {
    if (!user) { base44.auth.redirectToLogin(window.location.href); return; }
    setIsSubmitting(true);
    try {
      // Passe par la fonction serveur (deadline + points d'engagement + UserProgress),
      // plutôt qu'une écriture directe de l'entité qui contournerait ces règles.
      await base44.functions.invoke('prediciteScoringSieges', {
        action: 'submitPronosticSieges',
        liste_id: liste.id,
        predicted_seats: seats[0],
        justification,
      });
      await queryClient.invalidateQueries({ queryKey: ['pronostic-sieges', liste.id, user.email] });
      setConfirmed(true);
      setEditMode(false);
    } catch (e) {
      if (e?.status === 403 || e?.response?.status === 403) setDeadlineClosed(true);
      console.error('Erreur soumission pronostic sièges:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !liste) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'transparent' }}>
        <div className="w-8 h-8 rounded-full border-2 border-[var(--p-border-hover)] border-t-[var(--p-text-40)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'transparent' }}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link to={createPageUrl('Listes')} className="inline-flex items-center gap-1 text-sm mb-6 hover:text-[var(--p-text)] transition-colors" style={{ color: 'var(--p-text-40)' }}>
          <ChevronLeft className="w-4 h-4" /> Toutes les listes
        </Link>

        {/* Bandeau photo — bâtiment de la Knesset (libre, Wikimedia Commons) */}
        <div className="relative overflow-hidden rounded-2xl mb-4 h-28" style={{ backgroundImage: "url('/images/liste-hero.jpg')", backgroundSize: 'cover', backgroundPosition: 'center 40%' }}>
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(5,10,24,0.2) 0%, rgba(5,10,24,0.4) 100%)' }} />
        </div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          whileHover={{ y: -2 }}
          className="rounded-2xl border p-6 mb-6 transition-colors duration-300 hover:border-[var(--p-border-hover)]"
          style={{ background: 'var(--p-card)', borderColor: 'var(--p-border)' }}
        >
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div className="flex items-start gap-4">
              {liste.logo_url && (
                <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 p-1.5" style={{ background: '#FFFFFF', border: '1px solid var(--p-border)' }}>
                  <img src={liste.logo_url} alt="" className="max-w-full max-h-full object-contain" />
                </div>
              )}
              <BallotChip letters={liste.ballot_letters} size="lg" />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: liste.color || '#6B7280' }} />
                  <h1 className="text-2xl font-black" style={{ fontFamily: 'var(--font-display)', color: 'var(--p-text)' }}>{liste.name_fr}</h1>
                </div>
                <p className="text-sm" style={{ color: 'var(--p-text-60)' }}>{liste.leader_name}{liste.name_he ? ` · ${liste.name_he}` : ''}</p>
              </div>
            </div>
            {(() => {
              const blocColor = BLOC_COLOR[liste.bloc] || '#6B7280';
              return (
                <span
                  className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full"
                  style={{ background: `${blocColor}18`, color: blocColor, border: `1px solid ${blocColor}40` }}
                >
                  {BLOC_LABEL[liste.bloc] || '—'}
                </span>
              );
            })()}
          </div>

          {liste.founded_or_merged_note && (
            <p className="text-xs mt-3 pt-3 border-t" style={{ color: 'var(--p-gold-text)', borderColor: 'var(--p-border)' }}>
              ⓘ {liste.founded_or_merged_note}
            </p>
          )}

          <div className="flex items-center gap-6 mt-4 pt-4 border-t" style={{ borderColor: 'var(--p-border)' }}>
            <div>
              <p className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--p-text-40)' }}>Sièges sortants (25e Knesset)</p>
              <p className="text-xl font-bold font-mono" style={{ color: 'var(--p-text)' }}>{liste.current_knesset_seats ?? '—'}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--p-text-40)' }}>Dernière projection</p>
              {latest ? (
                <p className="text-xl font-bold font-mono" style={{ color: liste.color || 'var(--p-gold-text)' }}>{latest.seats} sièges</p>
              ) : (
                <p className="text-sm font-medium" style={{ color: 'var(--p-text-25)' }}>Pas encore de sondage</p>
              )}
            </div>
          </div>
        </motion.div>


        {/* Historique sondages */}
        {history.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-10%' }}
            transition={{ duration: 0.4 }}
            whileHover={{ y: -2 }}
            className="rounded-2xl border p-6 mb-6 transition-colors duration-300 hover:border-[var(--p-border-hover)]"
            style={{ background: 'var(--p-card)', borderColor: 'var(--p-border)' }}
          >
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4" style={{ color: 'var(--p-blue)' }} />
              <h2 className="font-bold text-sm" style={{ color: 'var(--p-text)' }}>Évolution des sondages sièges</h2>
            </div>
            <div className="flex items-end gap-2 h-32 mb-3">
              {history.map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1 group relative">
                  <span className="text-[10px] font-mono font-bold" style={{ color: liste.color || 'var(--p-gold-text)' }}>{h.seats}</span>
                  <motion.div
                    className="w-full rounded-t-sm"
                    style={{ backgroundColor: liste.color || 'var(--p-gold)', opacity: 0.7 }}
                    initial={{ height: 0 }}
                    whileInView={{ height: `${(h.seats / maxSeats) * 100}%` }}
                    viewport={{ once: true, margin: '-10%' }}
                    transition={{ duration: 0.5, delay: i * 0.05 }}
                  />
                </div>
              ))}
            </div>
            <div className="space-y-1.5 mt-4 pt-4 border-t" style={{ borderColor: 'var(--p-border)' }}>
              {history.slice().reverse().slice(0, 5).map((h, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span style={{ color: 'var(--p-text-60)' }}>
                    {h.institute} · {new Date(h.date).toLocaleDateString('fr-FR')}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold" style={{ color: 'var(--p-text)' }}>{h.seats} sièges</span>
                    {h.source_url && (
                      <a href={h.source_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--p-text-25)' }}>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Formulaire pronostic */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-10%' }}
          transition={{ duration: 0.4 }}
          className="rounded-2xl border overflow-hidden mb-6"
          style={{ background: 'var(--p-card)', borderColor: 'var(--p-border)' }}
        >
          <div className="px-6 py-4 flex items-center justify-between" style={{ background: 'linear-gradient(135deg,#1E3A8A,#2B5CE6)' }}>
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-white" />
              <h2 className="font-bold text-white text-sm">Mon pronostic sièges</h2>
            </div>
          </div>

          <div className={`flex items-center gap-2 px-6 py-2.5 text-xs ${deadlineClosed ? '' : ''}`}
            style={{ background: deadlineClosed ? 'rgba(217,43,43,0.1)' : 'rgba(212,175,55,0.08)', color: deadlineClosed ? 'var(--p-red)' : 'var(--p-gold-text)' }}>
            {deadlineClosed ? <Lock className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
            {deadlineClosed ? 'Pronostics clôturés' : <span>Clôture : <strong>{formatLocalDeadline(deadlineUtc)}</strong></span>}
          </div>

          <div className="p-6">
            {existingPred && !editMode ? (
              confirmed || true ? (
                <div className="flex items-center justify-between rounded-xl p-4" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)' }}>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 flex-shrink-0" style={{ color: '#16794A' }} />
                    <div>
                      <p className="text-sm font-semibold" style={{ color: '#16794A' }}>Pronostic : {existingPred.predicted_seats} sièges</p>
                      <p className="text-xs mt-0.5" style={{ color: '#16794A' }}>Enregistré</p>
                    </div>
                  </div>
                  {!deadlineClosed && (
                    <button
                      onClick={() => { setSeats([existingPred.predicted_seats]); setEditMode(true); }}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                      style={{ color: 'var(--p-blue)', border: '1px solid rgba(74,127,212,0.4)' }}
                    >
                      <PenLine className="w-3.5 h-3.5" /> Modifier
                    </button>
                  )}
                </div>
              ) : null
            ) : (
              <div className="space-y-5">
                <div className="text-center">
                  <motion.span
                    key={seats[0]}
                    initial={{ scale: 1.15, opacity: 0.6 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                    className="text-5xl font-black font-mono inline-block"
                    style={{ color: liste.color || 'var(--p-gold-text)' }}
                  >
                    {seats[0]}
                  </motion.span>
                  <p className="text-sm mt-2" style={{ color: 'var(--p-text-40)' }}>sièges sur 120</p>
                </div>
                <Slider
                  value={seats}
                  onValueChange={setSeats}
                  min={0}
                  max={maxSeats}
                  step={1}
                  aria-label="Nombre de sièges pronostiqués"
                />
                <div className="flex justify-between text-[11px]" style={{ color: 'var(--p-text-25)' }}>
                  <span>0 (sous le seuil)</span>
                  <span>Seuil ≈ 4 sièges</span>
                  <span>{maxSeats}</span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowJustification(!showJustification)}
                  className="flex items-center gap-1.5 text-xs hover:text-[var(--p-text)] transition-colors"
                  style={{ color: 'var(--p-text-40)' }}
                >
                  <PenLine className="w-3.5 h-3.5" />
                  {showJustification ? "Masquer l'analyse" : 'Ajouter une analyse (facultatif)'}
                </button>
                {showJustification && (
                  <Textarea
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                    placeholder="Pourquoi ce nombre de sièges ? Accords d'excédents, dynamique de campagne…"
                    className="resize-none text-sm bg-transparent border-[var(--p-border-hover)] text-[var(--p-text)] placeholder:text-[var(--p-text-25)]"
                    rows={3}
                  />
                )}

                <div className="flex gap-3">
                  {editMode && (
                    <Button variant="outline" onClick={() => setEditMode(false)} className="flex-1 border-[var(--p-border-hover)] text-[var(--p-text-60)]">Annuler</Button>
                  )}
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting || deadlineClosed}
                    className="flex-1"
                    style={{ background: 'linear-gradient(135deg,#1E3A8A,#2B5CE6)' }}
                  >
                    {isSubmitting ? 'Enregistrement...' : '✓ Valider mon pronostic'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        <KnessetRulesModule compact />

        <div className="flex items-center justify-center gap-6 mt-8">
          <Link to={createPageUrl('PremierMinistre')} className="text-sm hover:text-[var(--p-text)] transition-colors flex items-center gap-1.5" style={{ color: 'var(--p-text-40)' }}>
            <Users className="w-3.5 h-3.5" /> Pronostic Premier ministre
          </Link>
        </div>
      </div>
    </div>
  );
}
