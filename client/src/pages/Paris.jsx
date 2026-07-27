import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ChevronRight, Coins, TrendingUp, Info, ArrowRight } from 'lucide-react';

const MISE_MIN = 10, MISE_MAX = 500, MISE_STEP = 10;

function MarketCard({ market, jetons, onPlaced }) {
  const [selected, setSelected] = useState(market.issues[0]?.id || null);
  const [mise, setMise] = useState(50);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const issue = market.issues.find(i => i.id === selected);
  const cote = issue?.cote || 0;
  const gain = Math.round(mise * cote);
  const canBet = issue && mise <= (jetons ?? 0) && mise >= MISE_MIN;

  async function place() {
    if (!canBet || busy) return;
    setBusy(true); setMsg(null);
    try {
      const res = await base44.functions.invoke('parisSondages', { action: 'placerMise', issue_id: selected, mise });
      setMsg({ ok: true, text: `Mise placée à ${res.cote} — gain potentiel ${res.gain_pot} jetons.` });
      onPlaced?.();
    } catch (e) {
      setMsg({ ok: false, text: e?.message || 'Échec de la mise.' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl p-5 md:p-6" style={{ background: 'var(--p-card)', border: '0.5px solid var(--p-gold-border)', boxShadow: '0 14px 34px -24px rgba(212,175,55,0.5)' }}>
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {market.type === 'evenement'
          ? <span className="p-badge p-badge-blue">Événement</span>
          : <span className="p-badge p-badge-gold">Sondage</span>}
        <span className="text-xs" style={{ color: 'var(--p-text-40)' }}>
          {market.type === 'evenement' ? 'résolu quand l\'événement a lieu' : 'résolu au prochain sondage'}
        </span>
      </div>
      <h3 className="text-lg font-bold mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--p-text)' }}>{market.question}</h3>

      {/* issues avec cotes */}
      <div className="grid gap-2.5" style={{ gridTemplateColumns: `repeat(${Math.min(market.issues.length, 2)}, minmax(0,1fr))` }}>
        {market.issues.map(iss => {
          const sel = iss.id === selected;
          return (
            <button
              key={iss.id}
              onClick={() => setSelected(iss.id)}
              className="text-left rounded-xl px-3.5 py-3 transition-colors"
              style={{
                background: sel ? 'var(--p-blue-dim)' : 'var(--p-card)',
                border: `0.5px solid ${sel ? 'var(--p-blue)' : 'var(--p-border)'}`,
              }}
            >
              <div className="text-xs font-semibold mb-1 truncate" style={{ color: 'var(--p-text-60)' }}>{iss.label}</div>
              <div className="font-mono font-bold text-2xl leading-none" style={{ color: sel ? 'var(--p-blue)' : 'var(--p-text)' }}>
                {iss.cote.toFixed(2)}<span className="text-xs font-semibold" style={{ color: 'var(--p-text-40)' }}> ×</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* widget de mise */}
      <div className="mt-4 pt-4" style={{ borderTop: '0.5px dashed var(--p-border)' }}>
        <div className="flex items-center justify-between text-xs mb-2" style={{ color: 'var(--p-text-60)' }}>
          <span>Ta mise</span>
          <span className="font-mono" style={{ color: 'var(--p-text)' }}>{mise} jetons</span>
        </div>
        <input
          type="range" min={MISE_MIN} max={Math.max(MISE_MIN, Math.min(MISE_MAX, jetons ?? MISE_MAX))} step={MISE_STEP}
          value={mise} onChange={e => setMise(Number(e.target.value))}
          className="w-full" style={{ accentColor: 'var(--p-blue)' }}
        />
        <div className="flex items-center justify-between mt-3 gap-3 flex-wrap">
          <div>
            <div className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--p-text-40)' }}>Gain potentiel</div>
            <div className="font-mono font-bold text-2xl leading-none" style={{ color: 'var(--p-green)' }}>{gain}</div>
          </div>
          <button
            onClick={place} disabled={!canBet || busy}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-[10px] font-semibold text-[15px] text-white transition-transform"
            style={{ background: canBet ? 'var(--p-blue)' : 'var(--p-text-25)', boxShadow: canBet ? '0 8px 20px -8px rgba(43,92,230,0.6)' : 'none', cursor: canBet ? 'pointer' : 'not-allowed' }}
          >
            {busy ? 'Envoi…' : 'Placer ma mise'} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        {mise > (jetons ?? 0) && <p className="text-xs mt-2" style={{ color: 'var(--p-red)' }}>Pas assez de jetons pour cette mise.</p>}
        {msg && <p className="text-xs mt-2" style={{ color: msg.ok ? 'var(--p-green)' : 'var(--p-red)' }}>{msg.text}</p>}
      </div>
    </div>
  );
}

export default function Paris() {
  const [user, setUser] = useState(null);
  useEffect(() => { base44.auth.me().then(setUser).catch(() => setUser(false)); }, []);

  // Dotation hebdo + solde de jetons (la fonction crédite si nouvelle semaine et renvoie le progress).
  const { data: progress, refetch: refetchJetons } = useQuery({
    queryKey: ['paris-jetons', user?.email],
    queryFn: () => base44.functions.invoke('parisSondages', { action: 'ensureJetons' }),
    enabled: !!user?.email,
  });

  const { data: marchesData, refetch: refetchMarches, isLoading } = useQuery({
    queryKey: ['paris-marches', user?.email],
    queryFn: () => base44.functions.invoke('parisSondages', { action: 'listMarches' }),
    enabled: !!user?.email,
  });
  const marches = marchesData?.marches || [];
  const jetons = progress?.jetons ?? null;

  const onPlaced = () => { refetchJetons(); refetchMarches(); };

  return (
    <div className="min-h-screen" style={{ background: 'transparent' }}>
      {/* Hero clair */}
      <div className="relative overflow-hidden">
        <div className="p-tricolor"><div /><div /><div /></div>
        <div className="absolute inset-x-0 top-0 h-[340px] pointer-events-none" style={{
          background: 'radial-gradient(ellipse 70% 100% at 50% 0%, rgba(212,175,55,0.16), transparent 62%)',
        }} />
        <div className="relative max-w-3xl mx-auto px-4 py-12 md:py-14">
          <div className="flex items-center gap-2 text-sm mb-6" style={{ color: 'var(--p-text-40)' }}>
            <Link to={createPageUrl('Home')} className="hover:text-[var(--p-text)] transition-colors">Accueil</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span style={{ color: 'var(--p-text-60)' }} aria-current="page">Paris sur sondages</span>
          </div>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4" style={{ color: 'var(--p-gold-text)' }} />
                <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--p-gold-text)' }}>Jeu de points · gratuit</p>
              </div>
              <motion.h1
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
                className="text-3xl md:text-5xl font-black leading-tight"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--p-text)', letterSpacing: '-0.02em' }}
              >
                Parie sur les sondages
              </motion.h1>
            </div>
            {jetons != null && (
              <div className="rounded-xl px-4 py-3 text-center" style={{ background: 'var(--p-gold-dim)', border: '0.5px solid var(--p-gold-border)' }}>
                <div className="flex items-center gap-1.5 justify-center">
                  <Coins className="w-4 h-4" style={{ color: 'var(--p-gold-text)' }} />
                  <span className="font-mono font-bold text-2xl leading-none" style={{ color: 'var(--p-gold-text)' }}>{jetons.toLocaleString('fr-FR')}</span>
                </div>
                <div className="text-[10px] uppercase tracking-wide mt-1" style={{ color: 'var(--p-text-40)' }}>jetons</div>
              </div>
            )}
          </div>
          <p className="text-base md:text-lg leading-relaxed max-w-2xl mt-4" style={{ color: 'var(--p-text-60)' }}>
            Mise tes jetons sur ce que diront les prochains sondages. Plus une issue est improbable, plus la cote paie. Résolution à chaque nouveau sondage. C'est gratuit — que des points, jamais d'argent.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-start gap-2 mb-6 text-xs rounded-lg p-3" style={{ background: 'var(--p-blue-dim)', border: '0.5px solid var(--p-border)', color: 'var(--p-text-40)' }}>
          <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: 'var(--p-blue)' }} />
          <p>La cote s'ouvre sur la probabilité des sondages puis bouge selon les mises de tous : parier tôt et à contre-courant paie plus. La cote est verrouillée à l'instant où tu mises.</p>
        </div>

        {user === false ? (
          <div className="rounded-2xl border p-8 text-center" style={{ background: 'var(--p-card)', borderColor: 'var(--p-border)' }}>
            <p className="text-sm mb-4" style={{ color: 'var(--p-text-60)' }}>Connecte-toi pour recevoir tes jetons et parier.</p>
            <button onClick={() => base44.auth.redirectToLogin()} className="inline-flex items-center gap-2 px-6 py-3 rounded-[10px] font-semibold text-[15px] text-white" style={{ background: 'var(--p-blue)' }}>
              Se connecter <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : isLoading ? (
          <div className="space-y-3">{[...Array(2)].map((_, i) => <div key={i} className="h-40 rounded-2xl animate-pulse" style={{ background: 'var(--p-border)' }} />)}</div>
        ) : marches.length === 0 ? (
          <div className="rounded-2xl border p-8 text-center text-sm" style={{ background: 'var(--p-card)', borderColor: 'var(--p-border)', color: 'var(--p-text-40)' }}>
            Aucun marché ouvert pour l'instant — reviens à la prochaine manche, après le prochain sondage.
          </div>
        ) : (
          <div className="space-y-4">
            {marches.map(m => <MarketCard key={m.id} market={m} jetons={jetons} onPlaced={onPlaced} />)}
          </div>
        )}

        <div className="flex items-center justify-center gap-6 mt-10 pt-8 flex-wrap" style={{ borderTop: '0.5px solid var(--p-border)' }}>
          <Link to={createPageUrl('ReglesDuJeu')} className="text-sm hover:text-[var(--p-text)] transition-colors" style={{ color: 'var(--p-text-40)' }}>Règles du jeu</Link>
          <Link to={createPageUrl('Leaderboard')} className="text-sm hover:text-[var(--p-text)] transition-colors" style={{ color: 'var(--p-text-40)' }}>Classement</Link>
          <Link to={createPageUrl('Listes')} className="text-sm hover:text-[var(--p-text)] transition-colors" style={{ color: 'var(--p-text-40)' }}>Les listes</Link>
        </div>
      </div>
    </div>
  );
}
