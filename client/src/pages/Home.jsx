import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
// useReducedMotion explicitement : MotionConfig reducedMotion="user" ne coupe
// que les animations de transform et de layout. Une largeur animée n'en est pas
// une — elle continuerait de bouger pour quelqu'un qui a demandé l'arrêt.
import { motion, useReducedMotion } from 'framer-motion';
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
import { BLOC_LABEL, verdictMajorite } from '@/lib/blocs';
import { useProjection } from '@/lib/projection';

/**
 * Une liste : ce qu'elle a aujourd'hui, ce que le sondage lui donne, l'écart.
 *
 * Avant, cette ligne n'affichait que la projection — et la page ne montrait
 * NULLE PART la Knesset actuelle. Or une projection ne veut rien dire seule :
 * « Likoud 22 » n'est une information que si l'on sait qu'il en a 32. Tout
 * l'intérêt est dans le mouvement, et c'est justement lui qu'on ne voyait pas.
 *
 * Le sortant est un repère SUR la barre (trait vertical), pas une colonne de
 * plus : on lit la longueur actuelle et la longueur projetée d'un seul coup
 * d'œil, et l'écart devient visible avant même d'avoir lu le chiffre. Une liste
 * nouvelle n'a pas de repère — elle part de rien, et cette absence se voit.
 */
function ListeSnapshotRow({ liste, seats, maxSeats, index }) {
  const belowThreshold = seats === 0;
  const sortant = liste.current_knesset_seats;
  const nouvelle = sortant == null;
  const delta = nouvelle ? null : seats - sortant;
  const couleur = liste.color || '#6B7280';
  const reduit = useReducedMotion();

  // La barre part de la position ACTUELLE et se déplace vers la projection :
  // c'est le mouvement qui informe, pas la longueur finale. Un remplissage
  // depuis zéro raconterait une apparition ; ici on montre une perte ou un gain.
  // Une liste nouvelle part bien de zéro — elle, elle apparaît vraiment.
  const pct = (n) => Math.max(2, Math.min(100, (n / maxSeats) * 100));
  const depart = nouvelle ? 0 : pct(sortant);
  const arrivee = pct(seats || 0);

  // Le segment d'écart reste visible sous la barre une fois le mouvement fini :
  // on continue de voir d'où l'on vient. Vert si la liste gagne, rouge si elle
  // perd — la même convention que le chiffre d'écart à droite.
  const ecart = nouvelle || delta === 0 ? null : {
    gauche: `${Math.min(depart, arrivee)}%`,
    largeur: `${Math.abs(arrivee - depart)}%`,
    couleur: delta > 0 ? 'var(--p-green)' : 'var(--p-red)',
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
    >
      {/* `w-full` n'est pas décoratif. La règle de cible tactile de globals.css
          impose `display: inline-flex` à tout lien autonome : la classe `flex`
          écrite ici ne gagne pas, et un inline-flex se réduit à son contenu. La
          barre en `flex-1` n'avait donc AUCUNE largeur à prendre — mesurée à
          0 px, depuis toujours (le défaut est antérieur à ce bloc). Les barres
          comparatives de la page d'accueil n'ont jamais été visibles. */}
      <Link
        to={`${createPageUrl('Liste')}?slug=${liste.slug}`}
        className="flex w-full items-center gap-2.5 py-2 px-2 -mx-2 rounded-lg transition-colors hover:bg-[var(--p-night-2)]"
      >
        <span className="text-xs w-24 sm:w-32 shrink-0 truncate" style={{ color: 'var(--p-text-60)' }}>{liste.name_fr}</span>

        <div className="relative flex-1 min-w-0 h-2.5 rounded-full" style={{ background: 'var(--p-text-10)' }}>
          {/* Segment d'écart — la trace du chemin parcouru, posée sous la barre.
              Sous « mouvement réduit », tout est peint directement : pas de
              whileInView du tout. Le piège évité est net — avec `initial={false}`
              et une largeur portée uniquement par l'animation, une barre pas
              encore entrée dans le champ n'aurait EU aucune largeur, et serait
              restée vide si l'observateur ne se déclenchait jamais. */}
          {ecart && (
            reduit ? (
              <span className="absolute inset-y-0 rounded-full" aria-hidden="true"
                style={{ left: ecart.gauche, width: ecart.largeur, background: ecart.couleur, opacity: 0.22 }} />
            ) : (
              <motion.span
                className="absolute inset-y-0 rounded-full" aria-hidden="true"
                style={{ left: ecart.gauche, width: ecart.largeur, background: ecart.couleur }}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 0.22 }}
                viewport={{ once: true, margin: '-12%' }}
                transition={{ duration: 0.4, delay: 0.5 + index * 0.05 }}
              />
            )
          )}
          {reduit ? (
            <div className="absolute inset-y-0 left-0 rounded-full"
              style={{ width: `${arrivee}%`, backgroundColor: couleur, opacity: belowThreshold ? 0.3 : 1 }} />
          ) : (
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{ backgroundColor: couleur, opacity: belowThreshold ? 0.3 : 1 }}
              initial={{ width: `${depart}%` }}
              whileInView={{ width: `${arrivee}%` }}
              viewport={{ once: true, margin: '-12%' }}
              transition={{ duration: 0.9, delay: 0.2 + index * 0.05, ease: [0.16, 1, 0.3, 1] }}
            />
          )}
          {/* Repère du sortant. Le halo le garde lisible aussi bien sur la barre
              colorée que sur la piste vide — il doit se voir des deux côtés du
              mouvement, c'est tout son intérêt. */}
          {!nouvelle && sortant > 0 && (
            <span
              className="absolute top-[-3px] bottom-[-3px] w-[2px] rounded-full"
              style={{
                left: `calc(${Math.min(100, (sortant / maxSeats) * 100)}% - 1px)`,
                background: 'var(--p-text)',
                boxShadow: '0 0 0 1.5px var(--p-card)',
              }}
              aria-hidden="true"
            />
          )}
        </div>

        {/* Le chiffre ne s'anime PAS, et c'est délibéré. J'avais d'abord fait
            descendre le Likoud de 32 à 22 en même temps que sa barre : joli, et
            dangereux. Un compteur animé affiche son point de DÉPART tant que
            l'animation n'a pas démarré — mesuré ici, la ligne annonçait « 32 »
            comme si c'était la projection. Un chiffre faux mais plausible est
            précisément ce que ce site s'interdit ; une barre encore immobile
            n'est qu'une imprécision visuelle. L'état au repos doit dire le vrai,
            le mouvement n'est qu'un commentaire par-dessus. */}
        <span className="text-xs font-bold font-mono w-7 text-right shrink-0"
          style={{ color: belowThreshold ? 'var(--p-text-25)' : texteLisible(couleur) }}>
          {seats}
        </span>

        {/* Colonne d'écart resserrée sur mobile : à 375 px, les trois colonnes
            fixes ne laissaient que 79 px à la barre, qui est justement ce qu'on
            vient là pour lire. */}
        <span className="text-[11px] font-bold font-mono w-10 sm:w-[52px] text-right shrink-0"
          style={{ color: nouvelle ? 'var(--p-gold-text)' : delta > 0 ? 'var(--p-green-text)' : delta < 0 ? 'var(--p-red)' : 'var(--p-text-25)' }}>
          {nouvelle ? 'nouv.' : delta === 0 ? '=' : `${delta > 0 ? '+' : ''}${delta}`}
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
          // Échec silencieux voulu : la création du profil de progression est un
          // confort, pas une condition d'affichage de la page d'accueil. On ne
          // marque pas la session comme faite, la tentative se rejouera.
          try {
            await base44.functions.invoke('ensureUserProgress', {});
            sessionStorage.setItem(key, '1');
          } catch { /* réessai au prochain chargement */ }
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

  // Le plateau vient de la projection partagée : moyenne des 5 derniers
  // sondages, seuil appliqué, total ramené à 120. La Home lisait le dernier
  // sondage brut, « Forme ta coalition » la moyenne — et les deux pages
  // affichaient des sièges différents pour le même parti le même jour.
  // `sondages` (8) reste chargé à part : il alimente le consensus, dont le sujet
  // EST le désaccord entre instituts et qu'une moyenne effacerait.
  const {
    siegesParListe, pourHemicycle, provenance,
    pret: projectionPrete, sondages: sondagesProjection,
  } = useProjection(listes);
  // Sur TOUTES les listes (pas seulement le top 10 affiché plus bas), sinon
  // les blocs coalition/opposition perdent les listes hors classement — et
  // la liste_arabe, qui n'est ni l'un ni l'autre, doit apparaître à part
  // plutôt que d'être silencieusement absente du total.
  const listesAvecSieges = listes.map(l => ({ ...l, _seats: siegesParListe.get(l.id) ?? 0 }));
  const rankedListes = [...listesAvecSieges].sort((a, b) => b._seats - a._seats).slice(0, 10);

  // Le tableau « ce qui change » prend TOUTES les listes en lice, pas le top 10 :
  // une liste projetée à zéro est justement l'information la plus forte de la
  // page (Unité nationale passe de 12 sièges à rien). La tronquer au classement
  // reviendrait à ne montrer que ceux qui vont bien.
  const listesQuiChangent = [...listesAvecSieges].sort((a, b) => b._seats - a._seats);
  // L'échelle des barres doit couvrir le sortant AUSSI, sinon le repère du
  // Likoud (32 sortants pour 23 au plus haut projeté) sortirait de la piste.
  const maxSeats = Math.max(20, ...listesAvecSieges.map(l => Math.max(l._seats, l.current_knesset_seats ?? 0)));

  const coalitionSeats = listesAvecSieges.filter(l => l.bloc === 'coalition').reduce((s, l) => s + l._seats, 0);
  const oppositionSeats = listesAvecSieges.filter(l => l.bloc === 'opposition' || l.bloc === 'non_alignee').reduce((s, l) => s + l._seats, 0);
  const arabSeats = listesAvecSieges.filter(l => l.bloc === 'liste_arabe').reduce((s, l) => s + l._seats, 0);

  // Accroche dynamique — toujours vraie, quel que soit le sondage du jour.
  // La phrase vient de lib/blocs.js : elle était recopiée ici, dans le bandeau
  // en direct et dans la carte du fait du jour, et les trois avaient divergé.
  const verdict = projectionPrete
    ? verdictMajorite({ coalition: coalitionSeats, opposition: oppositionSeats, arabes: arabSeats })
    : null;

  const daysLeft = joursAvantScrutin();
  const firstName = user?.full_name?.split(' ')[0] || user?.email?.split('@')[0];

  // Flux « en direct » de la campagne (faits réels agrégés) — hook partagé Home/Paris.
  // `sansProjection` : l'hémicycle est deux cents pixels plus bas, inutile que le
  // bandeau récite d'abord les mêmes quatre listes, le même institut et le même
  // verdict. Il garde ce que l'hémicycle ne montre pas — mouvements, cotes, actu.
  const tickerItems = useCampaignFlux({ sansProjection: true });

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
            style={{ background: 'var(--p-grad-gold)', color: 'var(--p-ink)', boxShadow: '0 12px 30px -12px var(--p-gold-glow), 0 2px 8px rgba(0,0,0,0.28)' }}>
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
            {/* Trois blocs, pas deux et une note. Les partis arabes tenaient dans
                un 10 px vert entre deux chiffres de 36 px : personne ne les
                voyait, et on lisait « 51 » et « 58 » comme un total qui ne fait
                pas 120. Or ce sont eux le PIVOT — ni l'un ni l'autre camp
                n'atteint 61 sans eux, c'est le fait le plus important de la page
                et il était le moins lisible. Ils restent plus petits que les deux
                camps, parce qu'ils le sont ; mais dans la même famille, avec le
                même traitement, pour que la somme se fasse à l'œil. */}
            <div className="text-left">
              <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--p-blue)' }}>{BLOC_LABEL.coalition}</p>
              <p className="text-4xl font-black font-mono leading-none mt-1" style={{ color: 'var(--p-blue)' }}><CountUp value={coalitionSeats} /></p>
            </div>
            <div className="text-center pb-0.5">
              {arabSeats > 0 && (
                <>
                  <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--p-green-text)' }}>{BLOC_LABEL.liste_arabe}</p>
                  <p className="text-2xl font-black font-mono leading-none mt-1" style={{ color: 'var(--p-green-text)' }}><CountUp value={arabSeats} delay={400} /></p>
                </>
              )}
              <p className="text-[10px] uppercase tracking-wide mt-1.5" style={{ color: 'var(--p-text-25)' }}>
                120 sièges · <span className="font-semibold" style={{ color: 'var(--p-gold-text)' }}>majorité 61</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--p-red)' }}>{BLOC_LABEL.opposition}</p>
              <p className="text-4xl font-black font-mono leading-none mt-1" style={{ color: 'var(--p-red)' }}><CountUp value={oppositionSeats} delay={200} /></p>
            </div>
          </div>

          <Hemicycle seatsByListe={pourHemicycle} listes={listes} height={250} />

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
          {/* La provenance annonce la moyenne, pas un institut : afficher
              « Projection Channel 13 » sous un hémicycle moyenné attribuerait à
              un institut des chiffres qu'il n'a pas publiés. */}
          <p className="text-center text-[11px] mt-1 px-4" style={{ color: 'var(--p-text-25)' }}>
            {provenance || 'En attente du premier sondage sièges'}
          </p>
          {/* Le moment exact où l'envie naît : on vient de lire l'assemblée
              projetée — « et toi, tu la vois comment ? ». Le geste central du
              produit se propose ICI, pas au fond d'un menu. */}
          {projectionPrete && (
            <div className="flex justify-center items-center gap-3 mt-4 flex-wrap">
              <Link to={createPageUrl('MaRepartition')} className="p-btn-gold-solid gap-2">
                Compose la tienne — 120 sièges <ArrowRight className="w-4 h-4" />
              </Link>
              <ShareProjection
                seatsByListe={rankedListes.filter(l => l._seats > 0).map(l => ({ seats: l._seats, color: l.color, name: l.name_fr }))}
                coalition={coalitionSeats}
                opposition={oppositionSeats}
                arab={arabSeats}
                source={provenance}
              />
            </div>
          )}
        </div>

      </div>

      {/* Courbe de tendance — juste sous l'hémicycle : la photo du jour, puis
          l'évolution. HomeIntro s'intercalait ici, en se justifiant d'arriver
          « APRÈS la donnée » — sauf qu'il en restait deux blocs derrière lui.
          Il coupait la séquence en deux au lieu de la suivre ; il descend donc
          après le consensus, une fois la démonstration faite. */}
      <SondagesTrend />

      {/* Consensus des sondages — l'hémicycle montre UN sondage ; ici on dit si
          les derniers s'accordent sur le leader, ou s'ils divergent (honnêteté). */}
      <ConsensusSondages sondages={sondages} listes={listes} />

      {/* Le fait du jour se joue — carte recto/verso (signature « vases
          communicants » : le sondage vérifié se retourne sur son pari + quiz) */}
      {projectionPrete && (
        <div className="p-reveal p-glow-gold max-w-md mx-auto px-4 pt-2 pb-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-center mb-3" style={{ color: 'var(--p-gold-text)' }}>Le fait du jour se joue — retourne la carte</p>
          <RectoVersoCard
            badge="Sondages · fait vérifié"
            /* Les chiffres sont ceux de la moyenne : les attribuer à un institut
               unique lui prêterait une publication qui n'existe pas. */
            title={`Moyenne des ${sondagesProjection.length} derniers sondages`}
            fact={verdict}
            nums={rankedListes.filter(l => l._seats > 0).slice(0, 2).map(l => ({ n: l._seats, label: l.name_fr }))}
            source={provenance}
            betQuestion={topMarket?.question}
            betCote={topMarket?.issues?.[0]?.cote?.toFixed(2)}
            betTo={createPageUrl('Paris')}
            quizTo={createPageUrl('Quiz')}
          />
        </div>
      )}

      {/* Le terrain de jeu — le registre JEU (or, énergie). Il arrivait en
          neuvième position : le héros promet « parie tes jetons », et il fallait
          traverser quatre blocs de Marbre avant le premier élément jouable. Qui
          ne descendait pas aux deux tiers de la page ne voyait jamais que
          PrédiCité est un jeu. Il remonte juste derrière la carte recto/verso,
          qui est précisément la bascule d'un registre à l'autre : le fait se
          retourne sur son pari, et le terrain de jeu prend le relais. L'or au
          milieu du bleu n'est pas une faute de rythme, c'est l'énoncé même des
          vases communicants — on joue et on apprend dans le même mouvement. */}
      {(parisData?.marches?.length > 0) && (
        <div className="p-reveal max-w-3xl mx-auto px-4 pt-2 pb-5">
          <TerrainDeJeu
            marches={parisData.marches}
            jetons={progress?.jetons ?? null}
            streak={progress?.current_streak ?? 0}
          />
        </div>
      )}

      {/* Ta progression vers le palier suivant (joueur connecté) — juste après
          le terrain de jeu : on vient de voir ce qui se joue, voici où tu en es. */}
      {user && progress && (
        <div className="max-w-3xl mx-auto px-4 pt-2 pb-2">
          <ProgressionPalier progress={progress} />
        </div>
      )}

      {/* Orientation : « comprendre en 30 secondes ». Arrive une fois la
          démonstration faite — la donnée, puis le jeu, puis seulement
          l'explication de ce qu'est cette plateforme. */}
      <HomeIntro />

      {/* Ce qui change — le bloc s'appelait « Dernière projection sièges » et
          réaffichait, une hauteur d'écran plus bas, exactement le tableau que la
          légende de l'hémicycle venait de donner : mêmes listes, mêmes sièges,
          même source. Il compare désormais la Knesset SORTANTE à la projection,
          ce qui règle deux choses d'un coup — la redite disparaît, et la
          composition actuelle, qui n'apparaissait nulle part sur la page,
          devient le point de comparaison. Une projection seule ne dit rien :
          « Likoud 22 » n'informe que si l'on sait qu'il en a 32. */}
      <div className="p-reveal max-w-3xl mx-auto px-4 pb-10">
        <div className="flex items-end justify-between mb-1">
          <h2 className="font-bold text-base" style={{ fontFamily: 'var(--font-display)', color: 'var(--p-text)' }}>
            Ce qui <span className="p-gradient-gold">change</span>
          </h2>
          <Link to={createPageUrl('Listes')}
            className="text-xs flex items-center gap-1 hover:text-[var(--p-text)] transition-colors"
            style={{ color: 'var(--p-text-40)' }}>
            Toutes les listes <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        <p className="text-xs mb-5" style={{ color: 'var(--p-text-40)' }}>
          La Knesset sortante face à la projection du jour. Le trait sur la barre marque les sièges d'aujourd'hui.
        </p>

        {listesQuiChangent.length === 0 ? (
          <div className="rounded-2xl p-8 text-center" style={{ background: 'var(--p-card)', border: '0.5px solid var(--p-border)' }}>
            <p className="text-sm" style={{ color: 'var(--p-text-40)' }}>Sondages à venir…</p>
          </div>
        ) : (
          <div className="p-card p-5" style={{ borderRadius: '18px' }}>
            {listesQuiChangent.map((l, i) => (
              <ListeSnapshotRow key={l.id} liste={l} seats={l._seats} maxSeats={maxSeats} index={i} />
            ))}
            {provenance && (
              <p className="text-[10px] mt-3 pt-3 border-t" style={{ color: 'var(--p-text-25)', borderColor: 'var(--p-border)' }}>
                Sortants : 25ᵉ Knesset. {provenance}
              </p>
            )}
          </div>
        )}

        {/* Appel final. La page se terminait sur ce tableau puis quatre liens
            gris : après tout ce défilement, le geste central du produit n'était
            proposé nulle part. C'est pourtant ici qu'on vient de voir ce qui
            bouge — le moment où l'on a un avis. */}
        <div className="mt-10 rounded-2xl px-6 py-8 text-center relative overflow-hidden"
          style={{ background: 'var(--p-night-2)', border: '0.5px solid var(--p-gold-border)' }}>
          <div className="p-tricolor absolute inset-x-0 top-0"><div /><div /><div /></div>
          <p className="text-[11px] font-black uppercase tracking-widest mb-2" style={{ color: 'var(--p-gold-text)' }}>À toi</p>
          <h3 className="text-xl md:text-2xl font-black mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--p-text)', letterSpacing: '-0.02em' }}>
            Tu la vois comment, cette Knesset ?
          </h3>
          <p className="text-sm mb-5 max-w-md mx-auto" style={{ color: 'var(--p-text-60)' }}>
            Répartis les 120 sièges à ta façon. Ton score se calcule le soir du 27 octobre, au dépouillement.
          </p>
          <Link to={createPageUrl('MaRepartition')} className="p-btn-gold-solid gap-2">
            Compose ta Knesset <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

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
