import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Building2, MapPin, Users, ChevronRight, Info, Vote, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const CITIES_PLM = [
  {
    id: 'paris',
    slug: 'paris',
    name: 'Paris',
    color: '#034EA2',
    bg: 'rgba(3,78,162,0.12)',
    population: '2 148 000 hab.',
    arrondissements: 20,
    conseillers: 163,
    image: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=600&q=80',
    law: 'Loi PLM (1982)',
    description: 'Paris fonctionne avec 20 arrondissements, chacun ayant son propre conseil d\'arrondissement et son maire d\'arrondissement.',
    how: [
      'Les Parisiens votent pour des listes dans chaque arrondissement',
      'Le nombre de sièges du Conseil de Paris varie selon la population de chaque arrondissement',
      'Le Conseil de Paris élit ensuite le Maire de Paris',
      'Paris dispose depuis 2017 d\'un statut de "Collectivité de Paris" fusionnant commune et département',
    ],
    specifics: [
      { label: 'Sièges au Conseil de Paris', value: '163' },
      { label: 'Arrondissements', value: '20' },
      { label: 'Mairies d\'arrondissement', value: '20' },
      { label: 'Statut spécial', value: 'Collectivité à statut particulier' },
    ],
    note: 'Depuis 2020, les 1er, 2e, 3e et 4e arrondissements sont regroupés en "Paris Centre".',
  },
  {
    id: 'lyon',
    slug: 'lyon',
    name: 'Lyon',
    color: '#C8102E',
    bg: 'rgba(200,16,46,0.12)',
    population: '522 000 hab.',
    arrondissements: 9,
    conseillers: 73,
    image: 'https://images.unsplash.com/photo-1571104508999-893933ded431?w=600&q=80',
    law: 'Loi PLM (1982)',
    description: 'Lyon comporte 9 arrondissements avec des conseils d\'arrondissement. Lyon est également incluse dans la Métropole de Lyon.',
    how: [
      'Les Lyonnais votent par arrondissement pour des listes',
      'Le Conseil Municipal de Lyon comprend 73 membres',
      'Le Conseil Municipal élit le Maire de Lyon',
      'Particularité : la Métropole de Lyon est une collectivité distincte, élue au suffrage universel direct',
    ],
    specifics: [
      { label: 'Sièges au Conseil Municipal', value: '73' },
      { label: 'Arrondissements', value: '9' },
      { label: 'Métropole de Lyon', value: 'Élue séparément depuis 2020' },
      { label: 'Conseils d\'arrondissement', value: '9' },
    ],
    note: 'Les élections municipales de Lyon se tiennent en parallèle des élections métropolitaines depuis 2020.',
  },
  {
    id: 'marseille',
    slug: 'marseille',
    name: 'Marseille',
    color: '#1A8C55',
    bg: 'rgba(26,140,85,0.12)',
    population: '873 000 hab.',
    arrondissements: 16,
    conseillers: 101,
    image: 'https://images.unsplash.com/photo-1589802929382-4c1b97dfe3fe?w=600&q=80',
    law: 'Loi PLM (1982)',
    description: 'Marseille a 16 arrondissements regroupés en 8 secteurs. Chaque secteur élit un conseil municipal de secteur.',
    how: [
      'Les Marseillais votent dans leur secteur (chaque secteur = 2 arrondissements)',
      '8 secteurs au total, chacun avec un conseil de secteur',
      'Les conseillers de secteur désignent les conseillers municipaux',
      'Le Conseil Municipal de Marseille élit le Maire de Marseille',
    ],
    specifics: [
      { label: 'Sièges au Conseil Municipal', value: '101' },
      { label: 'Arrondissements', value: '16' },
      { label: 'Secteurs de vote', value: '8 (regroupements de 2 arrond.)' },
      { label: 'Conseils de secteur', value: '8' },
    ],
    note: 'Marseille a un fonctionnement plus complexe : ce sont les secteurs, et non les arrondissements, qui constituent les circonscriptions électorales.',
  },
];

const DIFFERENCES = [
  {
    aspect: 'Circonscription de vote',
    paris: 'Arrondissement (20)',
    lyon: 'Arrondissement (9)',
    marseille: 'Secteur — 2 arrond. regroupés (8)',
    highlight: 'marseille',
  },
  {
    aspect: 'Conseil municipal',
    paris: '163 membres',
    lyon: '73 membres',
    marseille: '101 membres',
    highlight: 'paris',
  },
  {
    aspect: 'Élection du maire',
    paris: 'Par le Conseil de Paris',
    lyon: 'Par le Conseil Municipal',
    marseille: 'Par le Conseil Municipal',
    highlight: null,
  },
  {
    aspect: 'Statut spécial',
    paris: 'Collectivité à statut particulier (commune + département)',
    lyon: 'Incluse dans la Métropole de Lyon (élue séparément)',
    marseille: 'Commune dans la Métropole Aix-Marseille-Provence',
    highlight: 'paris',
  },
];

export default function ScrutinPLMPage() {
  const [active, setActive] = useState('paris');
  const city = CITIES_PLM.find(c => c.id === active);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#07122A] to-[#0d1f3c]">

      {/* Header */}
      <div className="bg-[#034EA2] relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px,white 1px,transparent 0)', backgroundSize: '24px 24px' }} />
        <div className="relative max-w-5xl mx-auto px-4 py-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-2 mb-3 text-white/50 text-sm">
              <Link to={createPageUrl('Learn')} className="hover:text-white transition">Apprendre</Link>
              <span>·</span>
              <span className="text-white">Scrutin PLM</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white mb-2"
              style={{ fontFamily: "'Space Grotesk','Outfit',sans-serif" }}>
              Scrutin spécial : Paris, Lyon, Marseille
            </h1>
            <p className="text-white/60 text-base max-w-xl">
              La loi PLM de 1982 donne à ces trois villes un mode de scrutin unique en France, par arrondissement ou secteur.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs text-white/70">
              <Info className="w-3.5 h-3.5" /> Loi n°82-1169 du 31 décembre 1982 — dite "Loi PLM"
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

        {/* City selector */}
        <div className="flex gap-3 flex-wrap">
          {CITIES_PLM.map(c => (
            <button
              key={c.id}
              onClick={() => setActive(c.id)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all border"
              style={{
                backgroundColor: active === c.id ? c.color : 'rgba(255,255,255,0.05)',
                borderColor: active === c.id ? c.color : 'rgba(255,255,255,0.1)',
                color: active === c.id ? 'white' : 'rgba(255,255,255,0.6)',
              }}
            >
              <Building2 className="w-4 h-4" />
              {c.name}
            </button>
          ))}
        </div>

        {/* City detail */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25 }}
            className="grid lg:grid-cols-[1fr_340px] gap-6"
          >
            {/* Left */}
            <div className="space-y-5">
              {/* Image + title */}
              <div className="relative rounded-2xl overflow-hidden h-40">
                <img src={city.image} alt={city.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#07122A]/80 to-transparent" />
                <div className="absolute bottom-4 left-5">
                  <p className="text-white font-black text-2xl">{city.name}</p>
                  <div className="flex items-center gap-3 text-white/60 text-xs mt-1">
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{city.population}</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{city.arrondissements} arrondissements</span>
                  </div>
                </div>
                <Badge className="absolute top-3 right-3 text-xs font-bold" style={{ backgroundColor: city.color }}>
                  {city.law}
                </Badge>
              </div>

              {/* Description */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <p className="text-white/80 text-sm leading-relaxed">{city.description}</p>
                {city.note && (
                  <div className="mt-3 flex items-start gap-2 bg-white/5 border border-white/10 rounded-xl p-3">
                    <Info className="w-3.5 h-3.5 text-[#D4A017] shrink-0 mt-0.5" />
                    <p className="text-white/50 text-xs leading-relaxed">{city.note}</p>
                  </div>
                )}
              </div>

              {/* How it works */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
                  <Vote className="w-4 h-4" style={{ color: city.color }} />
                  Comment ça fonctionne ?
                </h3>
                <div className="space-y-3">
                  {city.how.map((step, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 mt-0.5"
                        style={{ backgroundColor: city.color + '40', color: city.color }}
                      >
                        {i + 1}
                      </div>
                      <p className="text-white/70 text-sm leading-relaxed">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right — specifics */}
            <div className="space-y-4">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <h3 className="text-white font-bold text-sm mb-4">Chiffres clés</h3>
                <div className="space-y-3">
                  {city.specifics.map((s, i) => (
                    <div key={i} className="flex items-start justify-between gap-3 pb-3 border-b border-white/8 last:border-0 last:pb-0">
                      <span className="text-white/40 text-xs leading-snug">{s.label}</span>
                      <span className="text-white font-bold text-sm text-right shrink-0">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Schema visuel simplifié */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <h3 className="text-white font-bold text-sm mb-4">Schéma du scrutin</h3>
                <div className="space-y-2 text-center">
                  {[
                    { label: 'Électeurs votent dans leur ' + (active === 'marseille' ? 'secteur' : 'arrondissement'), bg: city.bg, color: city.color },
                    { label: '↓', bg: 'transparent', color: 'rgba(255,255,255,0.2)' },
                    { label: 'Conseil Municipal / Conseil de Paris', bg: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' },
                    { label: '↓', bg: 'transparent', color: 'rgba(255,255,255,0.2)' },
                    { label: 'Élection du Maire de ' + city.name, bg: city.bg, color: city.color },
                  ].map((row, i) => (
                    <div
                      key={i}
                      className="px-4 py-2 rounded-xl text-xs font-semibold"
                      style={{ backgroundColor: row.bg, color: row.color }}
                    >
                      {row.label}
                    </div>
                  ))}
                </div>
              </div>

              <Link to={`/City?slug=${city.slug}`}>
                <button
                  className="w-full py-3 rounded-2xl font-bold text-sm text-white transition flex items-center justify-center gap-2"
                  style={{ backgroundColor: city.color }}
                >
                  Voir la fiche {city.name} <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Comparison table */}
        <section>
          <h2 className="text-white font-bold text-lg mb-4">Tableau comparatif</h2>
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-4 text-xs font-bold uppercase tracking-widest border-b border-white/10">
              <div className="p-3 text-white/30">Aspect</div>
              {CITIES_PLM.map(c => (
                <div key={c.id} className="p-3 text-center font-bold" style={{ color: c.color }}>{c.name}</div>
              ))}
            </div>
            {DIFFERENCES.map((row, i) => (
              <div
                key={i}
                className="grid grid-cols-4 border-b border-white/5 last:border-0 text-xs hover:bg-white/3 transition"
              >
                <div className="p-3 text-white/50 font-semibold">{row.aspect}</div>
                <div className={`p-3 text-center ${row.highlight === 'paris' ? 'text-[#4A7FD4] font-semibold' : 'text-white/60'}`}>{row.paris}</div>
                <div className={`p-3 text-center ${row.highlight === 'lyon' ? 'text-[#E57373] font-semibold' : 'text-white/60'}`}>{row.lyon}</div>
                <div className={`p-3 text-center ${row.highlight === 'marseille' ? 'text-[#4CAF50] font-semibold' : 'text-white/60'}`}>{row.marseille}</div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="grid sm:grid-cols-2 gap-4">
          <Link to={createPageUrl('Learn')}>
            <div className="bg-white/5 border border-white/10 hover:border-white/20 rounded-2xl p-5 transition cursor-pointer group">
              <p className="text-white font-bold text-sm mb-1 group-hover:text-[#4A7FD4] transition">← Retour : Comprendre les municipales</p>
              <p className="text-white/40 text-xs">Système électoral général · Histoire · Scrutin de liste</p>
            </div>
          </Link>
          <Link to={createPageUrl('Cities')}>
            <div className="bg-white/5 border border-white/10 hover:border-white/20 rounded-2xl p-5 transition cursor-pointer group">
              <p className="text-white font-bold text-sm mb-1 group-hover:text-[#4A7FD4] transition">Explorer les villes →</p>
              <p className="text-white/40 text-xs">Sondages, candidats, historique politique de chaque ville</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}