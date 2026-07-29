import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Flame, Coins, ArrowRight } from 'lucide-react';
import QuizWidget from '@/components/knesset/QuizWidget';
import CinematicHero from '@/components/knesset/CinematicHero';
import { TITLES } from '@/lib/score';

// Les 6 thèmes du quiz-moteur (colonne `theme` en base — évolutif). Un widget
// par thème ; chaque widget s'efface tout seul s'il n'a pas encore de question.
const THEMES = [
  { key: 'systeme_electoral', title: 'Système électoral' },
  { key: 'partis', title: 'Les partis' },
  { key: 'histoire', title: 'Histoire de la Knesset' },
  { key: 'sondages_blocs', title: 'Sondages & blocs' },
  { key: 'personnalites', title: 'Personnalités' },
  { key: 'actu', title: 'Actu de la campagne' },
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
      <CinematicHero
        size="md"
        photos={['/images/learn-hero.jpg']}
        position="center 30%"
        kicker="Apprendre en s'amusant"
        title="Le quiz de la campagne"
        subtitle="Système électoral, histoire de la Knesset, actu. Choisis ta difficulté, chaque bonne réponse rapporte — et tente un défi série pour miser tes jetons."
      />

      <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
        {/* Les niveaux — la progression par Score, de Citoyen à Oracle. Chaque
            bonne réponse (plafonnée) et surtout tes pronostics/paris t'y font monter. */}
        <div className="rounded-2xl p-5" style={{ background: 'var(--p-card)', border: '0.5px solid var(--p-border)' }}>
          <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: 'var(--p-gold-text)' }}>Tes niveaux — de Citoyen à Oracle</p>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {TITLES.map((t, i) => (
              <React.Fragment key={t.label}>
                {i > 0 && <span className="flex-shrink-0" style={{ color: 'var(--p-text-25)' }}>→</span>}
                <div className="rounded-lg px-2.5 py-1.5 flex-shrink-0 text-center" style={{ background: `${t.color}12`, border: `1px solid ${t.color}40` }}>
                  <div className="text-xs font-black" style={{ color: t.color }}>{t.label}</div>
                  <div className="text-[9px] font-mono" style={{ color: 'var(--p-text-40)' }}>{t.min.toLocaleString('fr-FR')}+ pts</div>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>

        <DefiSerieCard />

        {THEMES.map(t => (
          <QuizWidget key={t.key} theme={t.key} title={t.title} />
        ))}

        <div className="flex items-center justify-center gap-2 pt-4 text-sm text-center" style={{ color: 'var(--p-text-40)' }}>
          <span>Envie d'aller plus loin ? <Link to={createPageUrl('Learn')} className="underline hover:opacity-80" style={{ color: 'var(--p-blue)' }}>Comprendre les législatives</Link>, <Link to={createPageUrl('Historique')} className="underline hover:opacity-80" style={{ color: 'var(--p-blue)' }}>l'Historique</Link> ou <Link to={createPageUrl('ReglesDuJeu')} className="underline hover:opacity-80" style={{ color: 'var(--p-blue)' }}>les règles du jeu</Link>.</span>
        </div>
      </div>
    </div>
  );
}
