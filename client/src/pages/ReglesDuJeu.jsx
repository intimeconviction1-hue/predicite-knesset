import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { BarChart3, Target, Trophy, Vote, Crown, ChevronRight, Info, Landmark, PieChart, Flame } from 'lucide-react';
import QuizWidget from '@/components/knesset/QuizWidget';

const SCORING_RULES = [
  { label: 'Siège exact pour une liste', pts: '+150', desc: 'Le nombre de sièges pronostiqué correspond exactement au résultat.' },
  { label: 'Écart de ±1 siège', pts: '+100', desc: 'Votre pronostic est à un siège près du résultat final.' },
  { label: 'Écart de ±3 sièges', pts: '+50', desc: 'Votre pronostic est à trois sièges près du résultat final.' },
  { label: 'Seuil électoral correctement anticipé', pts: '+30', desc: 'Vous aviez bien anticipé qu\'une liste franchirait — ou non — les 3,25 %.' },
  { label: 'Bloc majoritaire anticipé', pts: '+50', desc: 'Vous aviez identifié le bon camp (coalition ≥ 61 sièges, ou opposition).' },
  { label: 'Premier ministre correct', pts: '+100', desc: 'La personnalité pronostiquée est effectivement investie Premier ministre.' },
  { label: 'Défi quotidien', pts: '+20', desc: 'Répondre au quiz ou au signal du jour.' },
  { label: 'Série de 7 jours consécutifs', pts: '+75', desc: 'Bonus de régularité pour 7 jours d\'activité d\'affilée.' },
];

const BADGES = [
  { icon: Target, color: '#2B5CE6', label: 'Analyste Précis', desc: 'Première liste pronostiquée à ±1 siège près.' },
  { icon: Landmark, color: '#7A5F1A', label: 'Politologue', desc: 'Quiz système électoral et formation de coalition réussis.' },
  { icon: Crown, color: '#6D28D9', label: 'Faiseur de rois', desc: 'Pronostic Premier ministre correct.' },
  { icon: PieChart, color: '#16794A', label: 'Data Citoyen', desc: '5 quiz complétés avec succès.' },
  { icon: Flame, color: '#C2410C', label: 'Série enflammée', desc: '7 jours d\'activité consécutifs.' },
];

const STEPS = [
  {
    id: 'comprendre',
    icon: BarChart3,
    num: '01',
    label: 'COMPRENDRE',
    color: '#2B5CE6',
    title: 'Comprendre le scrutin avant de pronostiquer',
    description: 'La Knesset se vote à la proportionnelle nationale, liste contre liste, avec un seuil de 3,25 %. Deux modules expliquent le mécanisme (répartition des sièges, accords d\'excédents) et la formation du gouvernement qui suit — c\'est la base pour un pronostic sensé, pas une case à cocher avant de jouer.',
    tips: [
      'Consultez la fiche de chaque liste : sièges sortants, tendance des derniers sondages.',
      'Repérez les listes proches du seuil de 3,25 % — c\'est souvent là que ça se joue.',
      'Suivez les signaux de campagne (fusions, accords d\'excédents, désistements).',
    ],
    link: createPageUrl('Listes'),
    linkLabel: 'Explorer les listes →',
  },
  {
    id: 'anticiper',
    icon: Target,
    num: '02',
    label: 'ANTICIPER',
    color: '#7A5F1A',
    title: 'Soumettre vos pronostics',
    description: 'Pour chaque liste, pronostiquez un nombre de sièges. Ajoutez, si vous le souhaitez, un pronostic Premier ministre, qui se résout séparément — plus tard, à l\'investiture. Vous pouvez modifier vos pronostics jusqu\'à la deadline.',
    tips: [
      'Le pronostic sièges se clôture juste avant le scrutin du 27 octobre.',
      'Le pronostic Premier ministre se verrouille à la même date, mais se résout à l\'investiture.',
      'Modifier son pronostic est autorisé tant que la deadline n\'est pas passée.',
    ],
    link: createPageUrl('PremierMinistre'),
    linkLabel: 'Pronostic Premier ministre →',
  },
  {
    id: 'comparer',
    icon: Trophy,
    num: '03',
    label: 'COMPARER',
    color: '#16794A',
    title: 'Monter au classement',
    description: 'Après les résultats officiels, vos pronostics sont automatiquement scorés. Votre indice citoyen combine précision sièges (35 %), précision Premier ministre (15 %), apprentissage (30 %) et régularité (20 %).',
    tips: [
      'L\'indice citoyen est calculé sur 100 pts.',
      'Le volet Premier ministre pèse moins : c\'est plus proche du pari que de l\'analyse électorale.',
      'Comparez-vous à la communauté francophone dans le classement général.',
    ],
    link: createPageUrl('Leaderboard'),
    linkLabel: 'Voir le classement →',
  },
];

export default function ReglesDuJeu() {
  return (
    <div className="min-h-screen" style={{ background: 'transparent' }}>

      <div className="relative overflow-hidden">
        <div className="absolute inset-0" style={{
          backgroundImage: "url('/images/regles-hero.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }} />
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(180deg, rgba(5,10,24,0.35) 0%, rgba(5,10,24,0.55) 60%, var(--p-night) 100%)',
        }} />
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse at 85% 0%, rgba(212,175,55,0.15) 0%, transparent 55%)',
        }} />
        <div className="relative max-w-4xl mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex items-center gap-2 text-sm mb-6"
            style={{ color: 'rgba(245,240,232,0.4)' }}
          >
            <Link to={createPageUrl('Home')} className="hover:text-white transition-colors">Accueil</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span style={{ color: 'rgba(245,240,232,0.7)' }} aria-current="page">Règles du jeu</span>
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.06 }}
            className="text-xs font-bold uppercase tracking-[0.2em] mb-3"
            style={{ color: 'var(--p-gold)' }}
          >
            Comment ça marche
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.12 }}
            className="text-3xl md:text-4xl font-black mb-4 leading-tight"
            style={{ fontFamily: 'var(--font-display)', color: 'white' }}
          >
            Règles du jeu — Knesset 2026
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.18 }}
            className="text-base leading-relaxed max-w-2xl"
            style={{ color: 'rgba(245,240,232,0.6)' }}
          >
            PrédiCité est un jeu prédictif civique. Comprenez le scrutin proportionnel israélien, pronostiquez sièges et Premier ministre, comparez votre précision avec celle de la communauté francophone.
          </motion.p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-16">

        <section id="boucle">
          <h2 className="text-xl font-bold mb-8" style={{ fontFamily: 'var(--font-display)', color: 'var(--p-text)' }}>
            La boucle de jeu en 3 étapes
          </h2>
          <div className="space-y-4">
            {STEPS.map(({ id, icon: Icon, num, label, color, title, description, tips, link, linkLabel }, index) => (
              <motion.div
                key={id}
                id={id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-10%' }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
                whileHover={{ y: -2 }}
                className="rounded-2xl border p-6 md:p-8 transition-colors duration-300 hover:border-[var(--p-border-hover)]"
                style={{ background: 'var(--p-card)', borderColor: 'var(--p-border)' }}
              >
                <div className="flex items-start gap-5">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: color + '18', border: `1px solid ${color}30` }}>
                    <Icon className="w-5 h-5" style={{ color }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-black tracking-[0.2em] uppercase" style={{ fontFamily: "'JetBrains Mono',monospace", color }}>{num}</span>
                      <span className="text-[9px] font-bold tracking-[0.18em] uppercase px-2 py-0.5 rounded-full border" style={{ color, borderColor: color + '40', background: color + '12' }}>{label}</span>
                    </div>
                    <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--p-text)' }}>{title}</h3>
                    <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--p-text-60)' }}>{description}</p>
                    <ul className="space-y-1.5 mb-4">
                      {tips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--p-text-40)' }}>
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
                          {tip}
                        </li>
                      ))}
                    </ul>
                    <Link to={link} className="inline-flex items-center gap-1 text-sm font-semibold transition-colors hover:opacity-80" style={{ color }}>
                      {linkLabel}
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        <section id="points">
          <h2 className="text-xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--p-text)' }}>Calcul des points</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--p-text-40)' }}>Les points sièges sont attribués après les résultats officiels ; le point Premier ministre après l'investiture.</p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-10%' }}
            transition={{ duration: 0.4 }}
            className="rounded-2xl border overflow-hidden"
            style={{ borderColor: 'var(--p-border)' }}
          >
            <div className="grid grid-cols-[1fr_auto] text-xs font-bold uppercase tracking-wider px-5 py-3 border-b" style={{ background: 'var(--p-night-2)', borderColor: 'var(--p-border)', color: 'var(--p-text-25)' }}>
              <span>Action</span><span>Points</span>
            </div>
            {SCORING_RULES.map((rule, i) => (
              <div key={i} className="grid grid-cols-[1fr_auto] items-center px-5 py-4 border-b last:border-0" style={{ background: i % 2 === 0 ? 'var(--p-card)' : 'var(--p-night-2)', borderColor: 'var(--p-border)' }}>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--p-text)' }}>{rule.label}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--p-text-40)' }}>{rule.desc}</p>
                </div>
                <span className="text-sm font-black ml-8 tabular-nums" style={{ fontFamily: "'JetBrains Mono',monospace", color: 'var(--p-gold-text)' }}>{rule.pts}</span>
              </div>
            ))}
          </motion.div>
          <div className="flex items-start gap-2 mt-4 text-xs" style={{ color: 'var(--p-text-40)' }}>
            <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <p>Le pronostic Premier ministre est binaire (bon ou pas) et se résout séparément, potentiellement des semaines après le scrutin — voir la page dédiée pour le détail du mécanisme.</p>
          </div>
        </section>

        <section id="indice-citoyen">
          <h2 className="text-xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--p-text)' }}>L'indice citoyen</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--p-text-40)' }}>Score sur 100 pts qui mesure votre engagement civique global.</p>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { pct: '35%', label: 'Précision sièges', desc: 'Justesse de vos pronostics sièges par liste.', color: '#2B5CE6' },
              { pct: '15%', label: 'Précision PM', desc: 'Pronostic Premier ministre, une fois résolu.', color: '#6D28D9' },
              { pct: '30%', label: 'Apprentissage', desc: 'Quiz système électoral, coalition, signaux lus.', color: 'var(--p-gold-text)' },
              { pct: '20%', label: 'Régularité', desc: 'Streak quotidien et participation continue.', color: '#16794A' },
            ].map(({ pct, label, desc, color }, index) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-10%' }}
                transition={{ duration: 0.4, delay: index * 0.06 }}
                whileHover={{ y: -2 }}
                className="rounded-xl border p-5 transition-colors duration-300 hover:border-[var(--p-border-hover)]"
                style={{ background: 'var(--p-card)', borderColor: 'var(--p-border)' }}
              >
                <div className="text-3xl font-black mb-1" style={{ fontFamily: "'JetBrains Mono',monospace", color }}>{pct}</div>
                <div className="font-bold text-sm mb-1" style={{ color: 'var(--p-text)' }}>{label}</div>
                <div className="text-xs leading-relaxed" style={{ color: 'var(--p-text-40)' }}>{desc}</div>
              </motion.div>
            ))}
          </div>
        </section>

        <section id="quiz">
          <h2 className="text-xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--p-text)' }}>Testez-vous</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--p-text-40)' }}>Une question au hasard sur les règles, l'histoire ou l'actu — d'autres sur <Link to={createPageUrl('Quiz')} className="underline hover:opacity-80" style={{ color: 'var(--p-blue)' }}>la page Quiz</Link>.</p>
          <QuizWidget />
        </section>

        <section id="badges">
          <h2 className="text-xl font-bold mb-6" style={{ fontFamily: 'var(--font-display)', color: 'var(--p-text)' }}>Badges & récompenses</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            {BADGES.map(({ icon: Icon, color, label, desc }, index) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-10%' }}
                transition={{ duration: 0.4, delay: index * 0.06 }}
                whileHover={{ y: -2 }}
                className="flex items-start gap-3 rounded-xl border p-4 transition-colors duration-300 hover:border-[var(--p-border-hover)]"
                style={{ background: 'var(--p-card)', borderColor: 'var(--p-border)' }}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: color + '18', border: `1px solid ${color}30` }}
                >
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: 'var(--p-text)' }}>{label}</p>
                  <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--p-text-40)' }}>{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-10%' }}
          transition={{ duration: 0.4 }}
          className="rounded-2xl border p-8 text-center"
          style={{ background: 'rgba(30,58,138,0.08)', borderColor: 'var(--p-border)' }}
        >
          <p className="text-sm mb-2" style={{ color: 'var(--p-text-40)' }}>Prêt à commencer ?</p>
          <h3 className="text-2xl font-black mb-6" style={{ fontFamily: 'var(--font-display)', color: 'var(--p-text)' }}>
            Anticipez. Apprenez. Gagnez.
          </h3>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to={createPageUrl('Listes')} className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-85" style={{ background: 'linear-gradient(135deg,#1E3A8A,#2B5CE6)' }}>
              <Vote className="w-4 h-4" /> Explorer les listes
            </Link>
            <Link to={createPageUrl('PremierMinistre')} className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm border transition-colors hover:text-[var(--p-text)] hover:border-[var(--p-border-hover)]" style={{ borderColor: 'var(--p-border)', color: 'var(--p-text-60)' }}>
              <Crown className="w-4 h-4" /> Pronostic Premier ministre
            </Link>
          </div>
        </motion.section>

      </div>
    </div>
  );
}
