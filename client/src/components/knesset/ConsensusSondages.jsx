import React, { useMemo } from 'react';
import { Users, AlertTriangle, Check } from 'lucide-react';
import { texteLisible } from '@/lib/couleurs';

// « Consensus des sondages » — honnêteté avant fausse précision. L'hémicycle
// n'affiche qu'UN sondage (le plus récent) ; ici on regarde les derniers et on
// dit s'ils s'ACCORDENT sur le parti en tête, ou s'ils DIVERGENT (et alors on
// montre qui donne qui en tête). Répond au cas « les sondages ne sont pas
// d'accord » sans trancher arbitrairement.
export default function ConsensusSondages({ sondages = [], listes = [], max = 6 }) {
  const listeById = useMemo(() => new Map(listes.map(l => [l.id, l])), [listes]);

  const recents = useMemo(() => (sondages || []).slice(0, max).map(s => {
    const top = (s.seats_by_liste || []).slice().sort((a, b) => b.seats - a.seats)[0];
    if (!top) return null;
    const leader = listeById.get(top.liste_id);
    if (!leader) return null;
    return { media: s.publisher_media || s.institute, date: s.poll_date, leader, seats: top.seats };
  }).filter(Boolean), [sondages, listeById, max]);

  if (recents.length < 2) return null;

  const leaderIds = [...new Set(recents.map(r => r.leader.id))];
  const agree = leaderIds.length === 1;

  const fmt = (d) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

  return (
    <div className="max-w-2xl mx-auto px-4 pb-4">
      <div className="p-card p-4 md:p-5">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4" style={{ color: 'var(--p-text-40)' }} />
          <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: 'var(--p-text-40)' }}>
            Consensus des sondages · {recents.length} derniers
          </span>
        </div>

        {agree ? (
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--p-green-dim)' }}>
              <Check className="w-3.5 h-3.5" style={{ color: 'var(--p-green-text)' }} />
            </span>
            <p className="p-body text-sm" style={{ color: 'var(--p-text)' }}>
              Ils s'accordent : <b style={{ color: recents[0].leader.color ? texteLisible(recents[0].leader.color) : 'var(--p-text)' }}>{recents[0].leader.name_fr}</b> arrive en tête dans les {recents.length} derniers sondages.
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <span className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--p-gold-dim)' }}>
                <AlertTriangle className="w-3.5 h-3.5" style={{ color: 'var(--p-gold-text)' }} />
              </span>
              <p className="p-body text-sm" style={{ color: 'var(--p-text)' }}>
                Les sondages <b>divergent</b> sur le parti en tête — c'est normal (effets d'institut). Voici qui donne qui vainqueur :
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {recents.map((r, i) => (
                <div key={i} className="inline-flex items-center gap-2 rounded-full px-3 py-1.5" style={{ background: 'var(--p-night-2)', border: '0.5px solid var(--p-border)' }}>
                  <span className="text-[11px] font-semibold" style={{ color: 'var(--p-text-60)' }}>{r.media} · {fmt(r.date)}</span>
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: r.leader.color || '#6B7280' }} />
                  <span className="text-[11px] font-bold" style={{ color: r.leader.color ? texteLisible(r.leader.color) : 'var(--p-text)' }}>{r.leader.name_fr}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
