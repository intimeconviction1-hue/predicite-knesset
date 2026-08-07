import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import { Users, Trophy, Plus, Share2, Check, Crown, LogOut, ArrowRight } from 'lucide-react';
import CinematicHero, { HeroGold } from '@/components/knesset/CinematicHero';
import ConfettiBurst from '@/components/knesset/ConfettiBurst';
import { createPageUrl } from '@/utils';
import { urlDePartage } from '@/lib/carte-partage';

// Longueur du code d'invitation — doit rester alignée avec CODE_LEN côté serveur
// (server/functions/ligues.js).
const CODE_LEN = 8;

// Ligues privées : jouer « contre ses potes ». Créer une ligue → un code court à
// partager ; rejoindre par code ; classement privé sur le score permanent. Pur
// jeu de points. Les données viennent de la fonction serveur `ligues` (réelles,
// jamais inventées) ; anonyme, on invite à se connecter.

export default function Ligues() {
  const [user, setUser] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [selected, setSelected] = useState(null);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const [celebrate, setCelebrate] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  // Deep link ?code=XXXX → préremplit le champ « rejoindre ».
  useEffect(() => {
    const c = searchParams.get('code');
    if (c) setCode(c.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, CODE_LEN));
  }, [searchParams]);

  const { data: mine, refetch: refetchMine, isLoading: loadingMine } = useQuery({
    queryKey: ['ligues-mine', user?.email],
    queryFn: () => base44.functions.invoke('ligues', { action: 'mine' }),
    enabled: !!user?.email,
  });

  const { data: board, isLoading: loadingBoard } = useQuery({
    queryKey: ['ligue-board', selected, user?.email],
    queryFn: () => base44.functions.invoke('ligues', { action: 'leaderboard', ligue_id: selected }),
    enabled: !!selected && !!user?.email,
  });

  const ligues = mine?.ligues || [];

  async function handleCreate() {
    if (busy || name.trim().length < 2) return;
    setBusy(true); setMsg(null);
    try {
      const res = await base44.functions.invoke('ligues', { action: 'create', name: name.trim() });
      setName(''); setCelebrate(c => c + 1);
      setMsg({ ok: true, text: `Ligue « ${res.ligue.name} » créée ! Partage le code ${res.ligue.invite_code}.` });
      await refetchMine(); setSelected(res.ligue.id);
    } catch (e) { setMsg({ ok: false, text: e?.message || 'Échec de la création.' }); }
    finally { setBusy(false); }
  }

  async function handleJoin() {
    if (busy || code.length !== CODE_LEN) return;
    setBusy(true); setMsg(null);
    try {
      const res = await base44.functions.invoke('ligues', { action: 'join', code });
      setCode(''); setCelebrate(c => c + 1);
      setMsg({ ok: true, text: res.already ? `Tu es déjà dans « ${res.ligue.name} ».` : `Bienvenue dans « ${res.ligue.name} » !` });
      if (searchParams.get('code')) { searchParams.delete('code'); setSearchParams(searchParams, { replace: true }); }
      await refetchMine(); setSelected(res.ligue.id);
    } catch (e) { setMsg({ ok: false, text: e?.message || 'Code invalide.' }); }
    finally { setBusy(false); }
  }

  async function handleLeave(ligue_id) {
    setBusy(true); setMsg(null);
    try {
      await base44.functions.invoke('ligues', { action: 'leave', ligue_id });
      if (selected === ligue_id) setSelected(null);
      await refetchMine();
    } catch (e) { setMsg({ ok: false, text: e?.message || 'Échec.' }); }
    finally { setBusy(false); }
  }

  function copyInvite(inviteCode) {
    // `via=ligue` marque la provenance du clic pour le compteur d'audience, qui
    // ne pose ni cookie ni identifiant (voir server/routes/audience.js) : c'est
    // la seule façon de savoir si l'invitation entre amis ramène réellement du
    // monde. Le paramètre n'apparaît pas dans le canonical de la page, donc il
    // ne crée pas d'URL concurrente pour les moteurs.
    const url = urlDePartage(`${createPageUrl('Ligues')}?code=${inviteCode}`, 'ligue');
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  }

  const selectedLigue = ligues.find(l => l.id === selected);

  return (
    <div className="min-h-screen" style={{ background: 'transparent' }}>
      <ConfettiBurst trigger={celebrate} />

      <CinematicHero
        registre="jeu"
        size="sm"
        photos={['/images/listes-hero.jpg']}
        position="center 30%"
        kicker="Jeu de points · entre amis"
        title={<>Tes <HeroGold>ligues</HeroGold> privées</>}
        subtitle="Crée une ligue, invite tes amis avec un code, et comparez vos scores dans un classement rien qu'à vous."
      />

      <div className="max-w-3xl mx-auto px-4 py-8 p-glow-gold">
        {!user ? (
          <div className="p-reveal p-elev-1 rounded-2xl p-8 text-center" style={{ background: 'var(--p-card)', border: '0.5px solid var(--p-border)' }}>
            <Users className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--p-text-25)' }} />
            <h2 className="text-lg font-bold mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--p-text)' }}>Connecte-toi pour jouer entre amis</h2>
            <p className="text-sm mb-5" style={{ color: 'var(--p-text-60)' }}>Les ligues privées demandent un compte (gratuit) pour te classer.</p>
            <button onClick={() => base44.auth.redirectToLogin()} className="inline-flex items-center gap-2 px-6 py-3 rounded-[10px] font-semibold text-[15px] text-white transition-transform hover:-translate-y-0.5" style={{ background: 'var(--p-blue)', boxShadow: '0 10px 24px -8px rgba(43,92,230,0.6)' }}>
              Se connecter <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            {/* Créer / rejoindre */}
            <div className="p-reveal grid md:grid-cols-2 gap-4 mb-6">
              <div className="p-elev-1 rounded-2xl p-5" style={{ background: 'var(--p-card)', border: '0.5px solid var(--p-border)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <Plus className="w-4 h-4" style={{ color: 'var(--p-blue)' }} />
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--p-blue)' }}>Créer une ligue</span>
                </div>
                <input
                  value={name} onChange={e => setName(e.target.value)} maxLength={40}
                  placeholder="Nom de ta ligue (ex. Les Politologues)"
                  className="w-full px-3.5 py-2.5 rounded-[10px] text-sm mb-3 outline-none"
                  style={{ background: 'var(--p-bg)', border: '0.5px solid var(--p-border)', color: 'var(--p-text)' }}
                  onKeyDown={e => e.key === 'Enter' && handleCreate()}
                />
                <button onClick={handleCreate} disabled={busy || name.trim().length < 2}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-[10px] font-semibold text-sm text-white transition-transform hover:-translate-y-0.5"
                  style={{ background: name.trim().length >= 2 ? 'var(--p-blue)' : 'var(--p-text-25)', cursor: name.trim().length >= 2 ? 'pointer' : 'not-allowed' }}>
                  Créer la ligue
                </button>
              </div>

              <div className="p-elev-1 rounded-2xl p-5" style={{ background: 'var(--p-card)', border: '0.5px solid var(--p-gold-border)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4" style={{ color: 'var(--p-gold-text)' }} />
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--p-gold-text)' }}>Rejoindre par code</span>
                </div>
                <input
                  value={code} onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, CODE_LEN))}
                  placeholder={`Code à ${CODE_LEN} caractères`}
                  className="w-full px-3.5 py-2.5 rounded-[10px] text-sm mb-3 outline-none font-mono tracking-[0.3em]"
                  style={{ background: 'var(--p-bg)', border: '0.5px solid var(--p-border)', color: 'var(--p-text)' }}
                  onKeyDown={e => e.key === 'Enter' && handleJoin()}
                />
                <button onClick={handleJoin} disabled={busy || code.length !== CODE_LEN}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-[10px] font-semibold text-sm transition-transform hover:-translate-y-0.5"
                  style={{ background: code.length === CODE_LEN ? 'var(--p-gold-dim)' : 'transparent', color: 'var(--p-gold-text)', border: '0.5px solid var(--p-gold-border)', cursor: code.length === CODE_LEN ? 'pointer' : 'not-allowed' }}>
                  Rejoindre
                </button>
              </div>
            </div>

            {msg && (
              <p className="text-sm mb-5 text-center" style={{ color: msg.ok ? 'var(--p-green)' : 'var(--p-red)' }}>{msg.text}</p>
            )}

            {/* Mes ligues */}
            <h2 className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--p-text-40)' }}>Mes ligues</h2>
            {loadingMine ? (
              <div className="rounded-2xl h-20 animate-pulse mb-6" style={{ background: 'var(--p-border)' }} />
            ) : ligues.length === 0 ? (
              <div className="rounded-2xl p-8 text-center mb-6" style={{ background: 'var(--p-card)', border: '0.5px solid var(--p-border)' }}>
                <Trophy className="w-9 h-9 mx-auto mb-3" style={{ color: 'var(--p-text-25)' }} />
                <p className="font-semibold mb-1" style={{ color: 'var(--p-text-60)' }}>Tu n'as pas encore de ligue</p>
                <p className="text-sm" style={{ color: 'var(--p-text-40)' }}>Crée-en une et invite tes amis, ou rejoins-en une avec un code.</p>
              </div>
            ) : (
              <div className="p-reveal space-y-2 mb-6">
                {ligues.map(l => (
                  <button key={l.id} onClick={() => setSelected(selected === l.id ? null : l.id)}
                    className="w-full text-left rounded-2xl p-4 flex items-center justify-between gap-3 transition-colors"
                    style={{ background: 'var(--p-card)', border: `0.5px solid ${selected === l.id ? 'var(--p-blue)' : 'var(--p-border)'}` }}>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold truncate" style={{ fontFamily: 'var(--font-display)', color: 'var(--p-text)' }}>{l.name}</span>
                        {l.is_owner && <Crown className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--p-gold-text)' }} title="Tu es le créateur" />}
                      </div>
                      <span className="text-xs" style={{ color: 'var(--p-text-40)' }}>{l.member_count} membre{l.member_count > 1 ? 's' : ''} · code {l.invite_code}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--p-text-25)', transform: selected === l.id ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                  </button>
                ))}
              </div>
            )}

            {/* Classement de la ligue sélectionnée */}
            {selectedLigue && (
              <div className="p-reveal p-elev-2 rounded-2xl p-5" style={{ background: 'var(--p-card)', border: '0.5px solid var(--p-blue-border)' }}>
                <div className="p-tricolor mb-4"><div /><div /><div /></div>
                <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                  <div>
                    <h3 className="text-lg font-black" style={{ fontFamily: 'var(--font-display)', color: 'var(--p-text)' }}>{selectedLigue.name}</h3>
                    <span className="text-xs" style={{ color: 'var(--p-text-40)' }}>Classement privé · score permanent</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => copyInvite(selectedLigue.invite_code)}
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-[10px] font-semibold text-[13px] transition-transform hover:-translate-y-0.5"
                      style={{ background: 'var(--p-blue-dim)', color: 'var(--p-blue)', border: '0.5px solid var(--p-blue-border)' }}>
                      {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                      {copied ? 'Lien copié' : `Inviter · ${selectedLigue.invite_code}`}
                    </button>
                    <button onClick={() => handleLeave(selectedLigue.id)} title="Quitter la ligue"
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[10px] font-semibold text-[13px] transition-colors"
                      style={{ color: 'var(--p-red)', border: '0.5px solid var(--p-border)' }}>
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {loadingBoard ? (
                  <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-12 rounded-xl animate-pulse" style={{ background: 'var(--p-border)' }} />)}</div>
                ) : (
                  <div className="space-y-1.5">
                    {(board?.membres || []).map(m => (
                      <div key={m.rank} className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: m.is_you ? 'var(--p-blue-dim)' : 'var(--p-bg)', border: m.is_you ? '0.5px solid var(--p-blue-border)' : '0.5px solid transparent' }}>
                        <span className="font-mono font-bold text-sm w-6 text-center flex-shrink-0" style={{ color: m.rank === 1 ? 'var(--p-gold-text)' : 'var(--p-text-40)' }}>
                          {m.rank === 1 ? '★' : m.rank}
                        </span>
                        <span className="flex-1 font-semibold text-sm truncate" style={{ color: 'var(--p-text)' }}>
                          {m.name}{m.is_you && <span className="ml-1.5 text-xs" style={{ color: 'var(--p-blue)' }}>(toi)</span>}
                        </span>
                        <span className="text-[11px]" style={{ color: 'var(--p-text-40)' }}>{m.correct_predictions}/{m.predictions_count} justes</span>
                        <span className="font-mono font-bold text-sm w-16 text-right flex-shrink-0" style={{ color: 'var(--p-gold-text)' }}>{(m.score ?? 0).toLocaleString('fr-FR')}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
