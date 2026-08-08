import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import { Info, ArrowRight } from 'lucide-react';
import CinematicHero, { HeroGold } from '@/components/knesset/CinematicHero';
import CoteTile, { formatCote, formatProba } from '@/components/knesset/CoteTile';
import CourbeCote from '@/components/knesset/CourbeCote';
import RegleResolution from '@/components/knesset/RegleResolution';
import MesPositions from '@/components/knesset/MesPositions';
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
  // Une mise est IRRÉVERSIBLE et partait au premier clic, sans récapitulatif :
  // ni prévention d'erreur, ni contrôle, sur le second geste à enjeu du produit.
  // Un palier de confirmation s'intercale, qui rappelle les trois chiffres qui
  // comptent — combien, sur quoi, à quelle cote.
  const [aConfirmer, setAConfirmer] = useState(false);

  const issue = market.issues.find(i => i.id === selected);
  const cote = issue?.cote || 0;
  const gain = Math.round(mise * cote);
  // Deux instantanés au moins sur une même issue = la cote a bougé au moins une
  // fois, donc il y a une courbe à montrer.
  const aUneHistoire = market.issues.some(i => (i.historique || []).length >= 2);
  const canBet = issue && mise <= (jetons ?? 0) && mise >= MISE_MIN;
  const plafond = Math.max(MISE_MIN, Math.min(MISE_MAX, jetons ?? MISE_MAX));

  async function place() {
    if (!canBet || busy) return;
    setAConfirmer(false);
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
    <div className="p-card p-5 md:p-6" style={{ borderColor: 'var(--p-gold-border)' }}>
      <ConfettiBurst trigger={celebrate} />
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {market.type === 'evenement'
          ? <span className="p-badge p-badge-blue">Événement</span>
          : <span className="p-badge p-badge-gold">Sondage</span>}
        <span className="text-xs" style={{ color: 'var(--p-text-40)' }}>
          {market.type === 'evenement' ? 'résolu quand l\'événement a lieu' : 'résolu au prochain sondage'}
        </span>
      </div>
      <h3 className="p-title text-lg mb-4">{market.question}</h3>

      {/* Les cotes. Elles passent par <CoteTile>, la même brique que le terrain
          de jeu et le dos des cartes : une seule grammaire de cote sur tout le
          site, et le mouvement (▲/▼ + flash) offert par-dessus — jusqu'ici, une
          cote qui bougeait sous les yeux du joueur ne le signalait nulle part,
          alors que c'est exactement ce qui fait vivre un marché. */}
      <div className="grid gap-2.5" style={{ gridTemplateColumns: `repeat(${Math.min(market.issues.length, 2)}, minmax(0,1fr))` }}>
        {market.issues.map(iss => (
          <CoteTile
            key={iss.id}
            registre="clair"
            taille="lg"
            label={iss.label}
            cote={iss.cote}
            selected={iss.id === selected}
            onClick={() => { setSelected(iss.id); setAConfirmer(false); }}
          />
        ))}
      </div>

      {/* L'histoire du marché. Une cote seule ne dit que le présent ; la courbe
          dit d'où elle vient. Elle ne s'affiche qu'à partir de deux points
          réels : une ligne plate tracée sur un marché où personne n'a misé
          laisserait croire à une stabilité observée. */}
      {aUneHistoire ? (
        <div className="mt-4 pt-4" style={{ borderTop: '0.5px dashed var(--p-border)' }}>
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--p-text-40)' }}>
              Ce que le marché a pensé
            </span>
            <span className="text-[10px]" style={{ color: 'var(--p-text-40)' }}>
              {market.pool_total} jetons misés
            </span>
          </div>
          <CourbeCote issues={market.issues} />
        </div>
      ) : (
        <p className="text-[11px] mt-3" style={{ color: 'var(--p-text-40)' }}>
          Personne n’a encore misé sur ce marché : les probabilités sont celles des sondages, elles n’ont pas encore bougé.
        </p>
      )}

      {/* widget de mise */}
      <div className="mt-4 pt-4" style={{ borderTop: '0.5px dashed var(--p-border)' }}>
        <div className="flex items-center justify-between text-xs mb-2" style={{ color: 'var(--p-text-60)' }}>
          <span>Ta mise</span>
          <span className="font-mono" style={{ color: 'var(--p-text)' }}>{mise} jetons</span>
        </div>
        {/* Le curseur seul offrait 49 crans sur ~288px de piste, soit 5,9 px
            par cran : impossible à viser au pouce. Trois montants rapides et
            une saisie chiffrée le doublent. */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          {[25, 50, 100].filter(m => m <= plafond).map(m => (
            <button
              key={m}
              type="button"
              onClick={() => { setMise(m); setAConfirmer(false); }}
              aria-pressed={mise === m}
              className="px-3 h-11 rounded-lg text-sm font-semibold transition-colors"
              style={{
                background: mise === m ? 'var(--p-blue-dim)' : 'transparent',
                border: `0.5px solid ${mise === m ? 'var(--p-blue)' : 'var(--p-border-hover)'}`,
                color: mise === m ? 'var(--p-blue)' : 'var(--p-text-60)',
              }}
            >
              {m}
            </button>
          ))}
          <input
            type="number"
            min={MISE_MIN} max={plafond} step={MISE_STEP}
            inputMode="numeric"
            aria-label="Montant de ta mise, en jetons"
            value={mise}
            onChange={e => { setMise(Number(e.target.value)); setAConfirmer(false); }}
            className="w-20 h-11 px-2 rounded-lg bg-transparent border text-center text-sm outline-none focus:border-[var(--p-blue)]"
            style={{ borderColor: 'var(--p-border-hover)', color: 'var(--p-text)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}
          />
        </div>
        <input
          type="range" min={MISE_MIN} max={plafond} step={MISE_STEP}
          aria-label="Ajuster la mise au curseur"
          value={mise} onChange={e => { setMise(Number(e.target.value)); setAConfirmer(false); }}
          className="w-full" style={{ accentColor: 'var(--p-blue)' }}
        />
        <div className="flex items-center justify-between mt-3 gap-3 flex-wrap">
          <div>
            <div className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--p-text-40)' }}>Gain potentiel</div>
            <div className="p-mono text-2xl leading-none" style={{ color: 'var(--p-green-text)' }}>{gain}</div>
          </div>
          {loggedIn ? (
            !aConfirmer ? (
              <button
                onClick={() => setAConfirmer(true)} disabled={!canBet || busy}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-[10px] font-semibold text-[15px] text-white transition-transform"
                style={{ background: canBet ? 'var(--p-blue)' : 'var(--p-text-25)', boxShadow: canBet ? 'var(--p-shadow-blue)' : 'none', cursor: canBet ? 'pointer' : 'not-allowed' }}
              >
                Placer ma mise <ArrowRight className="w-4 h-4" />
              </button>
            ) : null
          ) : (
            <button
              onClick={() => base44.auth.redirectToLogin()}
              className="p-btn-primary gap-2 text-[15px]"
            >
              Se connecter pour parier <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Récapitulatif : les trois chiffres qu'on regrette de ne pas avoir vus
            après coup — combien, sur quoi, à quelle cote. */}
        {aConfirmer && (
          <div className="mt-3 rounded-xl px-4 py-3" style={{ background: 'var(--p-blue-dim)', border: '0.5px solid var(--p-blue-border)' }}>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--p-text)' }}>
              Tu mises <b className="p-mono">{mise}</b> jetons sur «&nbsp;{issue?.label}&nbsp;»,
              que le marché donne à <b className="p-mono">{formatProba(cote)}</b> (cote <b className="p-mono">×{formatCote(cote)}</b>)
              → gain potentiel <b className="p-mono" style={{ color: 'var(--p-green-text)' }}>{gain}</b>.
            </p>
            <p className="text-[11px] mt-1" style={{ color: 'var(--p-text-40)' }}>
              La cote est verrouillée à cet instant. Une mise ne s'annule pas.
            </p>
            <div className="flex items-center gap-2 mt-3">
              <button onClick={place} disabled={busy} className="p-btn-primary gap-2">
                {busy ? 'Envoi…' : 'Confirmer la mise'}
              </button>
              <button onClick={() => setAConfirmer(false)} disabled={busy} className="p-btn-ghost">
                Annuler
              </button>
            </div>
          </div>
        )}

        {/* Uniquement pour qui a un solde. Un visiteur non connecté a `jetons`
            à null : la comparaison le déclarait « pas assez de jetons » alors
            qu'il n'a pas encore de compte — un reproche adressé à quelqu'un qui
            n'a rien fait de mal, sous un bouton qui lui propose de se
            connecter. */}
        {loggedIn && mise > (jetons ?? 0) && (
          <p role="alert" className="text-xs mt-2" style={{ color: 'var(--p-red)' }}>Pas assez de jetons pour cette mise.</p>
        )}
        {/* Le retour d'une mise était un <p> de 12px sous le bouton pendant que
            les confettis occupaient tout l'écran : la célébration criait,
            l'information chuchotait. */}
        {msg && (
          <div
            role="status"
            className="mt-3 rounded-xl px-4 py-2.5 text-sm font-semibold"
            style={{
              background: msg.ok ? 'var(--p-green-dim)' : 'var(--p-red-dim)',
              border: `0.5px solid ${msg.ok ? 'rgba(26,140,85,0.3)' : 'rgba(200,16,46,0.3)'}`,
              color: msg.ok ? 'var(--p-green-text)' : 'var(--p-red)',
            }}
          >
            {msg.text}
          </div>
        )}
      </div>

      {/* La règle du jeu, publiée. Elle vivait dans le serveur (resolver_kind,
          resolver_args) et voyageait déjà dans la charge utile de l'API sans
          jamais être montrée : le site créditait chaque sondage mais taisait la
          règle qui décide qui gagne. */}
      <div className="mt-4 pt-3" style={{ borderTop: '0.5px dashed var(--p-border)' }}>
        <RegleResolution market={market} listeById={listeById} />
      </div>

      {/* Se renseigner : fiches des listes en jeu (marchés « rang ») */}
      {market.type === 'rang' && listeById && (
        <div className="mt-3 pt-3 flex items-center gap-x-3 gap-y-1 flex-wrap" style={{ borderTop: '0.5px dashed var(--p-border)' }}>
          <span className="text-[11px]" style={{ color: 'var(--p-text-40)' }}>Se renseigner :</span>
          {market.issues.map(iss => {
            const l = listeById.get(iss.match_value);
            return l ? (
              <Link key={iss.id} to={`${createPageUrl('Liste')}?slug=${l.slug}`} className="text-[11px] font-semibold hover:underline inline-flex items-center gap-1" style={{ color: 'var(--p-blue)' }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: l.color || 'var(--p-text-25)' }} />{l.name_fr}
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

  // Une mise change trois choses d'un coup : le solde, les cotes du marché, et
  // la liste de ses propres paris. Le compteur force la troisième à se recharger
  // (elle n'a pas de refetch propre, elle vit dans son composant).
  const [rafraichissement, setRafraichissement] = useState(0);
  const onPlaced = () => { refetchJetons(); refetchMarches(); setRafraichissement(n => n + 1); };
  const flux = useCampaignFlux();

  return (
    <div className="min-h-screen" style={{ background: 'transparent' }}>
      {/* La lumière rasante de fin de journée va avec le voile ambré du registre
          Jeu ; le plein midi de l'ancienne photo le contredisait. */}
      <CinematicHero
        registre="jeu"
        size="sm"
        photos={['/images/knesset-soir.webp']}
        position="center 46%"
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
          {/* Le pourcentage n'est pas une seconde façon de dire la cote : c'est
              la MÊME grandeur, et le lecteur doit pouvoir le vérifier lui-même.
              D'où la division écrite en toutes lettres. */}
          <p>
            Le pourcentage, c’est ce que le marché croit ; la cote, c’est ce que ça paie —
            l’un est l’inverse de l’autre&nbsp;: <b style={{ color: 'var(--p-text-60)' }}>1 ÷ 1,54 = 65 %</b>.
            Chaque cote s’ouvre sur la probabilité des sondages puis bouge selon les mises de tous : parier tôt
            et à contre-courant paie plus. Ta cote est verrouillée à l’instant où tu mises.
          </p>
        </div>

        {/* Mes paris — au-dessus des marchés : quand on revient, la première
            question n'est pas « sur quoi miser ? » mais « où en est ma mise ? ». */}
        <MesPositions actif={!!user} cleRafraichissement={rafraichissement} />

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
