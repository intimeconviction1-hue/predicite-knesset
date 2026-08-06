import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { AlertTriangle, Clock, Landmark, Lock, PenLine, Minus, Plus, Wand2, Trophy } from 'lucide-react';
import Hemicycle from '@/components/knesset/Hemicycle';
import ConfettiBurst from '@/components/knesset/ConfettiBurst';
import ShareProjection from '@/components/knesset/ShareProjection';
import { FALLBACK_DEADLINE_UTC, formatLocalDeadline } from '@/lib/echeances';
import { TOTAL_SIEGES, MIN_SIEGES_AU_SEUIL } from '@/lib/knesset';

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
 *
 * 2026-08-04 — l'écran demandait 15 nombres SANS afficher une seule donnée de
 * référence, alors que le dernier sondage est chargé partout ailleurs dans
 * l'app. Résultat : rien pour démarrer, et un habitué devait ouvrir un second
 * onglet. Trois ajouts, tous au service du même problème :
 *   1. le dernier sondage s'affiche par liste, et sert de tri (le paysage
 *      apparaît d'emblée hiérarchisé au lieu de 15 lignes identiques) ;
 *   2. « Partir du dernier sondage » pré-remplit à 120 — on AJUSTE au lieu de
 *      CRÉER, et l'écart au consensus devient le vrai geste de jeu ;
 *   3. l'écart s'affiche par liste : c'est là que se gagne le score.
 * Et la validation, qui rendait un encadré gris pour l'acte le plus coûteux du
 * produit, est devenue le moment fort qu'elle aurait toujours dû être.
 */


export default function MaRepartition() {
  const [user, setUser] = useState(undefined);
  const [seats, setSeats] = useState({});
  const [justifs, setJustifs] = useState({});
  const [ouverte, setOuverte] = useState(null);      // liste dont l'analyse est dépliée
  const [feedback, setFeedback] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deadlineUtc, setDeadlineUtc] = useState(FALLBACK_DEADLINE_UTC);
  const [deadlineClosed, setDeadlineClosed] = useState(false);
  const [celebre, setCelebre] = useState(0);

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

  // Le dernier sondage sièges : référence affichée par liste, base du tri, et
  // source du pré-remplissage. Même requête que Listes/FormeCoalition.
  const { data: sondages = [] } = useQuery({
    queryKey: ['sondages-sieges-latest'],
    queryFn: () => base44.entities.SondageSieges.list('-poll_date', 1),
  });
  const dernierSondage = sondages?.[0] || null;
  const siegesSondage = useMemo(
    () => new Map((dernierSondage?.seats_by_liste || []).map(s => [s.liste_id, s.seats])),
    [dernierSondage],
  );

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

  // Tri par poids réel : le paysage partisan apparaît hiérarchisé dès l'arrivée.
  // À défaut de sondage, on retombe sur les sièges sortants, puis sur le nom —
  // jamais sur un ordre arbitraire de base de données.
  const listesTriees = useMemo(() => [...listes].sort((a, b) => {
    const sa = siegesSondage.get(a.id) ?? a.current_knesset_seats ?? -1;
    const sb = siegesSondage.get(b.id) ?? b.current_knesset_seats ?? -1;
    if (sb !== sa) return sb - sa;
    return (a.name_fr || '').localeCompare(b.name_fr || '', 'fr');
  }), [listes, siegesSondage]);

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

  // Blocs de MA répartition — repris à l'identique de la Home pour que le même
  // mot désigne partout la même somme (non_alignee compte avec l'opposition).
  const blocs = useMemo(() => {
    const somme = (test) => listes.filter(test).reduce((s, l) => s + valeur(l.id), 0);
    return {
      coalition:  somme(l => l.bloc === 'coalition'),
      opposition: somme(l => l.bloc === 'opposition' || l.bloc === 'non_alignee'),
      arabe:      somme(l => l.bloc === 'liste_arabe'),
    };
  }, [listes, seats]);

  const ajuster = (id, delta) => {
    if (deadlineClosed) return;
    setSeats(s => {
      const v = Math.max(0, Math.min(TOTAL_SIEGES, (parseInt(s[id], 10) || 0) + delta));
      return { ...s, [id]: String(v) };
    });
  };

  // Pré-remplissage depuis le consensus. Le total d'un sondage vaut déjà 120 :
  // l'utilisateur part donc d'une répartition VALIDE et joue son écart, au lieu
  // de fabriquer 120 sièges depuis une page blanche.
  const partirDuSondage = () => {
    if (!dernierSondage || deadlineClosed) return;
    setSeats(Object.fromEntries(listes.map(l => [l.id, String(siegesSondage.get(l.id) ?? 0)])));
  };

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
        analyses: res.justifications,
        points: res.participation_points,
      });
      setCelebre(c => c + 1);
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
        <button onClick={() => base44.auth.redirectToLogin(window.location.href)} className="p-btn-deep">
          Se connecter
        </button>
      </Centre>
    );
  }
  if (user === undefined || isLoading) return <Centre>Chargement…</Centre>;

  const dateSondage = dernierSondage
    ? new Date(dernierSondage.poll_date).toLocaleDateString('fr-FR')
    : null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 pb-28 md:pb-8">
      {/* Hors de tout conteneur transformé : ConfettiBurst est en position fixed,
          et un `transform` parent en ferait un bloc conteneur — la salve
          partirait à côté de l'écran (piège documenté dans globals.css). */}
      <ConfettiBurst trigger={celebre} count={46} />

      <h1 className="p-display text-3xl mb-2">Ma répartition des 120 sièges</h1>
      <p className="p-body text-sm mb-6">
        La Knesset compte 120 sièges, ni plus ni moins. Donner un siège à une liste,
        c'est le retirer à une autre — c'est tout l'exercice. Une liste franchit le
        seuil de 3,25 % ou ne l'atteint pas : elle obtient donc au moins{' '}
        {MIN_SIEGES_AU_SEUIL} sièges, ou zéro. Jamais 1, 2 ou 3.
      </p>

      <div
        className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs mb-6"
        style={{
          background: deadlineClosed ? 'rgba(200,16,46,0.1)' : 'var(--p-gold-dim)',
          color: deadlineClosed ? 'var(--p-red)' : 'var(--p-gold-text)',
        }}
      >
        {deadlineClosed ? <Lock className="w-3.5 h-3.5 flex-shrink-0" /> : <Clock className="w-3.5 h-3.5 flex-shrink-0" />}
        {deadlineClosed
          ? 'Pronostics clôturés'
          : <span>Clôture : <strong>{formatLocalDeadline(deadlineUtc)}</strong></span>}
      </div>

      <div className="p-card p-4 mb-6">
        <Hemicycle seatsByListe={apercu} listes={listes} height={210} />
        <div className="flex items-center justify-center gap-5 mt-2 text-[11px]" style={{ color: 'var(--p-text-60)' }}>
          <span>Coalition <b className="p-mono" style={{ color: 'var(--p-text)' }}>{blocs.coalition}</b></span>
          <span>Opposition <b className="p-mono" style={{ color: 'var(--p-text)' }}>{blocs.opposition}</b></span>
          {blocs.arabe > 0 && <span>Listes arabes <b className="p-mono" style={{ color: 'var(--p-text)' }}>{blocs.arabe}</b></span>}
        </div>
      </div>

      {/* Le raccourci qui manquait : partir du consensus plutôt que d'une page
          blanche. Un sondage totalise déjà 120 sièges — le point de départ est
          donc valide par construction. */}
      {dernierSondage && !deadlineClosed && (
        <button
          type="button"
          onClick={partirDuSondage}
          className="p-btn-gold w-full justify-center mb-4"
        >
          <Wand2 className="w-4 h-4 mr-2" />
          Partir du dernier sondage ({dernierSondage.institute}, {dateSondage})
        </button>
      )}

      {/* Compteur collant. `top-2` le glissait SOUS l'en-tête, lui-même collant
          en h-14 : il faut dégager la hauteur de l'en-tête, pas 8px. */}
      <div
        className="sticky top-[62px] z-30 flex items-center justify-between rounded-xl border px-4 py-3 mb-4"
        style={{
          background: 'var(--p-glass-bg)',
          backdropFilter: 'blur(14px) saturate(1.1)',
          WebkitBackdropFilter: 'blur(14px) saturate(1.1)',
          borderColor: restants === 0 ? 'var(--p-gold)' : 'var(--p-border-hover)',
          boxShadow: restants === 0 ? '0 10px 26px -14px rgba(212,175,55,.75)' : 'var(--p-elev-1)',
        }}
      >
        <span className="text-sm font-semibold" style={{ color: 'var(--p-text-60)' }}>
          <span className="p-mono" style={{ color: 'var(--p-text)' }}>{total}</span> / {TOTAL_SIEGES} sièges
        </span>
        <motion.span
          key={restants}
          initial={{ scale: 1.12, opacity: 0.7 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 16 }}
          className="text-sm font-black tabular-nums"
          style={{ color: restants === 0 ? 'var(--p-gold-text)' : 'var(--p-text)' }}
        >
          {restants === 0
            ? 'Répartition complète'
            : restants > 0
              ? `${restants} à placer`
              : `${-restants} en trop`}
        </motion.span>
      </div>
      {/* Le compteur change à chaque frappe : annoncé une fois, calmement, au
          lieu d'être lu à chaque caractère. */}
      <p className="sr-only" role="status" aria-live="polite">
        {total} sièges placés sur {TOTAL_SIEGES}.
      </p>

      <div className="space-y-2">
        {listesTriees.map(liste => {
          const v = valeur(liste.id);
          const ref = siegesSondage.get(liste.id);
          const ecart = ref == null ? null : v - ref;
          const impossible = v > 0 && v < MIN_SIEGES_AU_SEUIL;
          const aUneAnalyse = (justifs[liste.id] || '').trim().length >= 20;
          return (
            <div
              key={liste.id}
              className="p-card px-4 py-3"
              style={impossible ? { borderColor: 'var(--p-red)' } : undefined}
            >
              <div className="relative flex items-center justify-between gap-3">
                <div className="min-w-0 flex items-center gap-2.5">
                  {/* La couleur du parti était disponible et jamais utilisée :
                      15 lignes typographiquement identiques. */}
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ background: liste.color || 'var(--p-text-25)' }}
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--p-text)' }}>
                      {liste.name_fr}
                    </p>
                    <p className="text-[11px] truncate" style={{ color: 'var(--p-text-40)' }}>
                      {ref != null
                        ? <>Sondage <b className="p-mono" style={{ color: 'var(--p-text-60)' }}>{ref}</b>{liste.leader_name ? ` · ${liste.leader_name}` : ''}</>
                        : (liste.leader_name || '—')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => ajuster(liste.id, -1)}
                    disabled={deadlineClosed || v === 0}
                    aria-label={`Retirer un siège à ${liste.name_fr}`}
                    className="w-11 h-11 rounded-lg border justify-center transition-colors hover:bg-[var(--p-text-10)] disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{ borderColor: 'var(--p-border-hover)', color: 'var(--p-text-60)' }}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    min="0"
                    max={TOTAL_SIEGES}
                    inputMode="numeric"
                    aria-label={`Sièges pronostiqués pour ${liste.name_fr}`}
                    disabled={deadlineClosed}
                    value={seats[liste.id] ?? ''}
                    onChange={(e) => setSeats(s => ({ ...s, [liste.id]: e.target.value }))}
                    className="w-14 h-11 px-2 rounded-lg bg-transparent border text-center text-sm outline-none transition-colors focus:border-[var(--p-gold)] disabled:opacity-50"
                    style={{ borderColor: 'var(--p-border-hover)', color: 'var(--p-text)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}
                    placeholder="0"
                  />
                  <button
                    type="button"
                    onClick={() => ajuster(liste.id, 1)}
                    disabled={deadlineClosed}
                    aria-label={`Ajouter un siège à ${liste.name_fr}`}
                    className="w-11 h-11 rounded-lg border justify-center transition-colors hover:bg-[var(--p-text-10)] disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{ borderColor: 'var(--p-border-hover)', color: 'var(--p-text-60)' }}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* L'écart au consensus : c'est là que se gagne ou se perd le
                  score, donc c'est ce qu'on montre — pas le chiffre brut seul. */}
              {ecart != null && ecart !== 0 && (
                <p className="text-[11px] mt-1.5 pl-5" style={{ color: 'var(--p-text-40)' }}>
                  <b className="p-mono" style={{ color: ecart > 0 ? 'var(--p-green-text)' : 'var(--p-red)' }}>
                    {ecart > 0 ? `+${ecart}` : ecart}
                  </b>{' '}
                  par rapport au sondage
                </p>
              )}

              {impossible && (
                <p className="text-[11px] mt-2 pl-5" style={{ color: 'var(--p-red)' }}>
                  {v} siège(s) est impossible : sous le seuil, c'est 0 ; au-dessus, au moins {MIN_SIEGES_AU_SEUIL}.
                </p>
              )}

              {!deadlineClosed && (
                <button
                  type="button"
                  onClick={() => setOuverte(ouverte === liste.id ? null : liste.id)}
                  aria-expanded={ouverte === liste.id}
                  className="flex items-center gap-1.5 text-[11px] mt-1 hover:text-[var(--p-text)] transition-colors"
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
                  aria-label={`Analyse pour ${liste.name_fr}`}
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

      {/* La validation était un encadré gris à deux puces pour l'acte le plus
          coûteux du produit : 15 arbitrages. C'est la « fin » au sens pic-fin,
          celle dont l'utilisateur garde le souvenir. */}
      {feedback?.type === 'ok' && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          role="status"
          className="mt-6 rounded-2xl overflow-hidden p-elev-2"
          style={{ background: 'var(--p-card)', border: '0.5px solid var(--p-gold-border)' }}
        >
          <div className="px-5 py-4" style={{ background: 'var(--p-grad-gold)' }}>
            <p className="p-title text-lg" style={{ color: 'var(--p-ink)' }}>Ta Knesset est déposée.</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(20,32,61,0.75)' }}>
              Modifiable jusqu'à la clôture, sans repartir de zéro.
            </p>
          </div>

          <div className="px-5 py-4">
            <div className="grid grid-cols-3 gap-3 text-center mb-4">
              {[
                { label: 'Coalition', value: blocs.coalition },
                { label: 'Opposition', value: blocs.opposition },
                { label: 'Listes arabes', value: blocs.arabe },
              ].map(b => (
                <div key={b.label}>
                  <p className="p-mono text-2xl" style={{ color: 'var(--p-text)' }}>{b.value}</p>
                  <p className="text-[10px] uppercase tracking-widest mt-0.5" style={{ color: 'var(--p-text-40)' }}>{b.label}</p>
                </div>
              ))}
            </div>

            <p className="text-xs mb-4" style={{ color: 'var(--p-text-60)' }}>
              {feedback.analyses > 0
                ? `${feedback.analyses} analyse(s) écrite(s) — ${feedback.points} points de participation.`
                : `${feedback.points} points de participation. Écris une analyse par liste pour en gagner davantage.`}
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <ShareProjection
                seatsByListe={listes
                  .filter(l => valeur(l.id) > 0)
                  .map(l => ({ seats: valeur(l.id), color: l.color, name: l.name_fr }))
                  .sort((a, b) => b.seats - a.seats)}
                coalition={blocs.coalition}
                opposition={blocs.opposition}
                arab={blocs.arabe}
                source="Ma répartition · PrédiCité"
              />
              <Link to={createPageUrl('Leaderboard')} className="p-btn-ghost gap-2">
                <Trophy className="w-3.5 h-3.5" /> Voir le classement
              </Link>
            </div>
          </div>
        </motion.div>
      )}

      {feedback?.type === 'erreur' && (
        <div
          role="alert"
          className="p-card p-card-alert mt-6 px-4 py-3"
        >
          <p className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--p-text)' }}>
            <AlertTriangle size={15} style={{ color: 'var(--p-red)' }} />
            {feedback.titre}
          </p>
          <ul className="mt-2 space-y-1">
            {feedback.lignes.map((ligne, i) => (
              <li key={i} className="text-xs leading-relaxed" style={{ color: 'var(--p-text-60)' }}>• {ligne}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Le bouton de validation arrivait APRÈS quinze champs : sur mobile il
          fallait faire défiler toute la liste pour savoir si on pouvait valider.
          Il colle désormais en bas de l'écran, dans la zone du pouce. */}
      <div className="fixed md:static bottom-0 left-0 right-0 z-40 px-4 py-3 md:p-0 md:mt-6"
        style={{ background: 'var(--p-glass-bg)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', borderTop: '0.5px solid var(--p-border)' }}>
        <button
          type="button"
          onClick={soumettre}
          disabled={!peutValider || isSubmitting}
          className="w-full max-w-3xl mx-auto py-3 rounded-lg font-bold text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed justify-center gap-2"
          style={{ background: 'var(--p-blue-deep)' }}
        >
          <Landmark className="w-4 h-4" />
          {isSubmitting
            ? 'Enregistrement…'
            : restants !== 0
              ? `Encore ${Math.abs(restants)} siège(s) à ajuster`
              : 'Valider ma répartition'}
        </button>
      </div>

      <p className="text-center text-xs mt-6">
        <Link to={createPageUrl('Listes')} className="p-inline underline hover:opacity-80" style={{ color: 'var(--p-text-40)' }}>
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
