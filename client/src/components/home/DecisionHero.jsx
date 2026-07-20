import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight, ExternalLink, RefreshCw,
  BookOpen, Target, MapPin, Shield
} from 'lucide-react';

// ─── Calcul indice de tension ───────────────────────────────────────────────
// Formule : base = max(0, 100 − gap × 9) + bonus si gap < 5 (+10)
// + variation 7j si disponible : abs(variation) × 1.5, plafonnée à 15
// Score final arrondi entre 0 et 100.
// Expliqué dans la page Méthodologie.
function calcTension(poll, variation7j) {
  if (!poll.candidates || poll.candidates.length < 2) return null;
  const sorted = [...poll.candidates].sort((a, b) => b.percentage - a.percentage);
  const gap = sorted[0].percentage - sorted[1].percentage;
  const base = Math.max(0, 100 - gap * 9);
  const gapBonus = gap < 5 ? 10 : 0;
  const variationBonus = variation7j != null ? Math.min(15, Math.abs(variation7j) * 1.5) : 0;
  const score = Math.min(100, Math.round(base + gapBonus + variationBonus));
  return { score, gap, sorted };
}

function tensionMeta(score) {
  if (score >= 75) return { label: 'Très incertaine', color: '#C8102E', border: 'border-red-500/30', bg: 'bg-red-900/20' };
  if (score >= 50) return { label: 'Indécise', color: '#E1B530', border: 'border-yellow-500/30', bg: 'bg-yellow-900/20' };
  if (score >= 30) return { label: 'Stable', color: '#6B7280', border: 'border-slate-500/30', bg: 'bg-slate-800/30' };
  return { label: 'Calme', color: '#22C55E', border: 'border-green-500/30', bg: 'bg-green-900/20' };
}

// ─── Sélection de la ville la plus incertaine ───
function getMostUncertainCities(surveys, cities, sources) {
  const latestByCity = {};
  surveys.forEach(s => {
    if (!latestByCity[s.city_id] || s.date > latestByCity[s.city_id].date)
      latestByCity[s.city_id] = s;
  });

  const metrics = Object.values(latestByCity).map(survey => {
    const city = cities.find(c => c.id === survey.city_id);
    if (!city || !survey.candidates || survey.candidates.length < 2) return null;
    // Variation 7j : chercher le sondage précédent de la même ville
    // Variation 7j — champs utilisés : survey.date (string ISO date), candidates[].percentage (number), candidates[].name (string)
    // Uniquement calculée si un sondage précédent distinct existe pour la même ville dans la liste chargée.
    // Si indisponible : variation7j = null → affiché "—" côté UI, non simulé.
    const previousPoll = surveys
      .filter(s => s.city_id === survey.city_id && s.id !== survey.id)
      .sort((a, b) => b.date.localeCompare(a.date))[0];
    const sorted0 = [...survey.candidates].sort((a, b) => b.percentage - a.percentage);
    const topName = sorted0[0]?.name;
    let variation7j = null;
    if (previousPoll && topName) {
      const prevCandidate = previousPoll.candidates?.find(c => c.name === topName);
      const currCandidate = survey.candidates?.find(c => c.name === topName);
      // Seuls candidates[].percentage (number) et candidates[].name (string) sont utilisés
      if (prevCandidate != null && currCandidate != null &&
          typeof prevCandidate.percentage === 'number' &&
          typeof currCandidate.percentage === 'number') {
        variation7j = currCandidate.percentage - prevCandidate.percentage;
      }
    }
    const tension = calcTension(survey, variation7j);
    if (!tension) return null;
    const source = sources.find(s => s.id === survey.survey_source_id);
    return { city, poll: survey, ...tension, variation7j, lastDataAt: survey.date, source };
  }).filter(Boolean);

  return metrics.sort((a, b) => {
    if (a.gap !== b.gap) return a.gap - b.gap;
    return new Date(b.lastDataAt) - new Date(a.lastDataAt);
  });
}

// ─── Composant principal ───
export default function DecisionHero() {
  const [pickIndex, setPickIndex] = useState(0);
  const [answered, setAnswered] = useState(null);

  const { data: surveys = [], isLoading: loadingSurveys } = useQuery({
    queryKey: ['all-city-surveys-hero'],
    queryFn: () => base44.entities.CitySurvey.list('-date', 50)
  });
  const { data: cities = [] } = useQuery({
    queryKey: ['cities'],
    queryFn: () => base44.entities.City.list()
  });
  const { data: sources = [] } = useQuery({
    queryKey: ['survey-sources'],
    queryFn: () => base44.entities.SurveySource.list()
  });

  const ranked = useMemo(
    () => getMostUncertainCities(surveys, cities, sources),
    [surveys, cities, sources]
  );

  const pick = ranked.length > 0 ? ranked[pickIndex % ranked.length] : null;
  const meta = pick ? tensionMeta(pick.score) : null;

  const handleChange = () => {
    if (ranked.length <= 1) return;
    setPickIndex(i => (i + 1) % ranked.length);
    setAnswered(null);
  };

  const ELECTION_DATE = new Date('2026-03-15T08:00:00');
  const daysLeft = Math.max(0, Math.floor((ELECTION_DATE - new Date()) / 86400000));

  return (
    <section className="relative min-h-screen flex items-center bg-[#060e24] overflow-hidden">
      {/* Bande tricolore */}
      <div className="absolute top-0 left-0 right-0 flex z-30 h-[3px]">
        <div className="flex-1 bg-[#034EA2]" />
        <div className="flex-1 bg-white/90" />
        <div className="flex-1 bg-[#C8102E]" />
      </div>

      {/* Fond image dynamique */}
      {pick?.city.image_url && (
        <div className="absolute inset-0">
          <img
            src={pick.city.image_url}
            alt={pick.city.name}
            className="w-full h-full object-cover blur-[18px] scale-105 opacity-15"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#060e24]/96 via-[#060e24]/88 to-[#060e24]/92" />
        </div>
      )}

      {/* Ambient lights */}
      <div className="absolute top-0 left-1/3 w-[600px] h-[400px] bg-[#034EA2] rounded-full mix-blend-screen filter blur-[200px] opacity-10 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#C8102E] rounded-full mix-blend-screen filter blur-[220px] opacity-8 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-24 w-full relative z-10">
        <div className="grid lg:grid-cols-12 gap-10 items-start">

          {/* ── COL GAUCHE : Positionnement ── */}
          <div className="lg:col-span-5 flex flex-col gap-7">

            {/* Badge + countdown */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.18em] text-white/50 uppercase border border-white/10 px-3 py-1.5 rounded-full">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C8102E] opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#C8102E]" />
                </span>
                Municipales 2026
              </span>
              <span className="text-xs text-white/35 border border-white/8 px-2.5 py-1 rounded-full">
                J-{daysLeft}
              </span>
            </div>

            {/* Titre */}
            <div>
              <h1 className="text-5xl lg:text-[3.5rem] font-extrabold text-white leading-[0.95] tracking-tight mb-4">
                Comprendre.<br />
                <span className="text-[#C8102E]">Anticiper.</span><br />
                Participer.
              </h1>
              <p className="text-white/50 text-[15px] leading-relaxed max-w-xs">
                Tableau de bord citoyen des municipales françaises. Données réelles, projections argumentées, engagement local.
              </p>
            </div>

            {/* 3 piliers */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Comprendre', icon: BookOpen, color: '#034EA2', href: 'Learn', desc: 'Institutions & histoire' },
                { label: 'Anticiper', icon: Target, color: '#C8102E', href: 'Cities', desc: 'Sondages & projections' },
                { label: 'Participer', icon: MapPin, color: '#E1B530', href: 'Leagues', desc: 'Cercles citoyens' },
              ].map((p, i) => (
                <Link key={i} to={createPageUrl(p.href)}>
                  <div className="relative rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm p-3 hover:bg-white/[0.08] transition-all h-full cursor-pointer">
                    <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-xl" style={{ backgroundColor: p.color, opacity: 0.55 }} />
                    <p.icon className="w-4 h-4 mb-1.5" style={{ color: p.color }} />
                    <p className="text-[11px] font-semibold text-white/90">{p.label}</p>
                    <p className="text-[10px] text-white/35 mt-0.5 leading-tight">{p.desc}</p>
                  </div>
                </Link>
              ))}
            </div>

            {/* CTAs principaux */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to={createPageUrl('Methodologie')}>
                <button className="flex items-center justify-center gap-2 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white px-5 py-3 rounded-xl font-medium text-sm transition-all w-full sm:w-auto">
                  <Shield className="w-4 h-4 text-[#E1B530]" />
                  Comment ça fonctionne
                </button>
              </Link>
              <Link to={createPageUrl('Cities')}>
                <button className="flex items-center justify-center gap-2 bg-[#034EA2]/80 hover:bg-[#034EA2] text-white px-5 py-3 rounded-xl font-medium text-sm transition-all w-full sm:w-auto">
                  Voir toutes les villes
                  <ChevronRight className="w-4 h-4" />
                </button>
              </Link>
            </div>
          </div>

          {/* ── COL DROITE : Carte ville la plus incertaine ── */}
          <div className="lg:col-span-7">
            {loadingSurveys || cities.length === 0 ? (
              <div className="bg-white/[0.04] rounded-2xl border border-white/[0.08] h-96 animate-pulse" />
            ) : !pick ? (
              <div className="bg-white/[0.04] rounded-2xl border border-white/[0.08] p-10 text-center">
                <p className="text-white/50 text-sm mb-4">Aucun sondage disponible pour le moment.</p>
                <div className="flex gap-3 justify-center">
                  <Link to={createPageUrl('Cities')}>
                    <button className="bg-[#034EA2] text-white px-4 py-2 rounded-lg text-sm font-medium">Voir les villes</button>
                  </Link>
                  <Link to={createPageUrl('Methodologie')}>
                    <button className="border border-white/20 text-white/70 px-4 py-2 rounded-lg text-sm">Méthodologie</button>
                  </Link>
                </div>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={pick.city.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.35 }}
                  className="bg-white/[0.04] backdrop-blur-xl rounded-2xl border border-white/[0.08] overflow-hidden shadow-2xl shadow-black/30"
                >
                  {/* Header */}
                  <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
                    <span className="text-[11px] font-semibold tracking-[0.15em] text-white/45 uppercase">
                      Ville la plus incertaine — données au {new Date(pick.lastDataAt).toLocaleDateString('fr-FR')}
                    </span>
                    {ranked.length > 1 && (
                      <button
                        onClick={handleChange}
                        className="flex items-center gap-1.5 text-[11px] text-white/35 hover:text-white/65 transition-colors"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Changer
                      </button>
                    )}
                  </div>

                  <div className="p-6 space-y-5">
                    {/* Ville + Indice tension */}
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div>
                        <Link to={`/city/${pick.city.slug}`}>
                          <h2 className="text-3xl font-bold text-white hover:text-[#E1B530] transition-colors cursor-pointer leading-tight">
                            {pick.city.name}
                          </h2>
                        </Link>
                        <p className="text-white/40 text-sm mt-0.5">{pick.city.region}</p>
                      </div>
                      <Link to={createPageUrl('Methodologie')} title="Voir la méthodologie de calcul">
                        <div className={`px-4 py-2.5 rounded-xl border ${meta.border} ${meta.bg} text-center cursor-pointer hover:opacity-80 transition-opacity`}>
                          <div className="text-2xl font-bold leading-none" style={{ color: meta.color }}>{pick.score}</div>
                          <div className="text-[10px] text-white/50 uppercase tracking-wider mt-0.5">{meta.label}</div>
                          <div className="text-[9px] text-white/30 mt-0.5">indice tension*</div>
                        </div>
                      </Link>
                    </div>

                    {/* Barres candidats (top 3) */}
                    <div className="space-y-2.5">
                      {pick.sorted.slice(0, 3).map((c, i) => {
                        const barColor = i === 0 ? '#C8102E' : i === 1 ? '#034EA2' : '#6B7280';
                        return (
                          <div key={i} className="flex items-center gap-3">
                            <div className="w-28 shrink-0">
                              <p className="text-white/85 text-sm font-medium truncate leading-tight">{c.name}</p>
                              <p className="text-white/30 text-[10px] truncate">{c.party}</p>
                            </div>
                            <div className="flex-1 h-5 bg-white/[0.06] rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-700"
                                style={{ width: `${c.percentage}%`, backgroundColor: barColor, opacity: 0.8 }}
                              />
                            </div>
                            <div className="w-14 text-right flex items-center justify-end gap-1">
                              <span className="text-white font-bold text-sm">{c.percentage}%</span>
                              {c.evolution !== undefined && c.evolution !== 0 && (
                                <span className={`text-[10px] ${c.evolution > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                  {c.evolution > 0 ? '+' : ''}{c.evolution}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Méta données */}
                    <div className="flex flex-wrap gap-3 text-[11px] text-white/35 border-t border-white/[0.06] pt-4">
                      <span>
                        Écart #1/#2 : <strong className="text-white/65">{pick.gap.toFixed(1)} pts</strong>
                      </span>
                      <span>
                        Var. 7j : <strong className="text-white/65">
                          {pick.variation7j != null
                            ? `${pick.variation7j > 0 ? '+' : ''}${pick.variation7j.toFixed(1)} pt`
                            : '—'}
                        </strong>
                      </span>
                      {pick.poll.undecided != null && (
                        <span>{pick.poll.undecided}% d'indécis</span>
                      )}
                      {pick.source && (
                        <span>
                          Source : <strong className="text-white/65">{pick.source.institute}</strong>
                          {pick.source.client && ` · ${pick.source.client}`}
                          {pick.source.link && (
                            <a
                              href={pick.source.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#E1B530] hover:underline ml-1 inline-flex items-center gap-0.5"
                            >
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </span>
                      )}
                      {pick.source?.sample_size && (
                        <span>n={pick.source.sample_size}</span>
                      )}
                    </div>

                    {/* Question interactive */}
                    <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4">
                      <p className="text-white/75 text-sm font-medium mb-3 leading-snug">
                        {pick.city.name} est à{' '}
                        <span className="text-[#E1B530] font-bold">{pick.gap.toFixed(1)} points</span>{' '}
                        d'écart. Si la participation augmente, que se passe-t-il ?
                      </p>

                      <AnimatePresence mode="wait">
                        {!answered ? (
                          <motion.div
                            key="choices"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex gap-2"
                          >
                            <button
                              onClick={() => setAnswered('resserre')}
                              className="flex-1 bg-green-900/20 border border-green-500/25 text-green-300/80 hover:bg-green-900/40 hover:text-green-300 text-xs font-medium px-3 py-2.5 rounded-lg transition-all"
                            >
                              L'écart se resserre
                            </button>
                            <button
                              onClick={() => setAnswered('creuse')}
                              className="flex-1 bg-blue-900/20 border border-blue-500/25 text-blue-300/80 hover:bg-blue-900/40 hover:text-blue-300 text-xs font-medium px-3 py-2.5 rounded-lg transition-all"
                            >
                              L'écart se creuse
                            </button>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="answer"
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-3"
                          >
                            <p className="text-white/60 text-xs leading-relaxed">
                              Les deux sont plausibles. L'effet dépend de <em>qui</em> se mobilise davantage. Une participation en hausse peut avantager des électorats habituellement peu mobilisés — mais cela varie fortement selon la composition locale de l'abstention.{' '}
                              <Link to={createPageUrl('Methodologie')} className="text-[#E1B530] hover:underline">
                                Comprendre les facteurs →
                              </Link>
                            </p>
                            <div className="flex gap-2">
                              <Link to={`/city/${pick.city.slug}`} className="flex-1">
                                <button className="w-full bg-[#034EA2]/80 hover:bg-[#034EA2] text-white text-xs font-semibold px-3 py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5">
                                  <BookOpen className="w-3.5 h-3.5" />
                                  Analyser {pick.city.name}
                                </button>
                              </Link>
                              <Link to={`/city/${pick.city.slug}?tab=prediction`} className="flex-1">
                                <button className="w-full bg-[#C8102E]/80 hover:bg-[#C8102E] text-white text-xs font-semibold px-3 py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5">
                                  <Target className="w-3.5 h-3.5" />
                                  Faire ma projection
                                </button>
                              </Link>
                            </div>
                            <button
                              onClick={() => setAnswered(null)}
                              className="text-[10px] text-white/25 hover:text-white/45 transition-colors block"
                            >
                              Recommencer
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Note transparence */}
                    <p className="text-[9px] text-white/22 leading-relaxed">
                      * Indice de tension calculé à partir de : écart entre les deux premiers candidats · présence d'une triangulaire (≥15%) · taux d'indécis.{' '}
                      <Link to={createPageUrl('Methodologie')} className="text-white/35 hover:text-white/55">
                        Méthodologie complète →
                      </Link>
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}