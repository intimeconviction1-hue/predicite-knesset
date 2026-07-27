import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ChevronRight, Trophy, ArrowRight, TrendingUp } from 'lucide-react';
import Hemicycle from '@/components/knesset/Hemicycle';
import HeroBackdrop from '@/components/knesset/HeroBackdrop';
import CountUp from '@/components/knesset/CountUp';
import CountdownTimer from '@/components/knesset/CountdownTimer';
import ElectionTimeline from '@/components/knesset/ElectionTimeline';

// Jour du scrutin (même convention que CountdownTimer : 07:00 heure d'Israël).
const ELECTION_DAY = new Date('2026-10-27T04:00:00Z');

function ListeSnapshotRow({ liste, seats, maxSeats, index }) {
  const belowThreshold = seats === 0;
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
    >
      <Link
        to={`${createPageUrl('Liste')}?slug=${liste.slug}`}
        className="flex items-center gap-3 py-2 px-2 -mx-2 rounded-lg transition-colors hover:bg-[var(--p-night-2)]"
      >
        <span className="text-xs w-32 shrink-0 truncate" style={{ color: 'var(--p-text-60)' }}>{liste.name_fr}</span>
        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--p-text-10)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: liste.color || '#6B7280', opacity: belowThreshold ? 0.3 : 1 }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(2, ((seats || 0) / maxSeats) * 100)}%` }}
            transition={{ duration: 0.6, delay: 0.15 + index * 0.04 }}
          />
        </div>
        <span className="text-xs font-bold font-mono w-14 text-right shrink-0" style={{ color: belowThreshold ? 'var(--p-text-25)' : (liste.color || 'var(--p-gold-text)') }}>
          {belowThreshold ? 'seuil' : `${seats} sièges`}
        </span>
      </Link>
    </motion.div>
  );
}

function Tile({ value, label }) {
  return (
    <div className="rounded-xl px-3 py-3 text-center" style={{ background: 'var(--p-card)', border: '0.5px solid var(--p-border)' }}>
      <p className="font-mono font-bold text-2xl leading-none" style={{ color: 'var(--p-text)' }}>{value}</p>
      <p className="text-[10.5px] mt-1.5" style={{ color: 'var(--p-text-40)' }}>{label}</p>
    </div>
  );
}

export default function Home() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(async (u) => {
      setUser(u);
      if (u) {
        const key = `progress_init_${u.email}`;
        if (!sessionStorage.getItem(key)) {
          try { await base44.functions.invoke('ensureUserProgress', {}); sessionStorage.setItem(key, '1'); } catch (_) {}
        }
      }
    }).catch(() => {});
  }, []);

  const { data: listes = [] } = useQuery({
    queryKey: ['home-listes'],
    queryFn: () => base44.entities.Liste.filter({ is_active: true }),
  });

  const { data: sondages = [] } = useQuery({
    queryKey: ['home-sondages-latest'],
    queryFn: () => base44.entities.SondageSieges.list('-poll_date', 1),
  });

  const { data: progress } = useQuery({
    queryKey: ['home-user-progress', user?.email],
    queryFn: () => base44.entities.UserProgress.filter({ user_email: user.email }),
    enabled: !!user?.email,
    select: d => d[0],
  });

  const { data: actuData } = useQuery({
    queryKey: ['home-actu'],
    queryFn: () => base44.actu.list(),
    staleTime: 10 * 60 * 1000,
  });
  const actuItems = (actuData?.items || []).slice(0, 4);

  // Cotes en direct (marchés publics) pour le teaser d'accueil.
  const { data: parisData } = useQuery({
    queryKey: ['home-paris'],
    queryFn: () => base44.paris.marches(),
    staleTime: 60 * 1000,
  });
  const topMarket = parisData?.marches?.[0] || null;

  const latestPoll = sondages?.[0] || null;
  const seatsByListe = new Map((latestPoll?.seats_by_liste || []).map(s => [s.liste_id, s.seats]));
  // Sur TOUTES les listes (pas seulement le top 10 affiché plus bas), sinon
  // les blocs coalition/opposition perdent les listes hors classement — et
  // la liste_arabe, qui n'est ni l'un ni l'autre, doit apparaître à part
  // plutôt que d'être silencieusement absente du total.
  const listesAvecSieges = listes.map(l => ({ ...l, _seats: seatsByListe.get(l.id) ?? 0 }));
  const rankedListes = [...listesAvecSieges].sort((a, b) => b._seats - a._seats).slice(0, 10);
  const maxSeats = Math.max(20, ...rankedListes.map(l => l._seats));

  const coalitionSeats = listesAvecSieges.filter(l => l.bloc === 'coalition').reduce((s, l) => s + l._seats, 0);
  const oppositionSeats = listesAvecSieges.filter(l => l.bloc === 'opposition' || l.bloc === 'non_alignee').reduce((s, l) => s + l._seats, 0);
  const arabSeats = listesAvecSieges.filter(l => l.bloc === 'liste_arabe').reduce((s, l) => s + l._seats, 0);

  // Accroche dynamique — toujours vraie, quel que soit le sondage du jour.
  const nobodyHasMajority = coalitionSeats < 61 && oppositionSeats < 61;
  const leaderIsCoalition = coalitionSeats >= oppositionSeats;
  const verdict = !latestPoll
    ? null
    : nobodyHasMajority
      ? (arabSeats > 0
          ? <>Aucun bloc n'atteint <b style={{ color: 'var(--p-text)', fontWeight: 600 }}>61</b> — les {arabSeats} sièges arabes tiennent la balance.</>
          : <>Aucun bloc n'atteint <b style={{ color: 'var(--p-text)', fontWeight: 600 }}>61</b> — la majorité reste à construire.</>)
      : <>Le bloc {leaderIsCoalition ? 'de coalition' : "d'opposition"} franchit la barre des <b style={{ color: 'var(--p-text)', fontWeight: 600 }}>61</b>.</>;

  const daysLeft = Math.max(0, Math.ceil((ELECTION_DAY.getTime() - Date.now()) / 86400000));
  const firstName = user?.full_name?.split(' ')[0] || user?.email?.split('@')[0];

  return (
    <div className="min-h-screen" style={{ background: 'transparent' }}>

      {/* Hero — l'hémicycle vivant en pièce maîtresse. Thème clair unifié (le fond
          crème + halos sont fournis par le Layout) ; un simple halo doré au sommet
          concentre le regard. L'accroche pose l'enjeu (qui gouverne ?), un seul CTA
          mène au pronostic. */}
      <div className="relative overflow-hidden">
        {/* liseré tricolore */}
        <div className="p-tricolor"><div /><div /><div /></div>
        {/* fond animé : plusieurs photos institutionnelles en fondu croisé (Ken Burns) */}
        <HeroBackdrop
          images={[
            '/images/knesset-hero.jpg',
            '/images/listes-hero.jpg',
            '/images/pm-hero.jpg',
          ]}
          position="center 26%"
        />
        {/* voile crème allégé (photos bien visibles) puis fondu vers le crème avant
            l'hémicycle, pour garder le texte lisible et les sièges nets. */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'linear-gradient(180deg, rgba(248,246,240,0.22) 0%, rgba(248,246,240,0.40) 32%, rgba(248,246,240,0.82) 58%, var(--p-night) 80%)',
        }} />
        {/* halo doré au sommet pour concentrer le regard */}
        <div className="absolute inset-x-0 top-0 h-[420px] pointer-events-none" style={{
          background: 'radial-gradient(ellipse 70% 100% at 50% 0%, rgba(212,175,55,0.22), transparent 62%)',
        }} />

        <div className="relative max-w-3xl mx-auto px-4 pt-12 md:pt-16 pb-6 text-center">
          {/* badge scrutin */}
          <div className="inline-flex items-center gap-2 mb-5 px-3 py-1.5 rounded-full"
            style={{ background: 'var(--p-gold-dim)', border: '0.5px solid var(--p-gold-border)' }}>
            <motion.span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--p-gold)' }}
              animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }} />
            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--p-gold-text)' }}>
              J-{daysLeft} · scrutin du 27 octobre 2026 · Knesset
            </span>
          </div>

          <p className="mb-2 text-sm font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--p-blue)' }}>
            Législatives israéliennes 2026 · en français
          </p>

          <motion.h1
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
            className="text-4xl md:text-6xl font-black mb-4"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--p-text)', letterSpacing: '-0.025em', lineHeight: 1.04 }}>
            Le scrutin est à <span style={{ color: 'var(--p-gold-text)' }}>toi</span>.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
            className="text-base md:text-lg mb-7 max-w-md mx-auto"
            style={{ color: 'var(--p-text-60)', lineHeight: 1.55 }}>
            Pronostique les 120 sièges, parie sur chaque sondage et les événements de la campagne, grimpe au classement. C'est gratuit.
          </motion.p>

          {/* CTA — un seul bouton principal, mène au pronostic (page Listes) */}
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link to={createPageUrl('Listes')}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-[10px] font-semibold text-[15px] text-white transition-transform"
              style={{ background: 'var(--p-blue)', boxShadow: '0 10px 24px -8px rgba(43,92,230,0.6)' }}>
              Je fais mon pronostic <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to={createPageUrl('ReglesDuJeu')}
              className="inline-flex items-center px-6 py-3.5 rounded-[10px] font-semibold text-[15px] transition-colors"
              style={{ color: 'var(--p-text-60)', border: '0.5px solid var(--p-border)' }}>
              Comment ça marche
            </Link>
          </div>

          {/* état joueur (réel) ou ligne d'accroche honnête pour les visiteurs */}
          {user && progress ? (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
              className="mt-6 inline-flex items-center gap-3 px-4 py-2.5 rounded-xl"
              style={{ background: 'var(--p-gold-dim)', border: '0.5px solid var(--p-gold-border)' }}>
              <Trophy className="w-3.5 h-3.5" style={{ color: 'var(--p-gold-text)' }} />
              <span className="text-sm" style={{ color: 'var(--p-text-60)' }}>
                Bonjour {firstName} ·
              </span>
              <span className="font-bold text-sm font-mono" style={{ color: 'var(--p-gold-text)' }}>
                {(progress.total_points || 0).toLocaleString('fr-FR')} pts
              </span>
            </motion.div>
          ) : (
            <p className="mt-5 text-[13px]" style={{ color: 'var(--p-text-40)' }}>
              Gratuit · ton score au dépouillement, le soir du 27 octobre.
            </p>
          )}
        </div>

        {/* Hémicycle — pièce maîtresse, avec les totaux de blocs et la ligne 61 */}
        <div className="relative max-w-2xl mx-auto px-4 pb-4">
          <div className="flex items-end justify-between mb-1 px-1">
            <div className="text-left">
              <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--p-blue)' }}>Bloc coalition</p>
              <p className="text-4xl font-black font-mono leading-none mt-1" style={{ color: 'var(--p-blue)' }}><CountUp value={coalitionSeats} /></p>
            </div>
            <div className="text-center pb-1.5">
              <p className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--p-text-25)' }}>120 sièges</p>
              <p className="text-[10px] uppercase tracking-wide font-semibold" style={{ color: 'var(--p-gold-text)' }}>majorité 61</p>
              {arabSeats > 0 && (
                <p className="text-[10px] uppercase tracking-wide mt-1" style={{ color: 'var(--p-green)' }}>+ {arabSeats} listes arabes</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--p-red)' }}>Bloc opposition</p>
              <p className="text-4xl font-black font-mono leading-none mt-1" style={{ color: 'var(--p-red)' }}><CountUp value={oppositionSeats} delay={200} /></p>
            </div>
          </div>

          <Hemicycle seatsByListe={latestPoll?.seats_by_liste || []} listes={listes} height={250} />

          {/* Légende — décode les couleurs de l'hémicycle (chaque parti = une couleur) */}
          {rankedListes.some(l => l._seats > 0) && (
            <div className="flex flex-wrap justify-center gap-x-3 gap-y-1.5 mt-2 mb-2 px-2">
              {rankedListes.filter(l => l._seats > 0).map(l => (
                <span key={l.id} className="inline-flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--p-text-60)' }}>
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: l.color || '#6B7280' }} />
                  {l.name_fr} <span className="font-mono font-bold" style={{ color: 'var(--p-text)' }}>{l._seats}</span>
                </span>
              ))}
            </div>
          )}

          {verdict ? (
            <p className="text-center text-sm mt-1" style={{ color: 'var(--p-text-60)' }}>{verdict}</p>
          ) : (
            <p className="text-center text-[13px] mt-1" style={{ color: 'var(--p-text-40)' }}>
              Composition à venir — le premier sondage sièges apparaîtra ici.
            </p>
          )}
          <p className="text-center text-[11px] font-mono mt-1" style={{ color: 'var(--p-text-25)' }}>
            {latestPoll
              ? `Projection ${latestPoll.institute}${latestPoll.publisher_media ? ` (${latestPoll.publisher_media})` : ''} · ${new Date(latestPoll.poll_date).toLocaleDateString('fr-FR')}`
              : 'En attente du premier sondage sièges'}
          </p>
        </div>

        {/* tuiles factuelles */}
        <div className="max-w-2xl mx-auto px-4 pt-4 pb-2 grid grid-cols-2 md:grid-cols-4 gap-3">
          <Tile value={`J-${daysLeft}`} label="avant le scrutin" />
          <Tile value="120" label="sièges en jeu" />
          <Tile value="61" label="pour gouverner" />
          <Tile value={listes.length || '—'} label="listes en lice" />
        </div>
      </div>

      {/* Cotes en direct — les paris visibles dès l'accueil (le hook de rétention) */}
      {topMarket && topMarket.issues?.length > 0 && (
        <div className="max-w-3xl mx-auto px-4 pt-2 pb-4">
          <Link to={createPageUrl('Paris')} className="block rounded-2xl p-5 transition-transform hover:-translate-y-0.5" style={{ background: 'var(--p-card)', border: '0.5px solid var(--p-gold-border)', boxShadow: '0 14px 34px -24px rgba(212,175,55,0.5)' }}>
            <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" style={{ color: 'var(--p-gold-text)' }} />
                <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--p-gold-text)' }}>Cotes en direct · jetons gratuits</span>
              </div>
              <span className="text-xs font-semibold inline-flex items-center gap-1" style={{ color: 'var(--p-blue)' }}>Parier <ArrowRight className="w-3.5 h-3.5" /></span>
            </div>
            <p className="text-sm font-bold mb-3" style={{ fontFamily: 'var(--font-display)', color: 'var(--p-text)' }}>{topMarket.question}</p>
            <div className="flex gap-2 flex-wrap">
              {topMarket.issues.slice(0, 4).map(iss => (
                <span key={iss.id} className="inline-flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: 'var(--p-night-2)', border: '0.5px solid var(--p-border)' }}>
                  <span className="text-xs font-semibold" style={{ color: 'var(--p-text-60)' }}>{iss.label}</span>
                  <span className="font-mono font-bold text-sm" style={{ color: 'var(--p-blue)' }}>{iss.cote.toFixed(2)}<span className="text-[10px]"> ×</span></span>
                </span>
              ))}
            </div>
          </Link>
        </div>
      )}

      {/* Compte à rebours + calendrier — le scrutin approche, sentiment de progression */}
      <div className="max-w-3xl mx-auto px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-10%' }}
          transition={{ duration: 0.4 }}
          className="rounded-3xl p-6 md:p-10 text-center"
          style={{ background: 'var(--p-card)', border: '0.5px solid var(--p-border)' }}
        >
          <p className="text-[10px] font-black uppercase tracking-widest mb-4" style={{ color: 'var(--p-gold-text)' }}>
            Le scrutin approche
          </p>
          <div className="flex justify-center">
            <CountdownTimer />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-10%' }}
          transition={{ duration: 0.4, delay: 0.08 }}
          className="rounded-3xl p-6 md:p-10 mt-4"
          style={{ background: 'var(--p-card)', border: '0.5px solid var(--p-border)' }}
        >
          <ElectionTimeline />
        </motion.div>
      </div>

      {/* Teaser Actu — la campagne en direct, visible dès l'accueil */}
      {actuItems.length > 0 && (
        <div className="max-w-3xl mx-auto px-4 pb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-base" style={{ fontFamily: 'var(--font-display)', color: 'var(--p-text)' }}>Actu de la campagne</h2>
            <Link to={createPageUrl('Actu')} className="text-xs flex items-center gap-1 hover:text-[var(--p-text)] transition-colors" style={{ color: 'var(--p-text-40)' }}>
              Toute l'actu <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {actuItems.map((item, i) => (
              <a key={item.link + i} href={item.link} target="_blank" rel="noopener noreferrer"
                className="block rounded-xl p-3 transition-colors hover:border-[var(--p-border-hover)]"
                style={{ background: 'var(--p-card)', border: `0.5px solid ${item.curated ? 'var(--p-gold-border)' : 'var(--p-border)'}` }}>
                <p className="text-sm font-semibold leading-snug" style={{ color: 'var(--p-text)' }}>{item.title}</p>
                <div className="mt-1 text-xs">
                  {item.curated
                    ? <span className="p-badge p-badge-gold">Résumé PrédiCité</span>
                    : item.source && <span className="font-semibold" style={{ color: 'var(--p-gold-text)' }}>{item.source}</span>}
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Classement des listes */}
      <div className="max-w-3xl mx-auto px-4 pb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold text-base" style={{ fontFamily: 'var(--font-display)', color: 'var(--p-text)' }}>
            Dernière projection sièges
          </h2>
          <Link to={createPageUrl('Listes')}
            className="text-xs flex items-center gap-1 hover:text-[var(--p-text)] transition-colors"
            style={{ color: 'var(--p-text-40)' }}>
            Toutes les listes <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {rankedListes.length === 0 ? (
          <div className="rounded-2xl p-8 text-center" style={{ background: 'var(--p-card)', border: '0.5px solid var(--p-border)' }}>
            <p className="text-sm" style={{ color: 'var(--p-text-40)' }}>Sondages à venir…</p>
          </div>
        ) : (
          <div className="rounded-2xl p-5" style={{ background: 'var(--p-card)', border: '0.5px solid var(--p-border)' }}>
            {rankedListes.map((l, i) => (
              <ListeSnapshotRow key={l.id} liste={l} seats={l._seats} maxSeats={maxSeats} index={i} />
            ))}
            {latestPoll && (
              <p className="text-[10px] mt-3 pt-3 border-t font-mono" style={{ color: 'var(--p-text-25)', borderColor: 'var(--p-border)' }}>
                {latestPoll.institute} · {new Date(latestPoll.poll_date).toLocaleDateString('fr-FR')}
              </p>
            )}
          </div>
        )}

        {/* Liens secondaires */}
        <div className="flex items-center justify-center gap-6 mt-12 pt-10 flex-wrap"
          style={{ borderTop: '0.5px solid var(--p-border)' }}>
          {[
            { label: 'Classement', to: 'Leaderboard' },
            { label: 'Comprendre', to: 'Learn' },
            { label: 'Quiz', to: 'Quiz' },
            { label: 'Règles du jeu', to: 'ReglesDuJeu' },
          ].map(({ label, to }) => (
            <Link key={to} to={createPageUrl(to)}
              className="text-sm hover:text-[var(--p-text)] transition-colors"
              style={{ color: 'var(--p-text-40)' }}>
              {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
