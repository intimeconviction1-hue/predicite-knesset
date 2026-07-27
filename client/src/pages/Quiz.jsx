import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ChevronRight, Brain, Flame, Coins, ArrowRight } from 'lucide-react';
import QuizWidget from '@/components/knesset/QuizWidget';

const CATEGORIES = [
  { key: 'regles', title: 'Règles du jeu' },
  { key: 'historique', title: 'Historique' },
  { key: 'actualite', title: 'Actualité 2026' },
];

const OBJECTIFS = [
  { n: 3, mult: 2 },
  { n: 5, mult: 4 },
  { n: 10, mult: 10 },
];

function DefiSerieCard() {
  const [user, setUser] = useState(null);
  const [objectif, setObjectif] = useState(5);
  const [mise, setMise] = useState(50);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const qc = useQueryClient();

  useEffect(() => { base44.auth.me().then(setUser).catch(() => setUser(false)); }, []);

  const { data: defi } = useQuery({
    queryKey: ['defi-serie', user?.email],
    queryFn: () => base44.functions.invoke('defiSerie', { action: 'get' }),
    enabled: !!user?.email,
  });

  const actif = defi?.statut === 'en_cours';
  const jetons = defi?.jetons ?? null;

  async function start() {
    if (busy) return;
    setBusy(true); setErr(null);
    try {
      await base44.functions.invoke('defiSerie', { action: 'start', objectif, mise });
      qc.invalidateQueries({ queryKey: ['defi-serie'] });
    } catch (e) {
      setErr(e?.message || 'Impossible de lancer le défi.');
    } finally { setBusy(false); }
  }

  if (user === false) {
    return (
      <div className="rounded-2xl p-5" style={{ background: 'var(--p-card)', border: '0.5px solid var(--p-gold-border)' }}>
        <div className="flex items-center gap-2 mb-1"><Flame className="w-4 h-4" style={{ color: 'var(--p-gold-text)' }} /><span className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--p-text)' }}>Défi série</span></div>
        <p className="text-sm" style={{ color: 'var(--p-text-40)' }}>Connecte-toi pour miser tes jetons sur une série de bonnes réponses.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-5 md:p-6" style={{ background: 'var(--p-card)', border: '0.5px solid var(--p-gold-border)', boxShadow: '0 14px 34px -24px rgba(212,175,55,0.5)' }}>
      <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5" style={{ color: 'var(--p-gold-text)' }} />
          <h3 className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--p-text)' }}>Défi série</h3>
        </div>
        {jetons != null && (
          <span className="inline-flex items-center gap-1.5 text-sm font-mono font-bold" style={{ color: 'var(--p-gold-text)' }}>
            <Coins className="w-4 h-4" />{jetons.toLocaleString('fr-FR')}
          </span>
        )}
      </div>

      {actif ? (
        <div>
          <p className="text-sm mb-3" style={{ color: 'var(--p-text-60)' }}>
            Enchaîne <b style={{ color: 'var(--p-text)' }}>{defi.objectif}</b> bonnes réponses pour remporter <b style={{ color: 'var(--p-green)' }}>{defi.gain_pot} jetons</b>. Une erreur et ta mise ({defi.mise}) est perdue.
          </p>
          <div className="h-2.5 rounded-full overflow-hidden mb-2" style={{ background: 'var(--p-text-10)' }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${(defi.progres / defi.objectif) * 100}%`, background: 'var(--p-gold)' }} />
          </div>
          <p className="text-xs font-mono" style={{ color: 'var(--p-text-40)' }}>{defi.progres} / {defi.objectif} bonnes réponses · réponds ci-dessous pour avancer</p>
        </div>
      ) : (
        <div>
          <p className="text-sm mb-4" style={{ color: 'var(--p-text-40)' }}>Mise des jetons sur une série de bonnes réponses d'affilée. Plus la série est longue, plus ça paie.</p>
          <div className="flex gap-2 mb-4">
            {OBJECTIFS.map(o => {
              const sel = o.n === objectif;
              return (
                <button key={o.n} onClick={() => setObjectif(o.n)} className="flex-1 rounded-xl py-2.5 text-center transition-colors"
                  style={{ background: sel ? 'var(--p-blue-dim)' : 'transparent', border: `0.5px solid ${sel ? 'var(--p-blue)' : 'var(--p-border)'}` }}>
                  <div className="font-mono font-bold text-lg leading-none" style={{ color: sel ? 'var(--p-blue)' : 'var(--p-text)' }}>{o.n}</div>
                  <div className="text-[10px] mt-1" style={{ color: 'var(--p-text-40)' }}>gagne ×{o.mult}</div>
                </button>
              );
            })}
          </div>
          <div className="flex items-center justify-between text-xs mb-1" style={{ color: 'var(--p-text-60)' }}>
            <span>Ta mise</span>
            <span className="font-mono" style={{ color: 'var(--p-text)' }}>{mise} → gain {mise * (OBJECTIFS.find(o => o.n === objectif)?.mult || 1)}</span>
          </div>
          <input type="range" min={20} max={Math.max(20, Math.min(300, jetons ?? 300))} step={10} value={mise} onChange={e => setMise(Number(e.target.value))} className="w-full mb-3" style={{ accentColor: 'var(--p-blue)' }} />
          <button onClick={start} disabled={busy} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[10px] font-semibold text-sm text-white" style={{ background: 'var(--p-blue)', boxShadow: '0 8px 20px -8px rgba(43,92,230,0.6)' }}>
            {busy ? 'Envoi…' : 'Lancer le défi'} <ArrowRight className="w-4 h-4" />
          </button>
          {err && <p className="text-xs mt-2" style={{ color: 'var(--p-red)' }}>{err}</p>}
        </div>
      )}
    </div>
  );
}

export default function Quiz() {
  return (
    <div className="min-h-screen" style={{ background: 'transparent' }}>
      <div className="relative overflow-hidden">
        <div className="p-tricolor"><div /><div /><div /></div>
        <div className="absolute inset-x-0 top-0 h-[340px] pointer-events-none" style={{
          background: 'radial-gradient(ellipse 70% 100% at 50% 0%, rgba(212,175,55,0.16), transparent 62%)',
        }} />
        <div className="relative max-w-4xl mx-auto px-4 py-12 md:py-14">
          <div className="flex items-center gap-2 text-sm mb-6" style={{ color: 'var(--p-text-40)' }}>
            <Link to={createPageUrl('Home')} className="hover:text-[var(--p-text)] transition-colors">Accueil</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span style={{ color: 'var(--p-text-60)' }} aria-current="page">Quiz</span>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-4 h-4" style={{ color: 'var(--p-gold-text)' }} />
            <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--p-gold-text)' }}>Apprendre en s'amusant</p>
          </div>
          <motion.h1
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
            className="text-3xl md:text-5xl font-black mb-4 leading-tight"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--p-text)', letterSpacing: '-0.02em' }}
          >
            Quiz Knesset 2026
          </motion.h1>
          <p className="text-base md:text-lg leading-relaxed max-w-2xl" style={{ color: 'var(--p-text-60)' }}>
            Règles du scrutin, histoire des Knesset, actualité de la campagne. Choisis ta difficulté, chaque bonne réponse rapporte — et tente un défi série pour miser tes jetons.
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
        <DefiSerieCard />

        {CATEGORIES.map(c => (
          <QuizWidget key={c.key} category={c.key} title={c.title} />
        ))}

        <div className="flex items-center justify-center gap-2 pt-4 text-sm text-center" style={{ color: 'var(--p-text-40)' }}>
          <span>Envie d'aller plus loin ? <Link to={createPageUrl('Learn')} className="underline hover:opacity-80" style={{ color: 'var(--p-blue)' }}>Comprendre les législatives</Link>, <Link to={createPageUrl('Historique')} className="underline hover:opacity-80" style={{ color: 'var(--p-blue)' }}>l'Historique</Link> ou <Link to={createPageUrl('ReglesDuJeu')} className="underline hover:opacity-80" style={{ color: 'var(--p-blue)' }}>les règles du jeu</Link>.</span>
        </div>
      </div>
    </div>
  );
}
