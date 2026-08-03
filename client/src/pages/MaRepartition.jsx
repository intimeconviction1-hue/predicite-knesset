import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { AlertTriangle, Check, Clock, Landmark, Lock, PenLine } from 'lucide-react';
import Hemicycle from '@/components/knesset/Hemicycle';

/**
 * Répartition des 120 sièges — le pronostic principal du jeu.
 *
 * Le pronostic se déposait auparavant liste par liste, chacun borné 0–120
 * indépendamment : on pouvait donner 40 sièges à tout le monde. Il n'y avait
 * donc aucun arbitrage, et la stratégie optimale se réduisait à recopier le
 * dernier sondage pour chaque liste.
 *
 * Ici, les 120 sièges sont une enveloppe fermée : ce qu'on donne à une liste,
 * on le retire à une autre. Le serveur revalide tout (voir
 * server/functions/repartitionSieges.js) — cet écran ne fait que rendre la
 * contrainte lisible et jouable.
 */

const TOTAL_SIEGES = 120;
const MIN_SIEGES_AU_SEUIL = 4;
const FALLBACK_DEADLINE_UTC = '2026-10-26T04:00:00Z';

function formatLocalDeadline(utcString) {
  const d = new Date(utcString);
  if (Number.isNaN(d.getTime())) return null;
  const date = d.toLocaleDateString('fr-FR', { timeZone: 'Asia/Jerusalem', day: 'numeric', month: 'long', year: 'numeric' });
  const time = d.toLocaleTimeString('fr-FR', { timeZone: 'Asia/Jerusalem', hour: '2-digit', minute: '2-digit' });
  return `${date} — ${time} (heure d'Israël)`;
}

export default function MaRepartition() {
  const [user, setUser] = useState(undefined);
  const [seats, setSeats] = useState({});
  const [justifs, setJustifs] = useState({});
  const [ouverte, setOuverte] = useState(null);      // liste dont l'analyse est dépliée
  const [feedback, setFeedback] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deadlineUtc, setDeadlineUtc] = useState(FALLBACK_DEADLINE_UTC);
  const [deadlineClosed, setDeadlineClosed] = useState(false);

  useEffect(() => {
    base44.auth.me().then(u => setUser(u || null)).catch(() => setUser(null));
  }, []);

  useEffect(() => {
    base44.entities.CampaignSettings.filter({ key: 'global' })
      .then(res => {
        const d = res?.[0]?.predictions_deadline_utc;
        const parsed = d && !Number.isNaN(new Date(d).getTime()) ? d : FALLBACK_DEADLINE_UTC;
        setDeadlineUtc(parsed);
        setDeadlineClosed(new Date() >= new Date(parsed));
      })
      .catch(() => setDeadlineClosed(new Date() >= new Date(FALLBACK_DEADLINE_UTC)));
  }, []);

  const { data: listes = [], isLoading } = useQuery({
    queryKey: ['listes-actives'],
    queryFn: () => base44.entities.Liste.filter({ is_active: true }),
  });

  // Le serveur ne renvoie que les pronostics de l'utilisateur connecté.
  const { data: existants = [] } = useQuery({
    queryKey: ['ma-repartition', user?.email],
    queryFn: () => base44.entities.PronosticSieges.filter({}),
    enabled: !!user?.email,
  });

  // Pré-remplit une seule fois, à l'arrivée des pronostics déjà déposés.
  useEffect(() => {
    if (!existants.length) return;
    setSeats(s => (Object.keys(s).length ? s : Object.fromEntries(
      existants.map(p => [p.liste_id, String(p.predicted_seats)])
    )));
    setJustifs(j => (Object.keys(j).length ? j : Object.fromEntries(
      existants.filter(p => p.justification).map(p => [p.liste_id, p.justification])
    )));
  }, [existants]);

  const valeur = (id) => parseInt(seats[id], 10) || 0;
  const total = useMemo(
    () => listes.reduce((sum, l) => sum + valeur(l.id), 0),
    [listes, seats],
  );
  const restants = TOTAL_SIEGES - total;

  // Aperçu vivant de l'hémicycle : c'est là que la contrainte devient tangible.
  const apercu = useMemo(
    () => listes.map(l => ({ liste_id: l.id, seats: valeur(l.id) })),
    [listes, seats],
  );

  const impossibles = listes.filter(l => {
    const v = valeur(l.id);
    return v > 0 && v < MIN_SIEGES_AU_SEUIL;
  });
  const peutValider = restants === 0 && impossibles.length === 0 && !deadlineClosed;

  const soumettre = async () => {
    if (!user) { base44.auth.redirectToLogin(window.location.href); return; }
    setIsSubmitting(true);
    setFeedback(null);
    try {
      const res = await base44.functions.invoke('prediciteScoringSieges', {
        action: 'submitRepartition',
        predictions: listes.map(l => ({
          liste_id: l.id,
          predicted_seats: valeur(l.id),
          justification: justifs[l.id] || '',
        })),
      });
      setFeedback({
        type: 'ok',
        titre: 'Répartition enregistrée.',
        lignes: [
          `${res.justifications} analyse(s) écrite(s) — ${res.participation_points} points de participation.`,
          'Modifiable autant que tu veux jusqu’à la clôture, sans repartir de zéro.',
        ],
      });
    } catch (err) {
      if (err?.status === 403) setDeadlineClosed(true);
      const details = err?.response?.data?.validation?.errors;
      setFeedback({
        type: 'erreur',
        titre: 'Répartition refusée',
        lignes: details?.length ? details : [err.message || 'Erreur inconnue.'],
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (user === null) {
    return (
      <Centre>
        <p className="mb-4">Connecte-toi pour déposer ta répartition.</p>
        <button
          onClick={() => base44.auth.redirectToLogin(window.location.href)}
          className="px-4 py-2.5 rounded-lg font-bold text-sm text-white"
          style={{ background: '#1E3A8A' }}
        >
          Se connecter
        </button>
      </Centre>
    );
  }
  if (user === undefined || isLoading) return <Centre>Chargement…</Centre>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-black mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--p-text)' }}>
        Ma répartition des 120 sièges
      </h1>
      <p className="text-sm mb-6 leading-relaxed" style={{ color: 'var(--p-text-60)' }}>
        La Knesset compte 120 sièges, ni plus ni moins. Donner un siège à une liste,
        c'est le retirer à une autre — c'est tout l'exercice. Une liste franchit le
        seuil de 3,25 % ou ne l'atteint pas : elle obtient donc au moins{' '}
        {MIN_SIEGES_AU_SEUIL} sièges, ou zéro. Jamais 1, 2 ou 3.
      </p>

      <div
        className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs mb-6"
        style={{
          background: deadlineClosed ? 'rgba(217,43,43,0.1)' : 'rgba(212,175,55,0.08)',
          color: deadlineClosed ? 'var(--p-red)' : 'var(--p-gold-text)',
        }}
      >
        {deadlineClosed ? <Lock className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
        {deadlineClosed
          ? 'Pronostics clôturés'
          : <span>Clôture : <strong>{formatLocalDeadline(deadlineUtc)}</strong></span>}
      </div>

      <div className="rounded-2xl border p-4 mb-6" style={{ background: 'var(--p-card)', borderColor: 'var(--p-border)' }}>
        <Hemicycle seatsByListe={apercu} listes={listes} height={210} />
      </div>

      {/* Compteur : collant, pour rester visible pendant toute la saisie. */}
      <div
        className="sticky top-2 z-10 flex items-center justify-between rounded-xl border px-4 py-3 mb-4 backdrop-blur"
        style={{
          background: 'var(--p-card)',
          borderColor: restants === 0 ? 'var(--p-gold)' : 'var(--p-border-hover)',
        }}
      >
        <span className="text-sm font-semibold" style={{ color: 'var(--p-text-60)' }}>
          {total} / {TOTAL_SIEGES} sièges
        </span>
        <motion.span
          key={restants}
          initial={{ scale: 1.12, opacity: 0.7 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 16 }}
          className="text-sm font-black tabular-nums"
          style={{ color: restants === 0 ? 'var(--p-gold)' : 'var(--p-text)' }}
        >
          {restants === 0
            ? 'Répartition complète'
            : restants > 0
              ? `${restants} à placer`
              : `${-restants} en trop`}
        </motion.span>
      </div>

      <div className="space-y-2">
        {listes.map(liste => {
          const v = valeur(liste.id);
          const impossible = v > 0 && v < MIN_SIEGES_AU_SEUIL;
          const aUneAnalyse = (justifs[liste.id] || '').trim().length >= 20;
          return (
            <div
              key={liste.id}
              className="rounded-xl border px-4 py-3"
              style={{
                background: 'var(--p-card)',
                borderColor: impossible ? 'var(--p-red)' : 'var(--p-border)',
              }}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--p-text)' }}>
                    {liste.name_fr}
                  </p>
                  {liste.leader_name && (
                    <p className="text-[11px] truncate" style={{ color: 'var(--p-text-40)' }}>{liste.leader_name}</p>
                  )}
                </div>
                <input
                  type="number"
                  min="0"
                  max={TOTAL_SIEGES}
                  inputMode="numeric"
                  aria-label={`Sièges pronostiqués pour ${liste.name_fr}`}
                  disabled={deadlineClosed}
                  value={seats[liste.id] ?? ''}
                  onChange={(e) => setSeats(s => ({ ...s, [liste.id]: e.target.value }))}
                  className="w-20 flex-shrink-0 px-3 py-1.5 rounded-lg bg-transparent border text-right text-sm outline-none transition-colors focus:border-[var(--p-gold)] disabled:opacity-50"
                  style={{ borderColor: 'var(--p-border-hover)', color: 'var(--p-text)' }}
                  placeholder="0"
                />
              </div>

              {impossible && (
                <p className="text-[11px] mt-2" style={{ color: 'var(--p-red)' }}>
                  {v} siège(s) est impossible : sous le seuil, c'est 0 ; au-dessus, au moins {MIN_SIEGES_AU_SEUIL}.
                </p>
              )}

              {!deadlineClosed && (
                <button
                  type="button"
                  onClick={() => setOuverte(ouverte === liste.id ? null : liste.id)}
                  className="flex items-center gap-1.5 text-[11px] mt-2 hover:text-[var(--p-text)] transition-colors"
                  style={{ color: aUneAnalyse ? 'var(--p-gold-text)' : 'var(--p-text-40)' }}
                >
                  <PenLine className="w-3 h-3" />
                  {aUneAnalyse ? 'Analyse écrite' : 'Ajouter une analyse (facultatif)'}
                </button>
              )}
              {ouverte === liste.id && (
                <textarea
                  value={justifs[liste.id] || ''}
                  onChange={(e) => setJustifs(j => ({ ...j, [liste.id]: e.target.value }))}
                  placeholder="Pourquoi ce nombre ? Reports de voix, dynamique de campagne, risque de passer sous le seuil…"
                  rows={3}
                  maxLength={500}
                  className="w-full mt-2 px-3 py-2 rounded-lg bg-transparent border text-sm outline-none resize-none focus:border-[var(--p-gold)]"
                  style={{ borderColor: 'var(--p-border-hover)', color: 'var(--p-text)' }}
                />
              )}
            </div>
          );
        })}
      </div>

      {feedback && (
        <div
          role="status"
          className="mt-6 rounded-xl border px-4 py-3"
          style={{
            background: 'var(--p-card)',
            borderColor: feedback.type === 'erreur' ? 'var(--p-red)' : 'var(--p-gold)',
          }}
        >
          <p className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--p-text)' }}>
            {feedback.type === 'erreur'
              ? <AlertTriangle size={15} style={{ color: 'var(--p-red)' }} />
              : <Check size={15} style={{ color: 'var(--p-gold)' }} />}
            {feedback.titre}
          </p>
          <ul className="mt-2 space-y-1">
            {feedback.lignes.map((ligne, i) => (
              <li key={i} className="text-xs leading-relaxed" style={{ color: 'var(--p-text-60)' }}>• {ligne}</li>
            ))}
          </ul>
        </div>
      )}

      <button
        type="button"
        onClick={soumettre}
        disabled={!peutValider || isSubmitting}
        className="w-full mt-6 py-3 rounded-lg font-bold text-sm text-white transition-opacity hover:opacity-88 disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
        style={{ background: '#1E3A8A' }}
      >
        <Landmark className="w-4 h-4" />
        {isSubmitting
          ? 'Enregistrement…'
          : restants !== 0
            ? `Encore ${Math.abs(restants)} siège(s) à ajuster`
            : 'Valider ma répartition'}
      </button>

      <p className="text-center text-xs mt-6">
        <Link to={createPageUrl('Listes')} className="underline hover:opacity-80" style={{ color: 'var(--p-text-40)' }}>
          Revoir le détail des listes
        </Link>
      </p>
    </div>
  );
}

function Centre({ children }) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center text-sm" style={{ color: 'var(--p-text-60)' }}>
      {children}
    </div>
  );
}
