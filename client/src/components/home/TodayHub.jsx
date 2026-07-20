import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { base44 } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import {
  Zap, BarChart3, BookOpen, ChevronRight, ExternalLink,
  TrendingUp, TrendingDown, Minus, Calendar, AlertTriangle, Newspaper
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getCampaignPhase, PHASE_CONFIG } from '@/components/campaign/CampaignPhase';

const PARTY_COLORS = {
  PS: '#F59E0B', EELV: '#22C55E', LR: '#3B82F6',
  RN: '#9CA3AF', RE: '#A78BFA', LFI: '#EF4444',
};
const getPartyColor = (party) => {
  for (const [k, v] of Object.entries(PARTY_COLORS)) {
    if (party?.toUpperCase().includes(k)) return v;
  }
  return '#6B7280';
};

const Evolution = ({ value }) => {
  if (!value || value === 0) return <span className="text-white/30 text-[10px] flex items-center"><Minus className="w-2.5 h-2.5" /></span>;
  if (value > 0) return <span className="text-green-400 text-[10px] flex items-center gap-0.5"><TrendingUp className="w-2.5 h-2.5" />+{value}</span>;
  return <span className="text-red-400 text-[10px] flex items-center gap-0.5"><TrendingDown className="w-2.5 h-2.5" />{value}</span>;
};

// ── Actualités liées aux municipales 2026 ─────────────────────────────────────
const DAILY_FACTS = [
  { emoji: '📰', title: 'Le Monde · 28 fév. 2026', text: 'À Paris, la gauche unie tente de reprendre la capitale après 25 ans de gestion socialiste. Les sondages donnent un écart de moins de 5 points.', url: 'https://www.lemonde.fr' },
  { emoji: '📰', title: 'Le Figaro · 27 fév. 2026', text: 'La droite cherche à reconquérir Lyon après la victoire historique de Grégory Doucet (EELV) en 2020. Le duel s\'annonce serré.', url: 'https://www.lefigaro.fr' },
  { emoji: '📰', title: 'France 3 · 26 fév. 2026', text: 'Marseille : Benoît Payan (PS) candidat à sa réélection face à une droite réunifiée. L\'abstention reste le premier enjeu pour les deux camps.', url: 'https://france3-regions.francetvinfo.fr' },
  { emoji: '📰', title: 'BFM TV · 25 fév. 2026', text: 'Le RN tente de franchir un cap décisif dans les grandes villes. Toulouse et Nice sont des cibles prioritaires pour 2026.', url: 'https://www.bfmtv.com' },
  { emoji: '📰', title: 'Libération · 24 fév. 2026', text: 'Bordeaux sans Alain Juppé ni Nicolas Florian : la ville est en pleine recomposition politique. La gauche y croit pour la première fois depuis 70 ans.', url: 'https://www.liberation.fr' },
  { emoji: '📰', title: 'Le Parisien · 23 fév. 2026', text: 'L\'abstention aux municipales de 2020 avait battu tous les records. Les associations citoyennes multiplient les initiatives pour mobiliser en 2026.', url: 'https://www.leparisien.fr' },
  { emoji: '📰', title: 'Franceinfo · 22 fév. 2026', text: 'Strasbourg, Rennes, Nantes : les maires écologistes sortants font face à une usure de mandat. Les sondages montrent un resserrement inédit.', url: 'https://www.francetvinfo.fr' },
  { emoji: '📰', title: 'L\'Obs · 21 fév. 2026', text: 'Les dépenses de campagne atteignent des niveaux records dans 12 grandes villes. Le financement public reste plafonné à 20 % des dépenses totales.', url: 'https://www.nouvelobs.com' },
  { emoji: '📰', title: 'La Croix · 20 fév. 2026', text: 'Grenoble : Éric Piolle ne se représente pas. Sa succession entre Insoumis, écologistes et socialistes s\'annonce explosives.', url: 'https://www.la-croix.com' },
  { emoji: '📰', title: 'Mediapart · 19 fév. 2026', text: 'Le débat sur la fusion des listes entre les deux tours revient au cœur de la campagne. Les règles du Code électoral imposent un seuil de 10% pour se maintenir.', url: 'https://www.mediapart.fr' },
];

export default function TodayHub({ user }) {
  const today = new Date().toISOString().split('T')[0];
  const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  const dailyFact = DAILY_FACTS[dayOfYear % DAILY_FACTS.length];

  const phase = getCampaignPhase();
  const phaseConfig = PHASE_CONFIG[phase];

  const { data: dailyChallenge } = useQuery({
    queryKey: ['daily-challenge-hub'],
    queryFn: async () => {
      const res = await base44.entities.DailyChallenge.filter({ date: today });
      return res[0] || null;
    }
  });

  // Sondage du jour — CitySurvey is_daily=true
  const { data: dailySurveyData } = useQuery({
    queryKey: ['daily-survey-hub-v2'],
    queryFn: async () => {
      const surveys = await base44.entities.CitySurvey.filter({ is_daily: true });
      return surveys[0] || null;
    }
  });

  const { data: cities = [] } = useQuery({ queryKey: ['cities'], queryFn: () => base44.entities.City.list() });

  // Source du sondage
  const { data: surveySource } = useQuery({
    queryKey: ['survey-source-hub', dailySurveyData?.survey_source_id],
    queryFn: () => base44.entities.SurveySource.filter({ id: dailySurveyData.survey_source_id }).then(r => r[0] || null),
    enabled: !!dailySurveyData?.survey_source_id
  });

  // Fallback: RealPoll featured si pas de CitySurvey
  const { data: featuredPoll } = useQuery({
    queryKey: ['featured-poll-hub'],
    queryFn: async () => {
      const polls = await base44.entities.RealPoll.filter({ is_featured: true, is_active: true });
      return polls[0] || null;
    },
    enabled: !dailySurveyData
  });

  const { data: pollSources = [] } = useQuery({
    queryKey: ['poll-sources'],
    queryFn: () => base44.entities.PollSource.list()
  });

  const surveyCity = cities.find(c => c.id === dailySurveyData?.city_id);
  const fpCity = cities.find(c => c.id === featuredPoll?.city_id);
  const fpSource = pollSources.find(s => s.id === featuredPoll?.poll_source_id);

  const activeSurvey = dailySurveyData;
  const activeCity = surveyCity;
  const top2 = activeSurvey?.candidates?.slice(0, 2) || [];
  const total = top2.reduce((s, c) => s + (c.percentage || 0), 0);

  const challengeRoute = dailyChallenge?.challenge_type === 'quiz'
    ? createPageUrl('Quiz')
    : createPageUrl('Predictions');

  return (
    <div className="border-b border-white/8" style={{ background: 'rgba(7,18,42,0.7)', backdropFilter: 'blur(8px)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        <div className="flex items-center gap-3 mb-5">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
            <span className="text-white/40 text-xs uppercase tracking-widest font-semibold">Aujourd'hui</span>
          </div>
          <div className="flex-1 h-px bg-white/8" />
          <span className="text-white/25 text-xs">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* ── Card 1: Défi du jour ─────────────────────────────────────── */}
          <Link to={challengeRoute} className="block group">
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="rounded-2xl border border-[#2B5CE6]/30 bg-[#0D1B3E]/80 p-5 flex flex-col gap-3 hover:border-[#4A7FD4]/60 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#4A7FD4]" />
              <span className="text-[10px] font-bold text-[#4A7FD4] uppercase tracking-widest">Défi du jour</span>
              {dailyChallenge?.points_reward && (
                <span className="ml-auto text-[10px] font-bold text-[#D4A017] bg-[#D4A017]/15 px-2 py-0.5 rounded-full">
                  +{dailyChallenge.points_reward} pts
                </span>
              )}
            </div>

            {dailyChallenge ? (
              <>
                <div>
                  <p className="text-white font-semibold text-sm leading-snug">{dailyChallenge.title}</p>
                  {dailyChallenge.description && (
                    <p className="text-white/40 text-xs mt-1 leading-relaxed">{dailyChallenge.description}</p>
                  )}
                </div>
                <div className="mt-auto">
                  <div className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#034EA2] hover:bg-[#023882] text-white rounded-xl text-xs font-bold transition">
                    Relever le défi <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col gap-3">
                <p className="text-white/40 text-sm">Défi en préparation 🗳️</p>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/8">
                  <span className="text-lg">{phaseConfig?.emoji || '📊'}</span>
                  <div>
                    <p className="text-white/70 text-xs font-semibold">{phaseConfig?.name}</p>
                    <p className="text-white/35 text-[10px]">Phase actuelle de campagne</p>
                  </div>
                </div>
                <div className="mt-auto">
                  <div className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white/8 border border-white/10 text-white rounded-xl text-xs font-semibold transition">
                    Aller aux quiz <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            )}
          </motion.div>
          </Link>

          {/* ── Card 2: Sondage du jour ────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="rounded-2xl border border-white/10 bg-[#0D1B3E]/80 p-5 flex flex-col gap-3"
          >
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#D4A017]" />
              <span className="text-[10px] font-bold text-[#D4A017] uppercase tracking-widest">Sondage du jour</span>
              {activeSurvey?.is_daily && (
                <span className="ml-auto flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
                  <span className="text-[9px] text-[#22C55E] font-bold uppercase">Live</span>
                </span>
              )}
            </div>

            {activeSurvey && activeCity ? (
              <>
                {/* City */}
                <div className="flex items-center gap-2">
                  {activeCity.image_url && (
                    <img src={activeCity.image_url} alt={activeCity.name} className="w-8 h-8 rounded-lg object-cover opacity-80" />
                  )}
                  <div>
                    <p className="text-white font-bold text-sm">{activeCity.name}</p>
                    <p className="text-white/35 text-[10px]">{activeCity.region}</p>
                  </div>
                </div>

                {/* Bars */}
                <div className="space-y-2">
                  {activeSurvey.candidates?.slice(0, 4).map((c, i) => {
                    const color = getPartyColor(c.party);
                    const maxPct = activeSurvey.candidates[0]?.percentage || 1;
                    return (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-white/60 text-xs w-18 shrink-0 truncate">{c.name?.split(' ').slice(-1)[0]}</span>
                        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: color }}
                            initial={{ width: 0 }}
                            animate={{ width: `${(c.percentage / maxPct) * 100}%` }}
                            transition={{ duration: 0.6, delay: i * 0.08 }}
                          />
                        </div>
                        <div className="flex items-center gap-1 w-14 justify-end shrink-0">
                          <span className="font-mono font-bold text-xs text-white">{c.percentage}%</span>
                          <Evolution value={c.evolution} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Source */}
                {surveySource && (
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-white/30 border-t border-white/8 pt-2">
                    <span className="font-bold text-white/50">{surveySource.institute}</span>
                    {surveySource.client && <span>pour {surveySource.client}</span>}
                    {surveySource.sample_size && <span>n={surveySource.sample_size}</span>}
                    {surveySource.margin_error && <span>±{surveySource.margin_error}pts</span>}
                    {surveySource.date_to && <span>{new Date(surveySource.date_to).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>}
                    {surveySource.link && (
                      <a href={surveySource.link} target="_blank" rel="noopener noreferrer" className="text-[#D4A017] hover:underline flex items-center gap-0.5">
                        Source <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                )}

                {activeSurvey.undecided != null && (
                  <p className="text-white/25 text-[10px] flex items-center gap-1">
                    <AlertTriangle className="w-2.5 h-2.5" />
                    {activeSurvey.undecided}% d'indécis
                  </p>
                )}

                <div className="flex gap-2 mt-auto">
                  <Link to={`/City?slug=${activeCity.slug}&tab=surveys`} className="flex-1">
                    <button className="w-full py-2 rounded-xl bg-white/8 hover:bg-white/12 border border-white/10 text-white/70 text-xs font-semibold transition">
                      Détails
                    </button>
                  </Link>
                  <Link to={`/City?slug=${activeCity.slug}&tab=predictions`} className="flex-1">
                    <button className="w-full py-2 rounded-xl bg-[#034EA2] hover:bg-[#023882] text-white text-xs font-bold transition">
                      Jouer
                    </button>
                  </Link>
                </div>
              </>
            ) : featuredPoll ? (
              <>
                {fpCity && <p className="text-white font-bold text-sm">{featuredPoll.title}</p>}
                <div className="space-y-2">
                  {featuredPoll.results?.slice(0, 3).map((r, i) => {
                    const color = getPartyColor(r.party);
                    const maxPct = featuredPoll.results[0]?.percentage || 1;
                    return (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-white/60 text-xs w-18 shrink-0 truncate">{r.candidate?.split(' ').slice(-1)[0]}</span>
                        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <motion.div className="h-full rounded-full" style={{ backgroundColor: color }}
                            initial={{ width: 0 }} animate={{ width: `${(r.percentage / maxPct) * 100}%` }}
                            transition={{ duration: 0.6, delay: i * 0.08 }} />
                        </div>
                        <span className="font-mono font-bold text-xs text-white w-10 text-right">{r.percentage}%</span>
                      </div>
                    );
                  })}
                </div>
                {fpSource && (
                  <p className="text-[10px] text-white/30 border-t border-white/8 pt-2">
                    <span className="font-bold text-white/50">{fpSource.short_name}</span>
                    {featuredPoll.publication_date && ` · ${new Date(featuredPoll.publication_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`}
                  </p>
                )}
                <Link to={createPageUrl('Surveys')} className="mt-auto">
                  <button className="w-full py-2.5 rounded-xl bg-[#034EA2] hover:bg-[#023882] text-white text-xs font-bold transition flex items-center justify-center gap-1">
                    Tous les sondages <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </Link>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 py-4">
                <BarChart3 className="w-8 h-8 text-white/15" />
                <p className="text-white/30 text-sm text-center">Sondage du jour à venir</p>
                <Link to={createPageUrl('Surveys')}>
                  <button className="text-xs text-[#4A7FD4] hover:underline flex items-center gap-1">
                    Voir tous les sondages <ChevronRight className="w-3 h-3" />
                  </button>
                </Link>
              </div>
            )}
          </motion.div>

          {/* ── Card 3: Info du jour ────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="rounded-2xl border border-[#D4A017]/20 bg-[#0D1B3E]/80 p-5 flex flex-col gap-3"
          >
            <div className="flex items-center gap-2">
              <Newspaper className="w-4 h-4 text-[#D4A017]" />
              <span className="text-[10px] font-bold text-[#D4A017] uppercase tracking-widest">Info du jour</span>
              <span className="ml-auto text-[10px] text-white/25">
                {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
              </span>
            </div>

            {/* Daily news */}
            <div className="flex-1 flex flex-col gap-3">
              <div className="bg-[#D4A017]/8 border border-[#D4A017]/20 rounded-xl p-4 flex-1">
                <div className="flex items-start gap-3">
                  <span className="text-lg shrink-0">{dailyFact.emoji}</span>
                  <div className="min-w-0">
                    <p className="text-[#D4A017] font-bold text-[10px] uppercase tracking-wide mb-1">{dailyFact.title}</p>
                    <p className="text-white/70 text-sm leading-relaxed">{dailyFact.text}</p>
                    {dailyFact.url && (
                      <a href={dailyFact.url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-2 text-[#D4A017] text-[10px] hover:underline">
                        <ExternalLink className="w-2.5 h-2.5" /> Lire l'article
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Key dates */}
              <div className="bg-white/5 border border-white/8 rounded-xl p-3 space-y-1.5">
                {[
                  { label: '1er tour', date: '15 mars 2026', color: '#034EA2' },
                  { label: '2e tour', date: '22 mars 2026', color: '#C8102E' },
                ].map(d => {
                  const daysLeft = Math.max(0, Math.ceil((new Date('2026-03-' + (d.label === '1er tour' ? '15' : '22')) - new Date()) / 86400000));
                  return (
                    <div key={d.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: d.color }} />
                        <span className="text-white/60 text-xs">{d.label} · {d.date}</span>
                      </div>
                      <span className="font-mono text-xs font-bold text-white/40">J-{daysLeft}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <a href="https://www.lemonde.fr/politique/" target="_blank" rel="noopener noreferrer" className="mt-auto">
              <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#D4A017]/25 bg-[#D4A017]/8 hover:bg-[#D4A017]/15 text-[#D4A017] text-xs font-bold transition">
                <Newspaper className="w-3.5 h-3.5" />
                Toute l'actu municipales <ChevronRight className="w-3 h-3" />
              </button>
            </a>
          </motion.div>
        </div>
      </div>
    </div>
  );
}