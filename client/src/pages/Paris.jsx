import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import { Info, ArrowRight } from 'lucide-react';
import CinematicHero, { HeroGold } from '@/components/knesset/CinematicHero';
import ConfettiBurst from '@/components/knesset/ConfettiBurst';
import LiveTicker from '@/components/knesset/LiveTicker';
import { useCampaignFlux } from '@/lib/useCampaignFlux';

const MISE_MIN = 10, MISE_MAX = 500, MISE_STEP = 10;

function MarketCard({ market, jetons, onPlaced, listeById, loggedIn }) {
  const [selected, setSelected] = useState(market.issues[0]?.id || null);
  const [mise, setMise] = useState(50);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [celebrate, setCelebrate] = useState(0);

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
      setCelebrate(c => c + 1);
      onPlaced?.();
    } catch (e) {
      setMsg({ ok: false, text: e?.message || 'Échec de la mise.' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl p-5 md:p-6" style={{ background: 'var(--p-card)', border: '0.5px solid var(--p-gold-border)', boxShadow: '0 14px 34px -24px rgba(212,175,55,0.5)' }}>
      <ConfettiBurst trigger={celebrate} />
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
          {loggedIn ? (
            <button
              onClick={place} disabled={!canBet || busy}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-[10px] font-semibold text-[15px] text-white transition-transform"
              style={{ background: canBet ? 'var(--p-blue)' : 'var(--p-text-25)', boxShadow: canBet ? '0 8px 20px -8px rgba(43,92,230,0.6)' : 'none', cursor: canBet ? 'pointer' : 'not-allowed' }}
            >
              {busy ? 'Envoi…' : 'Placer ma mise'} <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => base44.auth.redirectToLogin()}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-[10px] font-semibold text-[15px] text-white transition-transform hover:-translate-y-0.5"
              style={{ background: 'var(--p-blue)', boxShadow: '0 8px 20px -8px rgba(43,92,230,0.6)' }}
            >
              Se connecter pour parier <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
        {mise > (jetons ?? 0) && <p className="text-xs mt-2" style={{ color: 'var(--p-red)' }}>Pas assez de jetons pour cette mise.</p>}
        {msg && <p className="text-xs mt-2" style={{ color: msg.ok ? 'var(--p-green)' : 'var(--p-red)' }}>{msg.text}</p>}
      </div>

      {/* Se renseigner : fiches des listes en jeu (marchés « rang ») */}
      {market.type === 'rang' && listeById && (
        <div className="mt-3 pt-3 flex items-center gap-x-3 gap-y-1 flex-wrap" style={{ borderTop: '0.5px dashed var(--p-border)' }}>
          <span className="text-[11px]" style={{ color: 'var(--p-text-40)' }}>Se renseigner :</span>
          {market.issues.map(iss => {
            const l = listeById.get(iss.match_value);
            return l ? (
              <Link key={iss.id} to={`${createPageUrl('Liste')}?slug=${l.slug}`} className="text-[11px] font-semibold hover:underline inline-flex items-center gap-1" style={{ color: 'var(--p-blue)' }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: l.color || '#6B7280' }} />{l.name_fr}
              </Link>
            ) : null;
          })}
        </div>
      )}
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

  // Marchés + cotes en temps réel : PUBLICS (visibles sans login).
  const { data: marchesData, refetch: refetchMarches, isLoading } = useQuery({
    queryKey: ['paris-marches'],
    queryFn: () => base44.paris.marches(),
  });
  const marches = marchesData?.marches || [];
  const jetons = progress?.jetons ?? null;

  // Listes, pour lier chaque issue d'un marché « rang » à sa fiche.
  const { data: listes = [] } = useQuery({
    queryKey: ['paris-listes'],
    queryFn: () => base44.entities.Liste.filter({ is_active: true }),
  });
  const listeById = new Map(listes.map(l => [l.id, l]));

  const onPlaced = () => { refetchJetons(); refetchMarches(); };
  const flux = useCampaignFlux();

  return (
    <div className="min-h-screen" style={{ background: 'transparent' }}>
      <CinematicHero
        registre="jeu"
        size="sm"
        photos={['/images/knesset-hero.jpg']}
        position="center 30%"
        badge={{ text: 'La campagne en direct', live: true }}
        kicker="Paris · cotes · événements · flux"
        title={<>Le <HeroGold>direct</HeroGold></>}
        subtitle="Le hub de la campagne minute par minute — sondages, cotes, événements. Parie sur tout ce qui bouge. 100 % en jetons gratuits, jamais d'argent : bien parier fait monter ton Score."
      />

      {/* Le flux en direct — même bandeau que la Home (faits réels) */}
      <LiveTicker items={flux} />

      <div className="max-w-3xl mx-auto px-4 py-8 p-glow-gold">
        <div className="p-reveal flex items-start gap-2 mb-6 text-xs rounded-lg p-3" style={{ background: 'var(--p-blue-dim)', border: '0.5px solid var(--p-border)', color: 'var(--p-text-40)' }}>
          <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: 'var(--p-blue)' }} />
          <p>La cote s'ouvre sur la probabilité des sondages puis bouge selon les mises de tous : parier tôt et à contre-courant paie plus. La cote est verrouillée à l'instant où tu mises.</p>
        </div>

        {user === false && (
          <div className="p-reveal rounded-xl border p-4 mb-4 flex items-center justify-between gap-3 flex-wrap" style={{ background: 'var(--p-gold-dim)', borderColor: 'var(--p-gold-border)' }}>
            <p className="text-sm" style={{ color: 'var(--p-text-60)' }}>Les cotes sont en direct ci-dessous. <b style={{ color: 'var(--p-text)' }}>Connecte-toi</b> pour recevoir tes jetons et parier.</p>
            <button onClick={() => base44.auth.redirectToLogin()} className="inline-flex items-center gap-2 px-4 py-2 rounded-[10px] font-semibold text-sm text-white flex-shrink-0" style={{ background: 'var(--p-blue)' }}>
              Se connecter <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">{[...Array(2)].map((_, i) => <div key={i} className="h-40 rounded-2xl animate-pulse" style={{ background: 'var(--p-border)' }} />)}</div>
        ) : marches.length === 0 ? (
          <div className="rounded-2xl border p-8 text-center text-sm" style={{ background: 'var(--p-card)', borderColor: 'var(--p-border)', color: 'var(--p-text-40)' }}>
            Aucun marché ouvert pour l'instant — reviens à la prochaine manche, après le prochain sondage.
          </div>
        ) : (
          <div className="space-y-4">
            {marches.map(m => <MarketCard key={m.id} market={m} jetons={jetons} onPlaced={onPlaced} listeById={listeById} loggedIn={!!user} />)}
          </div>
        )}

        <div className="p-reveal flex items-center justify-center gap-6 mt-10 pt-8 flex-wrap" style={{ borderTop: '0.5px solid var(--p-border)' }}>
          <Link to={createPageUrl('ReglesDuJeu')} className="text-sm hover:text-[var(--p-text)] transition-colors" style={{ color: 'var(--p-text-40)' }}>Règles du jeu</Link>
          <Link to={createPageUrl('Leaderboard')} className="text-sm hover:text-[var(--p-text)] transition-colors" style={{ color: 'var(--p-text-40)' }}>Classement</Link>
          <Link to={createPageUrl('Listes')} className="text-sm hover:text-[var(--p-text)] transition-colors" style={{ color: 'var(--p-text-40)' }}>Les listes</Link>
        </div>
      </div>
    </div>
  );
}
