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
import DeckDuJour from '@/components/knesset/DeckDuJour';
import TerrainDeJeu from '@/components/knesset/TerrainDeJeu';
import ArcadeJeux from '@/components/knesset/ArcadeJeux';
import ProgressionPalier from '@/components/knesset/ProgressionPalier';
import { computeScore } from '@/lib/score';
import { texteLisible } from '@/lib/couleurs';
import { useCampaignFlux } from '@/lib/useCampaignFlux';
import CountUp from '@/components/knesset/CountUp';
import { joursAvantScrutin } from '@/lib/echeances';
import { BLOC_LABEL, verdictMajorite, campDe } from '@/lib/blocs';
import { useProjection } from '@/lib/projection';

/**
 * Une liste : ce qu'elle a aujourd'hui, ce que le sondage lui donne, l'écart.
 *
 * Une projection ne veut rien dire seule : « Likoud 25 » n'est une information
 * que si l'on sait qu'il en a 32. Tout l'intérêt est dans le mouvement.
 *
 * 2026-08-07 — la Knesset sortante était un TRAIT DE 2 PIXELS posé sur la
 * barre. C'est-à-dire, en pratique, rien : sur une piste de 150 px, deux
 * pixels d'encre ne se lisent pas comme « le Likoud avait 32 sièges », ils se
 * lisent comme une poussière. Le terme de comparaison de tout le bloc était le
 * seul élément invisible du bloc.
 *
 * Deux pistes superposées le règlent : au-dessus, le SORTANT, hachuré (une
 * texture dit « c'est le passé » sans avoir à l'écrire) ; en dessous, la
 * PROJECTION, pleine. L'écart devient une différence de longueur entre deux
 * traits parallèles — la comparaison la plus facile que l'œil sache faire — et
 * les deux chiffres sont écrits côte à côte, « 32 → 25 ». Une liste nouvelle
 * n'a pas de piste haute : cette absence dit qu'elle part de rien.
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

  // Hachure de la piste « sortante » : la couleur du parti, mais en texture.
  // Une texture se distingue d'un aplat même à travers un daltonisme, et même
  // quand deux partis ont des bleus voisins — ce qui est le cas de quatre des
  // treize listes.
  const hachure = `repeating-linear-gradient(135deg,
    color-mix(in srgb, ${couleur} 62%, transparent) 0 4px,
    color-mix(in srgb, ${couleur} 16%, transparent) 4px 9px)`;

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
    >
      {/* `!block w-full` n'est pas décoratif : globals.css impose
          `display:inline-flex` à tout lien autonome (plancher tactile de 44 px)
          avec une spécificité qui bat les classes Tailwind. Sans le `!`, la
          ligne se réduirait à son contenu et les pistes n'auraient aucune
          largeur à prendre — c'est exactement le défaut qui a rendu les barres
          de cette page invisibles pendant des mois. */}
      <Link
        to={`${createPageUrl('Liste')}?slug=${liste.slug}`}
        className="group !block w-full py-2.5 px-2 -mx-2 rounded-lg transition-colors hover:bg-[var(--p-bg-2)]"
      >
        <span className="flex items-baseline justify-between gap-2 mb-1.5">
          <span className="text-[12.5px] font-semibold truncate min-w-0" style={{ color: 'var(--p-text)' }}>{liste.name_fr}</span>

          {/* Les deux chiffres CÔTE À CÔTE. Le sortant n'était écrit nulle part :
              il fallait deviner la longueur d'un trait de 2 px pour reconstituer
              « 32 ». On lit maintenant la phrase entière : 32 → 25, soit −7. */}
          <span className="flex items-baseline gap-1.5 flex-shrink-0">
            {!nouvelle && (
              <>
                <span className="text-[11px] font-mono font-semibold" style={{ color: 'var(--p-text-25)' }}>{sortant}</span>
                <span aria-hidden="true" className="text-[10px]" style={{ color: 'var(--p-text-25)' }}>→</span>
              </>
            )}
            {/* Le chiffre ne s'anime PAS, et c'est délibéré. Un compteur animé
                affiche son point de DÉPART tant que l'animation n'a pas démarré :
                la ligne annoncerait « 32 » comme si c'était la projection. Un
                chiffre faux mais plausible est précisément ce que ce site
                s'interdit. L'état au repos doit dire le vrai. */}
            <span className="text-[15px] font-bold font-mono"
              style={{ color: belowThreshold ? 'var(--p-text-25)' : texteLisible(couleur) }}>
              {seats}
            </span>
            <span className="text-[11px] font-bold font-mono w-11 text-right"
              style={{ color: nouvelle ? 'var(--p-gold-text)' : delta > 0 ? 'var(--p-green-text)' : delta < 0 ? 'var(--p-red)' : 'var(--p-text-25)' }}>
              {nouvelle ? 'nouv.' : delta === 0 ? '=' : `${delta > 0 ? '+' : ''}${delta}`}
            </span>
          </span>
        </span>

        {/* Piste haute — LA KNESSET SORTANTE, hachurée. Absente pour une liste
            nouvelle : rien à comparer, et ce vide est l'information. */}
        <span className="block relative h-[7px] rounded-full mb-[3px]"
          style={{ background: nouvelle ? 'transparent' : 'var(--p-text-10)' }}>
          {!nouvelle && sortant > 0 && (
            <span className="absolute inset-y-0 left-0 rounded-full" aria-hidden="true"
              style={{ width: `${pct(sortant)}%`, background: hachure }} />
          )}
        </span>

        {/* Piste basse — LA PROJECTION, pleine. Elle part de la longueur du
            sortant et glisse vers la projection : avec la piste hachurée juste
            au-dessus comme repère fixe, le mouvement se lit littéralement comme
            un déplacement par rapport au passé.
            Sous « mouvement réduit », tout est peint directement — une largeur
            portée uniquement par l'animation laisserait une barre vide si
            l'observateur ne se déclenchait jamais. */}
        <span className="block relative h-[11px] rounded-full" style={{ background: 'var(--p-text-10)' }}>
          {reduit ? (
            <span className="absolute inset-y-0 left-0 rounded-full"
              style={{ width: `${arrivee}%`, backgroundColor: couleur, opacity: belowThreshold ? 0.35 : 1 }} />
          ) : (
            <motion.span
              className="absolute inset-y-0 left-0 rounded-full block"
              style={{ backgroundColor: couleur, opacity: belowThreshold ? 0.35 : 1 }}
              initial={{ width: `${depart}%` }}
              whileInView={{ width: `${arrivee}%` }}
              viewport={{ once: true, margin: '-12%' }}
              transition={{ duration: 0.9, delay: 0.2 + index * 0.05, ease: [0.16, 1, 0.3, 1] }}
            />
          )}
          {/* Une liste passée sous le seuil garde une trace : sans elle, une
              barre à zéro est indistinguable d'une barre pas encore chargée. */}
          {belowThreshold && !nouvelle && (
            <span className="absolute inset-y-0 left-0 flex items-center pl-1.5 text-[9px] font-bold uppercase tracking-wider"
              style={{ color: 'var(--p-red)' }}>
              sous le seuil
            </span>
          )}
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

  const { data: listes = [], isPending: listesChargent } = useQuery({
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


  // Cotes en direct (marchés publics) : elles alimentent le deck du jour (dos
  // des cartes) et le terrain de jeu.
  const { data: parisData } = useQuery({
    queryKey: ['home-paris'],
    queryFn: () => base44.paris.marches(),
    staleTime: 60 * 1000,
  });

  // Le plateau vient de la projection partagée : moyenne des 5 derniers
  // sondages, seuil appliqué, total ramené à 120. La Home lisait le dernier
  // sondage brut, « Forme ta coalition » la moyenne — et les deux pages
  // affichaient des sièges différents pour le même parti le même jour.
  // `sondages` (8) reste chargé à part : il alimente le consensus, dont le sujet
  // EST le désaccord entre instituts et qu'une moyenne effacerait.
  const {
    siegesParListe, pourHemicycle, provenance,
    pret: projectionPrete, chargement: projectionCharge, sondages: sondagesProjection,
  } = useProjection(listes, { listesChargent });
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

  // Le regroupement en camps vient de lib/blocs.js : il etait recopie ici, dans
  // useCampaignFlux, dans MaRepartition et dans le bareme serveur.
  const sommeCamp = (camp) => listesAvecSieges.filter(l => campDe(l.bloc) === camp).reduce((s, l) => s + l._seats, 0);
  const proSeats = sommeCamp('pro');
  const antiSeats = sommeCamp('anti');
  const arabSeats = listesAvecSieges.filter(l => l.bloc === 'partis_arabes').reduce((s, l) => s + l._seats, 0);

  // Accroche dynamique — toujours vraie, quel que soit le sondage du jour.
  // La phrase vient de lib/blocs.js : elle était recopiée ici, dans le bandeau
  // en direct et dans la carte du fait du jour, et les trois avaient divergé.
  const verdict = projectionPrete
    ? verdictMajorite({ pro: proSeats, anti: antiSeats, arabes: arabSeats })
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
        /* La photo d'ouverture était un cadrage de trottoir : prise depuis la
           route d'en face, abribus, poubelle, grillage et un passant au premier
           plan, sous une lumière de midi écrasée — et 60 % de l'image en ciel
           vide. Sous le voile, il n'en restait rien. Elle cède la place à la vue
           frontale depuis le parvis (drapeaux, lignes qui convergent vers
           l'entrée) puis à la vue de trois quarts en lumière rasante. */
        photos={['/images/knesset-parvis.jpg', '/images/knesset-soir.jpg', '/images/listes-hero.jpg', '/images/pm-hero.jpg']}
        position="center 48%"
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
            {/* Pendant le chargement, un tiret — jamais un zéro. Un « 0 » en
                36 px de haut est un CHIFFRE : il annonce que le camp
                pro-Netanyahou n'a aucun siège. C'est ce que voyait tout premier
                visiteur pendant les cinquante secondes de réveil de l'instance
                Render, trois zéros et « en attente du premier sondage » alors
                que la base en contient 160. L'état le plus vu du site affirmait
                le contraire de la vérité. */}
            <div className="text-left">
              <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--p-blue)' }}>{BLOC_LABEL.pro_netanyahou}</p>
              <p className="text-4xl font-black font-mono leading-none mt-1" style={{ color: projectionCharge ? 'var(--p-text-25)' : 'var(--p-blue)' }}>
                {projectionCharge ? '—' : <CountUp value={proSeats} />}
              </p>
            </div>
            <div className="text-center pb-0.5">
              {projectionCharge ? (
                <p className="text-[10px] font-bold uppercase tracking-wide animate-pulse" style={{ color: 'var(--p-text-25)' }}>Chargement…</p>
              ) : arabSeats > 0 && (
                <>
                  <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--p-green-text)' }}>{BLOC_LABEL.partis_arabes}</p>
                  <p className="text-2xl font-black font-mono leading-none mt-1" style={{ color: 'var(--p-green-text)' }}><CountUp value={arabSeats} delay={400} /></p>
                </>
              )}
              <p className="text-[10px] uppercase tracking-wide mt-1.5" style={{ color: 'var(--p-text-25)' }}>
                120 sièges · <span className="font-semibold" style={{ color: 'var(--p-gold-text)' }}>majorité 61</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--p-red)' }}>{BLOC_LABEL.anti_netanyahou}</p>
              <p className="text-4xl font-black font-mono leading-none mt-1" style={{ color: projectionCharge ? 'var(--p-text-25)' : 'var(--p-red)' }}>
                {projectionCharge ? '—' : <CountUp value={antiSeats} delay={200} />}
              </p>
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

          {/* Trois états, pas deux. « Composition à venir — le premier sondage
              apparaîtra ici » est vrai le jour du lancement, et faux tout le
              reste du temps : le dire pendant un chargement, c'est annoncer
              qu'aucun sondage n'existe alors qu'il y en a 160. La phrase est
              gardée pour le seul cas où elle est exacte. */}
          {projectionCharge ? (
            <p className="text-center text-[13px] mt-1 animate-pulse" style={{ color: 'var(--p-text-40)' }}>
              Chargement de la projection…
            </p>
          ) : verdict ? (
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
            {provenance || (projectionCharge ? '' : 'En attente du premier sondage sièges')}
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
                pro={proSeats}
                anti={antiSeats}
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

      {/* Le deck du jour — trois cartes recto/verso (signature « vases
          communicants » : chaque fait vérifié se retourne sur ce qu'il permet de
          jouer). Il n'y en avait qu'UNE, toujours la même : un seul
          retournement possible, donc jamais l'habitude de retourner. */}
      {projectionPrete && (
        <div className="p-glow-gold pt-2 pb-5">
          <DeckDuJour
            listesAvecSieges={listesAvecSieges}
            verdict={verdict}
            sondagesProjection={sondagesProjection}
            marches={parisData?.marches || []}
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

      {/* L'arcade — les cinq jeux courts, à plat. Ils n'existaient que dans un
          menu déroulant : trois clics et une lecture pour découvrir qu'on peut
          jouer. Ils arrivent juste après le terrain de jeu, qui vient de
          promettre « tout ce qui bouge se joue » — voici avec quoi. */}
      <div className="p-reveal pt-4 pb-5">
        <ArcadeJeux />
      </div>

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
        <p className="text-xs mb-3" style={{ color: 'var(--p-text-40)' }}>
          La Knesset sortante face à la projection du jour, liste par liste.
        </p>

        {/* Légende des deux pistes. Elle montre les textures au lieu de les
            décrire : « hachuré = sortant » se comprend une fois qu'on l'a vu,
            jamais quand on le lit. */}
        <div className="flex items-center gap-5 mb-4 text-[10.5px] flex-wrap" style={{ color: 'var(--p-text-40)' }}>
          <span className="inline-flex items-center gap-2">
            <span aria-hidden="true" className="w-8 h-[7px] rounded-full"
              style={{ background: 'repeating-linear-gradient(135deg, var(--p-text-40) 0 4px, transparent 4px 9px)' }} />
            Knesset sortante (25<sup>e</sup>)
          </span>
          <span className="inline-flex items-center gap-2">
            <span aria-hidden="true" className="w-8 h-[11px] rounded-full" style={{ background: 'var(--p-text-60)' }} />
            Projection du jour
          </span>
        </div>

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
          style={{ background: 'var(--p-bg-2)', border: '0.5px solid var(--p-gold-border)' }}>
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
