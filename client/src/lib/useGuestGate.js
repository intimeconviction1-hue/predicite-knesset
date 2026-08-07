import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/client';

// Mode essai : un visiteur non connecté peut jouer quelques parties en
// « découverte », puis on lui propose de créer un compte (mur). Le compteur est
// GLOBAL (toutes parties de tous les jeux confondues) et vit en localStorage.
// Les utilisateurs connectés ne sont jamais comptés ni bloqués.
const KEY = 'predicite_guest_plays';
const LIMIT = 3;

export function useGuestGate() {
  const [user, setUser] = useState(undefined);   // undefined = en cours, null = invité, objet = connecté
  const [plays, setPlays] = useState(() => {
    try { return parseInt(localStorage.getItem(KEY) || '0', 10) || 0; } catch { return 0; }
  });
  // Résultat du dernier crédit serveur : { credite, points, motif } ou null.
  const [gain, setGain] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => setUser(u || null)).catch(() => setUser(null));
  }, []);

  const isGuest = user === null;

  const record = useCallback(() => {
    setPlays(p => {
      const n = p + 1;
      try { localStorage.setItem(KEY, String(n)); } catch { /* indispo : on ignore */ }
      return n;
    });
  }, []);

  /**
   * À appeler quand une partie est TERMINÉE — le seul moment où elle compte.
   *
   * Fait les deux choses d'un coup, et c'est délibéré : les quatre mini-jeux
   * appelaient `record()` au bon endroit mais n'écrivaient rien côté serveur, si
   * bien qu'un joueur connecté ne gagnait rien alors que le mur d'inscription lui
   * promettait un score sauvegardé. Regrouper le comptage et le crédit ici évite
   * que le prochain mini-jeu n'en câble qu'une moitié — c'est la même leçon que
   * `lireTout` : ce qui est recopié dans quatre pages finit par diverger.
   *
   * Un invité n'appelle rien : la route exige une session et répondrait 401. Et
   * un échec de crédit ne doit jamais interrompre une partie — le jeu passe en
   * `done` quoi qu'il arrive, l'écran de fin affiche simplement le gain ou non.
   *
   * @param {string} jeu  l'un des identifiants de server/functions/miniJeux.js
   */
  const terminerPartie = useCallback(async (jeu) => {
    record();
    if (!user) { setGain(null); return null; }
    try {
      const res = await base44.functions.invoke('miniJeux', { action: 'partieTerminee', jeu });
      setGain(res);
      return res;
    } catch {
      setGain(null);
      return null;
    }
  }, [record, user]);

  return {
    user,
    isGuest,
    plays,
    limit: LIMIT,
    remaining: Math.max(0, LIMIT - plays),
    record,
    terminerPartie,
    gain,
    blocked: isGuest && plays >= LIMIT,   // invité ayant épuisé sa découverte
  };
}
