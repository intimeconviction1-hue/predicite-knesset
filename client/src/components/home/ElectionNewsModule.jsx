import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { base44 } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import { Newspaper, ExternalLink, ChevronRight, Calendar, Tag, Zap, ArrowRight } from 'lucide-react';

const CATEGORY_COLORS = {
  candidats:  { bg: 'bg-blue-900/40',   text: 'text-blue-300',   border: 'border-blue-700/30',   label: 'Candidats' },
  sondages:   { bg: 'bg-amber-900/40',  text: 'text-amber-300',  border: 'border-amber-700/30',  label: 'Sondages' },
  alliances:  { bg: 'bg-purple-900/40', text: 'text-purple-300', border: 'border-purple-700/30', label: 'Alliances' },
  campagne:   { bg: 'bg-green-900/40',  text: 'text-green-300',  border: 'border-green-700/30',  label: 'Campagne' },
  résultats:  { bg: 'bg-red-900/40',    text: 'text-red-300',    border: 'border-red-700/30',    label: 'Résultats' },
  général:    { bg: 'bg-slate-800/40',  text: 'text-slate-300',  border: 'border-slate-700/30',  label: 'Général' },
};

const CATEGORY_FILTERS = [
  { key: 'all', label: 'Tout' },
  { key: 'sondages', label: 'Sondages' },
  { key: 'candidats', label: 'Candidats' },
  { key: 'alliances', label: 'Alliances' },
  { key: 'campagne', label: 'Campagne' },
  { key: 'résultats', label: 'Résultats' },
];

export default function ElectionNewsModule() {
  const [activeFilter, setActiveFilter] = useState('all');

  const { data: news = [], isLoading } = useQuery({
    queryKey: ['election-news'],
    queryFn: () => base44.entities.ElectionNews.filter({ is_active: true }, '-published_at', 12),
  });

  const filtered = activeFilter === 'all'
    ? news
    : news.filter(n => n.category === activeFilter);

  const displayed = filtered.slice(0, 6);

  return (
    <div className="bg-[#07122A] border-b border-white/8 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex items-end justify-between mb-5">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Newspaper className="w-5 h-5 text-[#D4A017]" />
              <h2 className="text-xl font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Actualités des municipales
              </h2>
            </div>
            <p className="text-xs text-white/35">
              Dernières informations issues de la presse nationale et régionale
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {CATEGORY_FILTERS.map(f => (
            <button key={f.key} onClick={() => setActiveFilter(f.key)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                activeFilter === f.key
                  ? 'bg-[#034EA2] border-[#034EA2] text-white'
                  : 'bg-white/5 border-white/15 text-white/50 hover:text-white hover:border-white/30'
              }`}
            >{f.label}</button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3].map(i => <div key={i} className="bg-white/5 rounded-xl h-36 animate-pulse border border-white/8" />)}
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Newspaper className="w-10 h-10 text-white/15 mb-4" />
            <p className="text-white/40 text-sm font-medium mb-1">Aucune actualité disponible pour le moment</p>
            <p className="text-white/20 text-xs max-w-xs">Les articles sont collectés uniquement depuis des sources de presse vérifiées. Revenez bientôt.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayed.map((item, i) => {
              const cat = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.général;
              return (
                <motion.div key={item.id} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                  className="group rounded-xl border border-white/10 bg-white/4 hover:bg-white/8 hover:border-[#E1B530]/30 transition-all p-4 flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border bg-[#E1B530]/10 text-[#E1B530] border-[#E1B530]/25">
                      <Zap className="w-2.5 h-2.5" />SIGNAL POLITIQUE
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${cat.bg} ${cat.text} ${cat.border}`}>
                      <Tag className="w-2.5 h-2.5" />{cat.label}
                    </span>
                  </div>
                  <h3 className="text-white font-semibold text-sm leading-snug line-clamp-2">{item.title}</h3>
                  <p className="text-white/45 text-xs leading-relaxed line-clamp-2 flex-1">{item.summary}</p>
                  <div className="flex items-center justify-between pt-2 border-t border-white/8 gap-2">
                    <div className="flex items-center gap-2">
                      {item.source_url ? (
                        <a href={item.source_url} target="_blank" rel="noopener noreferrer"
                          className="text-white/30 text-[10px] hover:text-white/60 transition-colors inline-flex items-center gap-1"
                        >{item.source_name}<ExternalLink className="w-2.5 h-2.5" /></a>
                      ) : (
                        <span className="text-white/25 text-[10px]">{item.source_name}</span>
                      )}
                      <span className="text-white/15 text-[10px]">·</span>
                      <div className="flex items-center gap-1 text-white/25 text-[10px]">
                        <Calendar className="w-2.5 h-2.5" />
                        {new Date(item.published_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      </div>
                    </div>
                    <Link to={createPageUrl('Predictions') + (item.city_id ? `?city=${encodeURIComponent(item.city_id)}` : '')}
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-[#E1B530] hover:text-white transition-colors shrink-0"
                    >
                      <Zap className="w-2.5 h-2.5" />Ajuster ma prédiction<ArrowRight className="w-2.5 h-2.5" />
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {displayed.length > 0 && (
          <div className="mt-6 flex items-center justify-center">
            <Link to={createPageUrl('Surveys')} className="flex items-center gap-2 text-sm text-white/40 hover:text-white transition">
              <Newspaper className="w-4 h-4" />Voir tous les sondages et signaux<ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}