import React, { useMemo } from 'react';
import { base44 } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp } from 'lucide-react';
import TrendChartMulti from '@/components/knesset/TrendChartMulti';

const BUCKET_DAYS = 14;   // on moyenne par quinzaine pour lisser le bruit inter-instituts
const TOP_N = 6;

function buildTrend(polls, listes) {
  const sorted = polls.slice().filter(p => p.poll_date).sort((a, b) => (a.poll_date < b.poll_date ? -1 : 1));
  if (sorted.length < 2) return null;
  const byId = new Map(listes.map(l => [l.id, l]));

  const t0 = new Date(sorted[0].poll_date).getTime();
  const bucketOf = (d) => Math.floor((new Date(d).getTime() - t0) / (BUCKET_DAYS * 86400000));

  const buckets = new Map();  // idx -> { date, sums:Map, counts:Map }
  for (const p of sorted) {
    const b = bucketOf(p.poll_date);
    if (!buckets.has(b)) buckets.set(b, { date: p.poll_date, sums: new Map(), counts: new Map() });
    const bk = buckets.get(b);
    bk.date = p.poll_date;
    for (const s of (p.seats_by_liste || [])) {
      bk.sums.set(s.liste_id, (bk.sums.get(s.liste_id) || 0) + (Number(s.seats) || 0));
      bk.counts.set(s.liste_id, (bk.counts.get(s.liste_id) || 0) + 1);
    }
  }
  const idxs = [...buckets.keys()].sort((a, b) => a - b);
  if (idxs.length < 2) return null;

  const latest = sorted[sorted.length - 1];
  const topIds = (latest.seats_by_liste || []).slice().sort((a, b) => b.seats - a.seats).slice(0, TOP_N).map(s => s.liste_id);

  const series = topIds.map(id => {
    const l = byId.get(id);
    return {
      id,
      name: l?.name_fr || '?',
      color: l?.color || '#6B7280',
      latest: (latest.seats_by_liste || []).find(s => s.liste_id === id)?.seats ?? null,
      values: idxs.map(bi => {
        const bk = buckets.get(bi);
        const c = bk.counts.get(id);
        return c ? Math.round(bk.sums.get(id) / c) : null;
      }),
    };
  }).filter(s => s.color);

  const labels = idxs.map(bi => new Date(buckets.get(bi).date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }));
  return { series, labels };
}

export default function SondagesTrend() {
  const { data: polls = [] } = useQuery({ queryKey: ['trend-sondages'], queryFn: () => base44.entities.SondageSieges.list('-poll_date', 80) });
  const { data: listes = [] } = useQuery({ queryKey: ['trend-listes'], queryFn: () => base44.entities.Liste.filter({ is_active: true }) });

  const trend = useMemo(() => buildTrend(polls, listes), [polls, listes]);
  if (!trend) return null;

  return (
    <div className="p-reveal max-w-2xl mx-auto px-4 py-4">
      <div className="p-card p-5">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="w-4 h-4" style={{ color: 'var(--p-blue)' }} />
          <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: 'var(--p-text-40)' }}>Tendance des sondages</span>
        </div>
        <p className="text-[11px] mb-3" style={{ color: 'var(--p-text-25)' }}>Sièges par liste au fil de la campagne · moyenne par quinzaine, tous instituts.</p>

        <TrendChartMulti series={trend.series} labels={trend.labels} height={200} />

        <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-3 justify-center">
          {trend.series.map(s => (
            <span key={s.id} className="inline-flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--p-text-60)' }}>
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
              {s.name}{s.latest != null && <span className="font-mono font-bold" style={{ color: 'var(--p-text)' }}>{s.latest}</span>}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
