import React, { useState } from 'react';
import { base44 } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import { Search, Vote, Filter, ChevronRight, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { BLOC_LABEL } from '@/lib/blocs';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

import ListeCard from '@/components/cards/ListeCard';
import KnessetRulesModule from '@/components/election/KnessetRulesModule';
import CinematicHero from '@/components/knesset/CinematicHero';
import { useProjection } from '@/lib/projection';

// Les libellés viennent de BLOC_LABEL. Ils étaient écrits en dur ici, et ce
// filtre proposait donc encore « Coalition sortante » / « Opposition » /
// « Listes arabes » — les intitulés retirés le 2026-08-04 parce qu'ils décrivent
// la 25ᵉ Knesset et se lisent comme un positionnement gauche-droite. Troisième
// endroit que ce renommage n'avait pas atteint, après la Home et l'image
// partagée. À chaque fois, la cause est la même : une valeur recopiée.
const BLOC_OPTIONS = [
  { value: 'all', label: 'Tous les blocs' },
  { value: 'pro_netanyahou', label: BLOC_LABEL.pro_netanyahou },
  { value: 'anti_netanyahou', label: BLOC_LABEL.anti_netanyahou },
  { value: 'partis_arabes', label: BLOC_LABEL.partis_arabes },
  { value: 'sans_camp', label: BLOC_LABEL.sans_camp },
];

export default function Listes() {
  const [searchQuery, setSearchQuery] = useState('');
  const [blocFilter, setBlocFilter] = useState('all');
  const [showRules, setShowRules] = useState(false);

  const { data: listes = [], isLoading } = useQuery({
    queryKey: ['listes'],
    queryFn: () => base44.entities.Liste.filter({ is_active: true }),
  });

  // La projection partagée, pas le dernier sondage brut : les fiches affichaient
  // Likoud 22 pendant que « Forme ta coalition » en montrait 25.
  const { siegesParListe, provenance } = useProjection(listes);

  const filteredListes = listes.filter(l => {
    const matchesSearch = l.name_fr?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.leader_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBloc = blocFilter === 'all' || l.bloc === blocFilter;
    return matchesSearch && matchesBloc;
  });

  return (
    <div className="min-h-screen" style={{ background: 'transparent' }}>
      {/* Header cinématique */}
      <CinematicHero
        size="md"
        photos={['/images/listes-hero.jpg']}
        position="center 30%"
        title={<>Listes en lice — <span className="p-gradient-gold">Knesset 2026</span></>}
        subtitle={<>{listes.length} listes suivies · Scrutin du 27 octobre 2026 · Sondages sièges mis à jour régulièrement</>}
        actions={
          <button
            onClick={() => setShowRules(!showRules)}
            className="p-glass inline-flex items-center gap-1 px-6 py-3.5 font-semibold text-[15px] text-white hover:opacity-90 transition-opacity"
            style={{ background: 'rgba(255,255,255,0.10)', border: '0.5px solid rgba(255,255,255,0.25)' }}
          >
            {showRules ? 'Masquer' : 'Comment lire ces sièges ?'} <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showRules ? 'rotate-90' : ''}`} />
          </button>
        }
      />

      {showRules && (
        <div className="max-w-4xl mx-auto px-4 pt-8">
          <KnessetRulesModule />
        </div>
      )}

      {/* Filters */}
      <div className="p-reveal max-w-7xl mx-auto px-4 py-6">
        <div className="p-elev-1 rounded-2xl border p-4" style={{ background: 'var(--p-card)', borderColor: 'var(--p-border)' }}>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--p-text-25)' }} />
              <Input
                placeholder="Rechercher une liste ou une tête de liste..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                /* h-11 : la règle de cible tactile de globals.css ne vise que
                   les boutons et les liens, pas les champs de formulaire. Ces
                   deux-là restaient à 40 px. */
                className="h-11 pl-10 bg-transparent border-[var(--p-border-hover)] text-[var(--p-text)] placeholder:text-[var(--p-text-25)]"
              />
            </div>
            {/* <select> natif plutôt que le Select de Radix. Cette page en était
                le SEUL utilisateur de tout le client, et le composant pesait
                l'essentiel des 82 Ko de son chunk — pour un filtre à cinq
                options. Le natif est aussi meilleur ici : sur mobile il ouvre le
                sélecteur du système, il est navigable au clavier sans qu'on ait
                rien à écrire, et il ne peut pas se désynchroniser d'un lecteur
                d'écran. La flèche est peinte en fond, `appearance-none` retirant
                celle du navigateur. */}
            <div className="relative w-full md:w-56">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--p-text-40)' }} />
              <select
                value={blocFilter}
                onChange={(e) => setBlocFilter(e.target.value)}
                aria-label="Filtrer par bloc"
                className="appearance-none w-full h-11 pl-10 pr-9 rounded-md text-sm bg-transparent"
                style={{ border: '1px solid var(--p-border-hover)', color: 'var(--p-text)' }}
              >
                {BLOC_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--p-text-40)' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Grille */}
      <div className="max-w-7xl mx-auto px-4 pb-16">
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="rounded-2xl h-48 animate-pulse" style={{ background: 'var(--p-border)' }} />
            ))}
          </div>
        ) : filteredListes.length === 0 ? (
          <div className="text-center py-16">
            <Vote className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--p-text-25)' }} />
            <h3 className="text-lg font-semibold" style={{ color: 'var(--p-text-60)' }}>Aucune liste ne correspond</h3>
            <p className="text-sm" style={{ color: 'var(--p-text-40)' }}>Change ta recherche ou tes filtres pour retrouver ta liste.</p>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredListes.map((liste, index) => (
                <ListeCard key={liste.id} liste={liste} siegesProjetes={siegesParListe.get(liste.id)} index={index} />
              ))}
            </div>
            {/* La provenance manquait ici : les cartes affichaient des sièges
                sans dire d'où ils venaient. */}
            {provenance && (
              <p className="text-[11px] text-center mt-6" style={{ color: 'var(--p-text-25)' }}>{provenance}</p>
            )}
          </>
        )}

        <div className="p-reveal flex items-center justify-center gap-6 mt-12 pt-8 border-t" style={{ borderColor: 'var(--p-border)' }}>
          <Link to={createPageUrl('PremierMinistre')} className="text-sm hover:text-[var(--p-text)] transition-colors" style={{ color: 'var(--p-text-40)' }}>
            Pronostic Premier ministre
          </Link>
          <Link to={createPageUrl('Leaderboard')} className="text-sm hover:text-[var(--p-text)] transition-colors" style={{ color: 'var(--p-text-40)' }}>
            Classement
          </Link>
        </div>
      </div>
    </div>
  );
}
