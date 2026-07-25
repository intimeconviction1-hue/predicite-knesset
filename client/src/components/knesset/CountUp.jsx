import React, { useEffect, useRef, useState } from 'react';
import { useInView } from 'framer-motion';

/**
 * Compte de 0 jusqu'à `value`, une fois que le composant entre dans le
 * viewport. Easing "ease-out" — vite au début, se pose en douceur, comme un
 * compteur de résultats électoraux plutôt qu'un tick linéaire mécanique.
 */
export default function CountUp({ value, duration = 1200, delay = 0, decimals = 0, suffix = '', className, style }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-10%' });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    let raf;
    const start = performance.now() + delay;

    const tick = (now) => {
      const elapsed = now - start;
      if (elapsed < 0) { raf = requestAnimationFrame(tick); return; }
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      setDisplay(eased * value);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isInView, value, duration, delay]);

  return <span ref={ref} className={className} style={style}>{display.toFixed(decimals)}{suffix}</span>;
}
