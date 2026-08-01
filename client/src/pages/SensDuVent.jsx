import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Wind, RotateCcw, ArrowRight, Trophy, Flame } from 'lucide-react';

const ROUNDS = 5;
const fr = (d) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

// Questions « monté / baissé » à partir de paires de sondages consécutifs DU MÊME
// institut. On refuse le mélange inter-instituts : un parti qui « bouge » entre un
// sondage Midgam et un sondage Lazar mesure surtout l'écart entre instituts, pas un
// vrai mouvement d'opinion. Même institut = comparaison honnête.
function buildPool(sondages, listeById) {
  const byInst = {};
  for (const s of sondages) (byInst[s.institute] ||= []).push(s);
  const pool = [];
  for (const inst of Object.keys(byInst)) {
    const arr = byInst[inst].slice().sort((a, b) => (a.poll_date < b.poll_date ? -1 : 1));
    for (let i = 1; i < arr.length; i++) {
      const prev = arr[i - 1], cur = arr[i];
      if (prev.poll_date === cur.poll_date) continue;
      const pMap = new Map((prev.seats_by_liste || []).map(x => [x.liste_id, x.seats]));
      for (const c of (cur.seats_by_liste || [])) {
        const ps = pMap.get(c.liste_id);
        if (ps == null || ps === c.seats) continue; // on ne garde que les vrais mouvements
        const liste = listeById.get(c.liste_id);
        if (!liste) continue;
        pool.push({ inst, media: cur.publisher_media, liste, from: prev.poll_date, to: cur.poll_date, prev: ps, cur: c.seats, up: c.seats > ps });
      }
    }
  }
  return pool;
}

function pickRounds(pool) {
  const shuffled = pool.slice().sort(() => Math.random() - 0.5);
  const seen = new Set();
  const out = [];
  for (const q of shuffled) {
    const key = q.liste.id + '|' + q.to;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(q);
    if (out.length >= ROUNDS) break;
  }
  return out;
}

export default function SensDuVent() {
  const { data: sondages = [] } = useQuery({
    queryKey: ['svv-sondages'],
    queryFn: () => base44.entities.SondageSieges.list('-poll_date', 40),
  });
  const { data: listes = [] } = useQuery({
    queryKey: ['svv-listes'],
    queryFn: () => base44.entities.Liste.filter({ is_active: true }),
  });

  const listeById = useMemo(() => new Map(listes.map(l => [l.id, l])), [listes]);
  const pool = useMemo(() => buildPool(sondages, listeById), [sondages, listeById]);

  const [rounds, setRounds] = useState([]);
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [reveal, setReveal] = useState(null);   // { correct } de la manche courante
  const [phase, setPhase] = useState('intro');  // intro | play | done

  const q = rounds[idx];

  const start = () => {
    const r = pickRounds(pool);
    if (!r.length) return;
    setRounds(r); setIdx(0); setScore(0); setStreak(0); setBest(0); setReveal(null); setPhase('play');
  };

  const answer = (guessUp) => {
    if (reveal || !q) return;
    const correct = guessUp === q.up;
    setReveal({ correct });
    if (correct) {
      setScore(s => s + 1);
      setStreak(s => { const n = s + 1; setBest(b => Math.max(b, n)); return n; });
    } else setStreak(0);
  };

  const next = () => {
    if (idx + 1 >= rounds.length) {
      // Compteur « mode découverte » — servira au mur d'inscription (tâche à venir).
      try {
        const k = 'predicite_guest_plays';
        localStorage.setItem(k, String((parseInt(localStorage.getItem(k) || '0', 10) || 0) + 1));
      } catch (_) { /* localStorage indisponible : on ignore */ }
      setPhase('done');
    } else { setIdx(i => i + 1); setReveal(null); }
  };

  const gold = 'var(--p-gold-text)';

  return (
    <div className="min-h-screen" style={{ background: 'transparent' }}>
      {/* Liseré tricolore + en-tête compact « jeu » (registre ambré) */}
      <div className="p-tricolor"><div /><div /><div /></div>
      <div className="max-w-xl mx-auto px-4 pt-8 pb-4 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-3" style={{ background: 'var(--p-gold-dim)', border: '0.5px solid var(--p-gold-border)' }}>
          <Wind className="w-3.5 h-3.5" style={{ color: gold }} />
          <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: gold }}>Jeu · mode découverte</span>
        </div>
        <h1 className="p-display text-3xl md:text-4xl mb-2">Le sens du vent</h1>
        <p className="p-body text-sm max-w-md mx-auto">
          Entre deux sondages du même institut, un parti a‑t‑il <b style={{ color: 'var(--p-green)' }}>monté</b> ou <b style={{ color: 'var(--p-red)' }}>baissé</b> ? Fais ta série. Aucun compte requis pour essayer.
        </p>
      </div>

      <div className="max-w-md mx-auto px-4 pb-16">
        <AnimatePresence mode="wait">
          {/* ── INTRO ── */}
          {phase === 'intro' && (
            <motion.div key="intro" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-card p-6 text-center">
              {pool.length === 0 ? (
                <p className="p-body text-sm">Il faut au moins deux sondages du même institut pour jouer — reviens quand la campagne aura livré quelques vagues 😉</p>
              ) : (
                <>
                  <p className="p-body text-sm mb-5">{ROUNDS} manches. À chaque fois, devine le sens du mouvement. Enchaîne les bonnes réponses pour faire grimper ta série 🔥</p>
                  <button onClick={start} className="inline-flex items-center gap-2 px-6 py-3.5 rounded-[10px] font-bold text-[15px] transition-transform hover:-translate-y-0.5"
                    style={{ background: 'linear-gradient(180deg,#ffe08a,#D4AF37)', color: '#14203D', boxShadow: '0 14px 34px -12px rgba(212,175,55,0.6)' }}>
                    Jouer <ArrowRight className="w-4 h-4" />
                  </button>
                </>
              )}
            </motion.div>
          )}

          {/* ── PLAY ── */}
          {phase === 'play' && q && (
            <motion.div key={`play-${idx}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              {/* barre de progression + série */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1 h-1.5 rounded-full overflow-hidden mr-3" style={{ background: 'var(--p-text-10)' }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${((idx) / ROUNDS) * 100}%`, background: 'var(--p-gold)' }} />
                </div>
                <span className="inline-flex items-center gap-1 text-sm font-mono font-bold" style={{ color: streak > 0 ? '#C2410C' : 'var(--p-text-40)' }}>
                  <Flame className="w-4 h-4" /> {streak}
                </span>
              </div>

              <div className="p-card p-6 text-center">
                <p className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--p-text-40)' }}>
                  {q.inst}{q.media ? ` · ${q.media}` : ''} · sondage du {fr(q.from)} → {fr(q.to)}
                </p>
                <div className="flex items-center justify-center gap-2.5 mb-1">
                  <span className="w-3.5 h-3.5 rounded-full" style={{ background: q.liste.color || '#6B7280' }} />
                  <span className="p-title text-xl">{q.liste.name_fr}</span>
                </div>
                <p className="p-body text-sm mb-5">était à <b className="font-mono" style={{ color: 'var(--p-text)' }}>{q.prev}</b> sièges. Au sondage suivant, il a…</p>

                {!reveal ? (
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => answer(true)} className="flex flex-col items-center gap-1 py-4 rounded-xl transition-transform hover:-translate-y-0.5"
                      style={{ background: 'var(--p-green-dim)', border: '0.5px solid rgba(26,140,85,0.3)' }}>
                      <TrendingUp className="w-6 h-6" style={{ color: 'var(--p-green)' }} />
                      <span className="font-bold text-sm" style={{ color: '#16794A' }}>Monté</span>
                    </button>
                    <button onClick={() => answer(false)} className="flex flex-col items-center gap-1 py-4 rounded-xl transition-transform hover:-translate-y-0.5"
                      style={{ background: 'var(--p-red-dim)', border: '0.5px solid rgba(200,16,46,0.3)' }}>
                      <TrendingDown className="w-6 h-6" style={{ color: 'var(--p-red)' }} />
                      <span className="font-bold text-sm" style={{ color: 'var(--p-red)' }}>Baissé</span>
                    </button>
                  </div>
                ) : (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="rounded-xl py-4 px-3 mb-4" style={{ background: reveal.correct ? 'var(--p-green-dim)' : 'var(--p-red-dim)', border: `0.5px solid ${reveal.correct ? 'rgba(26,140,85,0.3)' : 'rgba(200,16,46,0.3)'}` }}>
                      <p className="font-bold text-sm mb-1" style={{ color: reveal.correct ? '#16794A' : 'var(--p-red)' }}>
                        {reveal.correct ? 'Bien vu !' : 'Raté !'}
                      </p>
                      <p className="p-body text-sm">
                        {q.liste.name_fr} est {q.up ? <span style={{ color: 'var(--p-green)', fontWeight: 700 }}>monté</span> : <span style={{ color: 'var(--p-red)', fontWeight: 700 }}>baissé</span>}
                        {' '}: <span className="font-mono" style={{ color: 'var(--p-text)' }}>{q.prev} → {q.cur}</span> <span className="font-mono" style={{ color: q.up ? 'var(--p-green)' : 'var(--p-red)' }}>({q.cur > q.prev ? '+' : ''}{q.cur - q.prev})</span>
                      </p>
                    </div>
                    <button onClick={next} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[10px] font-semibold text-sm text-white"
                      style={{ background: 'var(--p-blue)', boxShadow: '0 8px 20px -8px rgba(43,92,230,0.6)' }}>
                      {idx + 1 >= rounds.length ? 'Voir mon score' : 'Manche suivante'} <ArrowRight className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {/* ── DONE ── */}
          {phase === 'done' && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="p-card p-6 text-center">
              <Trophy className="w-8 h-8 mx-auto mb-2" style={{ color: gold }} />
              <p className="text-[11px] font-black uppercase tracking-widest mb-1" style={{ color: 'var(--p-text-40)' }}>Ton résultat</p>
              <p className="p-display text-4xl mb-1">{score}<span className="text-2xl" style={{ color: 'var(--p-text-40)' }}> / {ROUNDS}</span></p>
              <p className="p-body text-sm mb-5">Meilleure série : <b className="font-mono" style={{ color: '#C2410C' }}>{best} 🔥</b></p>

              {/* Mur d'inscription (accroche) — le vrai gating arrivera avec le mode essai */}
              <div className="rounded-xl p-4 mb-4" style={{ background: 'var(--p-blue-dim)', border: '0.5px solid var(--p-blue-border)' }}>
                <p className="p-body text-sm" style={{ color: 'var(--p-text)' }}>
                  Tu as joué en <b>mode découverte</b>. Crée ton compte (gratuit) pour <b>sauver ton score</b>, miser tes jetons et grimper au classement.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <button onClick={() => base44.auth.redirectToLogin()} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[10px] font-bold text-sm text-white"
                  style={{ background: 'var(--p-blue)', boxShadow: '0 8px 20px -8px rgba(43,92,230,0.6)' }}>
                  Créer mon compte <ArrowRight className="w-4 h-4" />
                </button>
                <button onClick={start} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[10px] font-semibold text-sm"
                  style={{ background: 'transparent', border: '0.5px solid var(--p-border-hover)', color: 'var(--p-text-60)' }}>
                  <RotateCcw className="w-4 h-4" /> Rejouer
                </button>
              </div>
              <div className="mt-4">
                <Link to={createPageUrl('Paris')} className="text-xs font-semibold" style={{ color: 'var(--p-blue)' }}>
                  Passer aux vrais paris →
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
