import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { base44 } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowUpRight, Zap, BookOpen, Target, Trophy,
  TrendingUp, TrendingDown, ChevronRight,
  BarChart3, MapPin, Flame
} from 'lucide-react';

// ── Countdown ──────────────────────────────────────────────────────────────
function useCountdown() {
  const [time, setTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    const target = new Date('2026-03-15T08:00:00');
    const tick = () => {
      const diff = target - new Date();
      if (diff <= 0) return;
      setTime({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

const PARTY_COLORS = {
  'PS': '#F59E0B', 'EELV': '#10B981', 'LR': '#2E5BFF',
  'RN': '#1F2937', 'Horizons': '#6366F1', 'RE': '#7C3AED',
  'LFI': '#DC2626', 'SE': '#6B7280', 'LR/RN': '#1E3A8A',
};
const getPartyColor = (p) => PARTY_COLORS[p] || '#6B7280';

const Evolution = ({ v }) => {
  if (!v) return null;
  if (v > 0) return <span className="text-emerald-400 text-[10px] font-mono flex items-center gap-0.5">+{v}<TrendingUp className="w-2.5 h-2.5" /></span>;
  return <span className="text-rose-400 text-[10px] font-mono flex items-center gap-0.5">{v}<TrendingDown className="w-2.5 h-2.5" /></span>;
};

// ── Logo ───────────────────────────────────────────────────────────────────
const PrediciteLogo = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <polygon points="20,2 37,11 37,29 20,38 3,29 3,11" fill="url(#hex-grad)" />
    <defs>
      <linearGradient id="hex-grad" x1="0" y1="0" x2="40" y2="40">
        <stop offset="0%" stopColor="#2E5BFF" />
        <stop offset="50%" stopColor="#7C3AED" />
        <stop offset="100%" stopColor="#10B981" />
      </linearGradient>
    </defs>
    <polyline points="12,26 20,14 25,20 31,12" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <circle cx="31" cy="11" r="2" fill="#F59E0B" />
  </svg>
);

// ── CounterBox ─────────────────────────────────────────────────────────────
const CountBox = ({ value, label }) => (
  <div className="flex flex-col items-center">
    <div className="font-mono text-2xl md:text-3xl font-extrabold text-white tabular-nums leading-none">
      {String(value).padStart(2, '0')}
    </div>
    <div className="text-[9px] uppercase tracking-widest text-white/40 mt-0.5">{label}</div>
  </div>
);

// ── Pill stat ──────────────────────────────────────────────────────────────
const Pill = ({ icon: Icon, label, color }) => (
  <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${color}`}>
    <Icon className="w-3 h-3" />{label}
  </div>
);

// ── Survey mini card (right panel) ────────────────────────────────────────
const SurveyCard = ({ survey, city, source }) => {
  if (!survey) return null;
  const gap = survey.candidates?.length >= 2
    ? (survey.candidates[0].percentage - survey.candidates[1].percentage).toFixed(1)
    : null;

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-white/40 mb-0.5">Sondage · {city?.name}</div>
          <div className="text-white font-semibold text-sm">{source?.institute || '—'}</div>
        </div>
        <div className="text-[10px] text-white/30 font-mono">{survey.date}</div>
      </div>
      <div className="space-y-2">
        {survey.candidates?.slice(0, 3).map((c, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-1.5 h-8 rounded-full" style={{ backgroundColor: getPartyColor(c.party) }} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-white text-xs font-medium truncate">{c.name.split(' ').slice(-1)[0]}</span>
                <div className="flex items-center gap-1">
                  <span className="font-mono text-white font-bold text-sm">{c.percentage}%</span>
                  <Evolution v={c.evolution} />
                </div>
              </div>
              <div className="h-1 bg-white/10 rounded-full overflow-hidden mt-1">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${c.percentage}%`, backgroundColor: getPartyColor(c.party) }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      {gap !== null && (
        <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
          <span className="text-[10px] text-white/40">Écart tête-à-tête</span>
          <span className={`font-mono text-xs font-bold ${parseFloat(gap) <= 5 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {gap < 0 ? '' : '+'}{gap} pts
          </span>
        </div>
      )}
    </div>
  );
};

// ── City mini card (left panel) ────────────────────────────────────────────
const CityMiniCard = ({ city, survey }) => {
  const top = survey?.candidates?.[0];
  const tension = survey?.candidates?.length >= 2
    ? survey.candidates[0].percentage - survey.candidates[1].percentage
    : null;

  return (
    <Link to={createPageUrl('City') + `?slug=${city.slug}`} replace={false}>
      <div className="group relative bg-white/5 border border-white/10 hover:border-[#2E5BFF]/50 rounded-xl p-3 backdrop-blur-md transition-all cursor-pointer overflow-hidden">
        {city.image_url && (
          <div
            className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity bg-cover bg-center"
            style={{ backgroundImage: `url(${city.image_url})` }}
          />
        )}
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-white font-bold text-sm">{city.name}</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-white/30 group-hover:text-[#2E5BFF] transition-colors" />
          </div>
          <div className="text-white/40 text-[10px] mb-2">{city.region}</div>
          {top && (
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getPartyColor(top.party) }} />
              <span className="text-white/60 text-[11px] truncate">{top.name.split(' ').slice(-1)[0]}</span>
              <span className="ml-auto font-mono text-white text-xs font-bold">{top.percentage}%</span>
            </div>
          )}
          {tension !== null && (
            <div className={`mt-1.5 text-[10px] font-mono ${tension <= 5 ? 'text-rose-400' : 'text-emerald-400/70'}`}>
              {tension <= 5 ? '🔴 Très serré' : tension <= 10 ? '🟠 Incertain' : '🟢 Avance nette'}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

// ── Main Hero ──────────────────────────────────────────────────────────────
export default function PredicitéHero() {
  const countdown = useCountdown();

  const { data: cities = [] } = useQuery({
    queryKey: ['cities'],
    queryFn: () => base44.entities.City.list()
  });

  const { data: citySurveys = [] } = useQuery({
    queryKey: ['city-surveys-hero'],
    queryFn: () => base44.entities.CitySurvey.list('-date', 20)
  });

  const { data: surveyStats } = useQuery({
    queryKey: ['survey-stats'],
    queryFn: async () => {
      const res = await base44.functions.invoke('getSurveyStats', {});
      return res.data;
    }
  });

  const { data: surveySources = [] } = useQuery({
    queryKey: ['survey-sources-hero'],
    queryFn: () => base44.entities.SurveySource.list()
  });

  // Derniers sondages par ville (1 par ville)
  const latestByCity = useMemo(() => {
    const map = {};
    for (const s of citySurveys) {
      if (!map[s.city_id]) map[s.city_id] = s;
    }
    return map;
  }, [citySurveys]);

  const featuredSurvey = citySurveys[0];
  const featuredCity = cities.find(c => c.id === featuredSurvey?.city_id);
  const featuredSource = surveySources.find(s => s.id === featuredSurvey?.survey_source_id);

  // Villes avec sondages, triées par tension (les plus serrées en premier)
  const citiesWithSurveys = useMemo(() => {
    return cities
      .filter(c => latestByCity[c.id])
      .map(c => ({ city: c, survey: latestByCity[c.id] }))
      .sort((a, b) => {
        const gapA = a.survey.candidates?.length >= 2
          ? a.survey.candidates[0].percentage - a.survey.candidates[1].percentage : 99;
        const gapB = b.survey.candidates?.length >= 2
          ? b.survey.candidates[0].percentage - b.survey.candidates[1].percentage : 99;
        return gapA - gapB;
      })
      .slice(0, 4);
  }, [cities, latestByCity]);

  return (
    <div className="relative min-h-[calc(100vh-56px)] bg-[#060e24] overflow-hidden flex flex-col">
      {/* Background ambiance */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#2E5BFF]/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-[#7C3AED]/10 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#10B981]/5 rounded-full blur-[80px]" />
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
      </div>

      {/* Top bar: logo + countdown + pills */}
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4 px-6 md:px-12 pt-8 pb-4">
        <div className="flex items-center gap-3">
          <PrediciteLogo size={36} />
          <div>
            <div className="font-extrabold text-white text-lg leading-none">PrédiCité</div>
            <div className="text-[10px] text-white/40 tracking-widest uppercase">Élections Municipales 2026</div>
          </div>
        </div>

        <div className="flex items-center gap-1 px-4 py-2 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
          <Flame className="w-4 h-4 text-[#F59E0B] mr-1" />
          <CountBox value={countdown.days} label="jours" />
          <span className="text-white/30 font-mono text-xl mx-1">:</span>
          <CountBox value={countdown.hours} label="heures" />
          <span className="text-white/30 font-mono text-xl mx-1">:</span>
          <CountBox value={countdown.minutes} label="min" />
          <span className="text-white/30 font-mono text-xl mx-1">:</span>
          <CountBox value={countdown.seconds} label="sec" />
        </div>

        <div className="hidden md:flex items-center gap-2">
          <Pill icon={MapPin} label={`${cities.length} villes`} color="border-[#2E5BFF]/40 text-[#2E5BFF] bg-[#2E5BFF]/10" />
          <Pill icon={BarChart3} label={surveyStats ? `${surveyStats.total_surveys} sondages` : '… sondages'} color="border-[#7C3AED]/40 text-[#7C3AED] bg-[#7C3AED]/10" />
          <Pill icon={Trophy} label="Live" color="border-[#F59E0B]/40 text-[#F59E0B] bg-[#F59E0B]/10" />
        </div>
      </div>

      {/* ── SPLIT SCREEN ────────────────────────────────────────────── */}
      <div className="relative z-10 flex-1 grid md:grid-cols-2 gap-0 px-6 md:px-12 pb-8 pt-4">

        {/* LEFT PANEL */}
        <div className="flex flex-col pr-0 md:pr-6 border-r border-white/0 md:border-white/10">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-5 h-5 rounded-md bg-gradient-to-br from-[#2E5BFF] to-[#7C3AED] flex items-center justify-center">
              <Target className="w-3 h-3 text-white" />
            </div>
            <span className="text-[11px] uppercase tracking-widest text-white/50 font-semibold">Pronostiquer</span>
            <div className="flex-1 h-px bg-gradient-to-r from-[#2E5BFF]/30 to-transparent" />
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white leading-tight mb-2">
              Les villes les plus{' '}
              <span className="bg-gradient-to-r from-[#2E5BFF] via-[#7C3AED] to-[#10B981] bg-clip-text text-transparent">
                incertaines
              </span>
            </h1>
            <p className="text-white/50 text-sm mb-5 leading-relaxed">
              Analysez les sondages en temps réel. Faites vos pronostics. Montez dans le classement.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 gap-3 mb-5">
            {citiesWithSurveys.map(({ city, survey }, i) => (
              <motion.div
                key={city.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.07 }}
              >
                <CityMiniCard city={city} survey={survey} />
              </motion.div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-auto">
            <Link to={createPageUrl('Cities')} className="flex-1">
              <button className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm text-white
                bg-gradient-to-r from-[#2E5BFF] to-[#7C3AED] hover:from-[#2550e0] hover:to-[#6d30d4] transition-all shadow-lg shadow-[#2E5BFF]/20">
                <MapPin className="w-4 h-4" />
                Explorer les villes
              </button>
            </Link>
            <Link to={createPageUrl('Surveys')} className="flex-1">
              <button className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm text-white/80
                bg-white/5 border border-white/15 hover:bg-white/10 hover:text-white transition-all">
                <BarChart3 className="w-4 h-4" />
                Tous les sondages
              </button>
            </Link>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="flex flex-col pl-0 md:pl-6 mt-8 md:mt-0">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-5 h-5 rounded-md bg-gradient-to-br from-[#10B981] to-[#F59E0B] flex items-center justify-center">
              <BookOpen className="w-3 h-3 text-white" />
            </div>
            <span className="text-[11px] uppercase tracking-widest text-white/50 font-semibold">Comprendre</span>
            <div className="flex-1 h-px bg-gradient-to-r from-[#10B981]/30 to-transparent" />
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white leading-tight mb-2">
              Sondage{' '}
              <span className="bg-gradient-to-r from-[#10B981] to-[#F59E0B] bg-clip-text text-transparent">
                en direct
              </span>
            </h2>
            <p className="text-white/50 text-sm mb-5 leading-relaxed">
              Données issues d'instituts agréés. Comprenez les méthodes, lisez les marges d'erreur.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="mb-4">
            <SurveyCard survey={featuredSurvey} city={featuredCity} source={featuredSource} />
          </motion.div>

          <div className="grid grid-cols-3 gap-2 mb-5">
            {[
              { icon: Target, label: 'Prédire', sub: 'Pronostics', grad: 'from-[#2E5BFF] to-[#7C3AED]', page: 'Cities' },
              { icon: BookOpen, label: 'Apprendre', sub: 'Institutions', grad: 'from-[#10B981] to-[#2E5BFF]', page: 'Learn' },
              { icon: Trophy, label: 'Concourir', sub: 'Classement', grad: 'from-[#F59E0B] to-[#7C3AED]', page: 'Leaderboard' },
            ].map(({ icon: Icon, label, sub, grad, page }, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.07 }}
              >
                <Link to={createPageUrl(page)}>
                  <div className={`relative bg-gradient-to-br ${grad} p-[1px] rounded-xl group cursor-pointer`}>
                    <div className="bg-[#0a1628] group-hover:bg-[#0a1628]/80 rounded-[11px] p-3 transition-all text-center">
                      <Icon className="w-5 h-5 mx-auto mb-1 text-white/70" />
                      <div className="text-white font-bold text-xs">{label}</div>
                      <div className="text-white/40 text-[10px]">{sub}</div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          <div className="mt-auto flex gap-3">
            <Link to={createPageUrl('Quiz')} className="flex-1">
              <button className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm text-white
                bg-gradient-to-r from-[#10B981] to-[#2E5BFF] hover:opacity-90 transition-all shadow-lg shadow-[#10B981]/15">
                <Zap className="w-4 h-4" />
                Quiz du jour
              </button>
            </Link>
            <Link to={createPageUrl('Leaderboard')} className="flex-1">
              <button className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm text-white/80
                bg-white/5 border border-white/15 hover:bg-white/10 hover:text-white transition-all">
                <Trophy className="w-4 h-4" />
                Classement
              </button>
            </Link>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#060e24] to-transparent pointer-events-none" />
      <div className="relative z-10 flex justify-center pb-4">
        <div className="h-0.5 w-24 bg-gradient-to-r from-[#2E5BFF] via-[#7C3AED] to-[#10B981] rounded-full opacity-50" />
      </div>
    </div>
  );
}