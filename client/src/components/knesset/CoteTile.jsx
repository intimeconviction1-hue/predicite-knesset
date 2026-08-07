import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown } from 'lucide-react';

/**
 * LA TUILE DE COTE — la brique la plus répétée du registre Jeu.
 *
 * Elle existait en quatre exemplaires divergents : un <button> dans Paris.jsx,
 * un <Link> dans TerrainDeJeu, un <span> dans RectoVersoCard, une ligne de
 * texte dans le bandeau live. Quatre tailles de chiffre, quatre façons d'écrire
 * la cote, aucun état de sélection commun — et surtout, nulle part le signal qui
 * fait vivre un marché : la cote qui vient de BOUGER.
 *
 * Ce que la tuile apporte, et qui n'existait pas :
 *   1. le mouvement de la cote se voit (flash + flèche ▲/▼) ;
 *   2. le chiffre est tabulaire, donc les cotes s'alignent en colonne ;
 *   3. la pression du doigt a un retour (90 ms, court : on la presse souvent).
 *
 * Honnêteté : la flèche n'apparaît QUE sur un mouvement réellement observé
 * pendant que la tuile est montée (la cote reçue à l'arrivée n'est comparée à
 * rien — on ne peut pas savoir d'où elle vient, donc on ne dit rien).
 */

// La cote s'écrit à la française : 1,54 et non 1.54. Le site est francophone,
// et « 1.54 » se lit comme un séparateur de milliers pour beaucoup de lecteurs.
export function formatCote(c) {
  const n = Number(c);
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Combien de temps la flèche « ça vient de bouger » reste affichée. Assez long
// pour être vu par quelqu'un qui lisait autre chose, assez court pour ne pas
// rester à l'écran une fois l'information périmée.
const DUREE_SIGNAL = 6000;

const REGISTRES = {
  // Sur le tapis sombre (TerrainDeJeu, dos des cartes, dock)
  sombre: {
    fond: 'var(--p-jeu-tile)',
    fondActif: 'var(--p-gold-dim)',
    bord: 'var(--p-jeu-brd)',
    bordActif: 'var(--p-gold-strong)',
    label: '#fff',
    kicker: 'var(--p-jeu-text-lo)',
    cote: 'var(--p-gold-bright)',
    coteActive: 'var(--p-gold-bright)',
  },
  // Sur une carte blanche (Paris, fiches de liste)
  clair: {
    fond: 'var(--p-card)',
    fondActif: 'var(--p-blue-dim)',
    bord: 'var(--p-border)',
    bordActif: 'var(--p-blue)',
    label: 'var(--p-text)',
    kicker: 'var(--p-text-40)',
    cote: 'var(--p-text)',
    coteActive: 'var(--p-blue)',
  },
};

const TAILLES = {
  sm: { pad: 'px-3 py-2.5', cote: 'text-base', label: 'text-[12px]', min: 48 },
  md: { pad: 'px-3.5 py-3', cote: 'text-xl', label: 'text-[13px]', min: 58 },
  lg: { pad: 'px-4 py-3.5', cote: 'text-2xl', label: 'text-sm', min: 66 },
};

export default function CoteTile({
  label,
  kicker,
  cote,
  selected = false,
  onClick,
  to,
  href,
  registre = 'clair',
  taille = 'md',
  disabled = false,
  className = '',
}) {
  const r = REGISTRES[registre] || REGISTRES.clair;
  const t = TAILLES[taille] || TAILLES.md;

  // Mouvement de la cote. `precedente` démarre à la valeur reçue : au montage,
  // il n'y a rien à comparer, donc rien à signaler.
  const precedente = useRef(cote);
  const [sens, setSens] = useState(null); // 'up' | 'down' | null

  useEffect(() => {
    if (precedente.current == null || cote == null) { precedente.current = cote; return; }
    if (cote === precedente.current) return;
    const direction = cote > precedente.current ? 'up' : 'down';
    precedente.current = cote;
    setSens(direction);
    const minuteur = setTimeout(() => setSens(null), DUREE_SIGNAL);
    return () => clearTimeout(minuteur);
  }, [cote]);

  const Fleche = sens === 'up' ? TrendingUp : TrendingDown;
  const couleurSens = sens === 'up' ? 'var(--p-green)' : 'var(--p-red)';

  const contenu = (
    <>
      <span className="min-w-0 flex-1 text-left">
        {kicker && (
          <span className="block text-[9px] font-bold uppercase tracking-[0.14em] mb-0.5 truncate" style={{ color: r.kicker }}>
            {kicker}
          </span>
        )}
        <span className={`block font-semibold leading-tight ${t.label}`} style={{ color: r.label }}>
          {label}
        </span>
      </span>

      <span className="flex items-center gap-1.5 flex-shrink-0">
        {sens && (
          /* La flèche est de l'information, pas de l'ornement : elle survit à
             prefers-reduced-motion, contrairement au flash qui l'accompagne. */
          <Fleche className="w-3.5 h-3.5" style={{ color: couleurSens }} aria-hidden="true" />
        )}
        <span className={`p-cote leading-none ${t.cote}`} style={{ color: selected ? r.coteActive : r.cote }}>
          <span className="text-[0.62em] font-semibold align-middle" style={{ opacity: 0.55 }}>×</span>
          {formatCote(cote)}
        </span>
      </span>
    </>
  );

  const classes = [
    'p-cote flex items-center gap-3 rounded-xl w-full',
    t.pad,
    sens === 'up' ? 'p-cote-up' : sens === 'down' ? 'p-cote-down' : '',
    disabled ? 'opacity-50 pointer-events-none' : '',
    className,
  ].filter(Boolean).join(' ');

  const style = {
    background: selected ? r.fondActif : r.fond,
    border: `1px solid ${selected ? r.bordActif : r.bord}`,
    minHeight: t.min,
  };

  // La cote est lue à voix haute avec son libellé : un lecteur d'écran qui
  // annonce « ×1,54 » seul ne dit sur quoi porte le pari.
  const etiquette = `${label}${kicker ? ` (${kicker})` : ''} — cote ${formatCote(cote)}${
    sens === 'up' ? ', en hausse' : sens === 'down' ? ', en baisse' : ''
  }`;

  if (to) {
    return <Link to={to} className={classes} style={style} aria-label={etiquette}>{contenu}</Link>;
  }
  if (href) {
    return <a href={href} target="_blank" rel="noopener noreferrer" className={classes} style={style} aria-label={etiquette}>{contenu}</a>;
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={onClick ? selected : undefined}
      aria-label={etiquette}
      className={classes}
      style={style}
    >
      {contenu}
    </button>
  );
}
