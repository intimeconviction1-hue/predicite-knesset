import React, { useState } from 'react';
import { base44 } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, MapPin, Filter, Grid3X3, List, ArrowUpAZ } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import CityCard from '@/components/cards/CityCard';

export default function Cities() {
  const [searchQuery, setSearchQuery] = useState('');
  const [regionFilter, setRegionFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [sortAlpha, setSortAlpha] = useState(false);

  const { data: cities = [], isLoading } = useQuery({
    queryKey: ['cities'],
    queryFn: () => base44.entities.City.list()
  });

  const regions = [...new Set(cities.map(c => c.region).filter(Boolean))].sort();

  const filteredCities = cities
    .filter(city => {
      const matchesSearch = city.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        city.region?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRegion = regionFilter === 'all' || city.region === regionFilter;
      return matchesSearch && matchesRegion;
    })
    .sort((a, b) => sortAlpha ? a.name?.localeCompare(b.name, 'fr') : 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="bg-[#034EA2] text-white">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-5 h-5 text-white/70" />
              <h1 className="text-2xl font-bold">Villes suivies</h1>
            </div>
            <p className="text-white/65 text-sm">
              {cities.length} grandes villes · Sondages et indice de tension mis à jour régulièrement
            </p>
          </motion.div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Rechercher une ville..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={regionFilter} onValueChange={setRegionFilter}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Région" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les régions</SelectItem>
                {regions.map(region => (
                  <SelectItem key={region} value={region}>{region}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button
                variant={sortAlpha ? 'default' : 'outline'}
                size="icon"
                onClick={() => setSortAlpha(!sortAlpha)}
                title="Trier A→Z"
                aria-label="Trier par ordre alphabétique"
              >
                <ArrowUpAZ className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('grid')}
                aria-label="Vue grille"
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('list')}
                aria-label="Vue liste"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Cities Grid */}
      <div className="max-w-7xl mx-auto px-4 pb-12">
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl h-72 animate-pulse" />
            ))}
          </div>
        ) : filteredCities.length === 0 ? (
          <div className="text-center py-16">
            <MapPin className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-semibold text-slate-600">Aucune ville trouvée</h3>
            <p className="text-slate-500">Essayez de modifier vos filtres</p>
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-6' 
            : 'space-y-4'
          }>
            {filteredCities.map((city, index) => (
              <CityCard key={city.id} city={city} index={index} />
            ))}
          </div>
        )}

        {filteredCities.length > 0 && (
          <p className="text-center text-slate-500 mt-8">
            {filteredCities.length} ville{filteredCities.length > 1 ? 's' : ''} affichée{filteredCities.length > 1 ? 's' : ''}
          </p>
        )}
      </div>
    </div>
  );
}