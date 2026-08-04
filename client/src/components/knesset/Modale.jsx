import React, { useEffect, useRef, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

/**
 * Modale accessible — cadre commun de l'Onboarding et de la fiche candidat.
 *
 * Les deux modales du site étaient de simples <div> avec un onClick sur le
 * fond : ni `role="dialog"`, ni `aria-modal`, ni titre annoncé, ni fermeture au
 * clavier, ni piège de focus, ni restitution du focus au retour. Six critères
 * manquants sur six, deux fois. Aggravant : la fiche candidat était le SEUL
 * chemin pour sélectionner un Premier ministre — un utilisateur au clavier ne
 * pouvait donc pas déposer ce pronostic du tout.
 *
 * Ce composant fait les six, une fois. Il ne s'occupe pas de l'apparence :
 * chaque appelant garde la sienne via `children`.
 */
export default function Modale({
  ouverte,
  onClose,
  titre,              // texte du titre — sert d'aria-labelledby ET d'en-tête si `enTete` est absent
  enTete,             // en-tête personnalisé (photo, dégradé…) ; doit contenir un élément portant `id={titreId}`
  labelFermer = 'Fermer',
  largeur = 'max-w-md',
  children,
}) {
  const panneauRef = useRef(null);
  const dernierFocusRef = useRef(null);
  const titreId = useId();

  // `onClose` est très souvent une fonction recréée à chaque rendu par
  // l'appelant. Si l'effet en dépendait, il se démonterait et se remonterait
  // sans arrêt : le nettoyage rendrait le focus au fond de page à chaque frappe,
  // et le piège de focus ne tiendrait pas. On le lit donc par référence, et
  // l'effet ne dépend plus que de l'ouverture.
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  useEffect(() => {
    if (!ouverte) return;

    // Mémorise l'élément qui avait le focus pour le lui rendre à la fermeture :
    // sans ça, le focus repart au début du document et l'utilisateur perd sa place.
    dernierFocusRef.current = document.activeElement;

    const panneau = panneauRef.current;
    const focusables = () => panneau
      ? [...panneau.querySelectorAll('a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])')]
        .filter(el => el.offsetParent !== null)
      : [];

    // Le focus entre dans la modale, sinon le lecteur d'écran reste derrière.
    const premier = focusables()[0] || panneau;
    premier?.focus?.();

    const onKeyDown = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); onCloseRef.current(); return; }
      if (e.key !== 'Tab') return;
      // Piège de focus : la tabulation boucle dans la modale au lieu d'aller
      // parcourir la page derrière, qui est censée être inerte.
      const list = focusables();
      if (!list.length) return;
      const [debut] = list;
      const fin = list[list.length - 1];
      if (e.shiftKey && document.activeElement === debut) { e.preventDefault(); fin.focus(); }
      else if (!e.shiftKey && document.activeElement === fin) { e.preventDefault(); debut.focus(); }
    };

    document.addEventListener('keydown', onKeyDown, true);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      document.body.style.overflow = overflow;
      dernierFocusRef.current?.focus?.();
    };
  }, [ouverte]);

  // ⚠️ L'AnimatePresence vit ICI, autour du motion.div, et surtout PAS chez
  // l'appelant autour de <Modale>. framer-motion ne sait pas détecter la fin de
  // l'animation de sortie d'un composant PERSONNALISÉ : avec
  // `<AnimatePresence>{x && <Modale/>}</AnimatePresence>`, la sortie ne se
  // termine jamais et la modale reste montée pour toujours — elle ne se ferme
  // alors ni par Échap, ni par le bouton, ni par le fond. Vérifié en vrai.
  return (
    <AnimatePresence>
      {ouverte && (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-3 sm:p-4"
      style={{ background: 'rgba(5,10,24,0.5)', backdropFilter: 'blur(2px)' }}
      onClick={onClose}
    >
      <motion.div
        ref={panneauRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titreId}
        tabIndex={-1}
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 300, damping: 26 }}
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full ${largeur} rounded-2xl overflow-hidden outline-none`}
        style={{ background: 'var(--p-card)', border: '0.5px solid var(--p-border)', boxShadow: 'var(--p-elev-3)' }}
      >
        <button
          onClick={onClose}
          aria-label={labelFermer}
          className="absolute top-3 right-3 z-10 w-11 h-11 rounded-full justify-center hover:bg-[rgba(20,32,61,0.06)]"
          style={{ color: 'var(--p-text-40)' }}
        >
          <X className="w-4 h-4" />
        </button>

        {enTete
          ? React.cloneElement(enTete, { titreId })
          : <h2 id={titreId} className="sr-only">{titre}</h2>}

        {typeof children === 'function' ? children({ titreId }) : children}
      </motion.div>
    </motion.div>
      )}
    </AnimatePresence>
  );
}
