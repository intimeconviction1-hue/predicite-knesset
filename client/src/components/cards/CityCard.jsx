import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MapPin, Users, TrendingUp, ChevronRight } from 'lucide-react';
import Tooltip from '@/components/shared/Tooltip';

const PARTY_HEX = {
  PS: '#F59E0B', EELV: '#22C55E', LR: '#3B82F6',
  RN: '#9CA3AF', RE: '#A78BFA', LFI: '#EF4444',
};
function partyColor(party) {
  for (const [k, v] of Object.entries(PARTY_HEX)) {
    if (party?.toUpperCase().includes(k)) return v;
  }
  return '#6B7280';
}

function tensionDelta(candidates) {
  if (!candidates || candidates.length < 2) return null;
  const sorted = [...candidates].sort((a, b) => (b.percentage || 0) - (a.percentage || 0));
  const delta = Math.abs((sorted[0].percentage || 0) - (sorted[1].percentage || 0));
  return { delta: delta.toFixed(1), color: delta <= 3 ? '#D92B2B' : delta <= 8 ? '#E07B1A' : delta <= 15 ? '#D4A017' : '#3B82F6' };
}

export default function CityCard({ city, predCount = 0, index = 0 }) {
  const dt = tensionDelta(city.candidates);
  const leaderColor = city.candidates?.[0] ? partyColor(city.candidates[0].party) : '#374151';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -3, transition: { duration: 0.18 } }}
    >
      <Link to={`/City?slug=${city.slug}`}>
        <div
          className="group overflow-hidden rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300"
          style={{ background: 'rgba(10,18,42,0.85)', backdropFilter: 'blur(8px)' }}
        >
          {/* Image */}
          <div className="relative h-36 overflow-hidden">
            <img
              src={city.image_url || 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=600&h=400&fit=crop'}
              alt={city.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050C1A] via-[#050C1A]/40 to-transparent" />

            {/* Δ tension badge */}
            {dt && (
              <Tooltip text={`Écart entre le 1er et le 2e candidat : ${dt.delta}%. Plus l'écart est faible, plus la course est serrée.`} position="bottom">
                <div
                  className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-lg font-mono text-xs font-bold cursor-help"
                  style={{ background: `${dt.color}22`, color: dt.color, border: `1px solid ${dt.color}44` }}
                >
                  Δ{dt.delta}%
                </div>
              </Tooltip>
            )}

            <div className="absolute bottom-2.5 left-3">
              <h3 className="text-white font-bold text-lg leading-tight">{city.name}</h3>
              <div className="flex items-center gap-1 text-white/40 text-xs mt-0.5">
                <MapPin className="w-3 h-3" />
                {city.region}
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-4 space-y-3">
            {/* Population + leader */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-white/40 text-xs">
                <Users className="w-3.5 h-3.5" />
                <span className="font-mono">{city.population?.toLocaleString('fr-FR') || '—'}</span>
                <span>hab.</span>
              </div>
              {city.candidates?.[0] && (
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: leaderColor }} />
                  <span className="text-[11px] text-white/50 truncate max-w-[80px]">
                    {city.candidates[0].name?.split(' ').pop()}
                  </span>
                </div>
              )}
            </div>

            {/* Candidates mini bars */}
            {city.candidates?.length > 0 && (
              <div className="space-y-1.5">
                {city.candidates.slice(0, 3).map((c, i) => {
                  const pct = c.percentage || 0;
                  const max = city.candidates[0]?.percentage || 1;
                  const color = partyColor(c.party);
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-[10px] text-white/35 w-14 shrink-0 truncate">{c.name?.split(' ').pop()}</span>
                      <div className="flex-1 h-1 bg-white/8 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(pct / max) * 100}%`, backgroundColor: color }} />
                      </div>
                      <span className="font-mono text-[10px] font-bold w-8 text-right shrink-0" style={{ color }}>
                        {pct > 0 ? `${pct}%` : '—'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-white/8">
              {predCount > 0 ? (
                <span className="text-[10px] font-mono text-[#D4AF37]">{predCount} pronostic{predCount > 1 ? 's' : ''}</span>
              ) : (
                <span className="text-[10px] text-white/20">Aucun pronostic</span>
              )}
              <div className="flex items-center gap-1 text-[#4A7FD4] text-xs font-semibold group-hover:gap-1.5 transition-all">
                <TrendingUp className="w-3 h-3" />
                Prédire
                <ChevronRight className="w-3 h-3" />
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}