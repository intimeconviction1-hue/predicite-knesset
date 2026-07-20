import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/client';
import { ExternalLink, Newspaper, Calendar, AlertCircle } from 'lucide-react';

const CATEGORY_STYLES = {
  sondages: { label: 'Sondage', bg: 'bg-amber-100', text: 'text-amber-800' },
  candidats: { label: 'Candidature', bg: 'bg-blue-100', text: 'text-blue-800' },
  alliances: { label: 'Alliance', bg: 'bg-purple-100', text: 'text-purple-800' },
  campagne: { label: 'Campagne', bg: 'bg-slate-100', text: 'text-slate-700' },
  résultats: { label: 'Résultats', bg: 'bg-green-100', text: 'text-green-800' },
  général: { label: 'Général', bg: 'bg-slate-100', text: 'text-slate-700' },
};

export default function CityLocalNews({ city }) {
  const { data: news = [], isLoading } = useQuery({
    queryKey: ['city-local-news', city?.id],
    queryFn: () => base44.entities.ElectionNews.filter({ city_id: city.id, is_active: true }, '-published_at', 5),
    enabled: !!city?.id,
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <div className="h-4 bg-slate-100 rounded animate-pulse w-40 mb-4" />
        <div className="space-y-3">
          {[1, 2].map(i => <div key={i} className="h-16 bg-slate-50 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-100">
        <div className="w-7 h-7 rounded-lg bg-[#034EA2]/10 flex items-center justify-center">
          <Newspaper className="w-3.5 h-3.5 text-[#034EA2]" />
        </div>
        <h3 className="font-bold text-slate-800 text-sm">Dernières informations</h3>
        <span className="ml-auto text-[10px] text-slate-400 uppercase tracking-wide">Sources vérifiées</span>
      </div>

      {/* Content */}
      {news.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <AlertCircle className="w-6 h-6 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-400">Aucune donnée récente disponible.</p>
          <p className="text-xs text-slate-300 mt-1">Les informations apparaîtront dès leur publication.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-50">
          {news.map((item) => {
            const catStyle = CATEGORY_STYLES[item.category] || CATEGORY_STYLES.général;
            return (
              <a
                key={item.id}
                href={item.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block px-5 py-4 hover:bg-slate-50 transition-colors group"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${catStyle.bg} ${catStyle.text}`}>
                        {catStyle.label}
                      </span>
                      <div className="flex items-center gap-1 text-slate-400 text-[10px]">
                        <Calendar className="w-2.5 h-2.5" />
                        {new Date(item.published_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                      <span className="text-slate-300 text-[10px]">{item.source_name}</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-800 leading-snug group-hover:text-[#034EA2] transition-colors line-clamp-2">
                      {item.title}
                    </p>
                    {item.summary && (
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">
                        {item.summary}
                      </p>
                    )}
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#034EA2] flex-shrink-0 mt-1 transition-colors" />
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}