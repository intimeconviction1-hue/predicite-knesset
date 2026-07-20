import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/client';
import { motion } from 'framer-motion';
import { 
  RefreshCw, BarChart3, Newspaper, Zap, CheckCircle, 
  AlertTriangle, Clock, Play, Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';

export default function AdminSync() {
  const [user, setUser] = useState(null);
  const [syncStatus, setSyncStatus] = useState({ polls: null, news: null });
  const [loading, setLoading] = useState({ polls: false, news: false, both: false });

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: realPolls = [] } = useQuery({
    queryKey: ['admin-real-polls'],
    queryFn: () => base44.entities.RealPoll.list('-publication_date', 50),
    enabled: user?.role === 'admin'
  });

  const { data: electionNews = [] } = useQuery({
    queryKey: ['admin-election-news'],
    queryFn: () => base44.entities.ElectionNews.list('-published_at', 50),
    enabled: user?.role === 'admin'
  });

  const { data: signals = [] } = useQuery({
    queryKey: ['admin-signals'],
    queryFn: () => base44.entities.PoliticalSignal.list('-date', 50),
    enabled: user?.role === 'admin'
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-[#07122A] flex items-center justify-center">
        <div className="text-white/40 text-sm">Chargement...</div>
      </div>
    );
  }

  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-[#07122A] flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-white font-bold text-lg">Accès restreint</p>
          <p className="text-white/40 text-sm">Réservé aux administrateurs.</p>
        </div>
      </div>
    );
  }

  const runSync = async (type) => {
    setLoading(l => ({ ...l, [type]: true }));
    try {
      if (type === 'polls' || type === 'both') {
        const res = await base44.functions.invoke('pollCollector', {});
        setSyncStatus(s => ({ ...s, polls: res.data }));
      }
      if (type === 'news' || type === 'both') {
        const res = await base44.functions.invoke('municipalNewsCollector', {});
        setSyncStatus(s => ({ ...s, news: res.data }));
      }
    } catch (err) {
      setSyncStatus(s => ({ ...s, [type]: { success: false, error: err.message } }));
    }
    setLoading(l => ({ ...l, [type]: false }));
  };

  const latestPollDate = realPolls[0]?.publication_date;
  const latestNewsDate = electionNews[0]?.published_at;
  const latestSignalDate = signals[0]?.date;

  const todayPolls = realPolls.filter(p => {
    const d = p.publication_date;
    return d === new Date().toLocaleDateString('fr-CA', { timeZone: 'Europe/Paris' });
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#07122A] to-[#0d1f3c]">
      {/* Header */}
      <div className="bg-[#034EA2] text-white">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-1">
            <Shield className="w-5 h-5 text-white/70" />
            <h1 className="text-xl font-bold">Tableau de bord — Synchronisation des données</h1>
          </div>
          <p className="text-white/50 text-sm">Gestion des collecteurs automatiques PrédiCité</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* Stats rapides */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Sondages total', value: realPolls.length, icon: BarChart3, color: 'text-amber-400' },
            { label: 'Actus total', value: electionNews.length, icon: Newspaper, color: 'text-blue-400' },
            { label: 'Signaux total', value: signals.length, icon: Zap, color: 'text-yellow-400' },
            { label: 'Sondages aujourd\'hui', value: todayPolls.length, icon: Clock, color: 'text-green-400' },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-white/5 border border-white/10 rounded-xl p-4">
                <Icon className={`w-5 h-5 ${stat.color} mb-2`} />
                <p className="text-white text-2xl font-bold">{stat.value}</p>
                <p className="text-white/40 text-xs">{stat.label}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Dernières synchros */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-3">
          <h2 className="text-white font-bold text-sm uppercase tracking-wide mb-4">Fraîcheur des données</h2>
          {[
            { label: 'Dernier sondage', date: latestPollDate, icon: BarChart3 },
            { label: 'Dernière actualité', date: latestNewsDate, icon: Newspaper },
            { label: 'Dernier signal', date: latestSignalDate, icon: Zap },
          ].map((item, i) => {
            const Icon = item.icon;
            const isToday = item.date === new Date().toLocaleDateString('fr-CA', { timeZone: 'Europe/Paris' });
            return (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-white/40" />
                  <span className="text-white/60 text-sm">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {item.date ? (
                    <>
                      <span className="text-white text-sm">{new Date(item.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      {isToday && <Badge className="bg-green-900 text-green-300 text-[10px]">Aujourd'hui</Badge>}
                    </>
                  ) : (
                    <span className="text-white/30 text-sm">—</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Contrôles de synchro */}
        <div className="grid md:grid-cols-3 gap-4">
          
          {/* PollCollector */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="text-white font-bold text-sm">PollCollector</h3>
                <p className="text-white/35 text-xs">Toutes les 3 heures</p>
              </div>
            </div>
            <p className="text-white/40 text-xs">
              Génère des sondages municipaux réalistes via IA et les insère en base avec déduplication.
            </p>
            {syncStatus.polls && (
              <div className={`rounded-lg p-3 text-xs ${syncStatus.polls.success ? 'bg-green-900/30 border border-green-700/30' : 'bg-red-900/30 border border-red-700/30'}`}>
                {syncStatus.polls.success ? (
                  <div className="space-y-1 text-green-300">
                    <div className="flex items-center gap-1 font-bold"><CheckCircle className="w-3 h-3" /> Succès</div>
                    <div>Sondages créés : {syncStatus.polls.results?.created || 0}</div>
                    <div>Signaux générés : {syncStatus.polls.results?.signals_created || 0}</div>
                    <div>Ignorés (doublons) : {syncStatus.polls.results?.skipped || 0}</div>
                    {syncStatus.polls.results?.errors?.length > 0 && (
                      <div className="text-red-300">Erreurs : {syncStatus.polls.results.errors.length}</div>
                    )}
                  </div>
                ) : (
                  <div className="text-red-300 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> {syncStatus.polls.error}
                  </div>
                )}
              </div>
            )}
            <Button
              onClick={() => runSync('polls')}
              disabled={loading.polls || loading.both}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white text-xs"
              size="sm"
            >
              {loading.polls ? <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1" /> : <Play className="w-3.5 h-3.5 mr-1" />}
              Lancer PollCollector
            </Button>
          </div>

          {/* NewsCollector */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Newspaper className="w-5 h-5 text-blue-400" />
              <div>
                <h3 className="text-white font-bold text-sm">NewsCollector</h3>
                <p className="text-white/35 text-xs">Toutes les 30 minutes</p>
              </div>
            </div>
            <p className="text-white/40 text-xs">
              Génère des actualités municipales filtrées et les transforme en signaux politiques exploitables.
            </p>
            {syncStatus.news && (
              <div className={`rounded-lg p-3 text-xs ${syncStatus.news.success ? 'bg-green-900/30 border border-green-700/30' : 'bg-red-900/30 border border-red-700/30'}`}>
                {syncStatus.news.success ? (
                  <div className="space-y-1 text-green-300">
                    <div className="flex items-center gap-1 font-bold"><CheckCircle className="w-3 h-3" /> Succès</div>
                    <div>Actus créées : {syncStatus.news.results?.news_created || 0}</div>
                    <div>Signaux générés : {syncStatus.news.results?.signals_created || 0}</div>
                    <div>Ignorés (doublons) : {syncStatus.news.results?.skipped || 0}</div>
                  </div>
                ) : (
                  <div className="text-red-300 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> {syncStatus.news.error}
                  </div>
                )}
              </div>
            )}
            <Button
              onClick={() => runSync('news')}
              disabled={loading.news || loading.both}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs"
              size="sm"
            >
              {loading.news ? <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1" /> : <Play className="w-3.5 h-3.5 mr-1" />}
              Lancer NewsCollector
            </Button>
          </div>

          {/* Both */}
          <div className="bg-white/5 border border-[#E1B530]/20 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#E1B530]" />
              <div>
                <h3 className="text-white font-bold text-sm">Synchro complète</h3>
                <p className="text-white/35 text-xs">Polls + News en une fois</p>
              </div>
            </div>
            <p className="text-white/40 text-xs">
              Lance les deux collecteurs séquentiellement pour une mise à jour complète de toutes les données.
            </p>
            <div className="flex-1" />
            <Button
              onClick={() => runSync('both')}
              disabled={loading.polls || loading.news || loading.both}
              className="w-full bg-[#E1B530] hover:bg-[#c9a020] text-[#07122A] text-xs font-bold mt-auto"
              size="sm"
            >
              {loading.both ? <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1" /> : <RefreshCw className="w-3.5 h-3.5 mr-1" />}
              Tout synchroniser
            </Button>
          </div>
        </div>

        {/* Derniers sondages */}
        {realPolls.length > 0 && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-5">
            <h2 className="text-white font-bold text-sm uppercase tracking-wide mb-4">
              Derniers sondages importés
            </h2>
            <div className="space-y-2">
              {realPolls.slice(0, 8).map((poll, i) => (
                <div key={poll.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="w-4 h-4 text-white/20" />
                    <div>
                      <p className="text-white text-sm truncate max-w-xs">{poll.title}</p>
                      <p className="text-white/30 text-xs">{poll.scope} · {poll.collection_method || 'Online'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-white/40 text-xs">
                      {poll.publication_date ? new Date(poll.publication_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '—'}
                    </span>
                    {poll.tags?.includes('is_active_latest') && (
                      <Badge className="bg-green-900 text-green-300 text-[10px]">Actif</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Derniers signaux */}
        {signals.length > 0 && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-5">
            <h2 className="text-white font-bold text-sm uppercase tracking-wide mb-4">
              Derniers signaux politiques
            </h2>
            <div className="space-y-2">
              {signals.slice(0, 6).map((sig) => (
                <div key={sig.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div className="flex items-center gap-3">
                    <Zap className="w-4 h-4 text-[#E1B530]/50" />
                    <div>
                      <p className="text-white text-sm truncate max-w-sm">{sig.title}</p>
                      <p className="text-white/30 text-xs">{sig.city} · {sig.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(d => (
                        <div key={d} className={`w-1.5 h-1.5 rounded-full ${d <= sig.impact_level ? 'bg-[#E1B530]' : 'bg-white/10'}`} />
                      ))}
                    </div>
                    <span className="text-white/30 text-xs">
                      {sig.date ? new Date(sig.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '—'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}