import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Check, Loader2 } from 'lucide-react';

/**
 * Saisie manuelle des résultats — écran du soir du scrutin.
 *
 * Volontairement austère et sans dépendance à un collecteur : on saisit les
 * sièges liste par liste, on vérifie, on enregistre, on lance le scoring. Rien
 * n'est envoyé tant que le total ne fait pas 120 et que le serveur n'a pas
 * validé la répartition (functions/resultatsManuels.js refait tous les
 * contrôles : cet écran ne fait que les rendre lisibles).
 *
 * Non listée dans la navigation : accessible par URL, et de toute façon
 * réservée aux admins côté serveur.
 */

const TOTAL_SIEGES = 120;

export default function AdminResultats() {
  const [user, setUser] = useState(undefined);
  const [seats, setSeats] = useState({});
  const [busy, setBusy] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [enregistre, setEnregistre] = useState(false);

  useEffect(() => {
    base44.auth.me().then(u => setUser(u || null)).catch(() => setUser(null));
  }, []);

  const { data: listes = [], isLoading } = useQuery({
    queryKey: ['admin-listes-actives'],
    queryFn: () => base44.entities.Liste.filter({ is_active: true }),
    enabled: user?.role === 'admin',
  });

  const total = useMemo(
    () => listes.reduce((sum, l) => sum + (parseInt(seats[l.id], 10) || 0), 0),
    [listes, seats],
  );
  const ecart = total - TOTAL_SIEGES;

  const payload = () => ({
    seats_by_liste: listes.map(l => ({ liste_id: l.id, seats: parseInt(seats[l.id], 10) || 0 })),
  });

  async function appeler(action, body, label) {
    setBusy(label);
    setFeedback(null);
    try {
      const res = await base44.functions.invoke(action, body);
      return res;
    } catch (err) {
      const details = err?.response?.data?.validation?.errors;
      setFeedback({
        type: 'erreur',
        titre: 'Saisie refusée',
        lignes: details?.length ? details : [err.message || 'Erreur inconnue.'],
      });
      return null;
    } finally {
      setBusy('');
    }
  }

  const verifier = async () => {
    const res = await appeler('resultatsManuels', { ...payload(), dry_run: true }, 'verif');
    if (res) {
      setFeedback({
        type: 'ok',
        titre: `Répartition valide — ${res.total} sièges.`,
        lignes: res.warnings || [],
      });
    }
  };

  const enregistrer = async () => {
    if (!window.confirm(
      `Enregistrer ce résultat comme RÉSULTAT FINAL ?\n\n` +
      `Il remplacera tout résultat final existant et servira de base au scoring.`
    )) return;

    const res = await appeler('resultatsManuels', payload(), 'save');
    if (res) {
      setEnregistre(true);
      setFeedback({
        type: 'ok',
        titre: res.remplace ? 'Résultat final remplacé.' : 'Résultat final enregistré.',
        lignes: res.warnings || [],
      });
    }
  };

  const lancerScoring = async () => {
    const res = await appeler('prediciteScoringSieges', { action: 'scoreSiegesAndSync' }, 'score');
    if (res) {
      setFeedback({
        type: 'ok',
        titre: `Scoring effectué : ${res.predictions_scored} pronostic(s), ${res.users_updated} joueur(s) mis à jour.`,
        lignes: ['Relancer le scoring est sans effet : les points ne se cumulent pas.'],
      });
    }
  };

  const lancerBloc = async () => {
    const res = await appeler('prediciteScoringSieges', { action: 'scoreBlocMajoritaire' }, 'bloc');
    if (res) {
      setFeedback({
        type: 'ok',
        titre: `Bonus de bloc : ${res.users_awarded} joueur(s) récompensé(s).`,
        lignes: [
          `Coalition : ${res.real_coalition_seats} sièges — ` +
          `${res.real_coalition_majority ? 'majorité atteinte' : 'pas de majorité'}.`,
        ],
      });
    }
  };

  if (user === undefined) return <Ecran>Chargement…</Ecran>;
  if (user?.role !== 'admin') {
    return <Ecran>Réservé aux administrateurs.</Ecran>;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="p-display text-2xl mb-1">
        Résultats — saisie manuelle
      </h1>
      <p className="p-body text-sm mb-8">
        Sièges par liste. Le total doit faire exactement {TOTAL_SIEGES}, et une liste
        franchissant le seuil de 3,25 % obtient au moins 4 sièges — jamais 1, 2 ou 3.
      </p>

      {isLoading ? (
        <p className="text-sm" style={{ color: 'var(--p-text-40)' }}>Chargement des listes…</p>
      ) : (
        <div className="space-y-2">
          {listes.map(liste => (
            <div
              key={liste.id}
              className="flex items-center justify-between gap-4 p-card px-4 py-2.5"
            >
              <label htmlFor={`seats-${liste.id}`} className="text-sm font-semibold" style={{ color: 'var(--p-text)' }}>
                {liste.name_fr}
              </label>
              <input
                id={`seats-${liste.id}`}
                type="number"
                min="0"
                max={TOTAL_SIEGES}
                inputMode="numeric"
                value={seats[liste.id] ?? ''}
                onChange={(e) => setSeats(s => ({ ...s, [liste.id]: e.target.value }))}
                className="w-20 px-3 py-1.5 rounded-lg bg-transparent border text-right text-sm outline-none transition-colors focus:border-[var(--p-gold)]"
                style={{ borderColor: 'var(--p-border-hover)', color: 'var(--p-text)' }}
                placeholder="0"
              />
            </div>
          ))}
        </div>
      )}

      {/* Page volontairement austere — mais c'est l'ecran du SOIR DU SCRUTIN,
          utilise sous pression. Le total et l'ecart sont ce qu'on verifie a
          chaque saisie : ils collent en bas de l'ecran et se lisent de loin,
          au lieu d'etre une ligne de plus a retrouver en bas de page. */}
      <div
        className="sticky bottom-0 z-20 flex items-center justify-between mt-5 rounded-xl border px-4 py-3"
        style={{
          background: 'var(--p-glass-bg)',
          backdropFilter: 'blur(14px) saturate(1.1)',
          WebkitBackdropFilter: 'blur(14px) saturate(1.1)',
          borderColor: ecart === 0 ? 'var(--p-gold)' : 'var(--p-border-hover)',
          boxShadow: ecart === 0 ? '0 10px 26px -14px var(--p-gold-glow)' : 'var(--p-elev-1)',
        }}
      >
        <span className="text-sm font-semibold" style={{ color: 'var(--p-text-60)' }}>Total</span>
        <span className="p-mono text-2xl" style={{ color: ecart === 0 ? 'var(--p-gold-text)' : 'var(--p-text)' }}>
          {total} / {TOTAL_SIEGES}
          {ecart !== 0 && (
            <span className="text-sm font-semibold ml-2" style={{ color: 'var(--p-red)' }}>
              ({ecart > 0 ? `+${ecart}` : ecart})
            </span>
          )}
        </span>
      </div>
      <p className="sr-only" role="status" aria-live="polite">
        Total saisi : {total} sur {TOTAL_SIEGES}.
      </p>

      {feedback && (
        <div
          role="status"
          className="mt-5 rounded-lg border px-4 py-3"
          style={{
            background: 'var(--p-card)',
            borderColor: feedback.type === 'erreur' ? 'var(--p-red)' : 'var(--p-gold-border)',
          }}
        >
          <p className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--p-text)' }}>
            {feedback.type === 'erreur'
              ? <AlertTriangle size={15} style={{ color: 'var(--p-red)' }} />
              : <Check size={15} style={{ color: 'var(--p-gold-text)' }} />}
            {feedback.titre}
          </p>
          {feedback.lignes?.length > 0 && (
            <ul className="mt-2 space-y-1">
              {feedback.lignes.map((ligne, i) => (
                <li key={i} className="text-xs leading-relaxed" style={{ color: 'var(--p-text-60)' }}>• {ligne}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-3 mt-6">
        <Bouton onClick={verifier} busy={busy === 'verif'} variante="secondaire">
          Vérifier
        </Bouton>
        <Bouton onClick={enregistrer} busy={busy === 'save'} disabled={ecart !== 0}>
          Enregistrer le résultat final
        </Bouton>
      </div>

      <div className="mt-10 pt-6 border-t" style={{ borderColor: 'var(--p-border)' }}>
        <h2 className="text-sm font-bold mb-1" style={{ color: 'var(--p-text)' }}>Scoring</h2>
        <p className="text-xs mb-4 leading-relaxed" style={{ color: 'var(--p-text-40)' }}>
          À lancer une fois le résultat final enregistré. Les deux opérations sont
          rejouables sans risque : les points ne se cumulent pas d'un passage à l'autre.
        </p>
        <div className="flex flex-wrap gap-3">
          <Bouton onClick={lancerScoring} busy={busy === 'score'} disabled={!enregistre} variante="secondaire">
            Scorer les pronostics
          </Bouton>
          <Bouton onClick={lancerBloc} busy={busy === 'bloc'} disabled={!enregistre} variante="secondaire">
            Bonus de bloc majoritaire
          </Bouton>
        </div>
      </div>
    </div>
  );
}

function Ecran({ children }) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center text-sm" style={{ color: 'var(--p-text-40)' }}>
      {children}
    </div>
  );
}

function Bouton({ onClick, busy, disabled, variante, children }) {
  const secondaire = variante === 'secondaire';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy || disabled}
      className="px-4 py-2.5 rounded-lg font-bold text-sm transition-opacity hover:opacity-88 disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-2"
      style={secondaire
        ? { border: '1px solid var(--p-border-hover)', color: 'var(--p-text)' }
        : { background: 'var(--p-blue-deep)', color: '#fff' }}
    >
      {busy && <Loader2 size={14} className="animate-spin" />}
      {children}
    </button>
  );
}
