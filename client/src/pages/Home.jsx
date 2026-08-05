import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ChevronRight, Trophy, ArrowRight, Vote, Gamepad2, BookOpen } from 'lucide-react';
import Hemicycle from '@/components/knesset/Hemicycle';
import CinematicHero, { HeroGold } from '@/components/knesset/CinematicHero';
import ShareProjection from '@/components/knesset/ShareProjection';
import LiveTicker from '@/components/knesset/LiveTicker';
import ConsensusSondages from '@/components/knesset/ConsensusSondages';
import HomeIntro from '@/components/knesset/HomeIntro';
import SondagesTrend from '@/components/knesset/SondagesTrend';
import RectoVersoCard from '@/components/knesset/RectoVersoCard';
import TerrainDeJeu from '@/components/knesset/TerrainDeJeu';
import ProgressionPalier from '@/components/knesset/ProgressionPalier';
import { computeScore } from '@/lib/score';
import { texteLisible } from '@/lib/couleurs';
import { useCampaignFlux } from '@/lib/useCampaignFlux';
import CountUp from '@/components/knesset/CountUp';
import { joursAvantScrutin } from '@/lib/echeances';


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
        <span className="text-xs font-bold font-mono w-14 text-right shrink-0" style={{ color: belowThreshold ? 'var(--p-text-25)' : (liste.color ? texteLisible(liste.color) : 'var(--p-gold-text)') }}>
          {belowThreshold ? 'seuil' : `${seats} sièges`}
        </span>
      </Link>
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
    queryFn: () => base44.entities.SondageSieges.list('-poll_date', 8),
  });

  const { data: progress } = useQuery({
    queryKey: ['home-user-progress', user?.email],
    queryFn: () => base44.entities.UserProgress.filter({ user_email: user.email }),
    enabled: !!user?.email,
    select: d => d[0],
  });


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

  const daysLeft = joursAvantScrutin();
  const firstName = user?.full_name?.split(' ')[0] || user?.email?.split('@')[0];

  // Flux « en direct » de la campagne (faits réels agrégés) — hook partagé Home/Paris.
  const tickerItems = useCampaignFlux();

  return (
    <div className="min-h-screen" style={{ background: 'transparent' }}>

      {/* Hero cinématique institutionnel (composant maison CinematicHero) : vraie
          photo Ken Burns + voile bleu + Menorah + parallaxe. « Campagne en direct ». */}
      <CinematicHero
        size="full"
        photos={['/images/knesset-hero.jpg', '/images/listes-hero.jpg', '/images/pm-hero.jpg']}
        position="center 26%"
        badge={{ text: `La campagne en direct · J-${daysLeft}`, live: true }}
        kicker="Élections à la Knesset · 26ᵉ législature · 27 octobre 2026"
        title={<>Le scrutin est à <HeroGold>toi</HeroGold>.</>}
        subtitle="L'observatoire-jeu de la campagne israélienne. Prédis les sièges, parie tes jetons, trouve ton parti, apprends le scrutin — en français, gratuit et neutre."
        actions={<>
          {/* « Prédis » menait à la grille des listes — il mène au geste qu'il
              promet : la répartition des 120 sièges. */}
          <Link to={createPageUrl('MaRepartition')}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-[10px] font-bold text-sm transition-transform hover:-translate-y-0.5"
            style={{ background: 'var(--p-grad-gold)', color: 'var(--p-ink)', boxShadow: '0 12px 30px -12px rgba(212,175,55,0.6), 0 2px 8px rgba(0,0,0,0.28)' }}>
            <Vote className="w-4 h-4" /> Prédis
          </Link>
          <Link to={createPageUrl('Paris')}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-[10px] font-bold text-sm text-white transition-transform hover:-translate-y-0.5"
            style={{ background: 'rgba(255,255,255,0.14)', border: '0.5px solid rgba(255,255,255,0.30)' }}>
            <Gamepad2 className="w-4 h-4" /> Joue
          </Link>
          <Link to={createPageUrl('Learn')}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-[10px] font-bold text-sm text-white transition-transform hover:-translate-y-0.5"
            style={{ background: 'rgba(255,255,255,0.14)', border: '0.5px solid rgba(255,255,255,0.30)' }}>
            <BookOpen className="w-4 h-4" /> Apprends
          </Link>
        </>}
      >
        {/* état joueur (réel) ou ligne d'accroche honnête pour les visiteurs */}
        {user && progress ? (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            className="mt-6 inline-flex items-center gap-3 px-4 py-2.5 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.10)', border: '0.5px solid rgba(255,255,255,0.20)' }}>
            <Trophy className="w-3.5 h-3.5" style={{ color: '#ffd77a' }} />
            <span className="text-sm text-white">Bonjour {firstName} ·</span>
            <span className="font-bold text-sm font-mono" style={{ color: '#ffd77a' }}>
              {computeScore(progress).toLocaleString('fr-FR')} pts
            </span>
          </motion.div>
        ) : (
          <p className="mt-5 text-[13px]" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Gratuit · ton score au dépouillement, le soir du 27 octobre.
          </p>
        )}
      </CinematicHero>

      {/* Flux « en direct » de la campagne — défile juste sous le héros */}
      <LiveTicker items={tickerItems} />

      {/* Bloc hémicycle — sur fond clair, juste sous le hero. La Home empilait
          16 blocs (un sommaire déroulé, pas une composition) : l'hémicycle est
          LA pièce maîtresse, il passe donc en premier, et HomeIntro descend
          l'expliquer ensuite au lieu de retarder la donnée. */}
      <div className="relative overflow-hidden pt-2">

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
                <p className="text-[10px] uppercase tracking-wide mt-1" style={{ color: 'var(--p-green-text)' }}>+ {arabSeats} listes arabes</p>
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
          {/* Le moment exact où l'envie naît : on vient de lire l'assemblée
              projetée — « et toi, tu la vois comment ? ». Le geste central du
              produit se propose ICI, pas au fond d'un menu. */}
          {latestPoll && (
            <div className="flex justify-center items-center gap-3 mt-4 flex-wrap">
              <Link to={createPageUrl('MaRepartition')} className="p-btn-gold-solid gap-2">
                Compose la tienne — 120 sièges <ArrowRight className="w-4 h-4" />
              </Link>
              <ShareProjection
                seatsByListe={rankedListes.filter(l => l._seats > 0).map(l => ({ seats: l._seats, color: l.color, name: l.name_fr }))}
                coalition={coalitionSeats}
                opposition={oppositionSeats}
                arab={arabSeats}
                source={`Projection ${latestPoll.institute}${latestPoll.publisher_media ? ` (${latestPoll.publisher_media})` : ''} · ${new Date(latestPoll.poll_date).toLocaleDateString('fr-FR')}`}
              />
            </div>
          )}
        </div>

      </div>

      {/* Orientation : comprendre la plateforme — APRÈS la donnée, pas avant. */}
      <HomeIntro />

      {/* Courbe de tendance — juste sous l'hémicycle : la photo du jour, puis l'évolution */}
      <SondagesTrend />

      {/* Consensus des sondages — l'hémicycle montre UN sondage ; ici on dit si
          les derniers s'accordent sur le leader, ou s'ils divergent (honnêteté). */}
      <ConsensusSondages sondages={sondages} listes={listes} />

      {/* Le fait du jour se joue — carte recto/verso (signature « vases
          communicants » : le sondage vérifié se retourne sur son pari + quiz) */}
      {latestPoll && (
        <div className="p-reveal p-glow-gold max-w-md mx-auto px-4 pt-2 pb-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-center mb-3" style={{ color: 'var(--p-gold-text)' }}>Le fait du jour se joue — retourne la carte</p>
          <RectoVersoCard
            badge="Sondage · fait vérifié"
            title={`${latestPoll.institute} · ${new Date(latestPoll.poll_date).toLocaleDateString('fr-FR')}`}
            fact={nobodyHasMajority ? "Aucun bloc n'atteint la majorité de 61 sièges." : 'Un bloc franchit la barre des 61 sièges.'}
            nums={rankedListes.filter(l => l._seats > 0).slice(0, 2).map(l => ({ n: l._seats, label: l.name_fr }))}
            source={`Projection ${latestPoll.institute}${latestPoll.publisher_media ? ` (${latestPoll.publisher_media})` : ''}`}
            betQuestion={topMarket?.question}
            betCote={topMarket?.issues?.[0]?.cote?.toFixed(2)}
            betTo={createPageUrl('Paris')}
            quizTo={createPageUrl('Quiz')}
          />
        </div>
      )}

      {/* Ta progression vers le palier suivant (joueur connecté) — la montée
          en grade rendue désirable, et célébrée quand elle arrive. */}
      {user && progress && (
        <div className="max-w-3xl mx-auto px-4 pt-2">
          <ProgressionPalier progress={progress} />
        </div>
      )}

      {/* Le terrain de jeu — le registre JEU (or, énergie) : ce qui se joue
          maintenant, jouable en un clic. Contrepoids du registre Marbre. */}
      {(parisData?.marches?.length > 0) && (
        <div className="p-reveal max-w-3xl mx-auto px-4 pt-2 pb-5">
          <TerrainDeJeu
            marches={parisData.marches}
            jetons={progress?.jetons ?? null}
            streak={progress?.current_streak ?? 0}
          />
        </div>
      )}

      {/* Classement des listes */}
      <div className="p-reveal max-w-3xl mx-auto px-4 pb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold text-base" style={{ fontFamily: 'var(--font-display)', color: 'var(--p-text)' }}>
            Dernière projection <span className="p-gradient-gold">sièges</span>
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
          <div className="p-card p-5" style={{ borderRadius: '18px' }}>
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
        <hr className="p-hairline-gold mt-12" />
        <div className="flex items-center justify-center gap-6 pt-10 flex-wrap">
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
