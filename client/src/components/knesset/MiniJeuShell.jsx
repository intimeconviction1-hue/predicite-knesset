import React from 'react';
import { useLocation } from 'react-router-dom';
import ArcadeJeux from '@/components/knesset/ArcadeJeux';

/**
 * Cadre commun des mini-jeux (SensDuVent, VraiOuFake, Boussole, FormeCoalition).
 *
 * Les quatre pages portaient exactement la même charpente — filet tricolore,
 * pastille « Jeu · mode découverte », titre `p-display`, chapô `p-body`,
 * conteneur centré — recopiée à l'identique quatre fois. C'était du
 * copier-coller cohérent, pas un système : chaque retouche d'identité demandait
 * quatre modifications, et la quatrième finissait toujours par diverger.
 *
 * Ce sont aussi les SEULES pages jouables sans compte, donc les seules qu'un
 * inconnu arrivé par un lien partagé verra jamais — et c'étaient les quatre
 * pages qui n'avaient jamais reçu la couche premium. Le halo d'ambiance et
 * l'élévation vivent donc ici, une fois, pour les quatre.
 *
 * `largeur` cadre le corps du jeu : les jeux à cartes (« md ») restent étroits
 * pour garder une colonne lisible ; ceux qui affichent un hémicycle ou un
 * tableau (« lg », « xl ») ont besoin de la largeur.
 */

const LARGEURS = {
  md: 'max-w-md',
  lg: 'max-w-xl',
  xl: 'max-w-3xl',
};

export default function MiniJeuShell({
  icon: Icon,
  titre,
  chapo,
  largeur = 'md',
  children,
}) {
  // Le jeu courant se déduit de l'URL — les quatre pages n'ont donc rien à
  // déclarer, et une cinquième héritera de la sortie de partie sans y penser.
  const jeuCourant = useLocation().pathname.replace(/^\//, '');

  return (
    <div className="min-h-screen" style={{ background: 'transparent' }}>
      <div className="p-tricolor"><div /><div /><div /></div>

      <div className="p-glow-gold">
        <div className="max-w-xl mx-auto px-4 pt-8 pb-4 text-center">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-3"
            style={{ background: 'var(--p-gold-dim)', border: '0.5px solid var(--p-gold-border)' }}
          >
            {Icon ? <Icon className="w-3.5 h-3.5" style={{ color: 'var(--p-gold-text)' }} /> : null}
            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--p-gold-text)' }}>
              Jeu · mode découverte
            </span>
          </div>
          <h1 className="p-display text-3xl md:text-4xl mb-2">{titre}</h1>
          {chapo ? <p className="p-body text-sm max-w-md mx-auto">{chapo}</p> : null}
        </div>
      </div>

      <div className={`${LARGEURS[largeur] || LARGEURS.md} mx-auto px-4 pb-10`}>
        {children}
      </div>

      {/* Sortie de partie. Un mini-jeu se terminait sur lui-même : la seule
          issue était le bouton « retour » du navigateur ou le menu déroulant du
          header — c'est-à-dire, en pratique, la fin de la visite. On enchaîne
          sur les autres jeux, celui qu'on vient de finir en moins. */}
      <div className="pb-16">
        <hr className="p-hairline-gold max-w-5xl mx-auto mb-8" />
        <ArcadeJeux compact titre="Enchaîne" exclure={jeuCourant} />
      </div>
    </div>
  );
}

/**
 * Barre de progression d'une manche. Elle existait en <div> nu dans les quatre
 * jeux : un lecteur d'écran n'annonçait donc aucune progression.
 */
export function JaugeManche({ valeur, total, label = 'Progression' }) {
  const pct = total > 0 ? Math.min(100, Math.max(0, (valeur / total) * 100)) : 0;
  return (
    <div
      role="progressbar"
      aria-valuenow={valeur}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-label={label}
      className="flex-1 h-1.5 rounded-full overflow-hidden"
      style={{ background: 'var(--p-text-10)' }}
    >
      <div
        className="h-full rounded-full"
        style={{ width: `${pct}%`, background: 'var(--p-grad-gold)', transition: 'width .4s var(--p-ease)' }}
      />
    </div>
  );
}
