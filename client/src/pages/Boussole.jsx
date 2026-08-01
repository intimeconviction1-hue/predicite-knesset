import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, ThumbsUp, ThumbsDown, Minus, RotateCcw, ArrowRight, Share2 } from 'lucide-react';
import { useGuestGate } from '@/lib/useGuestGate';
import TrialWall from '@/components/knesset/TrialWall';

// ⚠️ CONTENU VALIDÉ AVEC DAVID (2026-08) — positions des partis par affirmation.
// pour = plutôt d'accord, contre = plutôt contre, le reste = neutre.
const STATEMENTS = [
  { text: 'Benyamin Netanyahou doit rester Premier ministre.',
    pour: ['likoud', 'shas', 'judaisme-unifie-de-la-torah', 'otzma-yehudit', 'sionisme-religieux'],
    contre: ['yashar-gadi-eisenkot', 'les-democrates', 'yisrael-beytenou', 'yachad-bennett', 'les-reservistes-hendel-tropper', 'hadash-ta-al-liste-commune', 'ra-am', 'ensemble-bennett-lapid', 'unite-nationale'] },
  { text: 'La réforme judiciaire (affaiblir la Cour suprême) doit aboutir.',
    pour: ['likoud', 'otzma-yehudit', 'sionisme-religieux'],
    contre: ['yashar-gadi-eisenkot', 'les-democrates', 'yisrael-beytenou', 'yachad-bennett', 'les-reservistes-hendel-tropper', 'hadash-ta-al-liste-commune', 'ra-am', 'ensemble-bennett-lapid', 'unite-nationale'] },
  { text: "L'État doit s'appuyer davantage sur la loi religieuse juive (halakha).",
    pour: ['shas', 'judaisme-unifie-de-la-torah', 'sionisme-religieux', 'otzma-yehudit'],
    contre: ['yisrael-beytenou', 'les-democrates', 'yashar-gadi-eisenkot', 'hadash-ta-al-liste-commune', 'ra-am', 'ensemble-bennett-lapid', 'unite-nationale'] },
  { text: 'Les étudiants des yeshivot (Haredim) doivent rester exemptés de service militaire.',
    pour: ['shas', 'judaisme-unifie-de-la-torah'],
    contre: ['yisrael-beytenou', 'les-democrates', 'yashar-gadi-eisenkot', 'les-reservistes-hendel-tropper', 'ensemble-bennett-lapid', 'unite-nationale'] },
  { text: 'Il faut relancer des négociations de paix avec les Palestiniens.',
    pour: ['les-democrates', 'hadash-ta-al-liste-commune', 'ra-am'],
    contre: ['likoud', 'otzma-yehudit', 'sionisme-religieux', 'yachad-bennett'] },
  { text: 'Il faut étendre les implantations, voire annexer une partie de la Cisjordanie.',
    pour: ['sionisme-religieux', 'otzma-yehudit', 'likoud'],
    contre: ['les-democrates', 'hadash-ta-al-liste-commune', 'ra-am', 'yashar-gadi-eisenkot', 'ensemble-bennett-lapid', 'unite-nationale'] },
  { text: 'Les citoyens arabes doivent avoir pleine égalité et une place au gouvernement.',
    pour: ['hadash-ta-al-liste-commune', 'ra-am', 'les-democrates'],
    contre: ['otzma-yehudit', 'sionisme-religieux'] },
  { text: 'Face au Hamas et à l\'Iran, la fermeté sécuritaire prime sur tout.',
    pour: ['likoud', 'otzma-yehudit', 'sionisme-religieux', 'yisrael-beytenou', 'yachad-bennett', 'yashar-gadi-eisenkot', 'ensemble-bennett-lapid', 'unite-nationale'],
    contre: ['les-democrates', 'hadash-ta-al-liste-commune', 'ra-am'] },
  { text: 'Les partis ultra-orthodoxes ont trop d\'influence sur la vie quotidienne.',
    pour: ['yisrael-beytenou', 'les-democrates', 'yashar-gadi-eisenkot', 'ensemble-bennett-lapid'],
    contre: ['shas', 'judaisme-unifie-de-la-torah', 'sionisme-religieux'] },
  { text: "L'État doit moins intervenir dans l'économie (plus de libéralisme).",
    pour: ['likoud', 'yisrael-beytenou', 'les-reservistes-hendel-tropper', 'ensemble-bennett-lapid'],
    contre: ['les-democrates', 'hadash-ta-al-liste-commune', 'ra-am'] },
];

function computeMatches(answers, bySlug) {
  const slugs = new Set();
  STATEMENTS.forEach(s => { s.pour.forEach(x => slugs.add(x)); s.contre.forEach(x => slugs.add(x)); });
  const out = [];
  for (const slug of slugs) {
    const liste = bySlug[slug];
    if (!liste) continue;
    let agree = 0, disagree = 0;
    STATEMENTS.forEach((st, i) => {
      const ua = answers[i];
      if (!ua) return;
      const stance = st.pour.includes(slug) ? 1 : st.contre.includes(slug) ? -1 : 0;
      if (!stance) return;
      if (Math.sign(ua) === Math.sign(stance)) agree++; else disagree++;
    });
    const rel = agree + disagree;
    out.push({ slug, liste, pct: rel ? Math.round((agree / rel) * 100) : 0, rel });
  }
  return out.sort((a, b) => b.pct - a.pct || b.rel - a.rel);
}

export default function Boussole() {
  const gate = useGuestGate();
  const { data: listes = [] } = useQuery({ queryKey: ['bouss-listes'], queryFn: () => base44.entities.Liste.filter({ is_active: true }) });
  const bySlug = useMemo(() => Object.fromEntries(listes.map(l => [l.slug, l])), [listes]);

  const [phase, setPhase] = useState('intro');   // intro | play | done
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState([]);

  const start = () => {
    if (gate.blocked) { setPhase('intro'); return; }
    setAnswers([]); setIdx(0); setPhase('play');
  };
  const answer = (v) => {
    const na = [...answers]; na[idx] = v; setAnswers(na);
    if (idx + 1 >= STATEMENTS.length) { gate.record(); setPhase('done'); }
    else setIdx(idx + 1);
  };

  const matches = useMemo(() => (phase === 'done' ? computeMatches(answers, bySlug) : []), [phase, answers, bySlug]);
  const top = matches[0];
  const gold = 'var(--p-gold-text)';
  const st = STATEMENTS[idx];

  return (
    <div className="min-h-screen" style={{ background: 'transparent' }}>
      <div className="p-tricolor"><div /><div /><div /></div>
      <div className="max-w-xl mx-auto px-4 pt-8 pb-4 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-3" style={{ background: 'var(--p-gold-dim)', border: '0.5px solid var(--p-gold-border)' }}>
          <Compass className="w-3.5 h-3.5" style={{ color: gold }} />
          <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: gold }}>Jeu · mode découverte</span>
        </div>
        <h1 className="p-display text-3xl md:text-4xl mb-2">Quel parti te ressemble ?</h1>
        <p className="p-body text-sm max-w-md mx-auto">10 affirmations, tes réponses, et on te dit de quel parti tu es le plus proche. Aucun compte requis pour essayer.</p>
      </div>

      <div className="max-w-md mx-auto px-4 pb-16">
        <AnimatePresence mode="wait">
          {phase === 'intro' && (gate.blocked ? (
            <motion.div key="wall" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><TrialWall plays={gate.plays} /></motion.div>
          ) : (
            <motion.div key="intro" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-card p-6 text-center">
              <p className="p-body text-sm mb-5">Réponds franchement à chaque affirmation : <b>d'accord</b>, <b>neutre</b> ou <b>pas d'accord</b>. Pas de bonne réponse — juste toi 🧭</p>
              <button onClick={start} className="inline-flex items-center gap-2 px-6 py-3.5 rounded-[10px] font-bold text-[15px] transition-transform hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(180deg,#ffe08a,#D4AF37)', color: '#14203D', boxShadow: '0 14px 34px -12px rgba(212,175,55,0.6)' }}>
                Commencer <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          ))}

          {phase === 'play' && st && (
            <motion.div key={`q-${idx}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1 h-1.5 rounded-full overflow-hidden mr-3" style={{ background: 'var(--p-text-10)' }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${(idx / STATEMENTS.length) * 100}%`, background: 'var(--p-gold)' }} />
                </div>
                <span className="text-xs font-mono font-bold" style={{ color: 'var(--p-text-40)' }}>{idx + 1}/{STATEMENTS.length}</span>
              </div>
              <div className="p-card p-6 text-center min-h-[150px] flex items-center justify-center mb-4">
                <p className="p-title text-lg leading-snug">{st.text}</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => answer(-1)} className="flex flex-col items-center gap-1 py-3.5 rounded-xl transition-transform hover:-translate-y-0.5" style={{ background: 'var(--p-red-dim)', border: '0.5px solid rgba(200,16,46,0.3)' }}>
                  <ThumbsDown className="w-5 h-5" style={{ color: 'var(--p-red)' }} /><span className="text-[11px] font-bold" style={{ color: 'var(--p-red)' }}>Pas d'accord</span>
                </button>
                <button onClick={() => answer(0)} className="flex flex-col items-center gap-1 py-3.5 rounded-xl transition-transform hover:-translate-y-0.5" style={{ background: 'var(--p-night-2)', border: '0.5px solid var(--p-border)' }}>
                  <Minus className="w-5 h-5" style={{ color: 'var(--p-text-40)' }} /><span className="text-[11px] font-bold" style={{ color: 'var(--p-text-60)' }}>Neutre</span>
                </button>
                <button onClick={() => answer(1)} className="flex flex-col items-center gap-1 py-3.5 rounded-xl transition-transform hover:-translate-y-0.5" style={{ background: 'var(--p-green-dim)', border: '0.5px solid rgba(26,140,85,0.3)' }}>
                  <ThumbsUp className="w-5 h-5" style={{ color: 'var(--p-green)' }} /><span className="text-[11px] font-bold" style={{ color: '#16794A' }}>D'accord</span>
                </button>
              </div>
            </motion.div>
          )}

          {phase === 'done' && top && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="p-card p-6 text-center">
              <p className="text-[11px] font-black uppercase tracking-widest mb-2" style={{ color: 'var(--p-text-40)' }}>Ton parti le plus proche</p>
              <div className="inline-flex items-center gap-2.5 mb-1">
                <span className="w-4 h-4 rounded-full" style={{ background: top.liste.color || '#6B7280' }} />
                <span className="p-display text-2xl" style={{ color: top.liste.color || 'var(--p-text)' }}>{top.liste.name_fr}</span>
              </div>
              <p className="p-body text-sm mb-5"><b className="font-mono" style={{ color: 'var(--p-text)' }}>{top.pct}%</b> d'affinité sur tes réponses</p>

              <div className="space-y-2 mb-5 text-left">
                {matches.slice(0, 4).map((m, i) => (
                  <div key={m.slug} className="flex items-center gap-2">
                    <span className="text-xs w-36 shrink-0 truncate" style={{ color: 'var(--p-text-60)', fontWeight: i === 0 ? 700 : 400 }}>{m.liste.name_fr}</span>
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--p-text-10)' }}>
                      <div className="h-full rounded-full" style={{ width: `${m.pct}%`, background: m.liste.color || '#6B7280' }} />
                    </div>
                    <span className="text-xs font-mono font-bold w-10 text-right shrink-0" style={{ color: 'var(--p-text)' }}>{m.pct}%</span>
                  </div>
                ))}
              </div>

              <div className="rounded-xl p-3 mb-4" style={{ background: 'var(--p-blue-dim)', border: '0.5px solid var(--p-blue-border)' }}>
                <p className="p-body text-sm" style={{ color: 'var(--p-text)' }}>Crée ton compte pour <b>garder ton profil</b>, jouer et grimper au classement.</p>
              </div>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <button onClick={() => base44.auth.redirectToLogin()} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[10px] font-bold text-sm text-white" style={{ background: 'var(--p-blue)', boxShadow: '0 8px 20px -8px rgba(43,92,230,0.6)' }}>
                  Créer mon compte <ArrowRight className="w-4 h-4" />
                </button>
                <button onClick={start} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[10px] font-semibold text-sm" style={{ background: 'transparent', border: '0.5px solid var(--p-border-hover)', color: 'var(--p-text-60)' }}>
                  <RotateCcw className="w-4 h-4" /> Refaire
                </button>
              </div>
              <p className="text-[10px] mt-4" style={{ color: 'var(--p-text-25)' }}>Résultat indicatif, basé sur 10 affirmations. Ni un conseil de vote, ni une position de PrédiCité.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
