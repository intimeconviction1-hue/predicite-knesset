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

/**
 * LA PROBABILITÉ, pas la cote.
 *
 * Le moteur de cotes est déjà probabiliste (server/functions/parisSondages.js) :
 *
 *     cote_i = (K + R) / (K·Pᵢ + Rᵢ)
 *
 * ce qui est exactement l'inverse de la probabilité courante du marché. Le site
 * calculait donc la probabilité et n'affichait que son inverse — alors que
 * « 65 % » se lit sans rien connaître aux paris, quand « ×1,54 » demande de
 * savoir qu'on divise 1 par 1,54. Sur une plateforme civique en français dont
 * une bonne moitié des visiteurs n'a jamais mis les pieds sur un site de paris,
 * ce n'est pas un détail de présentation.
 *
 * On dérive la probabilité de la cote AFFICHÉE (arrondie), pas de la valeur
 * brute : le lecteur doit pouvoir vérifier lui-même que 1 ÷ 1,54 fait bien 65 %.
 * Vérifié sur les cotes en ligne : Likoud ×1,54 → 65 %, Yashar ×2,85 → 35 %,
 * somme 100,0 %.
 */
export function probabiliteDepuisCote(cote) {
  const n = Number(cote);
  if (!Number.isFinite(n) || n <= 0) return null;
  return 1 / n;
}

// Espace fine insécable avant le %, comme le veut la typographie française.
// Écrite en séquence d'échappement et non en caractère littéral : eslint refuse
// les espaces « irrégulières » dans le source, et une espace fine au milieu d'un
// gabarit est invisible à la relecture — donc impossible à repérer si un
// copier-coller la remplace un jour par une espace ordinaire.
const FINE_INSECABLE = '\u202F';

export function formatProba(cote) {
  const p = probabiliteDepuisCote(cote);
  return p == null ? '—' : `${Math.round(p * 100)}${FINE_INSECABLE}%`;
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
  sm: { pad: 'px-3 py-2.5', cote: 'text-base', coteSecondaire: 'text-[10px]', label: 'text-[12px]', min: 50 },
  md: { pad: 'px-3.5 py-3', cote: 'text-xl', coteSecondaire: 'text-[11px]', label: 'text-[13px]', min: 60 },
  lg: { pad: 'px-4 py-3.5', cote: 'text-2xl', coteSecondaire: 'text-xs', label: 'text-sm', min: 68 },
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
  // La probabilité peut se taire là où la place manque vraiment (bandeau
  // défilant) — mais nulle part où l'on décide de miser.
  montrerProba = true,
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
        <span className="text-right leading-none">
          {/* La probabilité en premier et en grand, la cote en dessous : l'une
              se lit, l'autre sert à calculer un gain. */}
          {montrerProba && (
            <span className={`p-cote block ${t.cote}`} style={{ color: selected ? r.coteActive : r.cote }}>
              {formatProba(cote)}
            </span>
          )}
          <span className={`p-cote block ${montrerProba ? `mt-0.5 ${t.coteSecondaire}` : t.cote}`}
            style={{ color: montrerProba ? r.kicker : (selected ? r.coteActive : r.cote) }}>
            <span className="text-[0.7em] font-semibold align-middle" style={{ opacity: 0.7 }}>×</span>
            {formatCote(cote)}
          </span>
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
  // annonce « ×1,54 » seul ne dit sur quoi porte le pari. Et la probabilité
  // passe en premier à l'oreille comme à l'œil.
  const etiquette = `${label}${kicker ? ` (${kicker})` : ''} — ${
    montrerProba ? `${formatProba(cote)} de chances selon le marché, ` : ''
  }cote ${formatCote(cote)}${sens === 'up' ? ', en hausse' : sens === 'down' ? ', en baisse' : ''}`;

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
