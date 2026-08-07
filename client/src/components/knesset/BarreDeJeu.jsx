import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Zap, Gamepad2, Trophy, Coins, X, ArrowRight } from 'lucide-react';
import { JEUX } from '@/components/knesset/ArcadeJeux';

/**
 * LA BARRE DE JEU — le dock permanent.
 *
 * Le problème qu'elle règle : jouer demandait de remonter. Le geste fondateur
 * du produit (répartir les 120 sièges) et le hub des cotes vivaient dans un menu
 * déroulant du header — c'est-à-dire à trois interactions de distance depuis le
 * bas d'une fiche de liste, d'un article ou d'une page d'histoire. Sur mobile,
 * il fallait en plus remonter tout le défilement pour atteindre le burger. La
 * barre pose ces quatre gestes à portée de pouce, partout, tout le temps.
 *
 * Deux formes, un seul composant :
 *   · mobile  — barre pleine largeur collée en bas (le pouce y va sans viser) ;
 *   · desktop — pilule flottante centrée, en verre, qui ne mange pas la page.
 *
 * Les jetons ne sont PAS repris ici : le header mobile affiche déjà la barre de
 * statut (série · points · jetons), et le header desktop ses pastilles. Répéter
 * un solde à deux endroits, c'est deux endroits à garder d'accord.
 *
 * Elle laisse le contenu respirer : --p-dock-h (globals.css) est la seule source
 * de sa hauteur, et le Layout s'en sert pour réserver la place en bas de page.
 */

const ONGLETS = [
  { name: 'MaRepartition', label: 'Prédis', icon: PieChart, aide: 'Répartis les 120 sièges' },
  { name: 'Paris', label: 'Le direct', icon: Zap, aide: 'Les cotes du moment', live: true },
  { name: '__jeux', label: 'Jeux', icon: Gamepad2, aide: 'Les cinq jeux courts' },
  { name: 'Leaderboard', label: 'Rang', icon: Trophy, aide: 'Le classement' },
];

const PAGES_DE_JEU = new Set(JEUX.map(j => j.name));

/** La feuille des jeux — ouverte depuis l'onglet « Jeux ». */
function FeuilleJeux({ onClose, retourFocus }) {
  const panneau = useRef(null);

  useEffect(() => {
    panneau.current?.focus();
    const surTouche = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', surTouche);
    return () => {
      document.removeEventListener('keydown', surTouche);
      retourFocus?.current?.focus();
    };
  }, [onClose, retourFocus]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        onClick={onClose}
        className="fixed inset-0 z-[55]"
        style={{ background: 'rgba(10,18,38,0.5)', backdropFilter: 'blur(3px)' }}
        aria-hidden="true"
      />
      <motion.div
        ref={panneau}
        tabIndex={-1}
        role="dialog"
        /* Pas d'aria-modal : la feuille ne piège pas le focus et le dock reste
           volontairement actif dessous (on peut passer d'un onglet à l'autre
           sans la refermer). L'annoncer modale décrirait un comportement que
           le composant n'a pas. Échap et le clic sur le fond la ferment. */
        aria-label="Les mini-jeux"
        initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 28 }}
        transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
        className="fixed z-[56] left-0 right-0 rounded-t-3xl overflow-hidden outline-none
                   md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-[560px] md:rounded-3xl"
        style={{
          bottom: 'calc(var(--p-dock-h) + env(safe-area-inset-bottom, 0px) + 8px)',
          background: 'var(--p-jeu-surface)',
          border: '1px solid var(--p-gold-strong)',
          boxShadow: '0 -20px 60px -20px rgba(10,18,38,.6)',
        }}
      >
        <div className="p-tricolor"><div /><div /><div /></div>

        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] inline-flex items-center gap-1.5" style={{ color: 'var(--p-gold-bright)' }}>
            <Gamepad2 className="w-3.5 h-3.5" /> Cinq jeux courts
          </p>
          <button type="button" onClick={onClose} aria-label="Fermer les jeux"
            className="w-11 h-11 rounded-full justify-center transition-colors hover:bg-white/10"
            style={{ color: 'var(--p-jeu-text)' }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-3 pb-3 max-h-[52vh] overflow-y-auto">
          {JEUX.map((j) => {
            const Icon = j.icon;
            return (
              <Link key={j.name} to={createPageUrl(j.name)} onClick={onClose}
                className="group flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors hover:bg-white/[0.07]">
                <span className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                  style={{ background: 'var(--p-jeu-tile)', border: '1px solid var(--p-jeu-brd)' }}>
                  <Icon className="w-5 h-5" style={{ color: 'var(--p-gold-bright)' }} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-white leading-tight">{j.label}</span>
                  <span className="block text-[11.5px] leading-snug mt-0.5" style={{ color: 'var(--p-jeu-text-lo)' }}>{j.promesse}</span>
                </span>
                <span className="text-[9.5px] font-mono uppercase tracking-widest flex-shrink-0 px-2 py-1 rounded-full"
                  style={{ color: 'var(--p-jeu-text-lo)', border: '0.5px solid var(--p-jeu-brd)' }}>{j.duree}</span>
              </Link>
            );
          })}
        </div>

        <Link to={createPageUrl('ReglesDuJeu')} onClick={onClose}
          className="flex items-center justify-center gap-2 px-5 py-3 text-[12px] font-semibold transition-colors hover:bg-white/[0.06]"
          style={{ color: 'var(--p-gold-bright)', borderTop: '1px solid var(--p-jeu-brd)' }}>
          Nouveau ? Comment marche le jeu <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </motion.div>
    </>
  );
}

export default function BarreDeJeu({ jetons = null }) {
  const { pathname } = useLocation();
  const [feuille, setFeuille] = useState(false);
  const boutonJeux = useRef(null);

  // Toute navigation referme la feuille — y compris celle déclenchée depuis
  // l'un de ses propres liens.
  useEffect(() => { setFeuille(false); }, [pathname]);

  const page = pathname.replace(/^\//, '');
  const estActif = (name) => (name === '__jeux' ? PAGES_DE_JEU.has(page) : page === name);

  const contenuOnglet = (o, actif, compact) => {
    const Icon = o.icon;
    return (
      <>
        <span className="relative">
          <Icon className="w-[18px] h-[18px]" style={{ color: actif ? 'var(--p-gold-bright)' : 'var(--p-jeu-text)' }} />
          {o.live && (
            <span aria-hidden="true" className="p-live-dot absolute -top-0.5 -right-1.5" style={{ width: 6, height: 6 }} />
          )}
        </span>
        <span className={`font-bold leading-none ${compact ? 'text-[10px] mt-1' : 'text-[12.5px]'}`}
          style={{ color: actif ? 'var(--p-gold-bright)' : 'var(--p-jeu-text)' }}>
          {o.label}
        </span>
      </>
    );
  };

  const onglets = (compact) => ONGLETS.map((o) => {
    const actif = estActif(o.name);
    const commun = `relative flex ${compact ? 'flex-col flex-1' : 'flex-row gap-2 px-4'} items-center justify-center transition-colors rounded-xl`;
    const style = { minHeight: compact ? 52 : 44 };

    // Le fond de l'onglet actif GLISSE d'un onglet à l'autre au lieu de
    // s'éteindre ici et de se rallumer là-bas. C'est le même élément qui se
    // déplace (layoutId) : le mouvement raconte la navigation — d'où l'on
    // vient, où l'on va — là où deux fondus croisés ne racontent rien.
    // MotionConfig reducedMotion="user" le fige pour qui a coupé le mouvement,
    // et le fond apparaît alors directement au bon endroit.
    const surbrillance = actif ? (
      <motion.span
        aria-hidden="true"
        layoutId={compact ? 'dock-actif-mobile' : 'dock-actif-desktop'}
        className="absolute inset-0 rounded-xl"
        style={{ background: 'var(--p-gold-dim)', border: '0.5px solid var(--p-gold-strong)' }}
        transition={{ type: 'spring', stiffness: 420, damping: 34 }}
      />
    ) : null;

    if (o.name === '__jeux') {
      return (
        <button key={o.name} ref={boutonJeux} type="button"
          onClick={() => setFeuille(f => !f)}
          aria-expanded={feuille}
          aria-haspopup="dialog"
          aria-label={`${o.label} — ${o.aide}`}
          className={commun} style={style}>
          {surbrillance}
          <span className={`relative flex items-center justify-center ${compact ? 'flex-col' : 'flex-row gap-2'}`}>{contenuOnglet(o, actif || feuille, compact)}</span>
        </button>
      );
    }
    return (
      <Link key={o.name} to={createPageUrl(o.name)}
        aria-current={actif ? 'page' : undefined}
        aria-label={`${o.label} — ${o.aide}`}
        className={commun} style={style}>
        {surbrillance}
        <span className={`relative flex items-center justify-center ${compact ? 'flex-col' : 'flex-row gap-2'}`}>{contenuOnglet(o, actif, compact)}</span>
      </Link>
    );
  });

  return (
    <>
      <AnimatePresence>
        {feuille && <FeuilleJeux onClose={() => setFeuille(false)} retourFocus={boutonJeux} />}
      </AnimatePresence>

      {/* ── Mobile : barre pleine largeur, collée au bas ── */}
      <nav aria-label="Barre de jeu" className="md:hidden fixed inset-x-0 bottom-0 z-[57]"
        style={{
          background: 'var(--p-jeu-surface)',
          borderTop: '1px solid var(--p-gold-strong)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          boxShadow: '0 -10px 30px -12px rgba(10,18,38,.5)',
        }}>
        <div className="flex items-stretch gap-1 px-2" style={{ height: 'var(--p-dock-h)' }}>
          {onglets(true)}
        </div>
      </nav>

      {/* ── Desktop : pilule flottante ── */}
      <nav aria-label="Barre de jeu" className="hidden md:flex fixed left-1/2 -translate-x-1/2 bottom-5 z-[57] items-center gap-1 px-2 py-1.5 rounded-2xl"
        style={{
          background: 'var(--p-jeu-surface)',
          border: '1px solid var(--p-gold-strong)',
          boxShadow: '0 18px 50px -18px rgba(10,18,38,.65), 0 0 0 1px rgba(255,255,255,.04) inset',
        }}>
        {onglets(false)}
        {/* Le solde réel, jamais un chiffre de décor : sans progression chargée,
            la pastille n'apparaît pas. */}
        {jetons != null && (
          <span className="flex items-center gap-1.5 ml-1 pl-3 pr-3 py-2 rounded-xl"
            style={{ borderLeft: '1px solid var(--p-jeu-brd)' }} title="Tes jetons de la semaine">
            <Coins className="w-4 h-4" style={{ color: 'var(--p-gold-bright)' }} />
            <span className="p-mono text-[13px]" style={{ color: 'var(--p-gold-bright)' }}>
              {jetons.toLocaleString('fr-FR')}
            </span>
          </span>
        )}
      </nav>
    </>
  );
}
