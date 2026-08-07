import React from 'react';
import { base44 } from '@/api/client';
import { Sparkles, Clock, ArrowRight } from 'lucide-react';

/**
 * Ce qu'une partie terminée a réellement rapporté.
 *
 * Écrit une fois, affiché par les quatre mini-jeux. Chacun montrait auparavant
 * le même encart en dur — « Crée ton compte pour sauver ton score et grimper au
 * classement » — y compris à un joueur DÉJÀ connecté, et alors qu'aucune partie
 * n'était sauvegardée nulle part. Trois états à distinguer, donc, et un seul
 * endroit où les écrire.
 *
 * @param {object|null} gain      retour de gate.terminerPartie() : { credite, points, motif }
 * @param {boolean}     isGuest   true si aucune session
 */
export default function GainMiniJeu({ gain, isGuest }) {
  // Invité : l'argument d'inscription, mais chiffré et exact. La version
  // précédente promettait « sauver ton score », ce qui n'arrivait pas.
  if (isGuest) {
    return (
      <div className="rounded-xl p-4 mb-4" style={{ background: 'var(--p-blue-dim)', border: '0.5px solid var(--p-blue-border)' }}>
        <p className="p-body text-sm mb-3" style={{ color: 'var(--p-text)' }}>
          Avec un compte, chaque partie terminée te rapporte <b>10 points d'apprentissage</b> — un par jeu et par jour, comptés dans ton Score.
        </p>
        <button onClick={() => base44.auth.redirectToLogin()} className="p-btn-primary gap-2">
          Créer mon compte <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // Connecté, crédit déjà pris aujourd'hui sur ce jeu : on le dit franchement
  // plutôt que de laisser croire à des points qui ne viendront pas.
  if (gain && !gain.credite) {
    return (
      <div className="rounded-xl p-4 mb-4 flex items-center gap-2.5 justify-center" style={{ background: 'var(--p-text-10)', border: '0.5px solid var(--p-border)' }}>
        <Clock className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--p-text-40)' }} />
        <p className="p-body text-sm" style={{ color: 'var(--p-text-60)' }}>
          Points du jour déjà pris sur ce jeu — reviens demain pour <b style={{ color: 'var(--p-text)' }}>+{gain.points_par_partie ?? 10}</b>.
        </p>
      </div>
    );
  }

  if (gain?.credite) {
    return (
      <div className="rounded-xl p-4 mb-4 flex items-center gap-2.5 justify-center" style={{ background: 'var(--p-green-dim)', border: '0.5px solid rgba(26,140,85,0.3)' }}>
        <Sparkles className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--p-green-text)' }} />
        <p className="p-body text-sm" style={{ color: 'var(--p-text)' }}>
          <b style={{ color: 'var(--p-green-text)' }}>+{gain.points} points</b> d'apprentissage, crédités sur ton Score.
        </p>
      </div>
    );
  }

  // Crédit en vol, ou échec réseau : on n'affiche rien plutôt qu'un chiffre faux.
  // Une partie ne doit jamais se terminer sur un message d'erreur technique.
  return null;
}
