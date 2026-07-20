import React, { useState } from 'react';
import { base44 } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  BarChart3, Filter, Users, Building2, Calendar, 
  ExternalLink, TrendingUp, TrendingDown, Minus,
  ChevronRight, AlertCircle, FileBarChart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PollCard from '@/components/polls/PollCard';
import LiveUpdateBadge from '@/components/shared/LiveUpdateBadge';

const PARTY_COLORS = {
  'PS': '#FF8C00',
  'PS-PCF-EELV-PP': '#FF8C00',
  'PS-EELV': '#4CAF50',
  'Union Gauche': '#FF8C00',
  'LR': '#1E3A8A',
  'LR-MoDem-UDI': '#1E3A8A',
  'LR-HOR-UDI': '#1E3A8A',
  'LR-Renaissance': '#1E3A8A',
  'DVD': '#6B7280',
  'DVD-Ensemble': '#6B7280',
  'SE (ex-LR)': '#6B7280',
  'SE': '#6B7280',
  'EELV': '#22C55E',
  'RN': '#1F2937',
  'RN-UDR': '#1F2937',
  'LFI': '#DC2626',
  'LFI-NPA': '#DC2626',
  'HOR-REN': '#6366F1',
  'REC': '#7C3AED',
  'UDR-RN': '#1F2937',
};

const getPartyColor = (party) => PARTY_COLORS[party] || '#6B7280';

const Evolution = ({ value }) => {
  if (!value || value === 0) return <span className="text-gray-400 text-xs flex items-center gap-0.5"><Minus className="w-3 h-3" />0</span>;
  if (value > 0) return <span className="text-green-500 text-xs flex items-center gap-0.5"><TrendingUp className="w-3 h-3" />+{value}</span>;
  return <span className="text-red-400 text-xs flex items-center gap-0.5"><TrendingDown className="w-3 h-3" />{value}</span>;
};

export default function SurveysPage() {
  const [cityFilter, setCityFilter] = useState('all');
  const [pollSourceFilter, setPollSourceFilter] = useState('all');

  const { data: cities = [] } = useQuery({
    queryKey: ['cities'],
    queryFn: () => base44.entities.City.list()
  });

  const { data: citySurveys = [] } = useQuery({
    queryKey: ['city-surveys'],
    queryFn: () => base44.entities.CitySurvey.list('-date'),
    refetchInterval: 60_000,
    staleTime: 30_000
  });

  const { data: surveySources = [] } = useQuery({
    queryKey: ['survey-sources'],
    queryFn: () => base44.entities.SurveySource.list()
  });

  const { data: dailySurveys = [] } = useQuery({
    queryKey: ['daily-surveys'],
    queryFn: () => base44.entities.DailySurvey.list('-date')
  });

  const { data: responses = [] } = useQuery({
    queryKey: ['survey-responses'],
    queryFn: () => base44.entities.SurveyResponse.list()
  });

  const { data: realPolls = [] } = useQuery({
    queryKey: ['real-polls'],
    queryFn: () => base44.entities.RealPoll.list('-publication_date', 50),
    refetchInterval: 60_000,
    staleTime: 30_000
  });

  const { data: pollSources = [] } = useQuery({
    queryKey: ['poll-sources'],
    queryFn: () => base44.entities.PollSource.list(),
    staleTime: 300_000
  });

  const filteredRealPolls = realPolls.filter(p =>
    p.is_active !== false &&
    (cityFilter === 'all' || p.city_id === cityFilter || (cityFilter === 'national' && p.scope === 'national')) &&
    (pollSourceFilter === 'all' || p.poll_source_id === pollSourceFilter)
  );

  const getCity = (cityId) => cities.find(c => c.id === cityId);
  const getSource = (sourceId) => surveySources.find(s => s.id === sourceId);
  const getResponseCount = (surveyId) => responses.filter(r => r.survey_id === surveyId).length;

  const filteredCitySurveys = citySurveys.filter(s =>
    cityFilter === 'all' || s.city_id === cityFilter
  );

  const filteredDailySurveys = dailySurveys.filter(s =>
    cityFilter === 'all' || s.city_id === cityFilter
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#07122A] to-[#0d1f3c]">
      {/* Header */}
      <div className="bg-[#034EA2] text-white">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-5 h-5 text-white/70" />
              <h1 className="text-2xl font-bold">Sondages & données électorales</h1>
              </div>
                <p className="text-white/65 text-sm">
                  Sondages officiels d'instituts accrédités + opinion communautaire
                </p>
                {realPolls[0] && (
                  <div className="mt-2">
                    <LiveUpdateBadge updated_at={realPolls[0].publication_date} />
                  </div>
                )}
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filter */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6 flex items-center gap-4">
          <Filter className="w-4 h-4 text-white/50" />
          <Select value={cityFilter} onValueChange={setCityFilter}>
            <SelectTrigger className="w-64 bg-white/10 border-white/20 text-white">
              <SelectValue placeholder="Toutes les villes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les villes</SelectItem>
              {cities.map(city => (
                <SelectItem key={city.id} value={city.id}>{city.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="official" className="space-y-6">
          <TabsList className="bg-white/10 border border-white/20">
            <TabsTrigger value="official" className="text-white data-[state=active]:bg-[#034EA2] gap-2">
              <FileBarChart className="w-4 h-4" />
              Sondages officiels ({filteredRealPolls.length})
            </TabsTrigger>
            <TabsTrigger value="institutes" className="text-white data-[state=active]:bg-[#034EA2] gap-2">
              <Building2 className="w-4 h-4" />
              Instituts ({filteredCitySurveys.length})
            </TabsTrigger>
            <TabsTrigger value="community" className="text-white data-[state=active]:bg-[#034EA2] gap-2">
              <Users className="w-4 h-4" />
              Communauté ({filteredDailySurveys.length})
            </TabsTrigger>
          </TabsList>

          {/* --- SONDAGES OFFICIELS (RealPoll) --- */}
          <TabsContent value="official">
            {/* Source filter */}
            {pollSources.length > 0 && (
              <div className="flex items-center gap-3 mb-4 bg-white/5 border border-white/10 rounded-xl p-3">
                <Filter className="w-4 h-4 text-white/50" />
                <Select value={pollSourceFilter} onValueChange={setPollSourceFilter}>
                  <SelectTrigger className="w-48 bg-white/10 border-white/20 text-white text-sm">
                    <SelectValue placeholder="Tous les instituts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les instituts</SelectItem>
                    {pollSources.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {filteredRealPolls.length === 0 ? (
              <div className="text-center py-16">
                <BarChart3 className="w-10 h-10 text-white/20 mx-auto mb-3" />
                <p className="text-white/50">Aucun sondage officiel disponible</p>
              </div>
            ) : (
              <div className="space-y-5">
                {filteredRealPolls.map((poll, i) => (
                  <motion.div key={poll.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                    <PollCard
                      poll={poll}
                      source={pollSources.find(s => s.id === poll.poll_source_id)}
                      city={cities.find(c => c.id === poll.city_id)}
                      compact={false}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* --- INSTITUTS --- */}
          <TabsContent value="institutes">
            {filteredCitySurveys.length === 0 ? (
              <div className="text-center text-white/50 py-16">Aucun sondage disponible</div>
            ) : (
              <div className="space-y-5">
                {filteredCitySurveys.map((survey, idx) => {
                  const city = getCity(survey.city_id);
                  const source = getSource(survey.survey_source_id);
                  const top = survey.candidates?.[0];

                  return (
                    <motion.div
                      key={survey.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-white/25 transition"
                    >
                      {/* City header */}
                      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                        <div className="flex items-center gap-3">
                          {city?.image_url && (
                            <img src={city.image_url} alt={city.name} className="w-10 h-10 rounded-lg object-cover opacity-80" />
                          )}
                          <div>
                            <h3 className="text-white font-bold text-lg">{city?.name || 'Ville inconnue'}</h3>
                            <p className="text-white/50 text-xs">{city?.region}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          {survey.is_daily && (
                            <Badge className="bg-[#E1B530] text-[#034EA2] text-xs mb-1">SONDAGE DU JOUR</Badge>
                          )}
                          <div className="flex items-center gap-1 text-white/50 text-xs justify-end">
                            <Calendar className="w-3 h-3" />
                            {new Date(survey.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </div>
                        </div>
                      </div>

                      {/* Results */}
                      <div className="px-6 py-5">
                        <div className="space-y-3 mb-5">
                          {survey.candidates?.map((c, i) => (
                            <div key={i} className="flex items-center gap-3">
                              <div className="w-28 shrink-0">
                                <p className="text-white text-sm font-semibold truncate">{c.name}</p>
                                <p className="text-white/40 text-xs truncate">{c.party}</p>
                              </div>
                              <div className="flex-1 relative h-6 bg-white/10 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{
                                    width: `${c.percentage}%`,
                                    backgroundColor: getPartyColor(c.party),
                                    opacity: 0.85
                                  }}
                                />
                              </div>
                              <div className="w-16 flex items-center justify-end gap-1">
                                <span className="text-white font-bold text-sm">{c.percentage}%</span>
                                <Evolution value={c.evolution} />
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Meta / Source */}
                        {source && (
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-white/40 text-xs border-t border-white/10 pt-4">
                            <span className="font-semibold text-white/60">{source.institute}</span>
                            {source.client && <span>pour {source.client}</span>}
                            {source.sample_size && <span>n={source.sample_size}</span>}
                            {source.margin_error && <span>±{source.margin_error}pts</span>}
                            {source.methodology && <span>{source.methodology}</span>}
                            {source.date_from && source.date_to && (
                              <span>{new Date(source.date_from).toLocaleDateString('fr-FR')} – {new Date(source.date_to).toLocaleDateString('fr-FR')}</span>
                            )}
                            {source.link && (
                              <a href={source.link} target="_blank" rel="noopener noreferrer" className="text-[#E1B530] hover:underline flex items-center gap-1">
                                Source <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        )}

                        {survey.undecided != null && (
                          <p className="text-white/30 text-xs mt-2 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {survey.undecided}% d'indécis
                            {survey.turnout != null && ` · Participation estimée : ${survey.turnout}%`}
                          </p>
                        )}
                      </div>

                      {/* Footer */}
                      {city?.slug && (
                        <div className="px-6 pb-4">
                          <Link to={createPageUrl(`City`) + `?slug=${city.slug}`}>
                            <Button size="sm" variant="outline" className="border-white/20 text-white/70 hover:bg-white/10 text-xs gap-1">
                              Voir la fiche ville <ChevronRight className="w-3 h-3" />
                            </Button>
                          </Link>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* --- COMMUNITY --- */}
          <TabsContent value="community">
            {filteredDailySurveys.length === 0 ? (
              <div className="text-center text-white/50 py-16">Aucun sondage communautaire disponible</div>
            ) : (
              <div className="space-y-4">
                {filteredDailySurveys.map((survey, idx) => {
                  const city = getCity(survey.city_id);
                  return (
                    <motion.div
                      key={survey.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-white/25 transition"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <Badge className="bg-[#034EA2] text-white mb-2 text-xs">COMMUNAUTÉ</Badge>
                          <h3 className="text-white font-semibold text-base">{survey.question}</h3>
                        </div>
                        <div className="text-right text-white/40 text-xs flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(survey.date).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-white/50 text-xs">
                        {city && <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{city.name}</span>}
                        <Badge className="bg-green-900 text-green-300 text-xs">{getResponseCount(survey.id)} votes</Badge>
                      </div>
                      {survey.educational_context && (
                        <div className="mt-3 bg-blue-900/30 border border-blue-700/30 rounded-lg p-3 text-sm text-blue-200">
                          {survey.educational_context}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}