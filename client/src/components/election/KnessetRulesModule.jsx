import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scale, ChevronDown, Vote, Percent, Shuffle, BarChart3, AlertCircle } from 'lucide-react';

const RULES = [
  {
    id: 'scrutin',
    icon: Vote,
    title: 'Un bulletin, une liste',
    color: '#2B5CE6',
    accent: 'border-[#4A7FD4]/30 bg-[#4A7FD4]/8',
    content: [
      { type: 'text', value: "En Israël, on ne vote pas pour une personne mais pour une liste entière : un parti, ou une alliance de partis présentant une liste commune. Il n'y a ni circonscriptions ni vote uninominal — tout le pays forme une seule circonscription nationale. C'est ce qu'on appelle une représentation proportionnelle intégrale (« pure ») : la répartition des 120 sièges suit directement le pourcentage national de voix de chaque liste, sans découpage géographique intermédiaire." },
      { type: 'highlight', label: 'Pourquoi une seule circonscription nationale ?', value: "Ce choix remonte aux institutions pré-étatiques du Yishouv : dans une société d'immigration très diverse (courants religieux, laïcs, socialistes, révisionnistes, communautés arabes...), le but était de garantir une voix à chaque sensibilité politique, plutôt que de risquer d'en écraser certaines par un découpage en circonscriptions locales. Contrepartie assumée : un Parlement très fragmenté, où aucune liste n'a jamais eu seule la majorité — d'où la nécessité systématique d'une coalition." },
      { type: 'highlight', label: 'Différence clé', value: "Contrairement au scrutin français, il n'y a pas de duel entre deux personnes au second tour : un seul tour, et le résultat se traduit directement en sièges à la Knesset." },
    ]
  },
  {
    id: 'seuil',
    icon: Percent,
    title: 'Le seuil électoral (3,25 %)',
    color: 'var(--p-gold-text)',
    accent: 'border-[var(--p-gold)]/30 bg-[var(--p-gold)]/8',
    content: [
      { type: 'text', value: "Une liste doit obtenir au moins 3,25 % des suffrages exprimés au niveau national pour entrer à la Knesset. En dessous, elle n'obtient aucun siège, même si des dizaines de milliers d'électeurs ont voté pour elle — leurs voix sont redistribuées entre les listes qui ont franchi le seuil." },
      { type: 'threshold-bar', threshold: 3.25, examples: [
        { label: 'Liste sous le seuil', pct: 1.8, pass: false },
        { label: 'Liste tout juste au-dessus', pct: 3.6, pass: true },
        { label: 'Grande liste', pct: 19, pass: true },
      ] },
      { type: 'stat', label: 'Seuil actuel', value: '3,25 % des suffrages exprimés' },
      { type: 'text', value: "C'est souvent le vrai point de bascule d'une élection : une petite liste qui frôle le seuil peut faire perdre — ou gagner — plusieurs sièges à tout un bloc. C'est le cas du Sionisme religieux de Bezalel Smotrich, qui oscille autour de ce seuil dans les sondages de cette campagne." },
    ]
  },
  {
    id: 'repartition',
    icon: BarChart3,
    title: 'La répartition des 120 sièges',
    color: '#16794A',
    accent: 'border-emerald-400/30 bg-emerald-400/8',
    content: [
      { type: 'text', value: "Les 120 sièges sont répartis à la proportionnelle entre toutes les listes ayant franchi le seuil, selon la méthode Bader-Ofer (une variante de la méthode d'Hondt). Plus une liste a de voix, plus le rendement en sièges par voix est favorable — un effet qui avantage légèrement les grandes listes par rapport aux petites." },
      { type: 'seats-bar', total: 120, majority: 61 },
      { type: 'stat', label: 'Majorité', value: '61 sièges sur 120' },
      { type: 'text', value: "Aucune liste n'a jamais obtenu seule la majorité absolue depuis la création de l'État. Le résultat du soir du scrutin n'est donc qu'une étape : il fixe le rapport de force, pas le gouvernement." },
    ]
  },
  {
    id: 'excedents',
    icon: Shuffle,
    title: 'Les accords d\'excédents de voix',
    color: '#6D28D9',
    accent: 'border-[#A78BFA]/30 bg-[#A78BFA]/8',
    content: [
      { type: 'text', value: "Avant l'élection, deux listes peuvent signer un accord d'excédents (« hescem odafim ») : leurs restes de voix inutilisés dans le calcul sont mis en commun, ce qui peut faire basculer un siège de justesse vers l'une des deux plutôt que de le perdre." },
      { type: 'highlight', label: 'Pourquoi ça compte pour un pronostic', value: "Deux listes idéologiquement proches ont presque toujours intérêt à signer un tel accord. Un pronostic fin regarde qui s'allie avec qui sur ce point précis, pas seulement les intentions de vote brutes." },
    ]
  },
  {
    id: 'depot',
    icon: AlertCircle,
    title: 'Le dépôt des listes',
    color: 'var(--p-red)',
    accent: 'border-[#F47090]/30 bg-[#F47090]/8',
    content: [
      { type: 'text', value: "La composition définitive des listes (candidats, ordre, éventuelles fusions de dernière minute) n'est arrêtée que quelques semaines avant le scrutin, une fois le délai légal de dépôt passé auprès de la commission électorale centrale. Jusque-là, des alliances annoncées peuvent encore se défaire." },
      { type: 'highlight', label: 'À garder en tête', value: "Une liste suivie aujourd'hui dans les sondages peut fusionner, se scinder ou changer de nom d'ici le 27 octobre 2026. Les pronostics restent ouverts à modification jusqu'à la deadline officielle de l'app." },
    ]
  },
];

function RuleBlock({ item }) {
  if (item.type === 'threshold-bar') {
    return (
      <div className="rounded-lg p-3.5" style={{ background: 'rgba(20,32,61,0.03)', border: '1px solid var(--p-border)' }}>
        <div className="relative h-2 rounded-full mb-3 mt-2" style={{ background: 'var(--p-border-hover)' }}>
          <div
            className="absolute top-0 h-full rounded-l-full"
            style={{ width: `${item.threshold * 4}%`, background: 'var(--p-red)', opacity: 0.35 }}
          />
          <div
            className="absolute -top-1 w-0.5 h-4"
            style={{ left: `${item.threshold * 4}%`, background: 'var(--p-text)' }}
          />
          {item.examples.map((ex, i) => (
            <div
              key={i}
              className="absolute -top-1.5 w-3 h-3 rounded-full border-2"
              style={{
                left: `calc(${Math.min(ex.pct * 4, 96)}% - 6px)`,
                background: ex.pass ? 'var(--p-green)' : 'var(--p-red)',
                borderColor: 'var(--p-card)',
              }}
              title={`${ex.label} — ${ex.pct}%`}
            />
          ))}
        </div>
        <div className="flex items-center justify-between text-[10px] mb-2.5" style={{ color: 'var(--p-text-25)' }}>
          <span>0%</span>
          <span className="font-bold" style={{ color: 'var(--p-text)' }}>seuil {item.threshold}%</span>
          <span>25%</span>
        </div>
        <div className="space-y-1">
          {item.examples.map((ex, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: ex.pass ? 'var(--p-green)' : 'var(--p-red)' }} />
              <span style={{ color: 'var(--p-text-60)' }}>{ex.label} ({ex.pct}%)</span>
              <span className="ml-auto font-semibold" style={{ color: ex.pass ? 'var(--p-green)' : 'var(--p-red)' }}>
                {ex.pass ? 'entre à la Knesset' : 'aucun siège'}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (item.type === 'seats-bar') {
    const majorityPct = (item.majority / item.total) * 100;
    return (
      <div className="rounded-lg p-3.5" style={{ background: 'rgba(20,32,61,0.03)', border: '1px solid var(--p-border)' }}>
        <div className="relative h-3 rounded-full overflow-hidden flex" style={{ background: 'var(--p-border-hover)' }}>
          <div className="h-full" style={{ width: `${majorityPct}%`, background: 'linear-gradient(90deg,#2B5CE6,#4A7FD4)' }} />
          <div className="h-full flex-1" style={{ background: 'linear-gradient(90deg,#C8102E,#E24A63)', opacity: 0.5 }} />
          <div className="absolute -top-1 w-0.5 h-5" style={{ left: `${majorityPct}%`, background: 'var(--p-text)' }} />
        </div>
        <div className="flex items-center justify-between text-[10px] mt-2" style={{ color: 'var(--p-text-25)' }}>
          <span>0</span>
          <span className="font-bold" style={{ color: 'var(--p-text)' }}>{item.majority} = majorité</span>
          <span>{item.total} sièges</span>
        </div>
      </div>
    );
  }
  if (item.type === 'stat') {
    return (
      <div className="flex items-start gap-3 rounded-lg p-3" style={{ background: 'rgba(20,32,61,0.04)', border: '1px solid var(--p-border)' }}>
        <div className="flex-1">
          <p className="text-[11px] uppercase tracking-wide font-semibold mb-0.5" style={{ color: 'var(--p-text-40)' }}>{item.label}</p>
          <p className="text-sm font-bold" style={{ color: 'var(--p-text)' }}>{item.value}</p>
        </div>
      </div>
    );
  }
  if (item.type === 'highlight') {
    return (
      <div className="rounded-lg p-3" style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)' }}>
        <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: 'var(--p-gold-text)' }}>{item.label}</p>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--p-text-60)' }}>{item.value}</p>
      </div>
    );
  }
  return <p className="text-sm leading-relaxed" style={{ color: 'var(--p-text-60)' }}>{item.value}</p>;
}

export default function KnessetRulesModule({ compact = false }) {
  const [openId, setOpenId] = useState(compact ? null : 'scrutin');

  return (
    <div className={compact ? '' : 'rounded-2xl border overflow-hidden'} style={compact ? {} : { borderColor: 'var(--p-border)', background: 'var(--p-card)' }}>
      {!compact && (
        <div className="px-6 py-5 flex items-center gap-3" style={{ background: 'linear-gradient(135deg,#1E3A8A,#2B5CE6)' }}>
          <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
            <Scale className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-white font-bold text-lg" style={{ fontFamily: 'var(--font-display)' }}>Comment on vote à la Knesset</h2>
            <p className="text-white/60 text-xs">Le mécanisme du scrutin, pour pronostiquer avec de vraies bases</p>
          </div>
        </div>
      )}

      <div className={compact ? 'space-y-2' : 'divide-y'} style={compact ? {} : { borderColor: 'var(--p-border)' }}>
        {RULES.map((rule) => {
          const Icon = rule.icon;
          const isOpen = openId === rule.id;

          return (
            <div key={rule.id} className={compact ? `rounded-xl border ${rule.accent} overflow-hidden` : ''}>
              <button
                onClick={() => setOpenId(isOpen ? null : rule.id)}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[rgba(20,32,61,0.04)]"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${rule.accent}`}>
                  <Icon className="w-4 h-4" style={{ color: rule.color }} />
                </div>
                <span className="flex-1 text-sm font-semibold" style={{ color: rule.color }}>{rule.title}</span>
                <ChevronDown className={`w-4 h-4 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} style={{ color: 'var(--p-text-25)' }} />
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pt-1 space-y-3 border-t" style={{ borderColor: 'var(--p-border)' }}>
                      {rule.content.map((item, i) => (
                        <RuleBlock key={i} item={item} />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
