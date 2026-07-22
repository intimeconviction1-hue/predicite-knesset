import React, { useState } from 'react';
import { base44 } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, Vote, Filter, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

import ListeCard from '@/components/cards/ListeCard';
import KnessetRulesModule from '@/components/election/KnessetRulesModule';

const BLOC_OPTIONS = [
  { value: 'all', label: 'Tous les blocs' },
  { value: 'coalition', label: 'Coalition sortante' },
  { value: 'opposition', label: 'Opposition' },
  { value: 'liste_arabe', label: 'Listes arabes' },
  { value: 'non_alignee', label: 'Non alignées' },
];

export default function Listes() {
  const [searchQuery, setSearchQuery] = useState('');
  const [blocFilter, setBlocFilter] = useState('all');
  const [showRules, setShowRules] = useState(false);

  const { data: listes = [], isLoading } = useQuery({
    queryKey: ['listes'],
    queryFn: () => base44.entities.Liste.filter({ is_active: true }),
  });

  const { data: sondages = [] } = useQuery({
    queryKey: ['sondages-sieges-latest'],
    queryFn: () => base44.entities.SondageSieges.list('-poll_date', 1),
  });
  const latestPoll = sondages?.[0] || null;

  const filteredListes = listes.filter(l => {
    const matchesSearch = l.name_fr?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.leader_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBloc = blocFilter === 'all' || l.bloc === blocFilter;
    return matchesSearch && matchesBloc;
  });

  return (
    <div className="min-h-screen" style={{ background: 'var(--p-night)' }}>
      {/* Header */}
      <div className="relative border-b border-white/8" style={{ background: 'linear-gradient(180deg, rgba(30,58,138,0.15) 0%, transparent 100%)' }}>
        <div className="max-w-7xl mx-auto px-4 py-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-2 mb-2">
              <Vote className="w-5 h-5 text-white/70" />
              <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>
                Listes en lice — Knesset 2026
              </h1>
            </div>
            <p className="text-white/50 text-sm">
              {listes.length} listes suivies · Scrutin du 27 octobre 2026 · Sondages sièges mis à jour régulièrement
            </p>
            <button
              onClick={() => setShowRules(!showRules)}
              className="mt-4 text-sm font-semibold flex items-center gap-1 hover:opacity-80 transition-opacity"
              style={{ color: 'var(--p-gold)' }}
            >
              {showRules ? 'Masquer' : 'Comment lire ces sièges ?'} <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showRules ? 'rotate-90' : ''}`} />
            </button>
          </motion.div>
        </div>
      </div>

      {showRules && (
        <div className="max-w-4xl mx-auto px-4 pt-8">
          <KnessetRulesModule />
        </div>
      )}

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="rounded-2xl border border-white/10 p-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
              <Input
                placeholder="Rechercher une liste ou une tête de liste..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-transparent border-white/15 text-white placeholder:text-white/30"
              />
            </div>
            <Select value={blocFilter} onValueChange={setBlocFilter}>
              <SelectTrigger className="w-full md:w-56 bg-transparent border-white/15 text-white">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Bloc" />
              </SelectTrigger>
              <SelectContent>
                {BLOC_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Grille */}
      <div className="max-w-7xl mx-auto px-4 pb-16">
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="rounded-2xl h-48 animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
            ))}
          </div>
        ) : filteredListes.length === 0 ? (
          <div className="text-center py-16">
            <Vote className="w-12 h-12 mx-auto text-white/15 mb-4" />
            <h3 className="text-lg font-semibold text-white/60">Aucune liste trouvée</h3>
            <p className="text-white/30 text-sm">Essayez de modifier vos filtres</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredListes.map((liste, index) => (
              <ListeCard key={liste.id} liste={liste} latestPoll={latestPoll} index={index} />
            ))}
          </div>
        )}

        <div className="flex items-center justify-center gap-6 mt-12 pt-8 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <Link to={createPageUrl('PremierMinistre')} className="text-sm hover:text-white transition-colors" style={{ color: 'rgba(245,240,232,0.4)' }}>
            Pronostic Premier ministre
          </Link>
          <Link to={createPageUrl('Leaderboard')} className="text-sm hover:text-white transition-colors" style={{ color: 'rgba(245,240,232,0.4)' }}>
            Classement
          </Link>
        </div>
      </div>
    </div>
  );
}
