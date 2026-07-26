import React, { useEffect, useRef, useState } from 'react';

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
}) {
  const [active, setActive] = useState(0);
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current = typeof window !== 'undefined'
      && window.matchMedia
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduced.current || images.length <= 1) return;
    const id = setInterval(() => {
      setActive((i) => (i + 1) % images.length);
    }, interval);
    return () => clearInterval(id);
  }, [images.length, interval]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {images.map((src, i) => {
        const isActive = i === active;
        return (
          <div
            key={src}
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url('${src}')`,
              backgroundSize: 'cover',
              backgroundPosition: position,
              opacity: isActive ? 1 : 0,
              transition: `opacity ${fade}ms ease-in-out`,
              // Ken Burns : l'image active dérive/zoome lentement ; les autres
              // reviennent à l'échelle neutre pendant qu'elles sont invisibles.
              transform: isActive && !reduced.current ? 'scale(1.08)' : 'scale(1)',
              transitionProperty: 'opacity, transform',
              transitionDuration: `${fade}ms, ${interval + fade}ms`,
              transitionTimingFunction: 'ease-in-out, ease-out',
              willChange: 'opacity, transform',
            }}
          />
        );
      })}
    </div>
  );
}
