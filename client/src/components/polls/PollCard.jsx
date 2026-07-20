import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ExternalLink, AlertCircle, ChevronRight } from 'lucide-react';
import SourceBadge from '@/components/shared/SourceBadge';
import PollBar from '@/components/polls/PollBar';

const PARTY_COLORS = {
  'PS': '#F59E0B', 'EELV': '#10B981', 'LR': '#1A3580',
  'RN': '#374151', 'Horizons': '#6366F1', 'RE': '#7C3AED',
  'LFI': '#DC2626', 'SE': '#6B7280',
};
const getColor = (p, idx) => PARTY_COLORS[p] || ['#2B5CE6', '#D92B2B', '#D4A017', '#1A8C55', '#E07B1A'][idx % 5];

export default function PollCard({ poll, source, city, compact = false }) {
  if (!poll) return null;

  const results = poll.results || [];
  const displayResults = compact ? results.slice(0, 3) : results;

  // Format "P. Nom (Parti)" — use last name + party label
  const formatCandidate = (name, party) => {
    if (!name) return party || '—';
    const parts = name.trim().split(' ');
    const lastName = parts[parts.length - 1];
    const initial = parts.length > 1 ? parts[0].charAt(0) + '.' : '';
    const label = party ? ` (${party})` : '';
    return `${initial ? initial + ' ' : ''}${lastName}${label}`;
  };
  const citySlug = city?.slug;

  return (
    <div className="predicite-card p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 flex-wrap">
            {source && (
              <SourceBadge
                source_name={source.short_name || source.name}
                source_url={poll.source_url}
                is_verified={source.is_verified}
                show_icon={true}
              />
            )}
            {poll.scope === 'city' && city && (
              <span className="text-xs text-gray-500">{city.name}</span>
            )}
            {poll.scope === 'national' && (
              <span className="text-xs text-gray-500">National</span>
            )}
          </div>
          <h3 className="text-sm font-semibold text-gray-900 leading-tight">{poll.title}</h3>
        </div>
        <span className="text-xs text-gray-400 whitespace-nowrap shrink-0">
          {poll.publication_date ? new Date(poll.publication_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : ''}
        </span>
      </div>

      {/* Meta */}
      {!compact && (poll.sample_size || poll.collection_method) && (
        <div className="flex items-center gap-3 text-xs text-gray-400">
          {poll.sample_size && <span>n={poll.sample_size.toLocaleString('fr-FR')}</span>}
          {poll.collection_method && <span>{poll.collection_method}</span>}
          {poll.margin_of_error && <span>±{poll.margin_of_error}pt</span>}
        </div>
      )}

      {/* Bars */}
      <div className="space-y-1">
        {displayResults.map((r, i) => (
          <PollBar
            key={i}
            candidate_name={formatCandidate(r.candidate, r.party)}
            candidate_color={getColor(r.party, i)}
            percentage={r.percentage || 0}
            is_leader={i === 0}
          />
        ))}
      </div>

      {/* Undecided / notes */}
      {!compact && (poll.undecided_pct != null || poll.margin_of_error != null) && (
        <div className="flex items-center gap-2 text-xs text-gray-400 border-t border-gray-100 pt-2">
          <AlertCircle className="w-3 h-3 shrink-0" />
          {poll.undecided_pct != null && <span>Indécis : {poll.undecided_pct}%</span>}
          {poll.margin_of_error != null && <span>Marge : ±{poll.margin_of_error}pts</span>}
        </div>
      )}

      {/* Footer CTAs */}
      <div className="flex items-center justify-between pt-1 border-t border-gray-100 gap-2 flex-wrap">
        {poll.source_url && (
          <a href={poll.source_url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#2B5CE6] flex items-center gap-1 hover:underline">
            Voir la source <ExternalLink className="w-3 h-3" />
          </a>
        )}
        {citySlug && (
          <Link to={createPageUrl('City') + `?slug=${citySlug}&tab=predictions`} className="text-xs text-[#1A3580] font-medium flex items-center gap-0.5 hover:underline ml-auto">
            Prédire cette ville <ChevronRight className="w-3 h-3" />
          </Link>
        )}
        {compact && (
          <Link to={createPageUrl('Surveys')} className="text-xs text-[#2B5CE6] flex items-center gap-0.5 hover:underline ml-auto">
            Voir plus <ChevronRight className="w-3 h-3" />
          </Link>
        )}
      </div>
    </div>
  );
}