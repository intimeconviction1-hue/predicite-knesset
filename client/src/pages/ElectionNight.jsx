import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, Crown, MapPin, CheckCircle2, Clock,
  RefreshCw, Users, ChevronRight, Zap, Radio
} from 'lucide-react';

// ── Couleurs par parti ────────────────────────────────────────────────────
const PARTY_COLORS = {
  'PS': '#E05C5C', 'PCF': '#D92B2B', 'LFI': '#C0392B', 'NUPES': '#C0392B',
  'NFP': '#C0392B', 'LR': '#034EA2', 'UDI': '#2E86C1', 'MoDem': '#3498DB',
  'RE': '#F39C12', 'LREM': '#F39C12', 'RN': '#1A237E', 'EELV': '#27AE60',
  'DVG': '#E74C3C', 'DVD': '#2980B9', 'DVC': '#8E44AD', 'default': '#4B5563',
};

function getPartyColor(party) {
  if (!party) return PARTY_COLORS.default;
  for (const [key, color] of Object.entries(PARTY_COLORS)) {
    if (party.toUpperCase().includes(key)) return color;
  }
  return PARTY_COLORS.default;
}

// ── Horloge live ──────────────────────────────────────────────────────────
function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--p-gold)', fontSize: '1.5rem', letterSpacing: '0.04em' }}>
      {time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </span>
  );
}

// ── Cercle de progression ─────────────────────────────────────────────────
function CircleProgress({ value, total, size = 96 }) {
  const pct = total > 0 ? value / total : 0;
  const r = 36;
  const circ = 2 * Math.PI * r;
  const dash = circ * (1 - pct);
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute inset-0 -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(245,240,232,0.06)" strokeWidth="5" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="#D4AF37" strokeWidth="5" strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: dash }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      <div className="text-center z-10">
        <p className="font-black text-xl leading-none" style={{ fontFamily: 'var(--font-mono)', color: 'var(--p-gold)' }}>{value}</p>
        <p className="text-[9px] uppercase tracking-wide" style={{ color: 'rgba(245,240,232,0.3)' }}>/{total}</p>
      </div>
    </div>
  );
}

// ── Carte ville ───────────────────────────────────────────────────────────
function CityResultCard({ city, result, index }) {
  const elected = result?.elected_first_round;
  const candidates = result?.results || [];
  const top = candidates.slice(0, 5);
  const maxPct = top.length > 0 ? Math.max(...top.map(c => c.percentage || 0)) : 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35 }}
      className="rounded-2xl overflow-hidden flex flex-col"
      style={{
        background: elected
          ? 'linear-gradient(135deg, rgba(26,90,55,0.25) 0%, rgba(11,30,22,0.95) 100%)'
          : 'rgba(10,18,38,0.85)',
        border: elected
          ? '1px solid rgba(212,175,55,0.5)'
          : '0.5px solid rgba(245,240,232,0.07)',
        backdropFilter: 'blur(8px)',
        boxShadow: elected ? '0 0 28px rgba(212,175,55,0.1)' : 'none',
      }}
    >
      {/* Badge élu doré */}
      {elected && (
        <div className="px-4 py-1.5 flex items-center gap-2"
          style={{ background: 'linear-gradient(90deg, rgba(212,175,55,0.25), rgba(212,175,55,0.05))', borderBottom: '0.5px solid rgba(212,175,55,0.25)' }}>
          <Crown className="w-3 h-3" style={{ color: '#D4AF37' }} />
          <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#D4AF37' }}>
            ÉLU AU 1ER TOUR
          </span>
        </div>
      )}

      {/* En-tête */}
      <div className="px-4 pt-3 pb-2 flex items-start justify-between">
        <div>
          <p className="font-bold text-base text-white" style={{ fontFamily: 'var(--font-display)' }}>
            {city.name}
          </p>
          <p className="text-[11px]" style={{ color: 'rgba(245,240,232,0.35)' }}>
            {city.region}
          </p>
        </div>
        <Link to={createPageUrl('City') + `?slug=${city.slug}`}
          className="text-[10px] flex items-center gap-0.5 mt-0.5 hover:text-white transition-colors"
          style={{ color: 'rgba(43,92,230,0.8)' }}>
          Détail <ChevronRight className="w-2.5 h-2.5" />
        </Link>
      </div>

      {/* Barres candidats */}
      <div className="px-4 pb-3 space-y-2 flex-1">
        {top.map((c, i) => {
          const color = getPartyColor(c.party);
          const widthPct = maxPct > 0 ? (c.percentage / maxPct) * 100 : 0;
          const isFirst = i === 0;
          return (
            <div key={i}>
              <div className="flex items-center justify-between mb-0.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-xs font-medium truncate"
                    style={{ color: isFirst ? 'white' : 'rgba(245,240,232,0.5)' }}>
                    {c.candidate?.split(' ').slice(-1)[0] || c.candidate}
                  </span>
                  {c.qualified_t2 && !elected && (
                    <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold shrink-0"
                      style={{ background: 'rgba(200,16,46,0.2)', color: '#F47090', border: '0.5px solid rgba(200,16,46,0.4)' }}>
                      2ÈME TOUR
                    </span>
                  )}
                  {c.party && (
                    <span className="text-[9px] shrink-0" style={{ color: 'rgba(245,240,232,0.2)' }}>{c.party}</span>
                  )}
                </div>
                <span className="text-xs font-bold ml-1 shrink-0"
                  style={{ fontFamily: 'var(--font-mono)', color: isFirst ? color : 'rgba(245,240,232,0.4)' }}>
                  {c.percentage?.toFixed(1)}%
                </span>
              </div>
              <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(245,240,232,0.05)' }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: color, opacity: isFirst ? 1 : 0.45 }}
                  initial={{ width: 0 }}
                  animate={{ width: `${widthPct}%` }}
                  transition={{ duration: 0.7, delay: 0.1 + i * 0.08, ease: 'easeOut' }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Participation */}
      {result?.turnout && (
        <div className="px-4 pb-3 flex items-center gap-1.5"
          style={{ borderTop: '0.5px solid rgba(245,240,232,0.05)', paddingTop: '8px' }}>
          <Users className="w-3 h-3 shrink-0" style={{ color: 'rgba(245,240,232,0.25)' }} />
          <span className="text-[10px]" style={{ color: 'rgba(245,240,232,0.3)' }}>Participation</span>
          <span className="text-[11px] font-bold ml-auto"
            style={{ fontFamily: 'var(--font-mono)', color: result.turnout < 40 ? '#F97316' : 'rgba(245,240,232,0.55)' }}>
            {result.turnout.toFixed(1)}%
          </span>
        </div>
      )}
    </motion.div>
  );
}

// ── Carte "En attente" ────────────────────────────────────────────────────
function PendingCityCard({ city, index }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.03 }}
      className="rounded-2xl px-4 py-3 flex items-center gap-3"
      style={{ background: 'rgba(10,18,38,0.6)', border: '0.5px solid rgba(245,240,232,0.05)' }}
    >
      <div className="flex gap-0.5 shrink-0">
        {[0, 1, 2].map(j => (
          <motion.div key={j} className="w-1 h-1 rounded-full"
            style={{ background: 'rgba(245,240,232,0.2)' }}
            animate={{ opacity: [0.2, 0.8, 0.2] }}
            transition={{ duration: 1.4, repeat: Infinity, delay: j * 0.2 }}
          />
        ))}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium truncate" style={{ color: 'rgba(245,240,232,0.4)' }}>{city.name}</p>
        <p className="text-[9px]" style={{ color: 'rgba(245,240,232,0.2)' }}>En attente…</p>
      </div>
    </motion.div>
  );
}

// ── Bandeau défilant ──────────────────────────────────────────────────────
function TickerBanner({ items }) {
  if (!items.length) return null;
  const doubled = [...items, ...items];
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 overflow-hidden"
      style={{ background: 'rgba(5,10,24,0.97)', borderTop: '0.5px solid rgba(212,175,55,0.2)', height: '36px' }}>
      <div className="flex items-center h-full">
        <div className="shrink-0 px-3 flex items-center gap-1.5 border-r h-full"
          style={{ background: '#C8102E', borderColor: 'rgba(200,16,46,0.5)' }}>
          <Radio className="w-3 h-3 text-white animate-pulse" />
          <span className="text-[10px] font-black text-white uppercase tracking-widest">Résultats</span>
        </div>
        <div className="flex-1 overflow-hidden">
          <motion.div
            className="flex items-center gap-8 whitespace-nowrap"
            animate={{ x: [0, -50 * items.length * 8] }}
            transition={{ duration: items.length * 6, repeat: Infinity, ease: 'linear' }}
          >
            {doubled.map((item, i) => (
              <span key={i} className="text-xs flex items-center gap-2 shrink-0">
                <span className="font-bold" style={{ color: 'white' }}>{item.city}</span>
                <span style={{ color: 'rgba(245,240,232,0.4)' }}>·</span>
                <span style={{ color: item.elected ? '#5DC98A' : '#D4AF37', fontFamily: 'var(--font-mono)' }}>
                  {item.winner} {item.pct}%
                </span>
                {item.elected && (
                  <span style={{ color: '#5DC98A', fontSize: '9px' }}>✓ ÉLU</span>
                )}
              </span>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────────────────
export default function ElectionNight() {
  const queryClient = useQueryClient();

  const { data: cities = [], isFetching: loadingCities } = useQuery({
    queryKey: ['cities-election-night'],
    queryFn: () => base44.entities.City.list(),
    refetchInterval: 2 * 60 * 1000,
  });

  const { data: allResults = [], isFetching: loadingResults, dataUpdatedAt } = useQuery({
    queryKey: ['election-results-t1'],
    queryFn: () => base44.entities.ElectionResult.filter({ tour: 1 }, '-collected_at'),
    refetchInterval: 2 * 60 * 1000,
  });

  const { data: leaderboard = [] } = useQuery({
    queryKey: ['leaderboard-election-night'],
    queryFn: () => base44.entities.UserProgress.list('-total_points', 10),
    refetchInterval: 5 * 60 * 1000,
  });

  const cityCards = cities.map(city => ({
    city,
    result: allResults.find(r => r.city_id === city.id) || null,
  }));

  const sorted = [...cityCards].sort((a, b) => {
    const rank = x => x.result?.elected_first_round ? 2 : x.result ? 1 : 0;
    return rank(b) - rank(a);
  });

  const depouilled = cityCards.filter(c => c.result).length;
  const total = cities.length || 20;
  const electedT1 = cityCards.filter(c => c.result?.elected_first_round).length;
  const isFetching = loadingCities || loadingResults;

  // Ticker items
  const tickerItems = allResults
    .filter(r => r.results?.length > 0)
    .map(r => {
      const city = cities.find(c => c.id === r.city_id);
      const top = r.results[0];
      return {
        city: city?.name || '—',
        winner: top?.candidate?.split(' ').slice(-1)[0] || '—',
        pct: top?.percentage?.toFixed(1) || '—',
        elected: r.elected_first_round,
      };
    });

  return (
    <div className="min-h-screen pb-14" style={{ background: '#050A18' }}>

      {/* Bande tricolore */}
      <div className="h-1 w-full flex sticky top-0 z-50">
        <div className="flex-1 bg-[#034EA2]" />
        <div className="flex-1 bg-white/70" />
        <div className="flex-1 bg-[#C8102E]" />
      </div>

      {/* ── Header ── */}
      <div className="sticky top-1 z-40" style={{ background: 'rgba(5,10,24,0.97)', borderBottom: '0.5px solid rgba(212,175,55,0.15)', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

            {/* Titre + horloge */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <motion.div className="w-2 h-2 rounded-full bg-[#C8102E]"
                  animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }} />
                <span className="text-[10px] font-black uppercase tracking-widest text-[#C8102E]">En direct</span>
              </div>
              <div className="flex items-baseline gap-3 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-black" style={{ fontFamily: "'Syne', var(--font-display)", color: 'white' }}>
                  Soirée Électorale
                </h1>
                <LiveClock />
              </div>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(245,240,232,0.3)' }}>
                Municipales 2026 · 1er tour · 15 mars 2026
              </p>
            </div>

            {/* Compteurs */}
            <div className="flex items-center gap-5">
              {/* Cercle de progression */}
              <div className="flex flex-col items-center gap-1">
                <CircleProgress value={depouilled} total={total} />
                <p className="text-[9px] uppercase tracking-wide" style={{ color: 'rgba(245,240,232,0.3)' }}>Dépouillées</p>
              </div>

              {/* Élus T1 */}
              <div className="rounded-xl px-4 py-3 text-center"
                style={{ background: 'rgba(26,140,85,0.08)', border: '0.5px solid rgba(26,140,85,0.3)' }}>
                <p className="text-[9px] uppercase tracking-wide" style={{ color: 'rgba(93,201,138,0.6)' }}>Élus T1</p>
                <p className="text-2xl font-black" style={{ fontFamily: 'var(--font-mono)', color: '#5DC98A' }}>{electedT1}</p>
              </div>

              {/* Actualiser */}
              <div className="flex flex-col items-center gap-1">
                <button onClick={() => queryClient.invalidateQueries()}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs transition-all hover:bg-white/10"
                  style={{ background: 'rgba(245,240,232,0.05)', color: 'rgba(245,240,232,0.4)', border: '0.5px solid rgba(245,240,232,0.08)' }}>
                  <RefreshCw className={`w-3 h-3 ${isFetching ? 'animate-spin' : ''}`} />
                  Actualiser
                </button>
                {dataUpdatedAt && (
                  <p className="text-[8px]" style={{ color: 'rgba(245,240,232,0.2)' }}>
                    Màj {new Date(dataUpdatedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Contenu ── */}
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">

        {/* État vide */}
        {depouilled === 0 && (
          <div className="rounded-2xl p-12 text-center"
            style={{ background: 'rgba(10,18,38,0.7)', border: '0.5px solid rgba(245,240,232,0.06)' }}>
            <div className="flex justify-center gap-1 mb-4">
              {[0,1,2].map(i => (
                <motion.div key={i} className="w-2 h-2 rounded-full"
                  style={{ background: 'rgba(212,175,55,0.4)' }}
                  animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
                />
              ))}
            </div>
            <p className="font-semibold text-white/70 mb-1">Les résultats apparaîtront ici</p>
            <p className="text-xs" style={{ color: 'rgba(245,240,232,0.3)' }}>
              Collecte automatique · Données officielles Ministère de l'Intérieur · Actualisation toutes les 2 min
            </p>
          </div>
        )}

        {/* Élus T1 */}
        {electedT1 > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Crown className="w-4 h-4" style={{ color: '#D4AF37' }} />
              <h2 className="font-bold text-base" style={{ fontFamily: "'Syne', var(--font-display)", color: '#D4AF37' }}>
                Élus dès le 1er tour
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(212,175,55,0.12)', border: '0.5px solid rgba(212,175,55,0.3)', color: '#D4AF37' }}>
                {electedT1}
              </span>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sorted.filter(c => c.result?.elected_first_round).map(({ city, result }, i) => (
                <CityResultCard key={city.id} city={city} result={result} index={i} />
              ))}
            </div>
          </section>
        )}

        {/* 2e tour requis */}
        {sorted.filter(c => c.result && !c.result.elected_first_round).length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-[#C8102E]" />
              <h2 className="font-bold text-base" style={{ fontFamily: "'Syne', var(--font-display)", color: 'rgba(245,240,232,0.7)' }}>
                2ème tour requis
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(200,16,46,0.1)', border: '0.5px solid rgba(200,16,46,0.3)', color: '#F47090' }}>
                {sorted.filter(c => c.result && !c.result.elected_first_round).length}
              </span>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sorted.filter(c => c.result && !c.result.elected_first_round).map(({ city, result }, i) => (
                <CityResultCard key={city.id} city={city} result={result} index={i} />
              ))}
            </div>
          </section>
        )}

        {/* En attente */}
        {sorted.filter(c => !c.result).length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-3.5 h-3.5" style={{ color: 'rgba(245,240,232,0.2)' }} />
              <h2 className="text-sm font-semibold" style={{ color: 'rgba(245,240,232,0.25)' }}>
                En attente — {sorted.filter(c => !c.result).length} villes
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {sorted.filter(c => !c.result).map(({ city }, i) => (
                <PendingCityCard key={city.id} city={city} index={i} />
              ))}
            </div>
          </section>
        )}

        {/* Top analystes */}
        <section>
          <h2 className="text-sm font-bold mb-4 flex items-center gap-2"
            style={{ fontFamily: "'Syne', var(--font-display)", color: 'rgba(245,240,232,0.5)' }}>
            <Trophy className="w-3.5 h-3.5" style={{ color: 'var(--p-gold)' }} />
            Top analystes citoyens
          </h2>
          <div className="rounded-2xl overflow-hidden" style={{ border: '0.5px solid rgba(245,240,232,0.06)', background: 'rgba(10,18,38,0.8)' }}>
            {leaderboard.map((player, i) => (
              <div key={player.user_email} className="flex items-center gap-3 px-5 py-2.5"
                style={{ borderBottom: '0.5px solid rgba(245,240,232,0.04)' }}>
                <span className="w-5 text-center text-xs font-bold shrink-0"
                  style={{ fontFamily: 'var(--font-mono)', color: i === 0 ? '#D4AF37' : 'rgba(245,240,232,0.2)' }}>
                  {i + 1}
                </span>
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ background: i === 0 ? 'rgba(212,175,55,0.15)' : 'rgba(43,92,230,0.12)', color: i === 0 ? '#D4AF37' : '#7BA3F0' }}>
                  {player.user_email?.charAt(0).toUpperCase()}
                </div>
                <span className="flex-1 text-sm truncate" style={{ color: 'rgba(245,240,232,0.7)' }}>
                  {player.user_email?.split('@')[0]}
                </span>
                <span className="font-bold text-sm shrink-0"
                  style={{ fontFamily: 'var(--font-mono)', color: i === 0 ? '#D4AF37' : 'rgba(245,240,232,0.5)' }}>
                  {(player.total_points || 0).toLocaleString('fr-FR')} pts
                </span>
              </div>
            ))}
            {leaderboard.length === 0 && (
              <div className="py-8 text-center text-sm" style={{ color: 'rgba(245,240,232,0.2)' }}>Classement en cours…</div>
            )}
          </div>
        </section>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pb-4">
          <Link to={createPageUrl('FinalRecap')}>
            <button className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm"
              style={{ background: '#D4AF37', color: '#050A18' }}>
              <Trophy className="w-4 h-4" /> Voir mon bilan final
            </button>
          </Link>
          <Link to={createPageUrl('Leaderboard')}>
            <button className="flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-sm"
              style={{ background: 'rgba(245,240,232,0.05)', border: '0.5px solid rgba(245,240,232,0.1)', color: 'rgba(245,240,232,0.5)' }}>
              Classement complet <ChevronRight className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </div>

      {/* Bandeau défilant */}
      <TickerBanner items={tickerItems} />
    </div>
  );
}