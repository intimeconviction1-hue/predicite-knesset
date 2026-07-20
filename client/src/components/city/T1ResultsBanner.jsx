import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ArrowRight, ChevronRight, Trophy } from 'lucide-react';

const PARTY_COLORS = {
  'PS': '#E05C5C', 'PCF': '#D92B2B', 'LFI': '#8B1A1A', 'NUPES': '#C0392B', 'NFP': '#C0392B',
  'LR': '#034EA2', 'UDI': '#2E86C1', 'MoDem': '#3498DB', 'RE': '#F39C12', 'LREM': '#F39C12',
  'RN': '#1B2A4A', 'EELV': '#27AE60', 'DVG': '#E74C3C', 'DVD': '#2980B9', 'DVC': '#8E44AD',
  'default': '#6B7280',
};

function getPartyColor(party) {
  if (!party) return PARTY_COLORS.default;
  for (const [key, color] of Object.entries(PARTY_COLORS)) {
    if (party.toUpperCase().includes(key)) return color;
  }
  return PARTY_COLORS.default;
}

export default function T1ResultsBanner({ result, onReviserClick }) {
  if (!result) return null;

  const candidates = result.results || [];
  const elected = result.elected_first_round;
  const qualified = candidates.filter(c => c.qualified_t2);
  const maxPct = candidates.length > 0 ? Math.max(...candidates.map(c => c.percentage || 0)) : 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #07122A 0%, #0D1B3E 100%)',
        border: '1px solid rgba(212,175,55,0.4)',
        boxShadow: '0 0 24px rgba(212,175,55,0.08)',
      }}
    >
      {/* En-tête */}
      <div className="px-5 py-3 flex items-center justify-between flex-wrap gap-2"
        style={{ borderBottom: '0.5px solid rgba(212,175,55,0.2)' }}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: elected ? '#5DC98A' : '#D4AF37' }} />
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--p-gold)' }}>
            {elected ? '✓ Résultats définitifs — 1er tour' : 'Résultats 1er tour'}
          </span>
        </div>
        {result.turnout && (
          <span className="text-xs" style={{ color: 'rgba(245,240,232,0.4)' }}>
            Participation : <strong style={{ color: 'rgba(245,240,232,0.7)' }}>{result.turnout.toFixed(1)}%</strong>
          </span>
        )}
      </div>

      {/* Corps */}
      <div className="px-5 py-4">
        {elected && result.winner && (
          <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-xl"
            style={{ background: 'rgba(26,140,85,0.12)', border: '0.5px solid rgba(26,140,85,0.3)' }}>
            <Trophy className="w-4 h-4 shrink-0" style={{ color: '#5DC98A' }} />
            <p className="text-sm font-semibold" style={{ color: '#5DC98A' }}>
              {result.winner} élu(e) dès le 1er tour avec majorité absolue
            </p>
          </div>
        )}

        <div className="space-y-2.5">
          {candidates.slice(0, 6).map((c, i) => {
            const color = getPartyColor(c.party);
            const widthPct = maxPct > 0 ? (c.percentage / maxPct) * 100 : 0;
            const isFirst = i === 0;
            return (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-medium truncate"
                      style={{ color: isFirst ? 'white' : 'rgba(245,240,232,0.6)' }}>
                      {c.candidate}
                    </span>
                    {c.party && (
                      <span className="text-[10px] shrink-0 px-1.5 py-0.5 rounded"
                        style={{ background: `${color}22`, color: color, border: `0.5px solid ${color}44` }}>
                        {c.party}
                      </span>
                    )}
                    {c.qualified_t2 && !elected && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full shrink-0 font-bold"
                        style={{ background: 'rgba(43,92,230,0.2)', color: '#7BA3F0', border: '0.5px solid rgba(43,92,230,0.35)' }}>
                        → T2
                      </span>
                    )}
                    {elected && isFirst && (
                      <CheckCircle2 className="w-3 h-3 shrink-0" style={{ color: '#5DC98A' }} />
                    )}
                  </div>
                  <span className="text-sm font-bold ml-2 shrink-0"
                    style={{ fontFamily: 'var(--font-mono)', color: isFirst ? 'var(--p-gold)' : 'rgba(245,240,232,0.5)' }}>
                    {c.percentage?.toFixed(1)}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(245,240,232,0.06)' }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: color, opacity: isFirst ? 1 : 0.55 }}
                    initial={{ width: 0 }}
                    animate={{ width: `${widthPct}%` }}
                    transition={{ duration: 0.6, delay: i * 0.08 }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Qualifiés T2 résumé */}
        {!elected && qualified.length > 0 && (
          <div className="mt-4 px-3 py-2.5 rounded-xl"
            style={{ background: 'rgba(43,92,230,0.08)', border: '0.5px solid rgba(43,92,230,0.25)' }}>
            <p className="text-[11px] font-semibold mb-1.5" style={{ color: '#7BA3F0' }}>
              Qualifiés pour le 2ème tour
            </p>
            <div className="flex flex-wrap gap-2">
              {qualified.map((c, i) => (
                <span key={i} className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(43,92,230,0.15)', color: '#A8C4F5', border: '0.5px solid rgba(43,92,230,0.3)' }}>
                  {c.candidate} — {c.percentage?.toFixed(1)}%
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CTA */}
      {!elected && (
        <div className="px-5 pb-4">
          <button
            onClick={onReviserClick}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
            style={{ background: 'rgba(212,175,55,0.12)', border: '0.5px solid rgba(212,175,55,0.35)', color: 'var(--p-gold)' }}
          >
            <ArrowRight className="w-4 h-4" />
            Réviser ma prédiction pour le 2ème tour
          </button>
        </div>
      )}
    </motion.div>
  );
}