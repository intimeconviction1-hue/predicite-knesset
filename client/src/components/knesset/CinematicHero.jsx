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
//     photos={['/images/knesset-hero.jpg', ...]}
//     position="center 26%"
//     badge={{ text: `La campagne en direct · J-${d}`, live: true }}
//     kicker="Élections à la Knesset · 25ᵉ législature"
//     title={<>Le scrutin est à <HeroGold>toi</HeroGold>.</>}
//     subtitle="…"
//     actions={<>…CTAs…</>}
//   >{/* contenu libre optionnel (bandeau live, etc.) */}</CinematicHero>

const SIZES = {
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
const REGISTRES = {
  marbre: {
    voile: 'linear-gradient(180deg, rgba(3,14,52,0.93) 0%, rgba(5,30,104,0.78) 30%, rgba(8,40,122,0.60) 52%, rgba(237,241,249,0.5) 74%, FADE 92%)',
    kicker: '#9fc0ff',
  },
  jeu: {
    voile: 'linear-gradient(180deg, rgba(30,20,2,0.91) 0%, rgba(92,64,10,0.76) 30%, rgba(120,86,16,0.56) 52%, rgba(237,241,249,0.5) 74%, FADE 92%)',
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

      {/* voile bleu institutionnel : sombre en haut (texte blanc lisible),
          photo visible au milieu, fondu vers le clair avant le contenu */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: reg.voile.replace('FADE', fadeTo),
      }} />
      {/* vignette cinéma */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(120% 92% at 50% 12%, transparent 42%, rgba(0,10,40,0.34) 100%)',
      }} />
      {/* grain fin */}
      <div className="absolute inset-0 pointer-events-none" style={{
        opacity: 0.05, backgroundImage: 'radial-gradient(rgba(255,255,255,0.9) 0.5px, transparent 0.5px)', backgroundSize: '3px 3px',
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
      <div className={`relative max-w-3xl mx-auto px-4 ${s.pt} ${s.pb} flex flex-col ${alignCls}`}>
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
    </div>
  );
}
