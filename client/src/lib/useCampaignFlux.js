import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/client';
import { createPageUrl } from '@/utils';
import { joursAvantScrutin } from '@/lib/echeances';
import { verdictMajorite } from '@/lib/blocs';
import { formatProba } from '@/components/knesset/CoteTile';

// Hook du « flux en direct » de la campagne : agrège des faits RÉELS (dernier
// sondage, top listes, mouvements de sièges, cotes/événements, actu, repères) en
// une liste d'items pour <LiveTicker>. Aucun item fabriqué. Les mêmes clés de
// query que la Home → react-query mutualise le cache (pas de double appel).
// Réutilisé sur la Home et sur le hub « Le direct » (Paris).

const trunc = (s, n = 58) => (s && s.length > n ? `${s.slice(0, n - 1)}…` : s);

/**
 * @param {{sansProjection?: boolean}} options
 *   `sansProjection` retire du flux ce que la page affiche déjà en grand juste
 *   en dessous : l'institut, les quatre premières listes et le verdict de
 *   majorité. Sur la Home, le bandeau égrenait « Yashar 23 · Likoud 22 ·
 *   Ensemble 13 · Les Démocrates 11 · aucun camp n'atteint 61 » — puis
 *   l'hémicycle, à deux cents pixels, affichait exactement les mêmes chiffres et
 *   le même verdict. Un bandeau en direct doit apporter ce que la page ne montre
 *   PAS : les mouvements entre sondages, les cotes, l'actu. Sur « Le direct »
 *   (Paris), où il n'y a pas d'hémicycle, le flux garde tout.
 */
export function useCampaignFlux({ sansProjection = false } = {}) {
  const { data: listes = [] } = useQuery({
    queryKey: ['home-listes'],
    queryFn: () => base44.entities.Liste.filter({ is_active: true }),
  });
  // Clé PROPRE au flux. Elle s'appelait 'home-sondages-latest', comme celle de
  // la Home — mais avec une limite de 3 là où la Home en demande 8. React Query
  // déduplique par clé : le premier monté gagnait, l'autre recevait son cache en
  // silence. Selon l'ordre de montage, la courbe de tendance et le consensus
  // recevaient donc 8 sondages… ou 3, sans que rien ne le signale.
  const { data: sondages = [] } = useQuery({
    queryKey: ['flux-sondages', 3],
    queryFn: () => base44.entities.SondageSieges.list('-poll_date', 3),
  });
  const { data: parisData } = useQuery({
    queryKey: ['home-paris'],
    queryFn: () => base44.paris.marches(),
    staleTime: 60 * 1000,
  });
  const { data: actuData } = useQuery({
    queryKey: ['home-actu'],
    queryFn: () => base44.actu.list(),
    staleTime: 10 * 60 * 1000,
  });

  const latestPoll = sondages?.[0] || null;
  const prevPoll = sondages?.[1] || null;
  const seatsByListe = new Map((latestPoll?.seats_by_liste || []).map(s => [s.liste_id, s.seats]));
  const listesAvecSieges = listes.map(l => ({ ...l, _seats: seatsByListe.get(l.id) ?? 0 }));
  const rankedListes = [...listesAvecSieges].sort((a, b) => b._seats - a._seats).slice(0, 10);
  const coalitionSeats = listesAvecSieges.filter(l => l.bloc === 'coalition').reduce((s, l) => s + l._seats, 0);
  const oppositionSeats = listesAvecSieges.filter(l => l.bloc === 'opposition' || l.bloc === 'non_alignee').reduce((s, l) => s + l._seats, 0);
  const arabSeats = listesAvecSieges.filter(l => l.bloc === 'liste_arabe').reduce((s, l) => s + l._seats, 0);
  const daysLeft = joursAvantScrutin();

  const items = [];
  items.push({ emoji: '⏳', text: 'Scrutin', value: `J-${daysLeft}`, valueColor: 'var(--p-gold-text)', to: createPageUrl('Learn') });

  if (latestPoll && !sansProjection) {
    items.push({ emoji: '📊', text: `${latestPoll.institute} · ${new Date(latestPoll.poll_date).toLocaleDateString('fr-FR')}`, to: createPageUrl('Listes') });
    rankedListes.filter(l => l._seats > 0).slice(0, 4).forEach(l =>
      items.push({ emoji: '▪️', text: l.name_fr, value: `${l._seats}`, valueColor: l.color || 'var(--p-text)', to: `${createPageUrl('Liste')}?slug=${l.slug}` }),
    );
    items.push({ emoji: '⚖️', text: verdictMajorite({ coalition: coalitionSeats, opposition: oppositionSeats, arabes: arabSeats }), to: createPageUrl('Listes') });
  }

  // Mouvements — seulement entre deux sondages du MÊME institut (honnêteté).
  if (latestPoll && prevPoll && prevPoll.institute === latestPoll.institute) {
    const prevMap = new Map((prevPoll.seats_by_liste || []).map(s => [s.liste_id, s.seats]));
    listesAvecSieges
      .map(l => ({ ...l, delta: l._seats - (prevMap.get(l.id) ?? 0) }))
      .filter(l => l.delta !== 0)
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
      .slice(0, 4)
      .forEach(l => items.push({
        emoji: l.delta > 0 ? '📈' : '📉',
        text: l.name_fr,
        value: `${l.delta > 0 ? '+' : ''}${l.delta}`,
        valueColor: l.delta > 0 ? 'var(--p-green)' : 'var(--p-red)',
        to: `${createPageUrl('Liste')}?slug=${l.slug}`,
      }));
  }

  (parisData?.marches || []).slice(0, 10).forEach(m => {
    (m.issues || []).slice(0, m.type === 'evenement' ? 2 : 1).forEach((iss, idx) => items.push({
      emoji: idx > 0 ? '↔️' : (m.type === 'evenement' ? '🗳️' : '⚡'),
      text: idx > 0 ? iss.label : trunc(m.question),
      // Dans un bandeau qui défile, on n'a le temps de lire qu'un chiffre :
      // c'est la probabilité, pas la cote.
      value: formatProba(iss.cote),
      valueColor: 'var(--p-blue)',
      to: createPageUrl('Paris'),
    }));
  });

  (actuData?.items || []).slice(0, 8).forEach(a => {
    items.push({ emoji: '📰', text: trunc(a.source ? `${a.source} : ${a.title}` : a.title, 72), href: a.link });
  });

  items.push({ emoji: '📐', text: "Seuil d'entrée à la Knesset", value: '3,25 %', to: createPageUrl('Learn') });
  if (listes.length) items.push({ emoji: '🏳️', text: 'Listes en lice', value: `${listes.length}`, to: createPageUrl('Listes') });

  return items;
}
