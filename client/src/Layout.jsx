import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, MapPin, Trophy, Users, BookOpen, 
  HelpCircle, Menu, X, Vote, ChevronDown,
  User, LogOut, BarChart2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import SurveyBanner from '@/components/surveys/SurveyBanner';
import { useQuery } from '@tanstack/react-query';

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const location = useLocation();
  const moreRef = useRef(null);
  const userMenuRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: userProgress } = useQuery({
    queryKey: ['user-progress-header', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const progress = await base44.entities.UserProgress.filter({ user_email: user.email });
      return progress[0];
    },
    enabled: !!user?.email
  });

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsMoreOpen(false);
    setIsUserMenuOpen(false);
  }, [location]);

  // Fermer les dropdowns au clic extérieur
  useEffect(() => {
    const handler = (e) => {
      if (moreRef.current && !moreRef.current.contains(e.target)) setIsMoreOpen(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setIsUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // 5 items principaux
  const mainNavItems = [
    { name: 'Home', label: 'Accueil', icon: Home },
    { name: 'Listes', label: 'Listes', icon: MapPin },
    { name: 'PremierMinistre', label: 'Premier ministre', icon: Vote },
    { name: 'Leaderboard', label: 'Classement', icon: Trophy },
    { name: 'Learn', label: 'Comprendre', icon: BookOpen },
  ];

  // Menu "Plus"
  const moreNavItems = [
    { name: 'Quiz', label: 'Quiz', icon: HelpCircle },
    { name: 'Predictions', label: 'Mes pronostics', icon: Vote },
    { name: 'PollMap', label: 'Carte', icon: BarChart2 },
    { name: 'Leagues', label: 'Cercles', icon: Users },
  ];

  const isActive = (name) => currentPageName === name;
  const isMoreActive = moreNavItems.some(i => isActive(i.name));



  const navLinkDark = (active) =>
    `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      active
        ? 'text-[#D4AF37] bg-white/8'
        : 'text-white/60 hover:text-white hover:bg-white/8'
    }`;

  const LogoSVG = () => (
    <svg width="28" height="28" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="lgold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#D4AF37"/>
          <stop offset="100%" stopColor="#C8A84A"/>
        </linearGradient>
        <linearGradient id="lar" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#D4AF37"/>
          <stop offset="100%" stopColor="#F0D060"/>
        </linearGradient>
      </defs>
      <rect x="6" y="6" width="8" height="52" rx="2" fill="#D4AF37" opacity="0.9"/>
      <path d="M14 6 Q34 6 34 18 Q34 30 14 30" fill="none" stroke="#D4AF37" strokeWidth="8" strokeLinecap="round" opacity="0.9"/>
      <rect x="15" y="36" width="6" height="22" rx="1.5" fill="url(#lgold)" opacity="0.7"/>
      <rect x="24" y="28" width="6" height="30" rx="1.5" fill="url(#lgold)" opacity="0.8"/>
      <rect x="33" y="20" width="6" height="38" rx="1.5" fill="url(#lgold)"/>
      <line x1="20" y1="36" x2="48" y2="8" stroke="url(#lar)" strokeWidth="3.5" strokeLinecap="round"/>
      <polygon points="48,8 38,11 46,19" fill="url(#lar)"/>
    </svg>
  );

  return (
    <div className="min-h-screen" style={{ background: '#050505' }}>
      {/* Skip to main content – navigation clavier (accessibilité) */}
      <a href="#main-content" className="skip-to-content">
        Aller au contenu principal
      </a>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');
        body { font-family: 'Outfit', ui-sans-serif, system-ui, sans-serif; }
      `}</style>

      {/* Bandeau bleu/blanc/bleu — motif drapeau israélien */}
      <div className="h-0.5 w-full flex fixed top-0 z-[60]">
        <div className="w-1/3 h-full bg-[#0038B8]" />
        <div className="w-1/3 h-full bg-white/70" />
        <div className="w-1/3 h-full bg-[#0038B8]" />
      </div>

      {/* ── Desktop Header ── */}
      <header className="hidden md:block sticky top-0.5 z-50">
        <div
          className="border-b border-white/10"
          style={{ background: 'rgba(7,18,42,0.95)', backdropFilter: 'blur(12px)' }}
        >
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between h-14">

              {/* Logo */}
              <Link to={createPageUrl('Home')} className="flex items-center gap-2 flex-shrink-0">
                <LogoSVG />
                <span className="font-bold text-sm tracking-wide" style={{ color: '#D4AF37' }}>PrédiCité</span>
              </Link>

              {/* Nav */}
              <div className="flex items-center gap-0.5">
                {mainNavItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link key={item.name} to={createPageUrl(item.name)} className={navLinkDark(isActive(item.name))}>
                      <Icon className="w-3.5 h-3.5" />
                      {item.label}
                    </Link>
                  );
                })}
                {/* Règles — lien direct visible */}
                <Link to={createPageUrl('ReglesDuJeu')} className={`${navLinkDark(isActive('ReglesDuJeu'))} border border-[#D4AF37]/30 bg-[#D4AF37]/8 hover:bg-[#D4AF37]/15`} style={{ color: isActive('ReglesDuJeu') ? '#D4AF37' : '#D4AF37cc' }}>
                  <BookOpen className="w-3.5 h-3.5" />
                  Règles
                </Link>

                <div className="relative" ref={moreRef}>
                  <button onClick={() => setIsMoreOpen(!isMoreOpen)} className={navLinkDark(isMoreActive)}>
                    Plus
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isMoreOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {isMoreOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full right-0 mt-1 w-48 rounded-xl border border-white/10 py-1 z-50"
                        style={{ background: 'rgba(7,18,42,0.97)', backdropFilter: 'blur(12px)' }}
                      >
                        {moreNavItems.map((item) => {
                          const Icon = item.icon;
                          return (
                            <Link
                              key={item.name}
                              to={createPageUrl(item.name)}
                              className={`flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${
                                isActive(item.name) ? 'text-[#D4AF37] bg-white/8' : 'text-white/60 hover:text-white hover:bg-white/6'
                              }`}
                            >
                              <Icon className="w-4 h-4 text-white/30" />
                              {item.label}
                            </Link>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* User bloc */}
              <div className="flex items-center gap-3 flex-shrink-0">
                {user && userProgress && userProgress.total_points > 0 && (
                  <div className="px-3 py-1.5 rounded-full border border-[#D4AF37]/30 flex items-center gap-1.5" style={{ background: 'rgba(212,175,55,0.1)' }}>
                    <span className="text-sm font-bold" style={{ fontFamily: "'JetBrains Mono', monospace", color: '#D4AF37' }}>
                      {(userProgress.total_points || 0).toLocaleString('fr-FR')} pts
                    </span>
                  </div>
                )}
                {user ? (
                  <div className="relative" ref={userMenuRef}>
                    <button
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/8 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: '#1E3A8A' }}>
                        {user.full_name?.charAt(0) || user.email?.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-white/80">
                        {user.full_name?.split(' ')[0] || user.email?.split('@')[0]}
                      </span>
                      <ChevronDown className={`w-3.5 h-3.5 text-white/40 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                    </button>
                    <AnimatePresence>
                      {isUserMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 6 }}
                          transition={{ duration: 0.15 }}
                          className="absolute top-full right-0 mt-1 w-44 rounded-xl border border-white/10 py-1 z-50"
                          style={{ background: 'rgba(7,18,42,0.97)', backdropFilter: 'blur(12px)' }}
                        >
                          <Link to={createPageUrl('Profile')} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/6">
                            <User className="w-4 h-4 text-white/30" />
                            Mon profil
                          </Link>
                          <div className="h-px bg-white/10 mx-2 my-1" />
                          <button
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
                    style={{ background: '#1E3A8A' }}
                  >
                    Connexion
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
        <SurveyBanner />
      </header>

      {/* ── Mobile Header ── */}
      <nav aria-label="Navigation mobile" className="md:hidden sticky top-0.5 z-50">
        <div
          className="border-b border-white/10"
          style={{ background: 'rgba(7,18,42,0.95)', backdropFilter: 'blur(12px)' }}
        >
          <div className="flex items-center justify-between h-13 px-4 py-2">
            <Link to={createPageUrl('Home')} className="flex items-center gap-2">
              <LogoSVG />
              <span className="font-bold text-sm tracking-wide" style={{ color: '#D4AF37' }}>PrédiCité</span>
            </Link>
            <div className="flex items-center gap-2">
              {user && (
                <Link to={createPageUrl('Profile')}>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: '#1E3A8A' }}>
                    {user.full_name?.charAt(0) || user.email?.charAt(0).toUpperCase()}
                  </div>
                </Link>
              )}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2.5 rounded-lg hover:bg-white/8 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label={isMobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              >
                {isMobileMenuOpen ? <X className="w-5 h-5 text-white/70" /> : <Menu className="w-5 h-5 text-white/70" />}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="border-t border-white/8 overflow-hidden"
              >
                <div className="p-3 space-y-0.5">
                  {[...mainNavItems, { name: 'ReglesDuJeu', label: 'Règles du jeu', icon: BookOpen }, { name: 'Voter', label: 'Comment voter ?', icon: Vote }, ...moreNavItems].map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        to={createPageUrl(item.name)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                          isActive(item.name) ? 'bg-white/10 text-[#D4AF37]' : 'text-white/60 hover:bg-white/6 hover:text-white'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {item.label}
                      </Link>
                    );
                  })}
                  {!user ? (
                    <Button onClick={() => base44.auth.redirectToLogin()} className="w-full mt-3 text-white" size="sm" style={{ background: '#1E3A8A' }}>
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
        <SurveyBanner />
      </nav>

      {/* Page content */}
      <main id="main-content" tabIndex="-1">
        {children}
      </main>

      {/* Footer */}
      <footer role="contentinfo" className="bg-[#07122A] border-t border-white/10 text-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-[#0038B8] rounded-md p-1.5">
                  <Vote className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-white">Knesset 2026</span>
              </div>
              <p className="text-white/50 text-sm">
                Plateforme civique, gratuite et pédagogique sur les élections législatives israéliennes, à destination d'un public francophone.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-3 text-white/80 text-sm uppercase tracking-wide">Découvrir</h4>
              <ul className="space-y-2 text-sm text-white/50">
                <li><Link to={createPageUrl('Listes')} className="hover:text-white transition-colors">Listes</Link></li>
                <li><Link to={createPageUrl('PremierMinistre')} className="hover:text-white transition-colors">Premier ministre</Link></li>
                <li><Link to={createPageUrl('Quiz')} className="hover:text-white transition-colors">Quiz</Link></li>
                <li><Link to={createPageUrl('Leaderboard')} className="hover:text-white transition-colors">Classement</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-3 text-white/80 text-sm uppercase tracking-wide">Apprendre</h4>
              <ul className="space-y-2 text-sm text-white/50">
                <li><Link to={createPageUrl('Learn')} className="hover:text-white transition-colors">Les législatives israéliennes</Link></li>
                <li><Link to={createPageUrl('ReglesDuJeu')} className="hover:text-white transition-colors">Comment on vote à la Knesset</Link></li>
                <li><Link to={createPageUrl('PremierMinistre')} className="hover:text-white transition-colors">Formation du gouvernement</Link></li>
                <li><Link to={createPageUrl('Voter')} className="hover:text-white transition-colors">Comment voter ?</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-3 text-white/80 text-sm uppercase tracking-wide">Transparence</h4>
              <ul className="space-y-2 text-sm text-white/50">
                <li><Link to={createPageUrl('Methodologie')} className="hover:text-white transition-colors">Sources & Méthodologie</Link></li>
                <li><Link to={createPageUrl('Surveys')} className="hover:text-white transition-colors">Tous les sondages</Link></li>
                <li><Link to={createPageUrl('Predictions')} className="hover:text-white transition-colors">Pronostics</Link></li>
                <li><Link to={createPageUrl('Leaderboard')} className="hover:text-white transition-colors">Classement</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 mt-8 pt-6 flex flex-col md:flex-row items-center justify-between gap-2">
            <p className="text-xs text-white/30">
              © 2026 · Knesset 2026 · Plateforme neutre et pédagogique · Aucun parti politique associé
            </p>
            <p className="text-xs text-white/25">
              Élections : 27 octobre 2026
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}