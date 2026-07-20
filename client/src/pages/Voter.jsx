import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Vote, ClipboardList, MapPin, CheckCircle2, Clock, ChevronRight,
  ExternalLink, HelpCircle, AlertTriangle, Lightbulb, ArrowRight,
  Calendar, Users, Building2, Star, X
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// ── Key dates ─────────────────────────────────────────────────────────────────
const KEY_DATES = [
  {
    date: '31 déc. 2025',
    label: 'Clôture des listes électorales',
    desc: 'Dernière date pour s\'inscrire en mairie ou sur service-public.fr',
    color: '#D92B2B',
    done: true,
  },
  {
    date: '6 mars 2026',
    label: 'Dernier délai procuration',
    desc: 'Limite pour établir une procuration de vote',
    color: '#E07B1A',
    done: false,
  },
  {
    date: '15 mars 2026',
    label: '1er tour des élections',
    desc: 'Bureaux de vote ouverts de 8h à 18h (20h dans les grandes villes)',
    color: '#034EA2',
    done: false,
  },
  {
    date: '22 mars 2026',
    label: '2e tour des élections',
    desc: 'Si aucune liste n\'a obtenu la majorité absolue au 1er tour',
    color: '#034EA2',
    done: false,
  },
];

// ── Steps ──────────────────────────────────────────────────────────────────────
const STEPS = [
  {
    num: '01',
    icon: ClipboardList,
    title: 'Vérifier votre inscription',
    color: '#034EA2',
    bg: 'rgba(3,78,162,0.12)',
    content: [
      'Rendez-vous sur **service-public.fr** → "Vérifier votre inscription sur les listes électorales"',
      'Vous aurez besoin de votre numéro national d\'électeur (sur votre carte électorale)',
      'Si vous n\'êtes pas inscrit(e), il était possible de le faire jusqu\'au 31 décembre 2025',
    ],
    cta: { label: 'Vérifier sur service-public.fr', url: 'https://www.service-public.fr/particuliers/vosdroits/N47' },
    alert: 'Les inscriptions pour 2026 sont closes. Pour les prochaines élections, inscrivez-vous avant le 31 décembre de l\'année précédente.',
  },
  {
    num: '02',
    icon: MapPin,
    title: 'Trouver votre bureau de vote',
    color: '#1A8C55',
    bg: 'rgba(26,140,85,0.12)',
    content: [
      'Votre bureau de vote est indiqué sur votre **carte électorale**',
      'Il est généralement situé dans votre quartier : école, salle des fêtes, mairie annexe...',
      'Vous pouvez aussi le retrouver en ligne via le service "Trouver son bureau de vote"',
    ],
    cta: { label: 'Trouver mon bureau de vote', url: 'https://www.service-public.fr/particuliers/vosdroits/F1Bureauvote' },
  },
  {
    num: '03',
    icon: Vote,
    title: 'Le jour du vote',
    color: '#D4A017',
    bg: 'rgba(212,160,23,0.12)',
    content: [
      '**Apportez** : carte d\'identité ou passeport en cours de validité + carte d\'électeur (conseillée)',
      'Récupérez les bulletins de vote dans l\'isoloir — ils sont fournis par l\'État',
      'Glissez votre bulletin dans l\'enveloppe officielle, puis dans l\'urne',
      'Signez la liste d\'émargement et faites tamponner votre carte électorale',
    ],
  },
  {
    num: '04',
    icon: Users,
    title: 'Voter par procuration',
    color: '#7C3AED',
    bg: 'rgba(124,58,237,0.12)',
    content: [
      'Si vous ne pouvez pas vous déplacer, vous pouvez donner procuration à un proche',
      'La personne doit être inscrite dans votre commune',
      'La demande se fait en commissariat, gendarmerie, ou en ligne via **maprocuration.gouv.fr**',
      'Délai limite : **6 mars 2026**',
    ],
    cta: { label: 'Établir une procuration', url: 'https://www.maprocuration.gouv.fr/' },
  },
];

// ── Quiz questions ─────────────────────────────────────────────────────────────
const QUIZ = [
  {
    q: 'À quel âge peut-on voter en France ?',
    opts: ['16 ans', '18 ans', '21 ans', '25 ans'],
    a: 1,
    expl: 'En France, le droit de vote est accordé à 18 ans, depuis la loi du 5 juillet 1974 (abaissement de la majorité).',
  },
  {
    q: 'Quelle pièce d\'identité est obligatoire pour voter ?',
    opts: ['La carte électorale seule', 'Le passeport ou CNI en cours de validité', 'Un justificatif de domicile', 'Le numéro de sécurité sociale'],
    a: 1,
    expl: 'Une pièce d\'identité officielle avec photo est obligatoire. La carte électorale n\'est pas suffisante seule.',
  },
  {
    q: 'Qu\'est-ce que le scrutin de liste à deux tours ?',
    opts: [
      'On vote deux fois le même jour',
      'Une liste gagnant +50% au 1er tour l\'emporte; sinon, on revote',
      'Chaque électeur vote pour deux candidats',
      'Il y a deux bulletins différents',
    ],
    a: 1,
    expl: 'Si une liste obtient la majorité absolue (>50%) au 1er tour, elle l\'emporte. Sinon, un 2e tour départage les listes ayant obtenu au moins 10%.',
  },
  {
    q: 'Dans quelle maison peut-on déposer une procuration ?',
    opts: ['N\'importe quelle mairie', 'Uniquement en mairie de sa commune', 'Commissariat, gendarmerie ou en ligne', 'Tribunal judiciaire'],
    a: 2,
    expl: 'La procuration se fait au commissariat, à la gendarmerie, ou via maprocuration.gouv.fr depuis 2022.',
  },
  {
    q: 'Les citoyens de l\'UE résidant en France peuvent-ils voter aux municipales ?',
    opts: ['Non, jamais', 'Oui, s\'ils sont inscrits sur les listes complémentaires', 'Oui, automatiquement', 'Seulement en étant naturalisé'],
    a: 1,
    expl: 'Les citoyens européens résidant en France peuvent voter aux élections municipales (et européennes) s\'ils s\'inscrivent sur les listes électorales complémentaires.',
  },
];

function QuizBlock() {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const q = QUIZ[current];

  const handleAnswer = (idx) => {
    if (selected !== null) return;
    setSelected(idx);
    if (idx === q.a) setScore(s => s + 1);
  };

  const next = () => {
    if (current + 1 >= QUIZ.length) {
      setDone(true);
    } else {
      setCurrent(c => c + 1);
      setSelected(null);
    }
  };

  const reset = () => { setCurrent(0); setSelected(null); setScore(0); setDone(false); };

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-8"
      >
        <div className="text-5xl mb-4">{score >= 4 ? '🏆' : score >= 3 ? '🎉' : '📚'}</div>
        <p className="text-white font-bold text-2xl mb-1">{score} / {QUIZ.length}</p>
        <p className="text-white/60 mb-6">
          {score >= 4 ? 'Excellent ! Vous maîtrisez le processus électoral.' :
           score >= 3 ? 'Bon score ! Quelques notions à revoir.' :
           'Revoyez les démarches pour bien préparer votre vote.'}
        </p>
        <button
          onClick={reset}
          className="px-6 py-2.5 rounded-xl bg-[#034EA2] hover:bg-[#023882] text-white text-sm font-semibold transition"
        >
          Recommencer
        </button>
      </motion.div>
    );
  }

  return (
    <div>
      {/* Progress */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-white/40 text-xs uppercase tracking-widest">Question {current + 1} / {QUIZ.length}</span>
        <span className="text-[#D4A017] text-xs font-bold">{score} bonne{score > 1 ? 's' : ''}</span>
      </div>
      <div className="w-full h-1 bg-white/10 rounded-full mb-6 overflow-hidden">
        <div className="h-full bg-[#034EA2] rounded-full transition-all" style={{ width: `${(current / QUIZ.length) * 100}%` }} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <p className="text-white font-semibold text-base mb-5 leading-snug">{q.q}</p>
          <div className="space-y-2.5 mb-4">
            {q.opts.map((opt, i) => {
              let cls = 'w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ';
              if (selected === null) {
                cls += 'border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-white/20';
              } else if (i === q.a) {
                cls += 'border-green-500 bg-green-500/15 text-green-300';
              } else if (i === selected && i !== q.a) {
                cls += 'border-red-500 bg-red-500/15 text-red-300';
              } else {
                cls += 'border-white/5 bg-white/3 text-white/30';
              }
              return (
                <button key={i} className={cls} onClick={() => handleAnswer(i)}>
                  <span className="font-mono text-xs mr-2 opacity-50">{['A', 'B', 'C', 'D'][i]}.</span>
                  {opt}
                </button>
              );
            })}
          </div>

          {selected !== null && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="bg-blue-900/40 border border-blue-700/30 rounded-xl p-3 mb-4 text-sm text-blue-200">
              <span className="font-bold text-blue-300">💡 </span>{q.expl}
            </motion.div>
          )}

          {selected !== null && (
            <button
              onClick={next}
              className="w-full py-2.5 rounded-xl bg-[#034EA2] hover:bg-[#023882] text-white text-sm font-semibold transition flex items-center justify-center gap-2"
            >
              {current + 1 < QUIZ.length ? 'Question suivante' : 'Voir mon score'} <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default function VoterPage() {
  const [activeStep, setActiveStep] = useState(0);

  const today = new Date();
  const election1 = new Date('2026-03-15');
  const daysLeft = Math.max(0, Math.ceil((election1 - today) / 86400000));

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#07122A] to-[#0d1f3c]">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="bg-[#034EA2] relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px,white 1px,transparent 0)', backgroundSize: '24px 24px' }} />
        <div className="relative max-w-5xl mx-auto px-4 py-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-2 mb-3">
              <Vote className="w-5 h-5 text-white/70" />
              <span className="text-white/50 text-sm uppercase tracking-widest font-semibold">Section</span>
              <span className="text-white/50 text-sm">·</span>
              <span className="text-white text-sm font-bold">Voter</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white mb-2"
              style={{ fontFamily: "'Space Grotesk','Outfit',sans-serif" }}>
              Préparez votre vote
            </h1>
            <p className="text-white/60 text-base max-w-xl">
              Tout ce qu'il faut savoir pour voter aux municipales 2026 — inscription, bureau de vote, procuration.
            </p>
          </motion.div>

          {/* Countdown banner */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mt-6 inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-sm"
          >
            <Clock className="w-5 h-5 text-[#D4A017]" />
            <div>
              <span className="font-mono font-black text-2xl text-white">{daysLeft}</span>
              <span className="text-white/60 text-sm ml-2">jours avant le 1er tour</span>
            </div>
            <div className="w-px h-6 bg-white/20" />
            <span className="text-white/50 text-sm">15 mars 2026</span>
          </motion.div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

        {/* ── Timeline dates clés ───────────────────────────────────────────── */}
        <section>
          <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#D4A017]" /> Dates clés
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {KEY_DATES.map((d, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-4 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-1 h-full rounded-l-2xl" style={{ backgroundColor: d.color }} />
                {d.done && (
                  <Badge className="absolute top-3 right-3 text-[9px] bg-white/10 text-white/40 border-0">Passé</Badge>
                )}
                <p className="font-mono text-xs font-bold mb-1" style={{ color: d.color }}>{d.date}</p>
                <p className="text-white font-semibold text-sm leading-tight mb-1">{d.label}</p>
                <p className="text-white/40 text-xs leading-relaxed">{d.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Main grid: Steps + Quiz ────────────────────────────────────────── */}
        <div className="grid lg:grid-cols-[1fr_380px] gap-6">

          {/* Steps */}
          <section>
            <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-[#4A7FD4]" /> Démarches étape par étape
            </h2>
            <div className="space-y-3">
              {STEPS.map((step, i) => {
                const Icon = step.icon;
                const isOpen = activeStep === i;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="rounded-2xl border overflow-hidden transition-colors"
                    style={{ borderColor: isOpen ? step.color + '50' : 'rgba(255,255,255,0.08)' }}
                  >
                    <button
                      onClick={() => setActiveStep(isOpen ? -1 : i)}
                      className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-white/5 transition"
                    >
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: step.bg, color: step.color }}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <span className="font-mono text-xs opacity-40 mr-2">{step.num}</span>
                        <span className="text-white font-semibold text-sm">{step.title}</span>
                      </div>
                      <ChevronRight
                        className="w-4 h-4 text-white/30 transition-transform shrink-0"
                        style={{ transform: isOpen ? 'rotate(90deg)' : 'none' }}
                      />
                    </button>

                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 pb-5 pt-1 space-y-3">
                            {step.alert && (
                              <div className="flex items-start gap-2 bg-red-900/30 border border-red-700/30 rounded-xl p-3 text-sm text-red-300">
                                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                                {step.alert}
                              </div>
                            )}
                            <ul className="space-y-2">
                              {step.content.map((line, j) => {
                                const parts = line.split(/\*\*(.*?)\*\*/g);
                                return (
                                  <li key={j} className="flex items-start gap-2 text-sm text-white/70">
                                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: step.color }} />
                                    <span>
                                      {parts.map((p, k) =>
                                        k % 2 === 1
                                          ? <strong key={k} className="text-white font-semibold">{p}</strong>
                                          : p
                                      )}
                                    </span>
                                  </li>
                                );
                              })}
                            </ul>
                            {step.cta && (
                              <a href={step.cta.url} target="_blank" rel="noopener noreferrer">
                                <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/8 hover:bg-white/12 border border-white/15 text-white text-xs font-semibold transition mt-2">
                                  {step.cta.label} <ExternalLink className="w-3 h-3" />
                                </button>
                              </a>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>

            {/* Why vote */}
            <div className="mt-6 bg-gradient-to-br from-[#1A3580]/50 to-[#034EA2]/30 border border-[#2B5CE6]/25 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-5 h-5 text-[#D4A017]" />
                <h3 className="text-white font-bold text-sm">Pourquoi votre vote compte ?</h3>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { icon: Building2, text: 'Les élus décident des écoles, transports, parcs, logements de votre quartier' },
                  { icon: Star, text: 'En 2020, certaines villes ont basculé avec moins de 50 voix d\'écart' },
                  { icon: Users, text: 'Plus de participation = une démocratie locale plus représentative' },
                  { icon: MapPin, text: 'Les décisions municipales impactent votre quotidien directement' },
                ].map(({ icon: Icon, text }, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-white/60">
                    <Icon className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#4A7FD4]" />
                    {text}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Quiz */}
          <section>
            <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-[#D4A017]" /> Quiz citoyen
            </h2>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 sticky top-20">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-xl bg-[#D4A017]/20 flex items-center justify-center">
                  <HelpCircle className="w-4 h-4 text-[#D4A017]" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">Testez vos connaissances</p>
                  <p className="text-white/40 text-xs">Processus de vote · 5 questions</p>
                </div>
              </div>
              <QuizBlock />
            </div>

            {/* Link to full quiz */}
            <div className="mt-3">
              <Link to={createPageUrl('Quiz')}>
                <button className="w-full py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/8 text-white/60 hover:text-white text-xs font-semibold transition flex items-center justify-center gap-2">
                  Plus de quiz sur les élections <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </Link>
            </div>
          </section>
        </div>

        {/* ── Official links ─────────────────────────────────────────────────── */}
        <section>
          <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            <ExternalLink className="w-5 h-5 text-white/40" /> Ressources officielles
          </h2>
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              { title: 'service-public.fr', desc: 'Inscription listes électorales, vérification, procuration', url: 'https://www.service-public.fr/particuliers/vosdroits/N47', color: '#034EA2' },
              { title: 'maprocuration.gouv.fr', desc: 'Établir une procuration de vote en ligne', url: 'https://www.maprocuration.gouv.fr/', color: '#1A8C55' },
              { title: 'elections.interieur.gouv.fr', desc: 'Résultats officiels et informations du ministère', url: 'https://elections.interieur.gouv.fr/', color: '#7C3AED' },
            ].map((link, i) => (
              <a key={i} href={link.url} target="_blank" rel="noopener noreferrer">
                <div className="group bg-white/5 border border-white/10 hover:border-white/20 rounded-2xl p-4 transition cursor-pointer">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: link.color }} />
                    <span className="text-white font-semibold text-sm group-hover:underline">{link.title}</span>
                    <ExternalLink className="w-3 h-3 text-white/30 ml-auto" />
                  </div>
                  <p className="text-white/40 text-xs leading-relaxed">{link.desc}</p>
                </div>
              </a>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}