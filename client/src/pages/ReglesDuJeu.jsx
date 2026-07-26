import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { BarChart3, Target, Trophy, Vote, Crown, ChevronRight, Info, Landmark, PieChart, Flame, Zap, TrendingUp, Coins, ArrowRight } from 'lucide-react';
import QuizWidget from '@/components/knesset/QuizWidget';

// Barème EXACT, aligné sur le code serveur (server/functions/*) :
//  - engagement pronostic : 10 (+50 si justification ≥20 car.)  [prediciteScoringSieges]
//  - quiz : 10/bonne réponse  [quizScoring]
//  - streak : 75 tous les 7 jours  [miscFunctions]
//  - dépouillement sièges : 150 / 100 / 50, +30 seuil, +50 majorité  [prediciteScoringSieges]
//  - Premier ministre : 100  [resolvePremierMinistre]

// Ce qu'on gagne TOUT DE SUITE, pendant la campagne.
const POINTS_ENGAGEMENT = [
  { label: 'Pronostiquer les sièges d\'une liste', pts: '+10', desc: 'Pour chaque liste sur laquelle tu déposes un pronostic. Modifiable jusqu\'à la clôture.' },
  { label: 'Justifier ton pronostic', pts: '+50', desc: 'Ajoute une justification d\'au moins 20 caractères à ton pronostic.' },
  { label: 'Bonne réponse à un quiz', pts: '+10', desc: 'Chaque question compte une fois — il y en a des dizaines : règles, histoire, actu.' },
  { label: '7 jours d\'activité d\'affilée', pts: '+75', desc: 'Bonus de régularité versé automatiquement tous les 7 jours. Le compteur 🔥 apparaît dès le 2e jour.' },
];

// Ce qui se joue AU DÉPOUILLEMENT, une fois le résultat officiel connu.
const POINTS_RESULTAT = [
  { label: 'Sièges exacts d\'une liste', pts: '+150', desc: 'Ton nombre de sièges correspond pile au résultat.' },
  { label: 'À ±1 siège près', pts: '+100', desc: 'Tu tombes à un siège près du résultat final.' },
  { label: 'À ±3 sièges près', pts: '+50', desc: 'Tu tombes à trois sièges près.' },
  { label: 'Seuil bien anticipé', pts: '+30', desc: 'Tu avais bien vu qu\'une liste franchirait — ou non — les 3,25 %.' },
  { label: 'Majorité bien anticipée', pts: '+50', desc: 'Tu avais identifié le bon scénario : coalition ≥ 61 sièges, ou non.' },
  { label: 'Premier ministre correct', pts: '+100', desc: 'La personnalité pronostiquée est effectivement investie — résolu à l\'investiture, parfois des semaines après.' },
];

// Les 4 sources de points qui composent ton total (pas une formule pondérée cachée :
// le classement additionne simplement tout ce que tu gagnes).
const SOURCES = [
  { max: 'jusqu\'à +150', unit: '/ liste', label: 'Précision sièges', desc: 'Le cœur du jeu : la justesse de tes pronostics au dépouillement.', color: '#2B5CE6', icon: Target },
  { max: '+100', unit: 'à l\'investiture', label: 'Premier ministre', desc: 'Un pronostic binaire qui se résout séparément.', color: '#6D28D9', icon: Crown },
  { max: '+10', unit: '/ bonne réponse', label: 'Quiz', desc: 'Apprends le système électoral et l\'histoire, gagne des points.', color: 'var(--p-gold-text)', icon: PieChart },
  { max: '+75', unit: '/ 7 jours', label: 'Régularité', desc: 'Reviens chaque jour : la série est récompensée.', color: '#16794A', icon: Flame },
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
    id: 'comprendre', icon: BarChart3, num: '01', label: 'COMPRENDRE', color: '#2B5CE6',
    title: 'Comprendre le scrutin avant de pronostiquer',
    description: 'La Knesset se vote à la proportionnelle nationale, liste contre liste, avec un seuil de 3,25 %. Deux modules expliquent le mécanisme (répartition des sièges, accords d\'excédents) et la formation du gouvernement qui suit — la base pour un pronostic sensé.',
    tips: [
      'Consulte la fiche de chaque liste : sièges sortants, tendance des derniers sondages.',
      'Repère les listes proches du seuil de 3,25 % — c\'est souvent là que ça se joue.',
      'Suis les signaux de campagne (fusions, accords d\'excédents, désistements).',
    ],
    link: createPageUrl('Listes'), linkLabel: 'Explorer les listes →',
  },
  {
    id: 'anticiper', icon: Target, num: '02', label: 'ANTICIPER', color: '#7A5F1A',
    title: 'Déposer tes pronostics',
    description: 'Pour chaque liste, pronostique un nombre de sièges — tu gagnes des points d\'engagement dès maintenant. Ajoute, si tu veux, un pronostic Premier ministre, qui se résout séparément à l\'investiture. Tout est modifiable jusqu\'à la clôture.',
    tips: [
      'Le pronostic sièges se clôture juste avant le scrutin du 27 octobre.',
      'Le pronostic Premier ministre se verrouille à la même date, mais se résout plus tard.',
      'Justifier ton pronostic (≥ 20 caractères) rapporte un bonus d\'engagement.',
    ],
    link: createPageUrl('PremierMinistre'), linkLabel: 'Pronostic Premier ministre →',
  },
  {
    id: 'comparer', icon: Trophy, num: '03', label: 'COMPARER', color: '#16794A',
    title: 'Monter au classement',
    description: 'Ton score, c\'est le total de tes points : engagement pendant la campagne, puis précision au dépouillement. Après les résultats officiels, tes pronostics sièges sont re-scorés automatiquement selon leur justesse, et ton rang se fige.',
    tips: [
      'Pas de formule cachée : chaque point gagné s\'ajoute à ton total.',
      'La précision sièges est le plus gros levier (jusqu\'à +150 par liste).',
      'Compare-toi à la communauté francophone dans le classement général.',
    ],
    link: createPageUrl('Leaderboard'), linkLabel: 'Voir le classement →',
  },
];

function PointsTable({ title, subtitle, rows, accentIcon: AccentIcon, accentColor }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <AccentIcon className="w-4 h-4" style={{ color: accentColor }} />
        <h3 className="text-base font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--p-text)' }}>{title}</h3>
      </div>
      <p className="text-sm mb-4" style={{ color: 'var(--p-text-40)' }}>{subtitle}</p>
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--p-border)' }}>
        {rows.map((rule, i) => (
          <div key={i} className="grid grid-cols-[1fr_auto] items-center px-5 py-4 border-b last:border-0"
            style={{ background: i % 2 === 0 ? 'var(--p-card)' : 'var(--p-night-2)', borderColor: 'var(--p-border)' }}>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--p-text)' }}>{rule.label}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--p-text-40)' }}>{rule.desc}</p>
            </div>
            <span className="text-sm font-black ml-8 tabular-nums" style={{ fontFamily: "'JetBrains Mono',monospace", color: 'var(--p-gold-text)' }}>{rule.pts}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ReglesDuJeu() {
  return (
    <div className="min-h-screen" style={{ background: 'transparent' }}>

      {/* Hero — thème clair unifié (fin du yo-yo sombre), liseré tricolore + halo doré */}
      <div className="relative overflow-hidden">
        <div className="p-tricolor"><div /><div /><div /></div>
        <div className="absolute inset-x-0 top-0 h-[360px] pointer-events-none" style={{
          background: 'radial-gradient(ellipse 70% 100% at 50% 0%, rgba(212,175,55,0.16), transparent 62%)',
        }} />
        <div className="relative max-w-4xl mx-auto px-4 py-14">
          <div className="flex items-center gap-2 text-sm mb-6" style={{ color: 'var(--p-text-40)' }}>
            <Link to={createPageUrl('Home')} className="hover:text-[var(--p-text)] transition-colors">Accueil</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span style={{ color: 'var(--p-text-60)' }} aria-current="page">Règles du jeu</span>
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] mb-3" style={{ color: 'var(--p-gold-text)' }}>
            Comment ça marche
          </p>
          <motion.h1
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
            className="text-3xl md:text-5xl font-black mb-4 leading-tight"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--p-text)', letterSpacing: '-0.02em' }}
          >
            Les règles, en clair
          </motion.h1>
          <p className="text-base md:text-lg leading-relaxed max-w-2xl" style={{ color: 'var(--p-text-60)' }}>
            PrédiCité est un jeu de pronostics gratuit. Tu prédis la composition de la Knesset, tu gagnes des points en jouant et au dépouillement, et tu grimpes au classement. Voici exactement comment les points se gagnent.
          </p>
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
                key={id} id={id}
                initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-10%' }} transition={{ duration: 0.4, delay: index * 0.08 }}
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

        {/* Barème réel, en deux temps */}
        <section id="points" className="space-y-8">
          <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--p-text)' }}>Comment se gagnent les points</h2>

          <PointsTable
            title="Pendant la campagne — tout de suite"
            subtitle="Ces points font vivre ton classement dès aujourd'hui, avant même les résultats."
            rows={POINTS_ENGAGEMENT}
            accentIcon={Zap}
            accentColor="var(--p-gold-text)"
          />

          <PointsTable
            title="Au dépouillement — la précision"
            subtitle="Le soir du scrutin, tes pronostics sièges sont re-scorés selon leur justesse réelle."
            rows={POINTS_RESULTAT}
            accentIcon={Trophy}
            accentColor="#16794A"
          />

          {/* Exemple chiffré — comme MPP, on montre plutôt que d'expliquer */}
          <div className="rounded-2xl border p-6" style={{ background: 'var(--p-blue-dim)', borderColor: 'var(--p-blue-border)' }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--p-blue)' }}>Exemple</p>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--p-text-60)' }}>
              Tu pronostiques le <b style={{ color: 'var(--p-text)' }}>Likoud à 23 sièges</b> et tu justifies ton choix : <b style={{ color: 'var(--p-gold-text)' }}>+10</b> (pronostic) <b style={{ color: 'var(--p-gold-text)' }}>+50</b> (justification) tout de suite.
              Le soir du scrutin, le Likoud obtient <b style={{ color: 'var(--p-text)' }}>24</b> → tu es à un siège près : <b style={{ color: 'var(--p-gold-text)' }}>+100</b>, et tu avais bien vu qu\'il franchit le seuil : <b style={{ color: 'var(--p-gold-text)' }}>+30</b>.
              Rien que sur cette liste, tu bâtis <b style={{ color: 'var(--p-text)' }}>130 points de précision</b>. Multiplie par les 13 listes, ajoute le bonus majorité et le Premier ministre : voilà ton score.
            </p>
          </div>

          <div className="flex items-start gap-2 text-xs" style={{ color: 'var(--p-text-40)' }}>
            <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <p>Le pronostic Premier ministre est binaire (correct ou non) et se résout séparément, parfois des semaines après le scrutin, à l\'investiture du gouvernement — voir la page dédiée.</p>
          </div>
        </section>

        {/* Le classement : la vérité (points cumulés), pas d'indice fantôme */}
        <section id="classement">
          <h2 className="text-xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--p-text)' }}>Comment on te classe</h2>
          <p className="text-sm mb-6 max-w-2xl" style={{ color: 'var(--p-text-40)' }}>
            Tes points s'accumulent selon le barème ci-dessus. Ton <b style={{ color: 'var(--p-text-60)' }}>rang</b>, lui, se lit sur l'<b style={{ color: 'var(--p-gold-text)' }}>indice citoyen /100</b> — un équilibre entre <b style={{ color: 'var(--p-text-60)' }}>précision (40 %)</b>, <b style={{ color: 'var(--p-text-60)' }}>apprentissage (30 %)</b> et <b style={{ color: 'var(--p-text-60)' }}>régularité (30 %)</b>, pour ne pas récompenser que le volume. Voici tes sources de points :
          </p>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            {SOURCES.map(({ max, unit, label, desc, color, icon: Icon }, index) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-10%' }} transition={{ duration: 0.4, delay: index * 0.06 }}
                whileHover={{ y: -2 }}
                className="rounded-xl border p-5 transition-colors duration-300 hover:border-[var(--p-border-hover)]"
                style={{ background: 'var(--p-card)', borderColor: 'var(--p-border)' }}
              >
                <Icon className="w-5 h-5 mb-2" style={{ color }} />
                <div className="text-2xl font-black leading-none" style={{ fontFamily: "'JetBrains Mono',monospace", color }}>{max}</div>
                <div className="text-[10px] mb-2" style={{ color: 'var(--p-text-25)' }}>{unit}</div>
                <div className="font-bold text-sm mb-1" style={{ color: 'var(--p-text)' }}>{label}</div>
                <div className="text-xs leading-relaxed" style={{ color: 'var(--p-text-40)' }}>{desc}</div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Paris sur sondages — la mécanique de rétention entre deux sondages */}
        <section id="paris">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5" style={{ color: 'var(--p-gold-text)' }} />
            <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--p-text)' }}>Parie sur les sondages</h2>
          </div>
          <p className="text-sm mb-6 max-w-2xl" style={{ color: 'var(--p-text-40)' }}>
            Entre deux sondages, mise tes <b style={{ color: 'var(--p-gold-text)' }}>jetons</b> (gratuits, renouvelés chaque semaine) sur ce que diront les prochains. <b style={{ color: 'var(--p-text-60)' }}>Que des points, jamais d'argent.</b>
          </p>
          <div className="grid sm:grid-cols-3 gap-3 mb-5">
            {[
              { icon: Coins, color: 'var(--p-gold-text)', t: 'Des jetons gratuits', d: 'Une dotation chaque semaine, plus ce que tu gagnes. Impossible de « faire faillite ».' },
              { icon: TrendingUp, color: 'var(--p-blue)', t: 'Des cotes vivantes', d: 'La cote s\'ouvre sur la probabilité des sondages, puis bouge selon les mises de tous. L\'improbable paie plus.' },
              { icon: Trophy, color: '#16794A', t: 'Résolu à chaque sondage', d: 'Quand un nouveau sondage tombe, les paris se dénouent et une nouvelle manche s\'ouvre.' },
            ].map(({ icon: Icon, color, t, d }) => (
              <div key={t} className="rounded-xl border p-4" style={{ background: 'var(--p-card)', borderColor: 'var(--p-border)' }}>
                <Icon className="w-5 h-5 mb-2" style={{ color }} />
                <p className="text-sm font-bold mb-1" style={{ color: 'var(--p-text)' }}>{t}</p>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--p-text-40)' }}>{d}</p>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border p-5" style={{ background: 'var(--p-blue-dim)', borderColor: 'var(--p-blue-border)' }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--p-blue)' }}>Exemple</p>
            <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--p-text-60)' }}>
              Tu mises <b style={{ color: 'var(--p-text)' }}>50 jetons</b> sur « Likoud en tête » à une cote de <b style={{ color: 'var(--p-gold-text)' }}>2,35</b>. Si le prochain sondage lui donne la tête, tu remportes <b style={{ color: 'var(--p-green)' }}>118 jetons</b>. Plus tu paries tôt et à contre-courant, plus la cote — donc le gain — est élevée.
            </p>
            <Link to={createPageUrl('Paris')} className="inline-flex items-center gap-2 px-5 py-3 rounded-[10px] font-semibold text-[15px] text-white transition-transform hover:-translate-y-0.5" style={{ background: 'var(--p-blue)', boxShadow: '0 10px 24px -8px rgba(43,92,230,0.6)' }}>
              Voir les paris ouverts <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        <section id="quiz">
          <h2 className="text-xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--p-text)' }}>Teste-toi</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--p-text-40)' }}>Une question au hasard sur les règles, l'histoire ou l'actu — d'autres sur <Link to={createPageUrl('Quiz')} className="underline hover:opacity-80" style={{ color: 'var(--p-blue)' }}>la page Quiz</Link>.</p>
          <QuizWidget />
        </section>

        <section id="badges">
          <h2 className="text-xl font-bold mb-6" style={{ fontFamily: 'var(--font-display)', color: 'var(--p-text)' }}>Badges & récompenses</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            {BADGES.map(({ icon: Icon, color, label, desc }, index) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-10%' }} transition={{ duration: 0.4, delay: index * 0.06 }}
                whileHover={{ y: -2 }}
                className="flex items-start gap-3 rounded-xl border p-4 transition-colors duration-300 hover:border-[var(--p-border-hover)]"
                style={{ background: 'var(--p-card)', borderColor: 'var(--p-border)' }}
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: color + '18', border: `1px solid ${color}30` }}>
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
          initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-10%' }} transition={{ duration: 0.4 }}
          className="rounded-2xl border p-8 text-center"
          style={{ background: 'var(--p-blue-dim)', borderColor: 'var(--p-border)' }}
        >
          <p className="text-sm mb-2" style={{ color: 'var(--p-text-40)' }}>Prêt à commencer ?</p>
          <h3 className="text-2xl font-black mb-6" style={{ fontFamily: 'var(--font-display)', color: 'var(--p-text)' }}>
            Anticipe. Apprends. Grimpe.
          </h3>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to={createPageUrl('Listes')} className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white transition-transform hover:-translate-y-0.5" style={{ background: 'var(--p-blue)', boxShadow: '0 10px 24px -8px rgba(43,92,230,0.6)' }}>
              <Vote className="w-4 h-4" /> Je fais mon pronostic
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
