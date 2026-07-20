import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Zap, BarChart3, TrendingUp, Users, MapPin } from 'lucide-react';

const CITY_POS = {
  'paris':         { x: 52, y: 26 },
  'marseille':     { x: 62, y: 78 },
  'lyon':          { x: 62, y: 56 },
  'toulouse':      { x: 40, y: 73 },
  'nice':          { x: 74, y: 73 },
  'bordeaux':      { x: 25, y: 65 },
  'strasbourg':    { x: 80, y: 22 },
  'lille':         { x: 52, y: 10 },
  'nantes':        { x: 22, y: 44 },
  'grenoble':      { x: 68, y: 60 },
  'montpellier':   { x: 55, y: 78 },
  'rennes':        { x: 18, y: 30 },
  'le-havre':      { x: 35, y: 16 },
  'toulon':        { x: 68, y: 80 },
  'reims':         { x: 60, y: 22 },
  'saint-etienne': { x: 58, y: 62 },
  'dijon':         { x: 65, y: 40 },
  'angers':        { x: 28, y: 42 },
};

const PARTY_COLORS = {
  PS: '#F59E0B', EELV: '#22C55E', LR: '#3B82F6',
  RN: '#9CA3AF', UDR: '#9CA3AF', Horizons: '#A78BFA',
  RE: '#A78BFA', LFI: '#EF4444',
};

function getLeaderColor(party) {
  for (const [k, v] of Object.entries(PARTY_COLORS)) {
    if (party?.toUpperCase().includes(k)) return v;
  }
  return '#6B7280';
}

function getTension(poll) {
  if (!poll?.results || poll.results.length < 2) return 0;
  const gap = poll.results[0].percentage - poll.results[1].percentage;
  if (gap <= 2) return 4;
  if (gap <= 5) return 3;
  if (gap <= 10) return 2;
  if (gap <= 20) return 1;
  return 0;
}

const T_COLOR = ['#4B5563', '#3B82F6', '#D4A017', '#E07B1A', '#C8102E'];
const T_LABEL = ['Faible', 'Modérée', 'Élevée', 'Très élevée', 'Extrême'];

const FRANCE_PATH = "M28 5 L38 4 L52 8 L62 5 L75 10 L82 15 L85 22 L80 28 L82 35 L78 42 L80 50 L75 58 L72 65 L75 72 L70 80 L60 85 L50 88 L40 82 L28 80 L18 72 L10 62 L8 50 L12 38 L8 28 L12 18 L20 12 Z";

function useCountdown(target) {
  const [t, setT] = useState({ d: 0, h: 0, m: 0, s: 0 });
  useEffect(() => {
    const tick = () => {
      const diff = new Date(target) - new Date();
      if (diff <= 0) return;
      setT({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);
  return t;
}

function CountDigit({ value }) {
  return (
    <motion.span
      key={value}
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="inline-block"
    >
      {String(value).padStart(2, '0')}
    </motion.span>
  );
}

export default function HomeHeroV2() {
  const countdown = useCountdown('2026-03-15T08:00:00');
  const [hoveredCity, setHoveredCity] = useState(null);
  const [activeCity, setActiveCity] = useState(null);

  const { data: cities = [] } = useQuery({ queryKey: ['cities'], queryFn: () => base44.entities.City.list() });
  const { data: polls = [] } = useQuery({ queryKey: ['real-polls-hero'], queryFn: () => base44.entities.RealPoll.list('-publication_date', 80) });
  const { data: pollSources = [] } = useQuery({ queryKey: ['poll-sources'], queryFn: () => base44.entities.PollSource.list() });
  const { data: userProgress = [] } = useQuery({ queryKey: ['user-progress-count'], queryFn: () => base44.entities.UserProgress.list('-last_activity_date', 200) });

  const latestPollByCity = useMemo(() => {
    const map = {};
    for (const p of polls) {
      if (p.scope !== 'city' || p.is_active === false) continue;
      if (!map[p.city_id] || new Date(p.publication_date) > new Date(map[p.city_id].publication_date)) map[p.city_id] = p;
    }
    return map;
  }, [polls]);

  const cityNodes = useMemo(() => cities.map(city => {
    const pos = CITY_POS[city.slug];
    if (!pos) return null;
    const poll = latestPollByCity[city.id];
    const tension = getTension(poll);
    const leaderColor = poll?.results?.[0] ? getLeaderColor(poll.results[0].party) : '#374151';
    return { city, pos, poll, tension, leaderColor };
  }).filter(Boolean), [cities, latestPollByCity]);

  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
  const activeUsersCount = userProgress.filter(u => u.last_activity_date >= weekAgo).length;
  const tensionHigh = cityNodes.filter(n => n.tension >= 3).length;

  const focusNode = activeCity
    ? cityNodes.find(n => n.city.id === activeCity)
    : hoveredCity ? cityNodes.find(n => n.city.id === hoveredCity) : null;
  const focusPoll = focusNode?.poll;
  const focusSource = focusPoll ? pollSources.find(s => s.id === focusPoll.poll_source_id) : null;

  return (
    <div className="relative min-h-[92vh] flex flex-col justify-center overflow-hidden" style={{ background: 'var(--p-night)' }}>

      {/* Fond photo */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1569974495028-a0a09ec2e4a0?w=1800&q=80"
          alt=""
          className="w-full h-full object-cover object-center"
          style={{ opacity: 0.08 }}
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(5,10,24,0.7), rgba(5,10,24,0.95))' }} />
      </div>

      {/* Grille subtile */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, var(--p-blue) 1px, transparent 0)', backgroundSize: '40px 40px' }}
      />

      {/* Bande tricolore */}
      <div className="absolute top-0 left-0 right-0 z-20 p-tricolor">
        <div /><div /><div />
      </div>

      {/* Contenu */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex justify-center mb-10"
        >
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full"
            style={{ background: 'var(--p-gold-dim)', border: '0.5px solid var(--p-gold-border)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--p-gold)' }} />
            <span className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--p-gold)', fontFamily: 'var(--font-body)' }}>
              Élections Municipales · 15 & 22 mars 2026
            </span>
          </div>
        </motion.div>

        {/* Layout 3 colonnes */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px_1fr] gap-8 items-center">

          {/* GAUCHE — Titre + CTAs */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="flex flex-col gap-6"
          >
            <div>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="p-display"
                style={{ fontSize: 'clamp(3rem, 7vw, 5.5rem)', color: 'var(--p-gold)', fontFamily: 'var(--font-display)' }}
              >
                PrédiCité
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.2 }}
                className="p-body mt-4 max-w-sm"
              >
                Le jeu civique pour anticiper les élections municipales.
                Données réelles, pronostics, classement citoyen.
              </motion.p>
            </div>

            {/* Stats live */}
            <div className="flex flex-wrap gap-2">
              {[
                { icon: BarChart3, value: polls.length, label: 'sondages réels', color: 'var(--p-blue)' },
                { icon: Zap,       value: tensionHigh,  label: 'villes en tension', color: 'var(--p-red)' },
                { icon: Users,     value: activeUsersCount || '—', label: 'analystes actifs', color: 'var(--p-green)' },
              ].map(({ icon: Icon, value, label, color }) => (
                <div
                  key={label}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl"
                  style={{ background: 'rgba(245,240,232,0.04)', border: '0.5px solid var(--p-border)' }}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" style={{ color }} />
                  <span className="p-mono text-sm" style={{ color: 'var(--p-text)' }}>{value}</span>
                  <span className="text-xs" style={{ color: 'var(--p-text-40)' }}>{label}</span>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <motion.div
              className="flex flex-col sm:flex-row gap-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.35 }}
            >
              <Link to={createPageUrl('Predictions')}>
                <button className="p-btn-primary flex items-center gap-2 text-sm uppercase tracking-wide">
                  <TrendingUp className="w-4 h-4" />
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>Faire mon pronostic</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </Link>
              <Link to={createPageUrl('Learn')}>
                <button className="p-btn-gold flex items-center gap-2 text-sm">
                  <BarChart3 className="w-4 h-4" />
                  Comprendre les municipales
                </button>
              </Link>
            </motion.div>
          </motion.div>

          {/* CENTRE — Carte + Countdown */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="flex flex-col items-center gap-4"
          >
            {/* Countdown */}
            <div
              className="w-full rounded-2xl p-5 text-center"
              style={{ background: 'var(--p-card)', border: '0.5px solid var(--p-border)' }}
            >
              <p className="text-[10px] uppercase tracking-[0.2em] mb-3 font-semibold" style={{ color: 'var(--p-text-25)' }}>
                1er tour dans
              </p>
              <div className="flex items-end justify-center gap-2">
                {[
                  { v: countdown.d, l: 'j' },
                  { v: countdown.h, l: 'h' },
                  { v: countdown.m, l: 'm' },
                  { v: countdown.s, l: 's' },
                ].map(({ v, l }, i) => (
                  <div key={l} className="flex items-end gap-2">
                    {i > 0 && <span className="font-mono text-3xl mb-2" style={{ color: 'var(--p-text-25)' }}>:</span>}
                    <div className="flex flex-col items-center">
                      <span className="p-mono text-4xl leading-none" style={{ fontFamily: 'var(--font-mono)', fontSize: '2.2rem' }}>
                        <CountDigit value={v} />
                      </span>
                      <span className="text-[9px] uppercase tracking-widest mt-1" style={{ color: 'var(--p-text-25)' }}>{l}</span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] mt-3" style={{ color: 'var(--p-text-25)' }}>2e tour · 22 mars 2026</p>
            </div>

            {/* Carte interactive */}
            <div
              className="w-full rounded-2xl overflow-hidden relative"
              style={{ background: 'var(--p-card)', border: '0.5px solid var(--p-border)' }}
            >
              <svg viewBox="0 0 100 100" className="w-full" style={{ height: 260 }}>
                {[25, 50, 75].map(v => (
                  <g key={v}>
                    <line x1={v} y1="0" x2={v} y2="100" stroke="rgba(245,240,232,0.03)" strokeWidth="0.4" />
                    <line x1="0" y1={v} x2="100" y2={v} stroke="rgba(245,240,232,0.03)" strokeWidth="0.4" />
                  </g>
                ))}
                <path d={FRANCE_PATH} fill="rgba(43,92,230,0.08)" stroke="rgba(43,92,230,0.15)" strokeWidth="0.4" />
                {cityNodes.map(({ city, pos, poll, tension, leaderColor }) => {
                  const tc = T_COLOR[tension];
                  const isHov = hoveredCity === city.id;
                  const isAct = activeCity === city.id;
                  const r = tension >= 3 ? 2.6 : tension >= 1 ? 2.1 : 1.7;
                  return (
                    <g
                      key={city.id}
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={() => setHoveredCity(city.id)}
                      onMouseLeave={() => setHoveredCity(null)}
                      onClick={() => setActiveCity(isAct ? null : city.id)}
                    >
                      {tension >= 3 && <circle cx={pos.x} cy={pos.y} r={r + 3} fill="none" stroke={tc} strokeWidth="0.5" opacity="0.3" />}
                      {(isHov || isAct) && <circle cx={pos.x} cy={pos.y} r={r + 2} fill="none" stroke="white" strokeWidth="0.7" />}
                      <circle cx={pos.x} cy={pos.y} r={r} fill={leaderColor} stroke={tc} strokeWidth="0.7" opacity={isHov || isAct ? 1 : 0.82} />
                      <text x={pos.x} y={pos.y - r - 1.2} textAnchor="middle" fill="rgba(245,240,232,0.7)" fontSize="2.1" fontFamily="Inter,sans-serif" style={{ pointerEvents: 'none' }}>
                        {city.name}
                      </text>
                      {poll?.results?.length >= 2 && (
                        <text x={pos.x} y={pos.y + r + 2.8} textAnchor="middle" fill={tc} fontSize="1.7" fontFamily="monospace" opacity="0.85" style={{ pointerEvents: 'none' }}>
                          Δ{Math.abs(poll.results[0].percentage - poll.results[1].percentage).toFixed(0)}%
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>
              <div className="flex items-center justify-center gap-3 px-3 py-2 flex-wrap" style={{ borderTop: '0.5px solid var(--p-border)' }}>
                {[4, 3, 2].map(t => (
                  <div key={t} className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: T_COLOR[t] }} />
                    <span className="text-[9px]" style={{ color: 'var(--p-text-25)' }}>{T_LABEL[t]}</span>
                  </div>
                ))}
              </div>
              <div className="pb-2 text-center">
                <span className="text-[9px]" style={{ color: 'var(--p-text-25)' }}>Cliquez une ville · Δ = écart 1er/2e</span>
              </div>
            </div>

            <Link to={createPageUrl('PollMap')} className="text-[11px] flex items-center gap-1 transition" style={{ color: 'var(--p-blue)' }}>
              Carte complète <ChevronRight className="w-3 h-3" />
            </Link>
          </motion.div>

          {/* DROITE — Panel ville */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <AnimatePresence mode="wait">
              {focusNode ? (
                <motion.div
                  key={focusNode.city.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.22 }}
                  className="rounded-2xl overflow-hidden"
                  style={{ background: 'var(--p-card)', border: '0.5px solid var(--p-border)' }}
                >
                  <div className="relative h-28 overflow-hidden">
                    <img
                      src={focusNode.city.image_url || 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=500'}
                      alt={focusNode.city.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, var(--p-night), transparent)' }} />
                    <button
                      onClick={() => setActiveCity(null)}
                      aria-label="Fermer le panneau ville"
                      className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center text-sm"
                      style={{ background: 'rgba(0,0,0,0.5)', color: 'var(--p-text-60)' }}
                    >×</button>
                    <div className="absolute bottom-2 left-3">
                      <p className="p-title text-lg" style={{ color: 'var(--p-text)' }}>{focusNode.city.name}</p>
                      <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--p-text-40)' }}>
                        <MapPin className="w-2.5 h-2.5" />{focusNode.city.region}
                      </div>
                    </div>
                    <div
                      className="absolute top-2 left-3 p-badge"
                      style={{ background: T_COLOR[focusNode.tension] + '25', color: T_COLOR[focusNode.tension], borderColor: T_COLOR[focusNode.tension] + '40' }}
                    >
                      {T_LABEL[focusNode.tension]}
                    </div>
                  </div>

                  {focusPoll ? (
                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--p-gold)' }}>
                          {focusSource?.short_name || 'Sondage'}
                        </span>
                        <span className="text-[10px]" style={{ color: 'var(--p-text-25)' }}>
                          {new Date(focusPoll.publication_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {(focusPoll.results || []).slice(0, 4).map((r, i) => {
                          const color = getLeaderColor(r.party);
                          const max = focusPoll.results[0]?.percentage || 1;
                          const pct = Math.max(0, Math.min(100, (r.percentage / max) * 100));
                          const lastName = r.candidate?.trim().split(' ').pop() || '';
                          return (
                            <div key={i} className="flex items-center gap-2">
                              <span className="text-xs w-20 shrink-0 overflow-hidden" style={{ color: 'var(--p-text-60)', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                                {lastName} <span style={{ color: 'var(--p-text-25)' }}>({r.party})</span>
                              </span>
                              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--p-text-10)' }}>
                                <motion.div
                                  className="h-full rounded-full"
                                  style={{ backgroundColor: color }}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${pct}%` }}
                                  transition={{ duration: 0.5, delay: i * 0.07 }}
                                />
                              </div>
                              <span className="p-mono text-xs w-8 text-right shrink-0">{r.percentage}%</span>
                            </div>
                          );
                        })}
                      </div>
                      {focusPoll.results?.length >= 2 && (
                        <div
                          className="flex items-center justify-between px-3 py-2 rounded-lg"
                          style={{ background: T_COLOR[focusNode.tension] + '15' }}
                        >
                          <span className="text-xs" style={{ color: 'var(--p-text-40)' }}>Écart 1er / 2e</span>
                          <span className="p-mono text-base" style={{ color: T_COLOR[focusNode.tension] }}>
                            Δ {Math.abs(focusPoll.results[0].percentage - focusPoll.results[1].percentage).toFixed(1)}%
                          </span>
                        </div>
                      )}
                      <Link to={`/City?slug=${focusNode.city.slug}&tab=predictions`}>
                        <button className="p-btn-primary w-full mt-1 text-xs justify-center">
                          Prédire {focusNode.city.name} <ChevronRight className="w-3.5 h-3.5 ml-1" />
                        </button>
                      </Link>
                    </div>
                  ) : (
                    <div className="p-4 text-sm text-center" style={{ color: 'var(--p-text-25)' }}>Pas de sondage disponible</div>
                  )}
                </motion.div>
              ) : (
                <motion.div key="default-panel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                  <div className="rounded-2xl p-4" style={{ background: 'var(--p-card)', border: '0.5px solid var(--p-border)' }}>
                    <p className="text-[10px] uppercase tracking-widest font-semibold mb-3" style={{ color: 'var(--p-text-25)' }}>
                      Villes les plus disputées
                    </p>
                    <div className="space-y-1">
                      {cityNodes
                        .filter(n => n.poll)
                        .sort((a, b) => b.tension - a.tension)
                        .slice(0, 6)
                        .map(({ city, tension, poll }) => {
                          const gap = poll?.results?.length >= 2
                            ? Math.abs(poll.results[0].percentage - poll.results[1].percentage).toFixed(0)
                            : null;
                          return (
                            <button
                              key={city.id}
                              onClick={() => setActiveCity(city.id)}
                              aria-label={`Voir ${city.name}`}
                              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition"
                              style={{ minHeight: 44 }}
                              onMouseEnter={e => e.currentTarget.style.background = 'rgba(245,240,232,0.05)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: T_COLOR[tension] }} />
                                <span className="text-sm font-medium" style={{ color: 'var(--p-text)' }}>{city.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {gap && <span className="p-mono text-xs" style={{ color: T_COLOR[tension] }}>Δ{gap}%</span>}
                                <span className="text-[10px] hidden sm:block" style={{ color: 'var(--p-text-25)' }}>{T_LABEL[tension]}</span>
                              </div>
                            </button>
                          );
                        })}
                    </div>
                  </div>

                  <div
                    className="rounded-2xl p-5"
                    style={{ background: 'var(--p-card)', border: '0.5px solid var(--p-blue-border)' }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4" style={{ color: 'var(--p-gold)' }} />
                      <span className="p-title text-sm">Jeu prédictif gratuit</span>
                    </div>
                    <p className="text-xs mb-3 leading-relaxed" style={{ color: 'var(--p-text-40)' }}>
                      Prédisez les résultats, montez dans le classement, débloquez des badges.
                    </p>
                    <Link to={createPageUrl('Predictions')}>
                      <button className="p-btn-primary w-full text-xs justify-center">
                        Commencer à prédire →
                      </button>
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      {/* Bande de données bas */}
      <div className="relative z-10" style={{ borderTop: '0.5px solid var(--p-border)', background: 'rgba(5,10,24,0.6)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-4 overflow-x-auto">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--p-green)' }} />
              <span className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--p-text-40)' }}>Données live</span>
            </div>
            {cityNodes.filter(n => n.poll && n.tension >= 2).slice(0, 5).map(({ city, poll, tension }) => (
              <button
                key={city.id}
                onClick={() => { setActiveCity(city.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="flex items-center gap-1.5 shrink-0 px-2.5 py-1 rounded-full transition"
                style={{ background: 'rgba(245,240,232,0.04)', border: '0.5px solid var(--p-border)' }}
              >
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: T_COLOR[tension] }} />
                <span className="text-[11px] font-medium" style={{ color: 'var(--p-text)' }}>{city.name}</span>
                {poll?.results?.length >= 2 && (
                  <span className="p-mono text-[10px]" style={{ color: T_COLOR[tension] }}>
                    Δ{Math.abs(poll.results[0].percentage - poll.results[1].percentage).toFixed(0)}%
                  </span>
                )}
              </button>
            ))}
            <Link to={createPageUrl('Surveys')} className="ml-auto shrink-0 text-[11px] flex items-center gap-1 transition" style={{ color: 'var(--p-blue)' }}>
              Tous les sondages <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}