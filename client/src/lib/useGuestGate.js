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

  return {
    user,
    isGuest,
    plays,
    limit: LIMIT,
    remaining: Math.max(0, LIMIT - plays),
    record,
    blocked: isGuest && plays >= LIMIT,   // invité ayant épuisé sa découverte
  };
}
