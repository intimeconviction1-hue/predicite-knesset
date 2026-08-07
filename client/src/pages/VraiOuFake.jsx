import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Check, X, RotateCcw, ArrowRight, Trophy, Flame } from 'lucide-react';
import { useGuestGate } from '@/lib/useGuestGate';
import TrialWall from '@/components/knesset/TrialWall';
import GainMiniJeu from '@/components/knesset/GainMiniJeu';
import MiniJeuShell, { JaugeManche } from '@/components/knesset/MiniJeuShell';
import ShareScore from '@/components/knesset/ShareScore';

const ROUNDS = 7;

// Faits VÉRIFIÉS du système électoral israélien et de la campagne 2026.
// answer = true si l'affirmation est VRAIE. explain = éclairage pédagogique.
const FACTS = [
  { text: 'La Knesset compte 120 sièges.', answer: true, explain: '120 depuis 1949, en écho aux 120 membres de la Grande Assemblée antique.' },
  { text: 'Il faut 61 sièges pour former une majorité et gouverner.', answer: true, explain: 'La majorité absolue sur 120.' },
  { text: "Le seuil d'entrée à la Knesset est de 3,25 % des voix.", answer: true, explain: 'Relevé à 3,25 % en 2014 — il était plus bas auparavant.' },
  { text: 'Les Israéliens votent pour un député de leur ville ou de leur région.', answer: false, explain: 'Non : scrutin proportionnel, un seul district national. On vote pour une LISTE, pas un candidat local.' },
  { text: 'Le Premier ministre est élu au suffrage direct par les citoyens.', answer: false, explain: "Non : le président confie la formation du gouvernement au député capable de réunir 61 sièges. (L'élection directe a existé de 1996 à 2001, puis a été abolie.)" },
  { text: "Le président d'Israël a un rôle surtout cérémoniel.", answer: true, explain: 'Son pouvoir clé : désigner qui tentera de former le gouvernement.' },
  { text: 'Le vote est obligatoire en Israël.', answer: false, explain: "Il ne l'est pas — la participation est libre." },
  { text: 'Le jour du scrutin est un jour férié en Israël.', answer: true, explain: 'Pour faciliter la participation des électeurs.' },
  { text: "Un Israélien vivant à l'étranger peut voter par correspondance.", answer: false, explain: 'Sauf diplomates et personnels en mission, on doit voter en personne, sur le sol israélien.' },
  { text: "Un parti réunissant environ 10 % des voix obtient à peu près 12 sièges.", answer: true, explain: 'Proportionnelle : 10 % de 120 ≈ 12 sièges.' },
  { text: 'Le parti arrivé en tête forme automatiquement le gouvernement.', answer: false, explain: "Pas forcément : c'est celui capable de réunir 61 sièges, même s'il n'est pas le plus grand parti." },
  { text: 'Un parti arabe a déjà siégé dans une coalition gouvernementale israélienne.', answer: true, explain: 'Ra\'am est entré au gouvernement Bennett-Lapid en 2021 — une première historique.' },
  { text: "L'âge minimum pour voter est de 18 ans.", answer: true, explain: 'Comme dans la plupart des démocraties.' },
  { text: 'Depuis 2019, Israël a connu un seul scrutin législatif.', answer: false, explain: 'Au contraire : cinq élections entre 2019 et 2022, faute de coalition stable.' },
];

function pick() {
  return FACTS.slice().sort(() => Math.random() - 0.5).slice(0, ROUNDS);
}

export default function VraiOuFake() {
  const gate = useGuestGate();
  const [rounds, setRounds] = useState([]);
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [reveal, setReveal] = useState(null);
  const [phase, setPhase] = useState('intro');

  const q = rounds[idx];

  const start = () => {
    if (gate.blocked) { setPhase('intro'); return; }
    setRounds(pick()); setIdx(0); setScore(0); setStreak(0); setBest(0); setReveal(null); setPhase('play');
  };
  const answer = (guess) => {
    if (reveal || !q) return;
    const correct = guess === q.answer;
    setReveal({ correct });
    if (correct) { setScore(s => s + 1); setStreak(s => { const n = s + 1; setBest(b => Math.max(b, n)); return n; }); }
    else setStreak(0);
  };
  const next = () => {
    if (idx + 1 >= rounds.length) { gate.terminerPartie('vrai-ou-fake'); setPhase('done'); }
    else { setIdx(i => i + 1); setReveal(null); }
  };

  return (
    <MiniJeuShell
      icon={ShieldCheck}
      titre="Vrai ou Fake ?"
      chapo="Le système électoral israélien recèle des surprises. Sépare le vrai du faux — et apprends en jouant."
    >
        <AnimatePresence mode="wait">
          {phase === 'intro' && (gate.blocked ? (
            <motion.div key="wall" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><TrialWall plays={gate.plays} /></motion.div>
          ) : (
            <motion.div key="intro" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-card p-6 text-center">
              <p className="p-body text-sm mb-5">{ROUNDS} affirmations. Pour chacune, dis si c'est <b style={{ color: 'var(--p-green-text)' }}>vrai</b> ou <b style={{ color: 'var(--p-red)' }}>faux</b>. Explication à chaque fois.</p>
              <button onClick={start} className="p-btn-gold-solid gap-2 text-[15px]">
                Jouer <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          ))}

          {phase === 'play' && q && (
            <motion.div key={`q-${idx}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="flex items-center justify-between gap-3 mb-3">
                <JaugeManche valeur={idx} total={ROUNDS} label="Affirmations traitées" />
                <span className="inline-flex items-center gap-1 text-sm p-mono" style={{ color: streak > 0 ? 'var(--p-orange-text)' : 'var(--p-text-40)' }}>
                  <Flame className="w-4 h-4" /> {streak}
                  <span className="sr-only">série en cours</span>
                </span>
              </div>

              <div className="p-card p-6 text-center min-h-[140px] flex items-center justify-center mb-4">
                <p className="p-title text-lg leading-snug">{q.text}</p>
              </div>

              {!reveal ? (
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => answer(true)} className="flex flex-col items-center gap-1 py-4 rounded-xl transition-transform hover:-translate-y-0.5" style={{ background: 'var(--p-green-dim)', border: '0.5px solid var(--p-green-dim)', borderColor: 'rgba(26,140,85,0.3)' }}>
                    <Check className="w-6 h-6" style={{ color: 'var(--p-green-text)' }} /><span className="font-bold text-sm" style={{ color: 'var(--p-green-text)' }}>Vrai</span>
                  </button>
                  <button onClick={() => answer(false)} className="flex flex-col items-center gap-1 py-4 rounded-xl transition-transform hover:-translate-y-0.5" style={{ background: 'var(--p-red-dim)', border: '0.5px solid rgba(200,16,46,0.3)' }}>
                    <X className="w-6 h-6" style={{ color: 'var(--p-red)' }} /><span className="font-bold text-sm" style={{ color: 'var(--p-red)' }}>Fake</span>
                  </button>
                </div>
              ) : (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="rounded-xl py-4 px-4 mb-4" style={{ background: reveal.correct ? 'var(--p-green-dim)' : 'var(--p-red-dim)', border: `0.5px solid ${reveal.correct ? 'rgba(26,140,85,0.3)' : 'rgba(200,16,46,0.3)'}` }}>
                    <p className="font-bold text-sm mb-1" style={{ color: reveal.correct ? 'var(--p-green-text)' : 'var(--p-red)' }}>
                      {reveal.correct ? 'Correct !' : 'Raté !'} C'est <b>{q.answer ? 'VRAI' : 'FAUX'}</b>.
                    </p>
                    <p className="p-body text-sm" style={{ color: 'var(--p-text)' }}>{q.explain}</p>
                  </div>
                  <button onClick={next} className="p-btn-primary gap-2">
                    {idx + 1 >= rounds.length ? 'Voir mon score' : 'Suivant'} <ArrowRight className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}

          {phase === 'done' && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="p-card p-6 text-center">
              <Trophy className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--p-gold-text)' }} />
              <p className="text-[11px] font-black uppercase tracking-widest mb-1" style={{ color: 'var(--p-text-40)' }}>Ton résultat</p>
              <p className="p-display text-4xl mb-1">{score}<span className="text-2xl" style={{ color: 'var(--p-text-40)' }}> / {ROUNDS}</span></p>
              <p className="p-body text-sm mb-5">Meilleure série : <b className="font-mono" style={{ color: 'var(--p-orange-text)' }}>{best} 🔥</b></p>
              <GainMiniJeu gain={gate.gain} isGuest={gate.isGuest} />
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <button onClick={start} className="p-btn-ghost gap-2">
                  <RotateCcw className="w-4 h-4" /> Rejouer
                </button>
                <ShareScore
                  titre="Vrai ou Fake ?" kicker="PRÉDICITÉ · VRAI OU FAKE ?"
                  chemin="/VraiOuFake" via="vrai-ou-fake" nomFichier="mon-score-vrai-ou-fake.png"
                  score={score} total={ROUNDS} serie={best}
                  source="Affirmations sur le système électoral israélien, la Knesset et la campagne 2026"
                  defi={`${score} sur ${ROUNDS} à « Vrai ou Fake ? » sur la politique israélienne. Tu fais mieux ?`}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
    </MiniJeuShell>
  );
}
