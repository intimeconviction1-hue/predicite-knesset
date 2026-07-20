import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Vote, ChevronRight, Info, AlertCircle, CheckCircle2, 
  Users, Scale, BarChart3, BookOpen, ArrowRight, Building2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const TABS = [
  { id: 'general', label: 'Règles générales' },
  { id: 'tours', label: 'Les deux tours' },
  { id: 'sieges', label: 'Répartition des sièges' },
  { id: 'listes', label: 'Listes & candidats' },
  { id: 'petites', label: 'Petites communes' },
];

const CONTENT = {
  general: {
    title: 'Le scrutin municipal en France',
    intro: 'En France, les élections municipales permettent d\'élire les membres du conseil municipal pour 6 ans. Le mode de scrutin varie selon la taille de la commune.',
    blocks: [
      {
        type: 'rule',
        icon: Users,
        title: 'Qui peut voter ?',
        items: [
          'Tout citoyen français inscrit sur les listes électorales et âgé d\'au moins 18 ans.',
          'Les ressortissants de l\'Union européenne résidant en France pour les seules élections municipales (mais ils ne peuvent ni élire ni être élus maire).',
        ]
      },
      {
        type: 'rule',
        icon: Building2,
        title: 'Deux régimes distincts selon la taille de la commune',
        items: [
          'Communes de moins de 1 000 habitants : scrutin plurinominal majoritaire (vote pour des individus, pas des listes).',
          'Communes de 1 000 habitants et plus : scrutin de liste à deux tours avec représentation proportionnelle.',
          'Paris, Lyon, Marseille : régime spécial loi PLM de 1982 (vote par arrondissement ou secteur).',
        ]
      },
      {
        type: 'highlight',
        title: 'Seuil déterminant',
        text: '1 000 habitants — en dessous : pas de liste, vote individuel. Au-dessus : système de liste obligatoire avec deux tours.',
        color: '#034EA2',
      },
      {
        type: 'rule',
        icon: Vote,
        title: 'Durée du mandat',
        items: [
          '6 ans pour tous les conseillers municipaux.',
          'Le maire est élu par le conseil municipal à sa première réunion après les élections.',
          'Renouvellement intégral (pas de renouvellement par moitié).',
        ]
      }
    ]
  },
  tours: {
    title: 'Le système à deux tours',
    intro: 'Le scrutin de liste à deux tours s\'applique aux communes de 1 000 habitants et plus. Il combine majoritaire et proportionnel.',
    blocks: [
      {
        type: 'tour',
        numero: '1',
        color: '#034EA2',
        title: 'Premier tour',
        condition: 'Une liste obtient la majorité absolue des suffrages exprimés ET au moins 25 % des électeurs inscrits',
        result: 'Elle remporte la majorité des sièges dès le 1er tour. Le calcul de répartition s\'applique immédiatement.',
        seuils: [
          { label: 'Pour se maintenir au 2nd tour', value: '≥ 10 % des suffrages exprimés' },
          { label: 'Pour fusionner avec une autre liste', value: '≥ 5 % des suffrages exprimés' },
          { label: 'Victoire directe au 1er tour', value: '> 50 % des suffrages + 25 % des inscrits' },
        ]
      },
      {
        type: 'tour',
        numero: '2',
        color: '#C8102E',
        title: 'Second tour',
        condition: 'Si aucune liste n\'obtient la majorité absolue au 1er tour, un second tour est organisé.',
        result: 'La liste arrivée en tête l\'emporte, quel que soit son score. La répartition des sièges s\'applique à ce résultat.',
        seuils: [
          { label: 'Listes autorisées à se présenter', value: 'Celles ayant obtenu ≥ 10 % au 1er tour' },
          { label: 'Fusions autorisées', value: 'Avec toute liste ayant obtenu ≥ 5 % au 1er tour' },
          { label: 'Pour remporter la mairie', value: 'Être arrivé en tête (majorité relative suffit)' },
        ]
      },
      {
        type: 'note',
        icon: Info,
        text: 'Les listes qui se maintiennent ou fusionnent entre les deux tours peuvent modifier leur composition dans certaines limites légales, notamment pour intégrer des candidats d\'une liste ayant fusionné.',
      }
    ]
  },
  sieges: {
    title: 'Répartition des sièges',
    intro: 'Une fois le résultat connu, les sièges sont répartis en deux temps : une prime majoritaire pour la liste gagnante, puis une répartition proportionnelle pour les autres.',
    blocks: [
      {
        type: 'step',
        steps: [
          {
            numero: '1',
            title: 'Prime majoritaire',
            text: 'La liste arrivée en tête reçoit automatiquement la moitié des sièges du conseil municipal (arrondie à l\'entier supérieur si nécessaire).',
            color: '#034EA2',
            example: 'Pour un conseil de 33 membres → la liste gagnante reçoit d\'abord 17 sièges (la moitié arrondie).',
          },
          {
            numero: '2',
            title: 'Répartition proportionnelle',
            text: 'Les sièges restants sont répartis entre TOUTES les listes (y compris la gagnante) à la proportionnelle à la plus forte moyenne, selon les suffrages obtenus.',
            color: '#C8102E',
            example: 'Pour un conseil de 33 membres → les 16 sièges restants sont distribués proportionnellement entre toutes les listes.',
          },
          {
            numero: '3',
            title: 'Seuil d\'accès à la proportionnelle',
            text: 'Seules les listes ayant obtenu au moins 5 % des suffrages exprimés participent à la répartition proportionnelle.',
            color: '#1A8C55',
            example: 'Une liste à 4,9 % ne reçoit aucun siège, même si ce pourcentage représenterait mathématiquement un siège.',
          },
        ]
      },
      {
        type: 'highlight',
        title: 'Ce que garantit la prime majoritaire',
        text: 'La liste gagnante est toujours assurée d\'avoir la majorité absolue des sièges, lui permettant de gouverner sans coalition forcée.',
        color: '#034EA2',
      },
      {
        type: 'table',
        title: 'Exemple : commune de 33 conseillers',
        headers: ['Liste', 'Score 1er tour', 'Prime (50%)', 'Proport.', 'Total'],
        rows: [
          ['Liste A (gagnante)', '45 %', '17', '3', '20'],
          ['Liste B', '30 %', '—', '7', '7'],
          ['Liste C', '18 %', '—', '4', '4'],
          ['Liste D', '7 %', '—', '2', '2'],
        ]
      }
    ]
  },
  listes: {
    title: 'Listes et candidats',
    intro: 'Les règles de composition des listes sont strictement encadrées par la loi, notamment en matière de parité et d\'ordre de présentation.',
    blocks: [
      {
        type: 'rule',
        icon: Users,
        title: 'Parité stricte obligatoire',
        items: [
          'Les listes doivent alterner strictement femmes et hommes (ou hommes et femmes) : c\'est le principe du "zipper".',
          'La liste doit donc être composée alternativement d\'un candidat de chaque sexe.',
          'Ce principe s\'applique à partir des communes de 1 000 habitants.',
          'Non-respect → irrecevabilité de la liste (rejet par la préfecture).',
        ]
      },
      {
        type: 'rule',
        icon: Scale,
        title: 'Taille des listes',
        items: [
          'Chaque liste doit présenter autant de candidats que de sièges à pourvoir + 1/3 de candidats suppléants.',
          'En pratique : une liste complète + une liste de remplaçants.',
          'Il est interdit de panacher (mélanger des candidats de listes différentes).',
        ]
      },
      {
        type: 'rule',
        icon: Vote,
        title: 'Dépôt des candidatures',
        items: [
          'Les listes doivent être déposées en préfecture ou sous-préfecture avant la date limite fixée par décret.',
          'Chaque liste désigne un mandataire légal et un mandataire financier.',
          'Les comptes de campagne sont obligatoires à partir d\'un certain seuil de dépenses.',
        ]
      },
      {
        type: 'highlight',
        title: 'Règle de l\'ordre de liste',
        text: 'L\'ordre des candidats sur la liste détermine qui sera élu en cas de sièges limités. Le premier de liste est traditionnellement le candidat à la mairie.',
        color: '#D4A017',
      },
      {
        type: 'note',
        icon: AlertCircle,
        text: 'Le "panachage" (voter pour des candidats de listes différentes) est interdit pour les communes de 1 000 habitants et plus. Un bulletin modifié est nul.',
      }
    ]
  },
  petites: {
    title: 'Communes de moins de 1 000 habitants',
    intro: 'Pour les très petites communes (moins de 1 000 habitants), un régime simplifié s\'applique : pas de listes, mais un vote plurinominal.',
    blocks: [
      {
        type: 'rule',
        icon: Vote,
        title: 'Scrutin plurinominal majoritaire',
        items: [
          'Les électeurs votent pour des candidats individuels, pas pour des listes.',
          'Le "panachage" est autorisé : on peut voter pour des candidats de tendances différentes.',
          'On peut également ajouter des noms (candidats non déclarés) sur le bulletin.',
          'Sont élus au 1er tour les candidats ayant obtenu la majorité absolue ET au moins 25 % des inscrits.',
          'Au 2nd tour, la majorité relative suffit (si au moins autant de voix que de sièges).',
        ]
      },
      {
        type: 'rule',
        icon: Scale,
        title: 'Parité allégée',
        items: [
          'Dans les communes de moins de 1 000 habitants, la parité stricte alternée n\'est pas obligatoire.',
          'Il n\'y a pas non plus d\'obligation de présenter une liste complète.',
          'Des candidatures individuelles sont possibles.',
        ]
      },
      {
        type: 'table',
        title: 'Nombre de conseillers selon la population',
        headers: ['Population', 'Nb de conseillers'],
        rows: [
          ['Moins de 100 hab.', '7'],
          ['100 à 499 hab.', '11'],
          ['500 à 1 499 hab.', '15'],
          ['1 500 à 2 499 hab.', '19'],
          ['2 500 à 3 499 hab.', '23'],
          ['3 500 à 4 999 hab.', '27'],
          ['5 000 à 9 999 hab.', '29'],
          ['10 000 à 19 999 hab.', '33'],
          ['20 000 à 29 999 hab.', '35'],
          ['30 000 à 39 999 hab.', '39'],
          ['40 000 à 49 999 hab.', '43'],
          ['50 000 à 59 999 hab.', '45'],
          ['60 000 à 79 999 hab.', '49'],
          ['80 000 à 99 999 hab.', '53'],
          ['100 000 à 149 999 hab.', '55'],
          ['150 000 à 249 999 hab.', '59'],
          ['250 000 à 499 999 hab.', '65'],
          ['500 000 à 999 999 hab.', '69'],
          ['1 000 000 hab. et plus', '73 (Lyon) / 101 (Marseille) / 163 (Paris)'],
        ]
      }
    ]
  }
};

function RuleBlock({ block }) {
  if (block.type === 'rule') {
    const Icon = block.icon;
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Icon className="w-4 h-4 text-white/50" />
          <h3 className="text-white font-bold text-sm">{block.title}</h3>
        </div>
        <ul className="space-y-2">
          {block.items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-white/65 text-sm">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#1A8C55] mt-0.5 shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (block.type === 'highlight') {
    return (
      <div className="rounded-2xl p-4 border" style={{ backgroundColor: block.color + '18', borderColor: block.color + '40' }}>
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 shrink-0 mt-0.5" style={{ color: block.color }} />
          <div>
            <p className="font-bold text-sm text-white mb-1">{block.title}</p>
            <p className="text-white/65 text-sm">{block.text}</p>
          </div>
        </div>
      </div>
    );
  }

  if (block.type === 'note') {
    const Icon = block.icon;
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-start gap-2">
        <Icon className="w-4 h-4 text-[#D4A017] shrink-0 mt-0.5" />
        <p className="text-white/50 text-xs leading-relaxed">{block.text}</p>
      </div>
    );
  }

  if (block.type === 'tour') {
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-5 py-3 flex items-center gap-3" style={{ backgroundColor: block.color + '25', borderBottom: `1px solid ${block.color}30` }}>
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white font-black text-sm" style={{ backgroundColor: block.color }}>
            {block.numero}
          </div>
          <h3 className="text-white font-bold text-sm">{block.title}</h3>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Condition de victoire directe</p>
            <p className="text-white/80 text-sm">{block.condition}</p>
          </div>
          <div>
            <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Résultat</p>
            <p className="text-white/80 text-sm">{block.result}</p>
          </div>
          <div className="space-y-2">
            <p className="text-white/40 text-xs uppercase tracking-widest">Seuils clés</p>
            {block.seuils.map((s, i) => (
              <div key={i} className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-2">
                <span className="text-white/50 text-xs">{s.label}</span>
                <Badge className="text-xs font-bold" style={{ backgroundColor: block.color + '30', color: block.color, borderColor: block.color + '40' }}>
                  {s.value}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (block.type === 'step') {
    return (
      <div className="space-y-4">
        {block.steps.map((step, i) => (
          <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-white font-black text-sm shrink-0" style={{ backgroundColor: step.color }}>
                {step.numero}
              </div>
              <div>
                <h3 className="text-white font-bold text-sm mb-1">{step.title}</h3>
                <p className="text-white/65 text-sm mb-2">{step.text}</p>
                <div className="bg-white/5 rounded-xl px-3 py-2 text-xs text-white/40 italic">
                  {step.example}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (block.type === 'table') {
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-white/10">
          <h3 className="text-white font-bold text-sm">{block.title}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/10">
                {block.headers.map((h, i) => (
                  <th key={i} className="px-4 py-2.5 text-left text-white/40 font-semibold uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, i) => (
                <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/3 transition">
                  {row.map((cell, j) => (
                    <td key={j} className={`px-4 py-2.5 ${j === 0 ? 'text-white/70 font-medium' : 'text-white/50 text-center'}`}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return null;
}

export default function ScrutinMunicipalPage() {
  const [activeTab, setActiveTab] = useState('general');
  const content = CONTENT[activeTab];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#07122A] to-[#0d1f3c]">

      {/* Header */}
      <div className="bg-[#034EA2] relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
        <div className="relative max-w-4xl mx-auto px-4 py-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-2 mb-3 text-white/50 text-sm">
              <Link to={createPageUrl('Learn')} className="hover:text-white transition">Comprendre</Link>
              <span>·</span>
              <span className="text-white">Règles du scrutin</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white mb-2"
              style={{ fontFamily: "'Space Grotesk','Outfit',sans-serif" }}>
              Les règles du scrutin municipal
            </h1>
            <p className="text-white/60 text-base max-w-xl">
              Comment fonctionne concrètement une élection municipale en France : tours, seuils, répartition des sièges, listes, parité.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs text-white/70">
                <Scale className="w-3.5 h-3.5" /> Code électoral — Articles L. 252 à L. 262
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs text-white/70">
                <Vote className="w-3.5 h-3.5" /> Communes 1 000+ hab.
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Tab navigation */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-1.5 mb-8 flex flex-wrap gap-1">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-fit px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-[#034EA2] text-white shadow-sm'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.2 }}
            className="space-y-5"
          >
            {/* Section header */}
            <div className="mb-2">
              <h2 className="text-white font-black text-xl mb-1" style={{ fontFamily: "'Space Grotesk','Outfit',sans-serif" }}>
                {content.title}
              </h2>
              <p className="text-white/50 text-sm">{content.intro}</p>
            </div>

            {/* Blocks */}
            {content.blocks.map((block, i) => (
              <RuleBlock key={i} block={block} />
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Bottom navigation */}
        <div className="mt-10 grid sm:grid-cols-3 gap-4">
          <Link to={createPageUrl('Learn')}>
            <div className="bg-white/5 border border-white/10 hover:border-white/20 rounded-2xl p-4 transition cursor-pointer group">
              <p className="text-white font-bold text-sm group-hover:text-[#4A7FD4] transition mb-1">← Comprendre les municipales</p>
              <p className="text-white/35 text-xs">Retour aux fiches thématiques</p>
            </div>
          </Link>
          <Link to={createPageUrl('ScrutinPLM')}>
            <div className="bg-white/5 border border-white/10 hover:border-[#034EA2]/50 rounded-2xl p-4 transition cursor-pointer group">
              <p className="text-white font-bold text-sm group-hover:text-[#4A7FD4] transition mb-1">⬡ Cas spéciaux : Paris, Lyon, Marseille</p>
              <p className="text-white/35 text-xs">La loi PLM de 1982 expliquée</p>
            </div>
          </Link>
          <Link to={createPageUrl('Voter')}>
            <div className="bg-white/5 border border-white/10 hover:border-[#1A8C55]/50 rounded-2xl p-4 transition cursor-pointer group">
              <p className="text-white font-bold text-sm group-hover:text-[#1A8C55] transition mb-1">Comment voter ? →</p>
              <p className="text-white/35 text-xs">Inscription, bureau de vote, déroulement</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}