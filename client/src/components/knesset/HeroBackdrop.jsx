import React, { useEffect, useState } from 'react';

// Fond de hero « pro » : enchaîne plusieurs photos institutionnelles en fondu
// croisé, avec un léger effet Ken Burns (zoom/pan lent) sur l'image active.
// Chaque photo est voilée vers le crème par le gradient posé PAR-DESSUS dans
// Home.jsx — ici on ne gère que la rotation et le mouvement.
//
// Accessibilité : si l'utilisateur a demandé moins d'animations
// (prefers-reduced-motion), on fige sur la première image, sans rotation ni
// zoom (cohérent avec la règle globale de globals.css).

export default function HeroBackdrop({
  images = [],
  interval = 6000,   // durée d'affichage par image (ms)
  fade = 1600,       // durée du fondu croisé (ms)
  position = 'center 26%',
  // Étalonnage. Les photos libres de Wikimedia sont prises en plein midi de
  // Jérusalem : ciel délavé, pierre grise, contraste écrasé. Un léger gain de
  // contraste et de saturation, plus une pointe de chaleur, leur rend le relief
  // qu'un capteur en plein soleil aplatit — c'est ce que fait un étalonneur, et
  // c'est ce qui sépare une photo d'illustration d'une image de film.
  filtre = 'contrast(1.1) saturate(1.14) brightness(0.97)',
}) {
  const [active, setActive] = useState(0);
  // Lue de façon synchrone A L'INITIALISATION : dans un useEffect, le premier
  // rendu appliquait le Ken Burns avant de connaître la préférence — exactement
  // la frame que l'utilisateur sensible au mouvement ne devait pas voir.
  const [reduced] = useState(() => typeof window !== 'undefined'
    && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  useEffect(() => {
    if (reduced || images.length <= 1) return;
    const id = setInterval(() => {
      setActive((i) => (i + 1) % images.length);
    }, interval);
    return () => clearInterval(id);
  }, [images.length, interval, reduced]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {images.map((src, i) => {
        const isActive = i === active;
        // Le sens du panoramique alterne d'une image à l'autre. Un Ken Burns
        // qui zoome toujours de la même façon finit par se voir comme un effet ;
        // alterné, il se lit comme un mouvement de caméra.
        const sens = i % 2 === 0 ? 1 : -1;
        return (
          <div
            key={src}
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url('${src}')`,
              backgroundSize: 'cover',
              backgroundPosition: position,
              filter: filtre,
              opacity: isActive ? 1 : 0,
              // Ken Burns : l'image active zoome ET panoramique lentement ; les
              // autres reviennent au repos pendant qu'elles sont invisibles.
              transform: isActive && !reduced
                ? `scale(1.12) translate(${sens * 1.4}%, ${sens * -0.9}%)`
                : 'scale(1) translate(0, 0)',
              transitionProperty: 'opacity, transform',
              transitionDuration: `${fade}ms, ${interval + fade}ms`,
              transitionTimingFunction: 'ease-in-out, cubic-bezier(.22,.61,.36,1)',
              willChange: 'opacity, transform',
            }}
          />
        );
      })}
    </div>
  );
}
