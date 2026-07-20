import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/client';
import { 
  ChevronRight, Activity, BookOpen, LineChart, Vote, MapPin, BarChart3
} from 'lucide-react';
import HeroUserScore from './HeroUserScore';
import ObservatoryAction from './ObservatoryAction';

const ELECTION_DATE = new Date('2026-03-15T08:00:00');

// LIVE_DATA supprimé — hardcode interdit (audit P0)

function useCountdown() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    const calc = () => {
      const diff = ELECTION_DATE - new Date();
      if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      return {
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff / 3600000) % 24),
        minutes: Math.floor((diff / 60000) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      };
    };
    setTimeLeft(calc());
    const t = setInterval(() => setTimeLeft(calc()), 1000);
    return () => clearInterval(t);
  }, []);
  return timeLeft;
}

function calcGap(candidates) {
  if (!Array.isArray(candidates) || candidates.length < 2) return null;
  const sorted = [...candidates]
    .filter(c => typeof c.percentage === 'number')
    .sort((a, b) => b.percentage - a.percentage);
  if (sorted.length < 2) return null;
  return parseFloat((sorted[0].percentage - sorted[1].percentage).toFixed(1));
}

export default function RepublicanHero() {
  const [user, setUser] = useState(null);
  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: userProgress } = useQuery({
    queryKey: ['hero-user-progress', user?.email],
    queryFn: async () => {
      const p = await base44.entities.UserProgress.filter({ user_email: user.email });
      return p[0] || null;
    },
    enabled: !!user?.email
  });

  // Données réelles : derniers sondages + villes (Observatoire)
  const { data: recentSurveys = [] } = useQuery({
    queryKey: ['hero-recent-surveys'],
    queryFn: () => base44.entities.CitySurvey.list('-date', 10)
  });
  const { data: allCities = [] } = useQuery({
    queryKey: ['cities'],
    queryFn: () => base44.entities.City.list()
  });
  const { data: allSources = [] } = useQuery({
    queryKey: ['survey-sources'],
    queryFn: () => base44.entities.SurveySource.list()
  });

  // Construire les lignes de l'Observatoire depuis la DB
  const observatoryRows = (() => {
    const cityMap = Object.fromEntries(allCities.map(c => [c.id, c]));
    const sourceMap = Object.fromEntries(allSources.map(s => [s.id, s]));
    const latestByCity = {};
    for (const s of recentSurveys) {
      if (!latestByCity[s.city_id] || s.date > latestByCity[s.city_id].date)
        latestByCity[s.city_id] = s;
    }
    return Object.values(latestByCity)
      .filter(s => cityMap[s.city_id] && Array.isArray(s.candidates) && s.candidates.length >= 2)
      .map(s => {
        const city = cityMap[s.city_id];
        const source = sourceMap[s.survey_source_id];
        const gap = calcGap(s.candidates);
        return { city, source, gap, date: s.date };
      })
      .filter(r => r.gap !== null)
      .sort((a, b) => a.gap - b.gap) // les plus serrés en premier
      .slice(0, 3);
  })();

  // Indice tension national = moyenne des gaps les plus serrés (inversé)
  const nationalTensionScore = (() => {
    if (observatoryRows.length === 0) return null;
    const avgGap = observatoryRows.reduce((acc, r) => acc + r.gap, 0) / observatoryRows.length;
    return Math.round(Math.max(0, Math.min(100, 100 - avgGap * 3)));
  })();

  const countdown = useCountdown();

  const titleWords = [
    { text: 'Comprendre.', color: 'text-white' },
    { text: 'Pronostiquer.', color: 'text-[#C8102E]' },
    { text: 'Voter.', color: 'text-white' },
  ];

  return (
    <section className="relative min-h-[100vh] flex items-center bg-[#060e24] overflow-hidden">
      {/* Bande tricolore fine */}
      <div className="absolute top-0 left-0 right-0 flex z-30 h-[3px]">
        <div className="flex-1 bg-[#034EA2]" />
        <div className="flex-1 bg-white/90" />
        <div className="flex-1 bg-[#C8102E]" />
      </div>

      {/* Image de fond — desktop */}
      <div className="absolute inset-0 hidden md:block">
        <img
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6984c3b23a32fca616326712/aaa5485bd_ChatGPTImage25fvr202622_41_12.png"
          alt="Hôtel de Ville"
          className="w-full h-full object-cover scale-110 blur-[14px]"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#060e24]/85 via-[#060e24]/75 to-[#060e24]/90" />
      </div>

      {/* Ambient light — cinématique */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#034EA2] rounded-full mix-blend-screen filter blur-[180px] opacity-15" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-[#C8102E] rounded-full mix-blend-screen filter blur-[200px] opacity-10" />
      <div className="absolute top-1/3 left-0 w-[300px] h-[300px] bg-[#E1B530] rounded-full mix-blend-screen filter blur-[120px] opacity-8" />

      {/* Grain subtil */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10 py-20">
        
        {/* Countdown immersif — bandeau supérieur */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C8102E] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C8102E]"></span>
            </span>
            <span className="text-xs font-semibold tracking-[0.2em] text-white/70 uppercase">
              Élections municipales 2026
            </span>
          </div>

          <div className="flex items-center gap-2">
            {[
              { val: countdown.days, label: 'J' },
              { val: countdown.hours, label: 'H' },
              { val: countdown.minutes, label: 'M' },
              { val: countdown.seconds, label: 'S' },
            ].map((unit, i) => (
              <React.Fragment key={unit.label}>
                {i > 0 && <span className="text-white/20 text-lg font-light">:</span>}
                <div className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 min-w-[48px] text-center backdrop-blur-sm">
                  <span className="text-xl font-bold text-white tabular-nums font-mono">
                    {String(unit.val).padStart(2, '0')}
                  </span>
                  <span className="text-[10px] text-white/40 ml-0.5 uppercase">{unit.label}</span>
                </div>
              </React.Fragment>
            ))}
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Colonne gauche — Contenu principal */}
          <div className="lg:col-span-7 flex flex-col">
            
            {/* Titre séquentiel */}
            <div className="mb-8">
              {titleWords.map((word, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -40, filter: 'blur(8px)' }}
                  animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                  transition={{ duration: 0.7, delay: 0.3 + i * 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                >
                  <span className={`block text-6xl sm:text-7xl lg:text-8xl font-extrabold tracking-tight leading-[0.95] ${word.color}`}>
                    {word.text}
                  </span>
                </motion.div>
              ))}
            </div>

            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 1.1 }}
              className="text-lg text-white/55 mb-10 max-w-xl leading-relaxed"
            >
              Le tableau de bord citoyen des municipales françaises. Sondages en temps réel, prédictions et engagement civique.
            </motion.p>

            {/* Triple-pilier — glass cards */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.3 }}
              className="grid grid-cols-3 gap-3 mb-8"
            >
              {[
                { icon: BookOpen, label: 'Comprendre', desc: 'Institutions & contexte', color: '#034EA2', href: 'Learn' },
                { icon: LineChart, label: 'Pronostiquer', desc: 'Prédictions & scores', color: '#C8102E', href: 'Cities' },
                { icon: Vote, label: 'Voter', desc: 'Participation citoyenne', color: '#E1B530', href: 'Cities' },
              ].map((item, i) => (
                <Link key={i} to={createPageUrl(item.href)} className="group">
                  <div className="relative rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm p-4 hover:bg-white/[0.08] transition-all duration-300 overflow-hidden h-full">
                    <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ backgroundColor: item.color, opacity: 0.5 }} />
                    <item.icon className="w-5 h-5 mb-2" style={{ color: item.color }} />
                    <p className="text-sm font-semibold text-white/90 mb-0.5">{item.label}</p>
                    <p className="text-xs text-white/40">{item.desc}</p>
                  </div>
                </Link>
              ))}
            </motion.div>

            {/* CTA */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.5 }}
              className="flex flex-col sm:flex-row gap-3"
            >
              <Link to={createPageUrl('Cities')}>
                <button className="flex items-center justify-center gap-2.5 bg-[#C8102E] hover:bg-[#d91a3a] text-white px-8 py-4 rounded-xl font-semibold text-base transition-all duration-200 shadow-xl shadow-[#C8102E]/20 hover:shadow-2xl hover:shadow-[#C8102E]/30 w-full sm:w-auto">
                  Faire une prédiction
                  <ChevronRight className="w-5 h-5" />
                </button>
              </Link>
              <Link to={createPageUrl('Learn')}>
                <button className="flex items-center justify-center gap-2.5 bg-white/[0.04] hover:bg-white/[0.08] text-white border border-white/10 px-8 py-4 rounded-xl font-semibold text-base transition-all duration-200 w-full sm:w-auto">
                  <MapPin className="w-5 h-5 text-white/60" />
                  Explorer
                </button>
              </Link>
            </motion.div>

            {/* Score utilisateur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.8 }}
            >
              <HeroUserScore userProgress={userProgress} user={user} />
            </motion.div>
          </div>

          {/* Colonne droite — Module Observatoire LIVE */}
          <motion.div 
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="lg:col-span-5 w-full"
          >
            <div className="bg-white/[0.04] backdrop-blur-xl rounded-2xl border border-white/[0.08] overflow-hidden shadow-2xl shadow-black/30">
              {/* Header */}
              <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Activity className="w-5 h-5 text-[#034EA2]" />
                  <span className="font-semibold text-white text-sm tracking-wide">Observatoire</span>
                </div>
                {observatoryRows.length > 0 && (
                  <span className="text-[11px] font-mono text-white/30">
                    {new Date(observatoryRows[0].date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                  </span>
                )}
              </div>

              {/* Indice tension — basé données réelles DB */}
              <div className="p-6">
                {nationalTensionScore !== null ? (
                  <div className="bg-gradient-to-br from-white/[0.04] to-transparent rounded-xl p-5 border border-white/[0.05] mb-5">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className="text-[11px] text-white/40 uppercase tracking-[0.15em] font-medium">Indice de tension</span>
                        <p className="text-xs text-white/30 mt-0.5">{observatoryRows.length} scrutin{observatoryRows.length > 1 ? 's' : ''} calculé{observatoryRows.length > 1 ? 's' : ''}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-4xl font-bold text-[#E1B530]">{nationalTensionScore}</span>
                        <span className="text-sm text-white/25 ml-0.5">/100</span>
                      </div>
                    </div>
                    <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-green-500/80 via-[#E1B530] to-[#C8102E]"
                        initial={{ width: 0 }}
                        animate={{ width: `${nationalTensionScore}%` }}
                        transition={{ duration: 1.2, ease: 'easeOut' }}
                      />
                    </div>
                    <div className="flex justify-between mt-2">
                      <span className="text-[10px] text-white/25">Calme</span>
                      <span className="text-[10px] text-[#E1B530]/70 font-medium">Scrutin serré</span>
                      <span className="text-[10px] text-white/25">Tendu</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.05] mb-5 text-center">
                    <p className="text-white/35 text-xs">Indice indisponible — données en cours d'intégration</p>
                  </div>
                )}

                {/* Tableau Observatoire — données réelles */}
                {observatoryRows.length > 0 ? (
                  <div className="space-y-1.5">
                    <div className="grid grid-cols-3 text-[10px] uppercase tracking-[0.15em] text-white/25 px-3 mb-1">
                      <div>Ville</div>
                      <div className="text-center">Écart</div>
                      <div className="text-right">Source</div>
                    </div>
                    {observatoryRows.map((row, idx) => (
                      <Link key={idx} to={`/city/${row.city.slug}`}>
                        <div className="grid grid-cols-3 items-center bg-white/[0.03] hover:bg-white/[0.06] transition-colors rounded-lg px-3 py-2.5 cursor-pointer">
                          <div className="text-white/80 font-medium text-sm truncate">{row.city.name}</div>
                          <div className="text-center font-mono text-sm font-semibold text-[#E1B530]">
                            {row.gap.toFixed(1)} pt
                          </div>
                          <div className="text-right text-white/30 text-xs truncate">
                            {row.source?.institute || '—'}
                          </div>
                        </div>
                      </Link>
                    ))}
                    <p className="text-[10px] text-white/20 text-center pt-1">
                      Écart #1/#2 · <Link to={createPageUrl('Methodologie')} className="hover:text-white/40">Méthodologie</Link>
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-white/30 text-xs mb-3">Aucune donnée disponible</p>
                    <Link to={createPageUrl('Surveys')}>
                      <button className="text-xs text-white/50 hover:text-white/70 flex items-center gap-1 mx-auto">
                        <BarChart3 className="w-3 h-3" />
                        Voir les sondages
                      </button>
                    </Link>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-3 border-t border-white/[0.05]">
                <Link to={createPageUrl('Surveys')} className="text-xs text-white/40 hover:text-white/70 flex items-center justify-center gap-1 transition-colors">
                  Tous les sondages <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* Actions contextuelles */}
            <ObservatoryAction />
          </motion.div>
        </div>

        {/* Ligne décorative basse */}
        <motion.div 
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1.5, delay: 2 }}
          className="mt-16 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"
        />
      </div>
    </section>
  );
}