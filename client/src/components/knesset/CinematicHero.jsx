import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import HeroBackdrop from '@/components/knesset/HeroBackdrop';

// Hero cinématique institutionnel — la signature visuelle « Marbre » de PrédiCité.
// Une vraie photo (Ken Burns + fondu croisé via HeroBackdrop) sous un voile BLEU
// institutionnel (fini le crème qui masquait tout), texte blanc, Menorah de l'État
// en filigrane, liseré tricolore, grain + vignette cinéma, et une légère parallaxe
// au scroll. Fond → fondu vers le clair (fadeTo) pour enchaîner sur le contenu.
//
// Accessibilité : la parallaxe et le Ken Burns se coupent sous prefers-reduced-motion
// (HeroBackdrop gère sa part ; ici on fige la parallaxe).
//
// Utilisation :
//   <CinematicHero
//     size="lg"
//     photos={['/images/knesset-parvis.jpg', ...]}
//     position="center 26%"
//     badge={{ text: `La campagne en direct · J-${d}`, live: true }}
//     kicker="Élections à la Knesset · 25ᵉ législature"
//     title={<>Le scrutin est à <HeroGold>toi</HeroGold>.</>}
//     subtitle="…"
//     actions={<>…CTAs…</>}
//   >{/* contenu libre optionnel (bandeau live, etc.) */}</CinematicHero>

const SIZES = {
  // 'full' : hero de pleine hauteur pour l'accueil. 88svh et non 100 — c'est
  // délibéré : le haut de l'hémicycle doit dépasser sous le pli. Un écran
  // entièrement rempli ne dit pas qu'il y a une suite ; ce débord-là, si.
  // svh (et non vh) pour ne pas être coupé par la barre d'adresse mobile.
  full: { pt: 'pt-16 md:pt-24', pb: 'pb-10', title: 'text-5xl md:text-7xl', min: 'min-h-[88svh]' },
  lg: { pt: 'pt-12 md:pt-16', pb: 'pb-7', title: 'text-4xl md:text-6xl' },
  md: { pt: 'pt-10 md:pt-14', pb: 'pb-6', title: 'text-3xl md:text-5xl' },
  sm: { pt: 'pt-8 md:pt-10', pb: 'pb-5', title: 'text-[26px] md:text-4xl' },
};

// Le « toi » doré : dégradé or lisible sur fond sombre (≠ --p-gold-text qui est
// pensé pour le texte sur fond clair). Réutilisable dans les titres.
export function HeroGold({ children }) {
  return (
    <span style={{ background: 'linear-gradient(180deg,#ffe6a3,#D4AF37)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
      {children}
    </span>
  );
}

// Deux registres d'identité (« Le Marbre & le Jeu ») :
//  - 'marbre' (défaut) : voile BLEU institutionnel — l'info, l'élection, l'histoire
//  - 'jeu'             : voile AMBRÉ/or — les pages où l'on joue (paris, quiz,
//                        ligues, classement). Même grammaire, énergie différente.
// Le voile était UN aplat très dense (0.93 en haut, 0.78 à 30 %, 0.60 au
// milieu) : il rendait le texte lisible en effaçant la photo. On ne voyait plus
// ni la pierre de Jérusalem, ni les drapeaux, ni le ciel — juste du bleu.
//
// Il se décompose maintenant en DEUX couches, comme sur une affiche de cinéma :
//   · le VOILE, léger, qui pose l'ambiance et assure le fondu vers le clair ;
//   · le SCRIM, une ombre elliptique posée seulement SOUS LE TEXTE, là où la
//     lisibilité se joue vraiment.
// Le blanc du titre garde ainsi 8:1 de contraste même sur la partie la plus
// claire d'une photo, et la photo reste une photo partout ailleurs.
const REGISTRES = {
  marbre: {
    voile: 'linear-gradient(180deg, rgba(2,10,36,0.72) 0%, rgba(4,20,74,0.40) 24%, rgba(6,30,98,0.22) 46%, rgba(10,44,124,0.30) 62%, rgba(237,241,249,0.55) 82%, FADE 95%)',
    scrim: 'radial-gradient(78% 54% at 50% 46%, rgba(1,7,26,0.62) 0%, rgba(1,7,26,0.34) 46%, transparent 72%)',
    kicker: '#9fc0ff',
  },
  jeu: {
    voile: 'linear-gradient(180deg, rgba(26,17,2,0.74) 0%, rgba(74,50,8,0.42) 24%, rgba(104,72,14,0.24) 46%, rgba(120,86,16,0.32) 62%, rgba(237,241,249,0.55) 82%, FADE 95%)',
    scrim: 'radial-gradient(78% 54% at 50% 46%, rgba(20,12,0,0.62) 0%, rgba(20,12,0,0.34) 46%, transparent 72%)',
    kicker: '#ffd77a',
  },
};

export default function CinematicHero({
  photos = [],
  position = 'center 30%',
  size = 'md',
  registre = 'marbre',
  badge,
  kicker,
  title,
  subtitle,
  actions,
  children,
  fadeTo = 'var(--p-night)',
  menorah = true,
  align = 'center',
  interval = 6000,
  className = '',
}) {
  const ref = useRef(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : -60]);

  const s = SIZES[size] || SIZES.md;
  const reg = REGISTRES[registre] || REGISTRES.marbre;
  const alignCls = align === 'left' ? 'items-start text-left' : 'items-center text-center';

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      {/* liseré tricolore */}
      <div className="p-tricolor"><div /><div /><div /></div>

      {/* fond photo (Ken Burns) + parallaxe douce */}
      <motion.div style={{ y }} className="absolute inset-0">
        <HeroBackdrop images={photos} position={position} interval={interval} />
      </motion.div>

      {/* 1. Voile d'ambiance — léger, et fondu vers le clair avant le contenu */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: reg.voile.replace('FADE', fadeTo),
      }} />
      {/* 2. Scrim de lisibilité — l'ombre douce posée seulement sous le texte.
             C'est LUI qui rend le blanc lisible, pas le voile : il travaille sur
             un huitième de la surface au lieu de la totalité, donc la photo
             survit partout ailleurs. */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: reg.scrim }} />
      {/* 3. Vignette cinéma — resserrée sur les bords, plus franche qu'avant :
             c'est elle qui donne l'impression d'objectif photographique. */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(125% 95% at 50% 18%, transparent 38%, rgba(0,8,32,0.46) 100%)',
      }} />
      {/* 4. Grain argentique fin */}
      <div className="absolute inset-0 pointer-events-none" style={{
        opacity: 0.06, backgroundImage: 'radial-gradient(rgba(255,255,255,0.9) 0.5px, transparent 0.5px)', backgroundSize: '3px 3px',
      }} />

      {/* Menorah de l'État en filigrane */}
      {menorah && (
        <svg aria-hidden="true" className="absolute pointer-events-none" viewBox="0 0 200 210"
          style={{ left: '50%', top: 84, transform: 'translateX(-50%)', width: 280, opacity: 0.07, color: '#fff' }}
          fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round">
          <path d="M100,60 L100,176" /><path d="M54,60 A46,46 0 0 0 146,60" />
          <path d="M67,60 A33,33 0 0 0 133,60" /><path d="M80,60 A20,20 0 0 0 120,60" />
        </svg>
      )}

      {/* contenu */}
      <div className={`relative max-w-3xl mx-auto px-4 ${s.pt} ${s.pb} ${s.min || ''} flex flex-col justify-center ${alignCls}`}>
        {badge && (
          <div className="inline-flex items-center gap-2 mb-5 px-3.5 py-1.5 rounded-full"
            style={{ background: 'rgba(255,255,255,0.12)', border: '0.5px solid rgba(255,255,255,0.22)', backdropFilter: 'blur(6px)' }}>
            {badge.live && (
              <motion.span className="w-1.5 h-1.5 rounded-full" style={{ background: '#ff4d4d' }}
                animate={{ opacity: [1, 0.25, 1] }} transition={{ duration: 1.4, repeat: Infinity }} />
            )}
            <span className="text-[10px] font-black uppercase tracking-widest text-white">{badge.text}</span>
          </div>
        )}

        {kicker && (
          <p className="mb-2 text-sm font-bold" style={{ fontFamily: 'var(--font-display)', color: reg.kicker }}>{kicker}</p>
        )}

        {title && (
          <motion.h1
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
            className={`${s.title} font-black mb-4`}
            style={{ fontFamily: 'var(--font-display)', color: '#fff', letterSpacing: '-0.025em', lineHeight: 1.04, textShadow: '0 2px 30px rgba(0,0,0,0.35)' }}>
            {title}
          </motion.h1>
        )}

        {subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
            className="text-base md:text-lg mb-7 max-w-lg" style={{ color: 'rgba(255,255,255,0.85)', lineHeight: 1.55 }}>
            {subtitle}
          </motion.p>
        )}

        {actions && (
          <div className={`flex items-center gap-3 flex-wrap ${align === 'left' ? '' : 'justify-center'}`}>{actions}</div>
        )}

        {children}
      </div>

      {/* Invite à défiler — uniquement sur le hero pleine hauteur, où le contenu
          suivant n'est pas immédiatement visible. Purement décoratif (aria-hidden),
          et figé sous prefers-reduced-motion via la règle globale de globals.css. */}
      {s.min && (
        <div aria-hidden="true" className="absolute inset-x-0 bottom-5 flex flex-col items-center gap-2 pointer-events-none">
          <span className="text-[9px] font-bold uppercase tracking-[0.24em]" style={{ color: 'rgba(255,255,255,0.55)' }}>défiler</span>
          <motion.span
            className="block w-px h-8 rounded"
            style={{ background: 'linear-gradient(rgba(255,255,255,0.75), transparent)' }}
            animate={reduced ? {} : { opacity: [0.3, 1, 0.3], scaleY: [0.6, 1, 0.6] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      )}
    </div>
  );
}
