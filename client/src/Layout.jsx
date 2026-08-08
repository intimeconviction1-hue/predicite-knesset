import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, MapPin, Trophy, BookOpen,
  HelpCircle, Menu, X, Vote, ChevronDown,
  LogOut, BarChart2, Landmark, Newspaper, Flame, Coins, Users, UserCheck, Zap, Wind, Compass, ShieldCheck, PieChart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import Onboarding from '@/components/knesset/Onboarding';
import BarreDeJeu from '@/components/knesset/BarreDeJeu';
import { computeScore } from '@/lib/score';
import { titrePour } from '@/lib/titres';
import { useMesureAudience } from '@/lib/useMesureAudience';

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isJouerOpen, setIsJouerOpen] = useState(false);
  const [isApprendreOpen, setIsApprendreOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const location = useLocation();
  const jouerRef = useRef(null);
  const apprendreRef = useRef(null);
  const userMenuRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // Titre d'onglet. Posé ici plutôt que page par page : le Layout est le seul
  // endroit qui connaisse déjà le nom de la page courante, et une page nouvelle
  // hérite d'un titre correct sans y penser. Une page qui a besoin d'un titre
  // dynamique (Liste écrit le nom du parti) garde son propre effet : les effets
  // enfants s'exécutent avant celui du parent au montage, mais le sien se
  // redéclenche quand sa donnée arrive, donc c'est bien lui qui gagne.
  useEffect(() => {
    document.title = titrePour(currentPageName);
  }, [currentPageName]);

  // Compteur de fréquentation : un jour, une page, une provenance, et rien qui
  // permette de reconnaître qui que ce soit. Posé ici parce que le Layout est le
  // seul endroit traversé par toutes les pages — et parce qu'il connaît déjà le
  // nom de page, seule valeur envoyée. Voir lib/useMesureAudience.js.
  useMesureAudience(currentPageName);

  const { data: userProgress, refetch: refetchProgress } = useQuery({
    queryKey: ['user-progress-header', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const progress = await base44.entities.UserProgress.filter({ user_email: user.email });
      return progress[0];
    },
    enabled: !!user?.email
  });

  // Série de jours consécutifs — une fois par jour et par utilisateur, pour
  // faire revenir les gens sans spammer l'API à chaque navigation interne.
  useEffect(() => {
    if (!user?.email) return;
    const today = new Date().toISOString().slice(0, 10);
    const key = `streak_ping_${user.email}_${today}`;
    if (sessionStorage.getItem(key)) return;
    base44.functions.invoke('updateStreakAndBadges', {})
      .then(() => { sessionStorage.setItem(key, '1'); refetchProgress(); })
      .catch(() => {});
  }, [user?.email]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsJouerOpen(false);
    setIsApprendreOpen(false);
    setIsUserMenuOpen(false);
  }, [location]);

  // Fermer les dropdowns au clic extérieur
  useEffect(() => {
    const handler = (e) => {
      if (jouerRef.current && !jouerRef.current.contains(e.target)) setIsJouerOpen(false);
      if (apprendreRef.current && !apprendreRef.current.contains(e.target)) setIsApprendreOpen(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setIsUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Échap referme le menu ouvert et rend le focus à son déclencheur. Le handler
  // ci-dessus n'écoutait que `mousedown` : un utilisateur au clavier ouvrait un
  // menu et n'avait aucun moyen de le refermer — il tabulait « à travers » sans
  // savoir qu'il était ouvert.
  useEffect(() => {
    const surEchap = (e) => {
      if (e.key !== 'Escape') return;
      const ouvert = isJouerOpen || isApprendreOpen || isUserMenuOpen || isMobileMenuOpen;
      if (!ouvert) return;
      const conteneur = isJouerOpen ? jouerRef : isApprendreOpen ? apprendreRef : userMenuRef;
      setIsJouerOpen(false);
      setIsApprendreOpen(false);
      setIsUserMenuOpen(false);
      setIsMobileMenuOpen(false);
      conteneur?.current?.querySelector('button')?.focus();
    };
    document.addEventListener('keydown', surEchap);
    return () => document.removeEventListener('keydown', surEchap);
  }, [isJouerOpen, isApprendreOpen, isUserMenuOpen, isMobileMenuOpen]);

  // Nav organisée autour de l'axe « jouer en apprenant, apprendre en s'amusant » :
  // Jouer = la mécanique du jeu (règles, classement, quiz) ; Apprendre = le
  // contenu de l'élection elle-même (listes, PM, historique, actu).
  // Nav en GROUPES (forme + fond) avec un « pont » explicite vers l'autre axe —
  // « jouer en apprenant, apprendre en jouant ». « Comment ça marche » (les
  // règles) est SORTI des menus pour une place centrale (lien de nav dédié + Home).
  // ⚠️ MaRepartition est le geste FONDATEUR du produit (répartir les 120 sièges).
  // Il n'était référencé nulle part dans la nav jusqu'au 2026-08-04 — seulement
  // au bas de la fiche d'une liste. Pendant ce temps cinq CTA promettaient « faire
  // mon pronostic » et menaient à la grille des listes. Il ouvre donc le menu.
  const jouerGroups = [
    { group: 'Pronostiquer', items: [
      { name: 'MaRepartition', label: 'Mon pronostic', icon: PieChart, hint: 'Répartis les 120 sièges' },
      { name: 'Paris', label: 'Le direct', icon: Zap, hint: 'Mise tes jetons sur les sondages' },
    ] },
    { group: 'Mini-jeux', items: [
      { name: 'SensDuVent', label: 'Le sens du vent', icon: Wind },
      { name: 'FormeCoalition', label: 'Forme ta coalition', icon: Landmark },
      { name: 'Boussole', label: 'Quel parti te ressemble ?', icon: Compass },
      { name: 'VraiOuFake', label: 'Vrai ou Fake ?', icon: ShieldCheck },
      { name: 'Quiz', label: 'Quiz', icon: HelpCircle },
    ] },
    { group: 'Ta progression', items: [
      { name: 'Leaderboard', label: 'Classement', icon: Trophy },
      { name: 'Ligues', label: 'Ligues privées', icon: Users },
    ] },
  ];
  const jouerBridge = { name: 'ReglesDuJeu', label: 'Nouveau ? Comment ça marche', icon: BookOpen };

  const apprendreGroups = [
    { group: "L'élection", items: [
      { name: 'Learn', label: "L'élection en bref", icon: BookOpen },
      { name: 'Voter', label: 'Comment on vote', icon: UserCheck },
    ] },
    { group: 'Les acteurs', items: [
      { name: 'Listes', label: 'Les listes', icon: MapPin },
      { name: 'PremierMinistre', label: 'Premier ministre', icon: Vote },
    ] },
    { group: 'Suivre & vérifier', items: [
      { name: 'Actu', label: 'Actu de la campagne', icon: Newspaper },
      { name: 'Historique', label: 'Historique', icon: Landmark },
      { name: 'Methodologie', label: 'Sources & méthodo', icon: BarChart2 },
    ] },
  ];
  const apprendreBridge = { name: 'Quiz', label: 'Teste-toi : le Quiz', icon: HelpCircle };

  const jouerFlat = jouerGroups.flatMap(g => g.items);
  const apprendreFlat = apprendreGroups.flatMap(g => g.items);

  const isActive = (name) => currentPageName === name;
  const isJouerActive = jouerFlat.some(i => isActive(i.name));
  const isApprendreActive = apprendreFlat.some(i => isActive(i.name));

  // Rendu d'un menu déroulant en GROUPES (titre + items) suivi d'un PONT vers
  // l'autre axe. Réutilisé par les deux menus desktop.
  const renderGroups = (groups, bridge, activeColor) => {
    const BIcon = bridge?.icon;
    return (
      <>
        {groups.map((g, gi) => (
          <div key={g.group} style={gi > 0 ? { borderTop: '0.5px solid rgba(20,32,61,0.07)', marginTop: 4, paddingTop: 4 } : undefined}>
            <p className="px-4 pt-1.5 pb-1 text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: 'var(--p-text-40)' }} role="presentation">{g.group}</p>
            {g.items.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.name);
              return (
                <Link key={item.name} to={createPageUrl(item.name)}
                  role="menuitem"
                  aria-current={active ? 'page' : undefined}
                  className="flex items-start gap-2.5 px-4 py-2 text-sm transition-colors hover:bg-[rgba(20,32,61,0.05)]"
                  style={{ color: active ? activeColor : 'var(--p-text-60)', background: active ? 'rgba(20,32,61,0.06)' : 'transparent' }}>
                  <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--p-text-25)' }} />
                  <span className="leading-tight">{item.label}{item.hint ? <span className="block text-[10px]" style={{ color: 'var(--p-text-40)' }}>{item.hint}</span> : null}</span>
                </Link>
              );
            })}
          </div>
        ))}
        {bridge ? (
          <Link to={createPageUrl(bridge.name)}
            role="menuitem"
            className="flex items-center gap-2 px-4 py-2.5 mt-1 text-xs font-semibold transition-colors hover:bg-[var(--p-blue-dim)]"
            style={{ color: 'var(--p-blue)', borderTop: '0.5px solid rgba(20,32,61,0.08)' }}>
            <BIcon className="w-3.5 h-3.5" /> {bridge.label}
          </Link>
        ) : null}
      </>
    );
  };



  const navLinkDark = (active) =>
    `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      active
        ? 'text-[var(--p-gold-text)] bg-[rgba(20,32,61,0.06)]'
        : 'text-[var(--p-text-60)] hover:text-[var(--p-text)] hover:bg-[rgba(20,32,61,0.05)]'
    }`;

  // Statut permanent du joueur : série · points · jetons. Réutilisé dans le header
  // desktop ET dans une barre compacte mobile (mobile n'affichait rien jusque-là).
  // N'affiche que des VRAIES valeurs issues de userProgress (jamais de faux chiffre).
  const mono = { fontFamily: 'var(--font-mono)' };
  const hasStats = !!(user && userProgress && (
    (userProgress.current_streak || 0) > 1 ||
    (userProgress.total_points || 0) > 0 ||
    (userProgress.jetons || 0) > 0
  ));
  const statChips = (compact) => {
    if (!user || !userProgress) return null;
    const streak = userProgress.current_streak || 0;
    const points = computeScore(userProgress);
    const jetons = userProgress.jetons || 0;
    const pad = compact ? 'px-2.5 py-1' : 'px-3 py-1.5';
    const chips = [];
    if (streak > 1) chips.push(
      <div key="s" className={`rounded-full border border-orange-400/30 flex items-center gap-1 ${compact ? 'px-2 py-1' : 'px-2.5 py-1.5'}`} style={{ background: 'rgba(194,65,12,0.08)' }} title={`${streak} jours d'activité consécutifs`}>
        <Flame className="w-3.5 h-3.5" style={{ color: '#C2410C' }} />
        <span className="text-sm font-bold" style={{ ...mono, color: '#C2410C' }}>{streak}</span>
      </div>
    );
    if (points > 0) chips.push(
      <div key="p" className={`rounded-full border border-[var(--p-gold)]/30 flex items-center gap-1.5 ${pad}`} style={{ background: 'var(--p-gold-faint)' }} title="Ton score total (permanent)">
        <span className="text-sm font-bold" style={{ ...mono, color: 'var(--p-gold-text)' }}>{points.toLocaleString('fr-FR')} pts</span>
      </div>
    );
    if (jetons > 0) chips.push(
      <div key="j" className={`rounded-full border border-[var(--p-blue)]/30 flex items-center gap-1.5 ${pad}`} style={{ background: 'var(--p-blue-dim)' }} title="Tes jetons de la semaine (à parier)">
        <Coins className="w-3.5 h-3.5" style={{ color: 'var(--p-blue)' }} />
        <span className="text-sm font-bold" style={{ ...mono, color: 'var(--p-blue)' }}>{jetons.toLocaleString('fr-FR')}</span>
      </div>
    );
    return chips.length ? <>{chips}</> : null;
  };

  const LogoSVG = () => (
    <svg width="28" height="28" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="lgold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--p-gold)"/>
          <stop offset="100%" stopColor="#C8A84A"/>
        </linearGradient>
        <linearGradient id="lar" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--p-gold)"/>
          <stop offset="100%" stopColor="#F0D060"/>
        </linearGradient>
      </defs>
      <rect x="6" y="6" width="8" height="52" rx="2" fill="var(--p-gold)" opacity="0.9"/>
      <path d="M14 6 Q34 6 34 18 Q34 30 14 30" fill="none" stroke="var(--p-gold)" strokeWidth="8" strokeLinecap="round" opacity="0.9"/>
      <rect x="15" y="36" width="6" height="22" rx="1.5" fill="url(#lgold)" opacity="0.7"/>
      <rect x="24" y="28" width="6" height="30" rx="1.5" fill="url(#lgold)" opacity="0.8"/>
      <rect x="33" y="20" width="6" height="38" rx="1.5" fill="url(#lgold)"/>
      <line x1="20" y1="36" x2="48" y2="8" stroke="url(#lar)" strokeWidth="3.5" strokeLinecap="round"/>
      <polygon points="48,8 38,11 46,19" fill="url(#lar)"/>
    </svg>
  );

  return (
    <div className="min-h-screen relative" style={{ background: 'var(--p-bg)' }}>
      {/* Fond décoratif fixe — halos de couleur + grain léger. Fixe au viewport
          (pas au document) pour rester présent partout, même entre les cartes,
          quel que soit le défilement.
          Les halos ne dérivent plus depuis le 2026-08-07 : le header collant
          les relit à travers un backdrop-filter, qui ne peut rien mettre en
          cache tant que son arrière-plan bouge. Voir globals.css. */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        {/* Photo institutionnelle en toile de fond — visible surtout sur les
            côtés gauche/droit au-delà de la colonne de contenu centrée.
            Elle était à 0.1 d'opacité sous 35 % de désaturation, c'est-à-dire
            invisible : on payait le chargement d'une photo de 226 Ko pour un
            gris légèrement sale. Remontée à 0.17, presque plus désaturée, avec
            un gain de contraste — assez pour qu'on RECONNAISSE le bâtiment,
            assez peu pour que le texte des cartes reste posé sur du calme. */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: "url('/images/knesset-parvis.webp')",
          backgroundSize: 'cover',
          backgroundPosition: 'center 42%',
          opacity: 0.17,
          filter: 'grayscale(10%) contrast(1.06) saturate(1.08)',
        }} />
        <div style={{
          position: 'absolute', top: '-14%', left: '-10%', width: '54vw', height: '54vw', maxWidth: 700, maxHeight: 700,
          borderRadius: '9999px', background: 'var(--p-gold)', opacity: 0.15, filter: 'blur(85px)',
        }} />
        {/* Halos bleus allégés (0.28 → 0.20, 0.24 → 0.17) : posés par-dessus la
            photo, ils la repeignaient en bleu uni dès qu'on remontait son
            opacité. Un halo doit colorer l'air, pas recouvrir le décor. */}
        <div style={{
          position: 'absolute', top: '0%', right: '-14%', width: '48vw', height: '48vw', maxWidth: 640, maxHeight: 640,
          borderRadius: '9999px', background: 'var(--p-blue)', opacity: 0.20, filter: 'blur(85px)',
        }} />
        <div style={{
          position: 'absolute', top: '40%', left: '6%', width: '44vw', height: '44vw', maxWidth: 580, maxHeight: 580,
          borderRadius: '9999px', background: 'var(--p-blue)', opacity: 0.17, filter: 'blur(85px)',
        }} />
        <div style={{
          position: 'absolute', bottom: '-16%', right: '-8%', width: '52vw', height: '52vw', maxWidth: 680, maxHeight: 680,
          borderRadius: '9999px', background: 'var(--p-gold)', opacity: 0.14, filter: 'blur(85px)',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(20,32,61,0.08) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }} />
      </div>

      {/* Skip to main content – navigation clavier (accessibilité) */}
      <a href="#main-content" className="skip-to-content">
        Aller au contenu principal
      </a>

      {/* Bandeau bleu/blanc/bleu — motif drapeau israélien.
          Le motif était redessiné ici à la main alors que `.p-tricolor` le décrit
          déjà et sert 9 fois ailleurs : deux définitions du même bandeau, dont
          une seule aurait suivi un changement de teinte. */}
      <div className="p-tricolor fixed top-0 z-[60]">
        <div /><div /><div />
      </div>

      {/* ── Desktop Header ── */}
      <header className="hidden md:block sticky top-0.5 z-50">
        {/* Verre dépoli plus franc (flou + saturation) : la photo de fond et les
            halos transparaissent sous la barre — de la profondeur, au lieu d'un
            bandeau opaque posé dessus. Le filet doré remplace la bordure grise. */}
        <div
          className="relative"
          style={{
            background: 'var(--p-header-bg)',
            backdropFilter: 'var(--p-header-blur)',
            WebkitBackdropFilter: 'var(--p-header-blur)',
            boxShadow: 'var(--p-header-shadow)',
          }}
        >
          <div aria-hidden="true" className="absolute bottom-0 left-0 right-0 h-px pointer-events-none"
            style={{ background: 'linear-gradient(90deg, transparent, var(--p-gold-border), transparent)' }} />
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between h-14">

              {/* Logo */}
              <Link to={createPageUrl('Home')} className="flex items-center gap-2 flex-shrink-0">
                <LogoSVG />
                <span className="font-bold text-sm tracking-wide" style={{ color: 'var(--p-gold-text)' }}>PrédiCité</span>
              </Link>

              {/* Nav — deux axes : Jouer (pronostiquer, comparer) et Apprendre (comprendre, contexte) */}
              <div className="flex items-center gap-0.5">
                <Link to={createPageUrl('Home')} className={navLinkDark(isActive('Home'))}>
                  <Home className="w-3.5 h-3.5" />
                  Accueil
                </Link>

                <Link to={createPageUrl('ReglesDuJeu')}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors hover:bg-[rgba(20,32,61,0.05)]"
                  style={{ color: isActive('ReglesDuJeu') ? 'var(--p-gold-text)' : 'var(--p-text-60)' }}>
                  <HelpCircle className="w-3.5 h-3.5" />
                  Comment ça marche
                </Link>

                <div className="relative" ref={jouerRef}>
                  <button
                    onClick={() => setIsJouerOpen(!isJouerOpen)}
                    className={`${navLinkDark(isJouerActive)} border border-[rgba(30,58,138,0.25)] bg-[rgba(30,58,138,0.08)]`}
                    style={{ color: isJouerActive ? 'var(--p-blue-deep)' : 'rgba(30,58,138,0.75)' }}
                    aria-haspopup="menu"
                    aria-expanded={isJouerOpen}
                  >
                    <Vote className="w-3.5 h-3.5" />
                    Jouer
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isJouerOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {isJouerOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        transition={{ duration: 0.15 }}
                        role="menu"
                        className="absolute top-full left-0 mt-1 w-64 rounded-xl border border-[rgba(20,32,61,0.1)] py-1 z-50"
                        style={{ background: 'rgba(255,255,255,0.98)', backdropFilter: 'blur(12px)', boxShadow: 'var(--p-elev-2)' }}
                      >
                        {renderGroups(jouerGroups, jouerBridge, 'var(--p-blue-deep)')}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="relative" ref={apprendreRef}>
                  <button
                    onClick={() => setIsApprendreOpen(!isApprendreOpen)}
                    className={`${navLinkDark(isApprendreActive)} border border-[var(--p-gold)]/30 bg-[var(--p-gold)]/8`}
                    style={{ color: isApprendreActive ? 'var(--p-gold-text)' : 'rgba(122,95,26,0.8)' }}
                    aria-haspopup="menu"
                    aria-expanded={isApprendreOpen}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    Apprendre
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isApprendreOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {isApprendreOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        transition={{ duration: 0.15 }}
                        role="menu"
                        className="absolute top-full right-0 mt-1 w-64 rounded-xl border border-[rgba(20,32,61,0.1)] py-1 z-50"
                        style={{ background: 'rgba(255,255,255,0.98)', backdropFilter: 'blur(12px)', boxShadow: 'var(--p-elev-2)' }}
                      >
                        {renderGroups(apprendreGroups, apprendreBridge, 'var(--p-gold-text)')}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* User bloc */}
              <div className="flex items-center gap-3 flex-shrink-0">
                {statChips(false)}
                {user ? (
                  <div className="relative" ref={userMenuRef}>
                    <button
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[rgba(20,32,61,0.05)] transition-colors"
                      aria-haspopup="menu"
                      aria-expanded={isUserMenuOpen}
                    >
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: 'var(--p-blue-deep)' }}>
                        {user.full_name?.charAt(0) || user.email?.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium" style={{ color: 'var(--p-text-60)' }}>
                        {user.full_name?.split(' ')[0] || user.email?.split('@')[0]}
                      </span>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} style={{ color: 'var(--p-text-40)' }} />
                    </button>
                    <AnimatePresence>
                      {isUserMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 6 }}
                          transition={{ duration: 0.15 }}
                          role="menu"
                          className="absolute top-full right-0 mt-1 w-44 rounded-xl border border-[rgba(20,32,61,0.1)] py-1 z-50"
                          style={{ background: 'rgba(255,255,255,0.98)', backdropFilter: 'blur(12px)', boxShadow: 'var(--p-elev-2)' }}
                        >
                          <button
                            role="menuitem"
                            onClick={() => base44.auth.logout()}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 w-full text-left"
                          >
                            <LogOut className="w-4 h-4" />
                            Déconnexion
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <Button
                    onClick={() => base44.auth.redirectToLogin()}
                    size="sm"
                    className="text-white font-semibold"
                    style={{ background: 'var(--p-blue-deep)' }}
                  >
                    Connexion
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Mobile Header ── */}
      <nav aria-label="Navigation mobile" className="md:hidden sticky top-0.5 z-50">
        {/* Verre dépoli plus franc (flou + saturation) : la photo de fond et les
            halos transparaissent sous la barre — de la profondeur, au lieu d'un
            bandeau opaque posé dessus. Le filet doré remplace la bordure grise. */}
        <div
          className="relative"
          style={{
            background: 'var(--p-header-bg)',
            backdropFilter: 'var(--p-header-blur)',
            WebkitBackdropFilter: 'var(--p-header-blur)',
            boxShadow: 'var(--p-header-shadow)',
          }}
        >
          <div aria-hidden="true" className="absolute bottom-0 left-0 right-0 h-px pointer-events-none"
            style={{ background: 'linear-gradient(90deg, transparent, var(--p-gold-border), transparent)' }} />
          <div className="flex items-center justify-between h-14 px-4 py-2">
            <Link to={createPageUrl('Home')} className="flex items-center gap-2">
              <LogoSVG />
              <span className="font-bold text-sm tracking-wide" style={{ color: 'var(--p-gold-text)' }}>PrédiCité</span>
            </Link>
            <div className="flex items-center gap-2">
              {user && (
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: 'var(--p-blue-deep)' }}>
                  {user.full_name?.charAt(0) || user.email?.charAt(0).toUpperCase()}
                </div>
              )}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2.5 rounded-lg hover:bg-[rgba(20,32,61,0.05)] active:bg-[rgba(20,32,61,0.1)] transition-colors min-w-[48px] min-h-[48px] flex items-center justify-center"
                aria-label={isMobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" style={{ color: 'var(--p-text-60)' }} /> : <Menu className="w-5 h-5" style={{ color: 'var(--p-text-60)' }} />}
              </button>
            </div>
          </div>

          {/* Barre de statut permanente (mobile) — série · points · jetons */}
          {hasStats && (
            <div className="flex items-center gap-2 px-4 pb-2 pt-1.5 overflow-x-auto border-t border-[rgba(20,32,61,0.06)]">
              <span className="text-[10px] font-bold uppercase tracking-widest flex-shrink-0" style={{ color: 'var(--p-text-40)' }}>Ton statut</span>
              {statChips(true)}
            </div>
          )}

          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="border-t border-[rgba(20,32,61,0.06)] overflow-hidden"
              >
                {/* Le menu compte dix-huit entrées : déplié, il mesure plus haut
                    qu'un écran de téléphone. Il passait donc SOUS le dock de jeu,
                    qui est fixé en bas — les dernières entrées (Actu, Historique,
                    Méthodo, Connexion) étaient recouvertes et injoignables. Il a
                    maintenant sa propre hauteur maximale et son propre
                    défilement, calculés sur la hauteur du dock. */}
                <div
                  className="p-3 space-y-0.5 overflow-y-auto overscroll-contain"
                  style={{ maxHeight: 'calc(100svh - 3.5rem - var(--p-dock-h) - 1.5rem)' }}
                >
                  <Link
                    to={createPageUrl('Home')}
                    className={`flex items-center gap-3 px-3 py-3 min-h-[48px] rounded-lg text-[15px] font-medium transition-colors ${
                      isActive('Home') ? 'bg-[rgba(20,32,61,0.08)] text-[var(--p-gold-text)]' : 'text-[var(--p-text-60)] hover:bg-[rgba(20,32,61,0.05)] hover:text-[var(--p-text)]'
                    }`}
                  >
                    <Home className="w-4 h-4" />
                    Accueil
                  </Link>

                  <Link
                    to={createPageUrl('ReglesDuJeu')}
                    className={`flex items-center gap-3 px-3 py-3 min-h-[48px] rounded-lg text-[15px] font-semibold transition-colors ${
                      isActive('ReglesDuJeu') ? 'bg-[rgba(20,32,61,0.08)] text-[var(--p-gold-text)]' : 'text-[var(--p-text-60)] hover:bg-[rgba(20,32,61,0.05)] hover:text-[var(--p-text)]'
                    }`}
                  >
                    <HelpCircle className="w-4 h-4" />
                    Comment ça marche
                  </Link>

                  <p className="px-3 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(30,58,138,0.6)' }}>Jouer</p>
                  {jouerFlat.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        to={createPageUrl(item.name)}
                        className={`flex items-center gap-3 px-3 py-3 min-h-[48px] rounded-lg text-[15px] font-medium transition-colors ${
                          isActive(item.name) ? 'bg-[rgba(20,32,61,0.08)] text-[var(--p-blue-deep)]' : 'text-[var(--p-text-60)] hover:bg-[rgba(20,32,61,0.05)] hover:text-[var(--p-text)]'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {item.label}
                      </Link>
                    );
                  })}

                  <p className="px-3 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--p-gold-text)' }}>Apprendre</p>
                  {apprendreFlat.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        to={createPageUrl(item.name)}
                        className={`flex items-center gap-3 px-3 py-3 min-h-[48px] rounded-lg text-[15px] font-medium transition-colors ${
                          isActive(item.name) ? 'bg-[rgba(20,32,61,0.08)] text-[var(--p-gold-text)]' : 'text-[var(--p-text-60)] hover:bg-[rgba(20,32,61,0.05)] hover:text-[var(--p-text)]'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {item.label}
                      </Link>
                    );
                  })}
                  {!user ? (
                    <Button onClick={() => base44.auth.redirectToLogin()} className="w-full mt-3 text-white" size="sm" style={{ background: 'var(--p-blue-deep)' }}>
                      Connexion
                    </Button>
                  ) : (
                    <button onClick={() => base44.auth.logout()} className="flex items-center gap-2 px-3 py-2.5 text-sm text-red-400 w-full mt-2 hover:bg-red-500/10 rounded-lg">
                      <LogOut className="w-4 h-4" />
                      Déconnexion
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>

      {/* Page content */}
      <main id="main-content" tabIndex="-1">
        {children}
      </main>

      {/* Onboarding « premier pronostic » — modale au tout premier passage */}
      <Onboarding />

      {/* Le dock de jeu — présent sur toutes les pages. Le geste fondateur
          (répartir les 120 sièges) et les cotes vivaient jusqu'ici au fond d'un
          menu déroulant : depuis le bas d'une fiche de liste, il fallait remonter
          tout le défilement puis ouvrir le burger pour jouer. */}
      <BarreDeJeu jetons={userProgress?.jetons ?? null} />

      {/* Footer */}
      {/* Le pied de page réserve la hauteur du dock : c'est LUI qui allonge, pas
          la page, sinon on verrait une bande de fond nu sous le footer. Le dock
          flotte donc au-dessus de son propre fond, jamais au-dessus d'un lien. */}
      <footer role="contentinfo" className="border-t border-[rgba(20,32,61,0.08)] mt-auto" style={{ background: 'var(--p-bg-2)', color: 'var(--p-text)' }}>
        <div className="max-w-7xl mx-auto px-4 pt-10"
          style={{ paddingBottom: 'calc(var(--p-dock-h) + 24px + env(safe-area-inset-bottom, 0px))' }}>
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-[var(--p-tricolor-blue)] rounded-md p-1.5">
                  <Vote className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold" style={{ color: 'var(--p-text)' }}>Knesset 2026</span>
              </div>
              <p className="text-sm" style={{ color: 'var(--p-text-60)' }}>
                Plateforme civique, gratuite et pédagogique sur les élections législatives israéliennes, à destination d'un public francophone.
              </p>
            </div>

            <div>
              <p className="font-semibold mb-3 text-sm uppercase tracking-wide" style={{ color: 'var(--p-text)' }}>Découvrir</p>
              <ul className="space-y-2 text-sm" style={{ color: 'var(--p-text-60)' }}>
                <li><Link to={createPageUrl('Listes')} className="hover:text-[var(--p-text)] transition-colors">Listes</Link></li>
                <li><Link to={createPageUrl('PremierMinistre')} className="hover:text-[var(--p-text)] transition-colors">Premier ministre</Link></li>
                <li><Link to={createPageUrl('Leaderboard')} className="hover:text-[var(--p-text)] transition-colors">Classement</Link></li>
              </ul>
            </div>

            <div>
              <p className="font-semibold mb-3 text-sm uppercase tracking-wide" style={{ color: 'var(--p-text)' }}>Apprendre</p>
              <ul className="space-y-2 text-sm" style={{ color: 'var(--p-text-60)' }}>
                <li><Link to={createPageUrl('Learn')} className="hover:text-[var(--p-text)] transition-colors">Les législatives israéliennes</Link></li>
                <li><Link to={createPageUrl('Voter')} className="hover:text-[var(--p-text)] transition-colors">Comment on vote à la Knesset</Link></li>
                <li><Link to={createPageUrl('PremierMinistre')} className="hover:text-[var(--p-text)] transition-colors">Formation du gouvernement</Link></li>
                <li><Link to={createPageUrl('Historique')} className="hover:text-[var(--p-text)] transition-colors">Historique des Knesset</Link></li>
                <li><Link to={createPageUrl('Actu')} className="hover:text-[var(--p-text)] transition-colors">Actu de la campagne</Link></li>
                <li><Link to={createPageUrl('Quiz')} className="hover:text-[var(--p-text)] transition-colors">Quiz</Link></li>
              </ul>
            </div>

            <div>
              <p className="font-semibold mb-3 text-sm uppercase tracking-wide" style={{ color: 'var(--p-text)' }}>Transparence</p>
              <ul className="space-y-2 text-sm" style={{ color: 'var(--p-text-60)' }}>
                <li><Link to={createPageUrl('Methodologie')} className="hover:text-[var(--p-text)] transition-colors">Sources & Méthodologie</Link></li>
                <li><Link to={createPageUrl('ReglesDuJeu')} className="hover:text-[var(--p-text)] transition-colors">Comment ça marche</Link></li>
                <li><Link to={createPageUrl('Mentions')} className="hover:text-[var(--p-text)] transition-colors">Mentions légales & données</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-[rgba(20,32,61,0.08)] mt-8 pt-6 flex flex-col md:flex-row items-center justify-between gap-2">
            <p className="text-xs" style={{ color: 'var(--p-text-40)' }}>
              © 2026 · Knesset 2026 · Plateforme neutre et pédagogique · Aucun parti politique associé
            </p>
            <p className="text-xs" style={{ color: 'var(--p-text-40)' }}>
              Élections : 27 octobre 2026
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}