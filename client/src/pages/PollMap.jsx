import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, X, ExternalLink, ChevronRight, Zap, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Coordonnées approximatives des villes françaises (en % de la carte SVG de France)
const CITY_POSITIONS = {
  'paris':      { x: 52, y: 26 },
  'marseille':  { x: 62, y: 78 },
  'lyon':       { x: 62, y: 56 },
  'toulouse':   { x: 40, y: 73 },
  'nice':       { x: 74, y: 73 },
  'bordeaux':   { x: 25, y: 65 },
  'strasbourg': { x: 80, y: 22 },
  'lille':      { x: 52, y: 10 },
  'nantes':     { x: 22, y: 44 },
  'grenoble':   { x: 68, y: 60 },
  'montpellier':{ x: 55, y: 78 },
  'rennes':     { x: 18, y: 30 },
  'le-havre':   { x: 35, y: 16 },
  'toulon':     { x: 68, y: 80 },
  'reims':      { x: 60, y: 22 },
  'saint-etienne': { x: 58, y: 62 },
  'dijon':      { x: 65, y: 40 },
  'angers':     { x: 28, y: 42 },
};

const PARTY_COLORS = {
  'PS': '#E05C30', 'EELV': '#2E8B57', 'LR': '#003189',
  'RN': '#002395', 'Horizons': '#FF9900', 'RE': '#FF9900',
  'LFI': '#CC2936', 'SE': '#888888', 'UDR': '#002395',
};

function getTensionScore(poll) {
  if (!poll?.results || poll.results.length < 2) return 0;
  const gap = poll.results[0].percentage - poll.results[1].percentage;
  if (gap <= 2) return 4;   // Extrême
  if (gap <= 5) return 3;   // Très élevée
  if (gap <= 10) return 2;  // Élevée
  if (gap <= 20) return 1;  // Modérée
  return 0;                  // Faible
}

const TENSION_CONFIG = {
  4: { label: 'Extrême', color: '#D92B2B', ring: '#ff4444', size: 18 },
  3: { label: 'Très élevée', color: '#E07B1A', ring: '#ff9a3c', size: 16 },
  2: { label: 'Élevée', color: '#D4A017', ring: '#ffd055', size: 14 },
  1: { label: 'Modérée', color: '#2B5CE6', ring: '#4a87ff', size: 12 },
  0: { label: 'Faible', color: '#6B7280', ring: '#9ca3af', size: 10 },
};

function getLeaderColor(party) {
  for (const [k, v] of Object.entries(PARTY_COLORS)) {
    if (party?.toUpperCase().includes(k)) return v;
  }
  return '#6B7280';
}

export default function PollMapPage() {
  const [selectedCity, setSelectedCity] = useState(null);
  const [filterSource, setFilterSource] = useState('all');
  const [filterDate, setFilterDate] = useState('all');

  const { data: cities = [] } = useQuery({
    queryKey: ['cities'],
    queryFn: () => base44.entities.City.list()
  });

  const { data: polls = [] } = useQuery({
    queryKey: ['real-polls-map'],
    queryFn: () => base44.entities.RealPoll.list('-publication_date', 100)
  });

  const { data: pollSources = [] } = useQuery({
    queryKey: ['poll-sources'],
    queryFn: () => base44.entities.PollSource.list()
  });

  // Date filter options
  const dateOptions = useMemo(() => {
    const opts = [{ value: 'all', label: 'Toutes les dates' }];
    const now = new Date('2026-03-04');
    opts.push({ value: '7', label: '7 derniers jours' });
    opts.push({ value: '14', label: '14 derniers jours' });
    opts.push({ value: '30', label: '30 derniers jours' });
    return opts;
  }, []);

  // Filter polls
  const filteredPolls = useMemo(() => {
    return polls.filter(p => {
      if (p.is_active === false) return false;
      if (p.scope !== 'city') return false;
      if (filterSource !== 'all' && p.poll_source_id !== filterSource) return false;
      if (filterDate !== 'all') {
        const cutoff = new Date('2026-03-04');
        cutoff.setDate(cutoff.getDate() - parseInt(filterDate));
        if (new Date(p.publication_date) < cutoff) return false;
      }
      return true;
    });
  }, [polls, filterSource, filterDate]);

  // Latest poll per city after filters
  const latestPollByCity = useMemo(() => {
    const map = {};
    for (const p of filteredPolls) {
      if (!map[p.city_id] || new Date(p.publication_date) > new Date(map[p.city_id].publication_date)) {
        map[p.city_id] = p;
      }
    }
    return map;
  }, [filteredPolls]);

  // City nodes with position + tension
  const cityNodes = useMemo(() => {
    return cities
      .map(city => {
        const pos = CITY_POSITIONS[city.slug];
        if (!pos) return null;
        const poll = latestPollByCity[city.id];
        const tension = getTensionScore(poll);
        return { city, pos, poll, tension };
      })
      .filter(Boolean);
  }, [cities, latestPollByCity]);

  const selectedNode = selectedCity ? cityNodes.find(n => n.city.id === selectedCity) : null;
  const selectedPollSource = selectedNode?.poll ? pollSources.find(s => s.id === selectedNode.poll.poll_source_id) : null;

  // Polls for selected city panel (all filtered polls for this city)
  const cityPolls = useMemo(() => {
    if (!selectedCity) return [];
    return filteredPolls
      .filter(p => p.city_id === selectedCity)
      .sort((a, b) => new Date(b.publication_date) - new Date(a.publication_date));
  }, [filteredPolls, selectedCity]);

  return (
    <div className="min-h-screen bg-[#07122A] text-white">
      {/* Header */}
      <div className="bg-[#0D1B3E] border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-white">Carte électorale interactive</h1>
              <p className="text-white/50 text-sm mt-0.5">Sondages par ville — Municipales 2026</p>
            </div>
            {/* Filters */}
            <div className="flex items-center gap-3 flex-wrap">
              <Filter className="w-4 h-4 text-white/40 shrink-0" />
              <Select value={filterSource} onValueChange={setFilterSource}>
                <SelectTrigger className="w-44 bg-white/10 border-white/20 text-white text-sm h-9">
                  <SelectValue placeholder="Institut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les instituts</SelectItem>
                  {pollSources.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.short_name || s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterDate} onValueChange={setFilterDate}>
                <SelectTrigger className="w-44 bg-white/10 border-white/20 text-white text-sm h-9">
                  <SelectValue placeholder="Période" />
                </SelectTrigger>
                <SelectContent>
                  {dateOptions.map(d => (
                    <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* MAP */}
          <div className="flex-1 min-w-0">
            <div className="bg-[#0D1B3E] border border-white/10 rounded-2xl overflow-hidden">
              {/* Légende tension */}
              <div className="flex items-center gap-4 px-5 pt-4 pb-2 border-b border-white/10 flex-wrap">
                <span className="text-white/50 text-xs font-medium uppercase tracking-wide">Tension</span>
                {Object.entries(TENSION_CONFIG).reverse().map(([score, cfg]) => (
                  <div key={score} className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cfg.color }} />
                    <span className="text-white/60 text-xs">{cfg.label}</span>
                  </div>
                ))}
              </div>

              {/* SVG France Map */}
              <div className="relative w-full" style={{ paddingBottom: '90%' }}>
                <div className="absolute inset-0 p-4">
                  {/* Background France silhouette (simplified SVG path) */}
                  <svg
                    viewBox="0 0 100 100"
                    className="w-full h-full"
                    style={{ position: 'absolute', inset: 0 }}
                  >
                    {/* France outline — forme simplifiée */}
                    <path
                      d="M 28 5 L 38 4 L 52 8 L 62 5 L 75 10 L 82 15 L 85 22 L 80 28 L 82 35 L 78 42 L 80 50 L 75 58 L 72 65 L 75 72 L 70 80 L 60 85 L 50 88 L 40 82 L 28 80 L 18 72 L 10 62 L 8 50 L 12 38 L 8 28 L 12 18 L 20 12 Z"
                      fill="none"
                      stroke="rgba(255,255,255,0.08)"
                      strokeWidth="0.5"
                    />
                    {/* Grille légère */}
                    {[20,40,60,80].map(v => (
                      <React.Fragment key={v}>
                        <line x1={v} y1="0" x2={v} y2="100" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
                        <line x1="0" y1={v} x2="100" y2={v} stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
                      </React.Fragment>
                    ))}

                    {/* City dots */}
                    {cityNodes.map(({ city, pos, poll, tension }) => {
                      const cfg = TENSION_CONFIG[tension];
                      const isSelected = selectedCity === city.id;
                      const leader = poll?.results?.[0];
                      const leaderColor = leader ? getLeaderColor(leader.party) : cfg.color;

                      return (
                        <g
                          key={city.id}
                          style={{ cursor: 'pointer' }}
                          onClick={() => setSelectedCity(isSelected ? null : city.id)}
                        >
                          {/* Pulse ring for high tension */}
                          {tension >= 3 && (
                            <circle
                              cx={pos.x}
                              cy={pos.y}
                              r={cfg.size / 6 + 3}
                              fill="none"
                              stroke={cfg.ring}
                              strokeWidth="0.5"
                              opacity="0.5"
                            />
                          )}
                          {/* Selected ring */}
                          {isSelected && (
                            <circle
                              cx={pos.x}
                              cy={pos.y}
                              r={cfg.size / 6 + 4}
                              fill="none"
                              stroke="white"
                              strokeWidth="0.8"
                            />
                          )}
                          {/* Main dot */}
                          <circle
                            cx={pos.x}
                            cy={pos.y}
                            r={cfg.size / 6}
                            fill={tension > 0 ? leaderColor : '#374151'}
                            stroke={cfg.color}
                            strokeWidth="0.8"
                            opacity={isSelected ? 1 : 0.85}
                          />
                          {/* City label */}
                          <text
                            x={pos.x}
                            y={pos.y - cfg.size / 6 - 1.5}
                            textAnchor="middle"
                            fill="white"
                            fontSize="2.2"
                            fontFamily="Inter, sans-serif"
                            opacity={isSelected ? 1 : 0.75}
                          >
                            {city.name}
                          </text>
                          {/* Gap label under dot */}
                          {poll?.results?.length >= 2 && (
                            <text
                              x={pos.x}
                              y={pos.y + cfg.size / 6 + 2.5}
                              textAnchor="middle"
                              fill={cfg.color}
                              fontSize="1.8"
                              fontFamily="JetBrains Mono, monospace"
                            >
                              Δ{Math.abs(poll.results[0].percentage - poll.results[1].percentage).toFixed(0)}%
                            </text>
                          )}
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>

              <div className="px-5 pb-4 text-xs text-white/30 text-center">
                Cliquez sur une ville pour voir le détail · Δ = écart entre les 2 premiers candidats
              </div>
            </div>
          </div>

          {/* SIDE PANEL */}
          <div className="w-full lg:w-96 shrink-0">
            <AnimatePresence mode="wait">
              {selectedNode ? (
                <motion.div
                  key={selectedNode.city.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className="bg-[#0D1B3E] border border-white/10 rounded-2xl overflow-hidden"
                >
                  {/* City header */}
                  <div className="relative h-28 overflow-hidden">
                    <img
                      src={selectedNode.city.image_url || 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=600'}
                      alt={selectedNode.city.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0D1B3E] to-transparent" />
                    <button
                      onClick={() => setSelectedCity(null)}
                      className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/40 flex items-center justify-center hover:bg-black/60 transition"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                    <div className="absolute bottom-3 left-4">
                      <h2 className="text-white font-bold text-xl">{selectedNode.city.name}</h2>
                      <p className="text-white/60 text-xs">{selectedNode.city.region}</p>
                    </div>
                  </div>

                  {/* Tension indicator */}
                  <TensionPanel tension={selectedNode.tension} poll={selectedNode.poll} />

                  {/* Polls list */}
                  <div className="px-4 pb-4 space-y-3 max-h-[60vh] overflow-y-auto">
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-white/50 text-xs uppercase tracking-wide font-medium">
                        {cityPolls.length} sondage{cityPolls.length > 1 ? 's' : ''}
                      </span>
                    </div>
                    {cityPolls.length === 0 ? (
                      <p className="text-white/30 text-sm py-4 text-center">Aucun sondage pour cette ville avec ces filtres.</p>
                    ) : cityPolls.map(poll => {
                      const src = pollSources.find(s => s.id === poll.poll_source_id);
                      return <PollMiniCard key={poll.id} poll={poll} source={src} />;
                    })}
                  </div>

                  {/* CTA */}
                  <div className="px-4 pb-4 flex gap-2">
                    <Link
                      to={`/City?slug=${selectedNode.city.slug}`}
                      className="flex-1 text-center text-sm py-2 rounded-lg bg-[#1A3580] text-white hover:bg-[#0D2466] transition font-medium"
                    >
                      Fiche ville
                    </Link>
                    <Link
                      to={`/City?slug=${selectedNode.city.slug}&tab=predictions`}
                      className="flex-1 text-center text-sm py-2 rounded-lg bg-[#034EA2] text-white hover:bg-[#023882] transition font-medium"
                    >
                      Prédire →
                    </Link>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-[#0D1B3E] border border-white/10 rounded-2xl p-6"
                >
                  <h3 className="text-white font-semibold mb-3">Tableau de bord</h3>
                  <SummaryStats cityNodes={cityNodes} polls={filteredPolls} />
                  <div className="mt-5 space-y-2">
                    <p className="text-white/40 text-xs uppercase tracking-wide font-medium mb-2">Villes les + tendues</p>
                    {cityNodes
                      .filter(n => n.poll)
                      .sort((a, b) => b.tension - a.tension)
                      .slice(0, 5)
                      .map(({ city, tension, poll }) => (
                        <button
                          key={city.id}
                          onClick={() => setSelectedCity(city.id)}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition text-left"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: TENSION_CONFIG[tension]?.color }}
                            />
                            <span className="text-white text-sm font-medium">{city.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {poll?.results?.length >= 2 && (
                              <span className="text-white/40 text-xs font-mono">
                                Δ{Math.abs(poll.results[0].percentage - poll.results[1].percentage).toFixed(0)}%
                              </span>
                            )}
                            <Badge
                              className="text-xs px-2 py-0"
                              style={{
                                backgroundColor: TENSION_CONFIG[tension]?.color + '22',
                                color: TENSION_CONFIG[tension]?.color,
                                border: `1px solid ${TENSION_CONFIG[tension]?.color}44`
                              }}
                            >
                              {TENSION_CONFIG[tension]?.label}
                            </Badge>
                          </div>
                        </button>
                      ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Sub-components ---

function TensionPanel({ tension, poll }) {
  const cfg = TENSION_CONFIG[tension];
  if (!poll) return null;
  const gap = poll.results?.length >= 2
    ? Math.abs(poll.results[0].percentage - poll.results[1].percentage).toFixed(1)
    : null;

  return (
    <div className="px-4 py-3 border-b border-white/10">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4" style={{ color: cfg.color }} />
          <span className="text-white text-sm font-semibold">Tension électorale</span>
        </div>
        <Badge
          className="text-xs font-bold px-2 py-0.5"
          style={{
            backgroundColor: cfg.color + '22',
            color: cfg.color,
            border: `1px solid ${cfg.color}55`
          }}
        >
          {cfg.label}
        </Badge>
      </div>
      {/* Visual tension bar */}
      <div className="relative h-2 bg-white/10 rounded-full overflow-hidden mb-2">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: cfg.color }}
          initial={{ width: 0 }}
          animate={{ width: `${[0, 25, 50, 75, 100][tension]}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
      {gap && (
        <p className="text-white/50 text-xs">
          Écart 1er/2e : <span className="font-mono font-bold" style={{ color: cfg.color }}>Δ{gap}%</span>
          {poll.results?.length >= 2 && (
            <span className="ml-2 text-white/30">
              ({poll.results[0].candidate?.split(' ').pop()} vs {poll.results[1].candidate?.split(' ').pop()})
            </span>
          )}
        </p>
      )}
    </div>
  );
}

function PollMiniCard({ poll, source }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-3">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          {source && (
            <span className="text-xs font-bold text-[#C8A84A] uppercase tracking-wide">{source.short_name}</span>
          )}
          <p className="text-white/70 text-xs mt-0.5 leading-tight line-clamp-2">{poll.title}</p>
        </div>
        <span className="text-white/30 text-xs shrink-0">
          {new Date(poll.publication_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
        </span>
      </div>

      {/* Bars */}
      <div className="space-y-1.5">
        {(poll.results || []).slice(0, 4).map((r, i) => {
          const color = getLeaderColor(r.party);
          return (
            <div key={i} className="flex items-center gap-2">
              <span className="text-white/70 text-xs w-24 shrink-0 truncate">{r.candidate?.split(' ').pop()}</span>
              <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${r.percentage}%` }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                />
              </div>
              <span className="text-white text-xs font-mono w-9 text-right shrink-0">{r.percentage}%</span>
            </div>
          );
        })}
      </div>

      {(poll.sample_size || poll.margin_of_error) && (
        <div className="flex items-center gap-2 mt-2 text-white/25 text-xs">
          <AlertCircle className="w-3 h-3 shrink-0" />
          {poll.sample_size && <span>n={poll.sample_size}</span>}
          {poll.margin_of_error && <span>±{poll.margin_of_error}pt</span>}
          {poll.source_url && (
            <a href={poll.source_url} target="_blank" rel="noopener noreferrer" className="ml-auto text-[#C8A84A] flex items-center gap-0.5 hover:underline">
              Source <ExternalLink className="w-2.5 h-2.5" />
            </a>
          )}
        </div>
      )}
    </div>
  );
}

function SummaryStats({ cityNodes, polls }) {
  const extreme = cityNodes.filter(n => n.tension === 4).length;
  const high = cityNodes.filter(n => n.tension === 3).length;
  const covered = cityNodes.filter(n => n.poll).length;

  return (
    <div className="grid grid-cols-3 gap-3">
      {[
        { label: 'Villes couvertes', value: covered, color: '#2B5CE6' },
        { label: 'Tension extrême', value: extreme, color: '#D92B2B' },
        { label: 'Tension très élevée', value: high, color: '#E07B1A' },
      ].map(s => (
        <div key={s.label} className="bg-white/5 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold font-mono" style={{ color: s.color }}>{s.value}</div>
          <div className="text-white/40 text-xs mt-1 leading-tight">{s.label}</div>
        </div>
      ))}
    </div>
  );
}