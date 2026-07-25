import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Vote, Crown, ChevronRight, Trophy } from 'lucide-react';
import Hemicycle from '@/components/knesset/Hemicycle';
import CountUp from '@/components/knesset/CountUp';
import CountdownTimer from '@/components/knesset/CountdownTimer';
import ElectionTimeline from '@/components/knesset/ElectionTimeline';

function ListeSnapshotRow({ liste, seats, maxSeats, index }) {
  const belowThreshold = seats === 0;
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className="flex items-center gap-3 py-2"
    >
      <span className="text-xs w-32 shrink-0 truncate" style={{ color: 'rgba(245,240,232,0.6)' }}>{liste.name_fr}</span>
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(245,240,232,0.06)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: liste.color || '#6B7280', opacity: belowThreshold ? 0.25 : 0.9 }}
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(2, ((seats || 0) / maxSeats) * 100)}%` }}
          transition={{ duration: 0.6, delay: 0.15 + index * 0.04 }}
        />
      </div>
      <span className="text-xs font-bold font-mono w-14 text-right shrink-0" style={{ color: belowThreshold ? 'rgba(245,240,232,0.25)' : (liste.color || 'var(--p-gold)') }}>
        {belowThreshold ? 'seuil' : `${seats} sièges`}
      </span>
    </motion.div>
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

  const latestPoll = sondages?.[0] || null;
  const seatsByListe = new Map((latestPoll?.seats_by_liste || []).map(s => [s.liste_id, s.seats]));
  const rankedListes = [...listes]
    .map(l => ({ ...l, _seats: seatsByListe.get(l.id) ?? 0 }))
    .sort((a, b) => b._seats - a._seats)
    .slice(0, 10);
  const maxSeats = Math.max(20, ...rankedListes.map(l => l._seats));

  const coalitionSeats = rankedListes.filter(l => l.bloc === 'coalition').reduce((s, l) => s + l._seats, 0);
  const oppositionSeats = rankedListes.filter(l => l.bloc === 'opposition' || l.bloc === 'non_alignee').reduce((s, l) => s + l._seats, 0);

  return (
    <div className="min-h-screen" style={{ background: 'var(--p-night)' }}>

      {/* Hero — photo réelle de la Knesset (CC0, Wikimedia Commons) en fond, assombrie
          et fondue vers --p-night pour rester lisible et s'intégrer à l'identité du site */}
      <div className="relative flex flex-col items-center justify-center text-center px-4 py-24 md:py-32 overflow-hidden">
        <div className="absolute inset-0" style={{
          backgroundImage: "url('/images/knesset-hero.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center 35%',
        }} />
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(180deg, rgba(5,10,24,0.25) 0%, rgba(5,10,24,0.45) 55%, var(--p-night) 100%)',
        }} />
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse at 50% 15%, rgba(212,175,55,0.15) 0%, transparent 60%)',
        }} />

        <div className="relative z-10 flex flex-col items-center">

        <div className="flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full"
          style={{ background: 'rgba(212,175,55,0.1)', border: '0.5px solid rgba(212,175,55,0.3)' }}>
          <motion.div className="w-1.5 h-1.5 rounded-full"
            style={{ background: 'var(--p-gold)' }}
            animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }} />
          <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--p-gold)' }}>
            Scrutin du 27 octobre 2026 · Knesset
          </span>
        </div>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-5xl md:text-7xl font-black mb-4"
          style={{ fontFamily: "'Syne', sans-serif", color: 'white', letterSpacing: '-0.02em', lineHeight: 1 }}>
          PrédiCité
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="text-lg md:text-xl mb-10 max-w-md"
          style={{ color: 'rgba(245,240,232,0.5)', fontWeight: 400 }}>
          Pronostiquez les législatives israéliennes, en français
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.18 }}
          className="flex flex-col sm:flex-row items-center gap-3">
          <Link to={createPageUrl('Listes')}>
            <button className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white"
              style={{ background: '#1E3A8A' }}>
              <Vote className="w-4 h-4" /> Voir les listes
            </button>
          </Link>
          <Link to={createPageUrl('PremierMinistre')}>
            <button className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm"
              style={{ background: 'var(--p-gold)', color: 'var(--p-night)' }}>
              <Crown className="w-4 h-4" /> Pronostic Premier ministre
            </button>
          </Link>
        </motion.div>

        {user && progress && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-8 flex items-center gap-3 px-4 py-2.5 rounded-xl"
            style={{ background: 'rgba(212,175,55,0.08)', border: '0.5px solid rgba(212,175,55,0.2)' }}>
            <Trophy className="w-3.5 h-3.5" style={{ color: 'var(--p-gold)' }} />
            <span className="text-sm" style={{ color: 'rgba(245,240,232,0.6)' }}>
              Bonjour {user.full_name?.split(' ')[0] || user.email?.split('@')[0]} ·
            </span>
            <span className="font-bold text-sm" style={{ fontFamily: 'monospace', color: 'var(--p-gold)' }}>
              {(progress.total_points || 0).toLocaleString('fr-FR')} pts
            </span>
          </motion.div>
        )}
        </div>
      </div>

      {/* Compte à rebours + calendrier — le scrutin approche, sentiment de progression */}
      <div className="max-w-3xl mx-auto px-4 py-12">
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

      {/* Hémicycle — la composition de la Knesset en un coup d'œil, visuel signature de l'app */}
      <div className="max-w-3xl mx-auto px-4 pb-10">
        <div className="relative rounded-3xl px-6 pt-10 pb-6 md:px-10 md:pt-12" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(30,58,138,0.25) 0%, rgba(10,18,38,0.9) 65%)', border: '0.5px solid rgba(245,240,232,0.08)' }}>
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-[10px] uppercase tracking-wide" style={{ color: 'rgba(59,130,246,0.75)' }}>Bloc coalition</p>
              <p className="text-4xl font-black font-mono text-[var(--p-blue)] leading-none mt-1"><CountUp value={coalitionSeats} /></p>
            </div>
            <div className="text-center pt-2">
              <p className="text-[10px] uppercase tracking-wide" style={{ color: 'rgba(245,240,232,0.3)' }}>120 sièges</p>
              <p className="text-[10px] uppercase tracking-wide" style={{ color: 'rgba(212,175,55,0.7)' }}>majorité 61</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wide" style={{ color: 'rgba(217,43,43,0.75)' }}>Bloc opposition</p>
              <p className="text-4xl font-black font-mono text-[var(--p-red)] leading-none mt-1"><CountUp value={oppositionSeats} delay={200} /></p>
            </div>
          </div>

          <Hemicycle seatsByListe={latestPoll?.seats_by_liste || []} listes={listes} height={220} />

          <p className="text-center text-[11px] -mt-2" style={{ color: 'rgba(245,240,232,0.3)' }}>
            {latestPoll
              ? `Projection ${latestPoll.institute} du ${new Date(latestPoll.poll_date).toLocaleDateString('fr-FR')}`
              : 'Composition à venir — le premier sondage sièges apparaîtra ici'}
          </p>
        </div>
      </div>

      {/* Classement des listes */}
      <div className="max-w-3xl mx-auto px-4 pb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold text-base" style={{ fontFamily: "'Syne', sans-serif", color: 'var(--p-text)' }}>
            Dernière projection sièges
          </h2>
          <Link to={createPageUrl('Listes')}
            className="text-xs flex items-center gap-1 hover:text-[var(--p-text)] transition-colors"
            style={{ color: 'var(--p-text-40)' }}>
            Toutes les listes <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {rankedListes.length === 0 ? (
          <div className="rounded-2xl p-8 text-center" style={{ background: 'rgba(10,18,38,0.6)' }}>
            <p className="text-sm" style={{ color: 'rgba(245,240,232,0.3)' }}>Sondages à venir…</p>
          </div>
        ) : (
          <div className="rounded-2xl p-5" style={{ background: 'rgba(10,18,38,0.8)', border: '0.5px solid rgba(245,240,232,0.07)' }}>
            {rankedListes.map((l, i) => (
              <ListeSnapshotRow key={l.id} liste={l} seats={l._seats} maxSeats={maxSeats} index={i} />
            ))}
            {latestPoll && (
              <p className="text-[10px] mt-3 pt-3 border-t" style={{ color: 'rgba(245,240,232,0.25)', borderColor: 'rgba(245,240,232,0.05)' }}>
                {latestPoll.institute} · {new Date(latestPoll.poll_date).toLocaleDateString('fr-FR')}
              </p>
            )}
          </div>
        )}

        {/* Liens secondaires */}
        <div className="flex items-center justify-center gap-6 mt-12 pt-10"
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
