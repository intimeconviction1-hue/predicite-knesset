import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  MapPin, Users, Building2, AlertCircle, History, Target, 
  ChevronLeft, Lightbulb, TrendingUp, Award, HelpCircle, BarChart3, BookOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

import PredictionForm from '@/components/prediction/PredictionForm';
import T1ResultsBanner from '@/components/city/T1ResultsBanner';
import CityHistory from '@/components/city/CityHistory';
import CityEducation from '@/components/city/CityEducation';
import CitySurveys from '@/components/city/CitySurveys';
import CityExpertiseIndex from '@/components/city/CityExpertiseIndex';
import CityLocalNews from '@/components/city/CityLocalNews';
import LearningMomentCard from '@/components/learning/LearningMomentCard';

export default function CityPage() {
  const [user, setUser] = useState(null);
  const [learningMoment, setLearningMoment] = useState(null);
  const urlParams = new URLSearchParams(window.location.search);
  // Convention unique /city/:slug — extraire le slug du path, ignorer ?slug= legacy
  const slug = urlParams.get('slug') || window.location.pathname.split('/city/')[1]?.split('?')[0] || '';
  const rawTab = urlParams.get('tab');
  // Normalise "predictions" (plural, legacy) → "prediction"
  const tabParam = rawTab === 'predictions' ? 'prediction' : rawTab;
  const VALID_TABS = ['learn', 'surveys', 'prediction', 'history', 'info'];
  const [activeTab, setActiveTab] = useState(VALID_TABS.includes(tabParam) ? tabParam : 'learn');
  const queryClient = useQueryClient();
  const predictionRef = React.useRef(null);

  useEffect(() => {
    if ((tabParam === 'prediction' || rawTab === 'predictions') && predictionRef.current) {
      setTimeout(() => predictionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 400);
    }
  }, [tabParam]);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: city, isLoading } = useQuery({
    queryKey: ['city', slug],
    queryFn: async () => {
      const cities = await base44.entities.City.filter({ slug });
      return cities[0];
    },
    enabled: !!slug
  });

  // SEO
  useEffect(() => {
    if (!city) return;
    document.title = `${city.name} — Sondages Municipales 2026 | PrédiCité`;
    let desc = document.querySelector('meta[name="description"]');
    if (!desc) { desc = document.createElement('meta'); desc.name = 'description'; document.head.appendChild(desc); }
    desc.content = `Suivez les sondages et prédictions pour les municipales 2026 à ${city.name}. Candidats : ${city.candidates?.map(c => c.name).join(', ')}.`;
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) { ogTitle = document.createElement('meta'); ogTitle.setAttribute('property', 'og:title'); document.head.appendChild(ogTitle); }
    ogTitle.content = `${city.name} — Municipales 2026 | PrédiCité`;
  }, [city]);

  const { data: t1Result } = useQuery({
    queryKey: ['election-result-t1', city?.id],
    queryFn: () => base44.entities.ElectionResult.filter({ city_id: city.id, tour: 1 }),
    enabled: !!city?.id,
    select: (data) => data?.[0] || null,
  });

  const scrollToPrediction = () => {
    setActiveTab('prediction');
    setTimeout(() => predictionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
  };

  const { data: userPredictions = [] } = useQuery({
    queryKey: ['predictions', city?.id, user?.email],
    queryFn: async () => {
      if (!city?.id || !user?.email) return [];
      try {
        return await base44.entities.Prediction.filter({ 
          city_id: city.id, 
          user_email: user.email 
        });
      } catch (e) {
        console.error('Failed to fetch predictions:', e);
        return [];
      }
    },
    enabled: !!city?.id && !!user?.email
  });

  const createPrediction = useMutation({
    mutationFn: async (predictions) => {
      if (!predictions || predictions.length === 0) {
        throw new Error('Aucune prédiction à enregistrer');
      }

      try {
        for (const pred of predictions) {
          await base44.entities.Prediction.create({
            ...pred,
            user_email: user.email
          });
        }
        
        // Update user progress
        const progress = await base44.entities.UserProgress.filter({ user_email: user.email });
        if (progress[0]) {
          await base44.entities.UserProgress.update(progress[0].id, {
            predictions_count: (progress[0].predictions_count || 0) + predictions.length,
            total_points: (progress[0].total_points || 0) + (predictions.length * 10),
            last_activity_date: new Date().toISOString().split('T')[0]
          });
        } else {
          await base44.entities.UserProgress.create({
            user_email: user.email,
            predictions_count: predictions.length,
            total_points: predictions.length * 10,
            last_activity_date: new Date().toISOString().split('T')[0],
            daily_streak: 1
          });
        }
      } catch (e) {
        console.error('Prediction creation error:', e);
        throw e;
      }
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['predictions'] });
      queryClient.invalidateQueries({ queryKey: ['user-progress'] });
      toast.success('Prédictions enregistrées ! 🎯');
      // Streak + badges
      try {
        const res = await base44.functions.invoke('updateStreakAndBadges', { extra: {} });
        const newBadges = res?.data?.new_badges || [];
        newBadges.forEach(badge => {
          toast.success(`🏅 Badge débloqué : ${badge.replace(/_/g, ' ')}`, { duration: 4000 });
        });
      } catch {}
      // Learning moment après prédiction
      try {
        if (user?.email && city) {
          const progress = await base44.entities.UserProgress.filter({ user_email: user.email });
          await base44.entities.LearningMoment.create({
            user_email: user.email,
            city_id: city.id,
            type: 'prediction',
            lesson_learned: `Prédiction soumise pour ${city.name}`,
            educational_summary: `En pronostiquant pour ${city.name}, vous analysez les dynamiques politiques locales et affûtez votre sens de l'anticipation électorale.`,
            key_takeaway: `Les prédictions correctes rapportent jusqu'à 100 pts et améliorent votre indice de précision.`
          });
          if (progress[0]) {
            await base44.entities.UserProgress.update(progress[0].id, {
              learning_moments_count: (progress[0].learning_moments_count || 0) + 1
            });
          }
          setLearningMoment({ type: 'prediction', city: city.name });
        }
      } catch {}
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message || 'Impossible de sauvegarder les prédictions'}`);
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!city) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-slate-400 mb-4" />
          <h2 className="text-xl font-semibold text-slate-700">Ville non trouvée</h2>
          <Link to={createPageUrl('Cities')}>
            <Button className="mt-4">Voir toutes les villes</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {learningMoment && (
        <LearningMomentCard
          type={learningMoment.type}
          content={{
            educational_summary: `En pronostiquant pour ${learningMoment.city || city?.name}, vous analysez les dynamiques politiques locales.`,
            key_takeaway: `Les prédictions correctes rapportent jusqu'à 100 pts et améliorent votre indice de précision.`
          }}
          onClose={() => setLearningMoment(null)}
        />
      )}
      {/* Hero */}
      <div className="relative h-64 md:h-80 overflow-hidden bg-[#081532]">
        <img
          src={city.image_url || `https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6984c3b23a32fca616326712/aaa5485bd_ChatGPTImage25fvr202622_41_12.png`}
          alt={city.name}
          className="hidden md:block w-full h-full object-cover scale-105 md:blur-[10px]"
        />
        <div className="absolute inset-0 bg-[#081532]/70" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#081532]/80 via-[#081532]/50 to-transparent" />
        {/* Mobile fallback: pas d'image, juste dégradé */}
        <div className="absolute inset-0 md:hidden bg-gradient-to-b from-[#081532] to-[#081532]" />
        
        <div className="absolute top-4 left-4">
          <Link to={createPageUrl('Cities')}>
            <Button variant="ghost" className="text-white hover:bg-white/20">
              <ChevronLeft className="w-5 h-5 mr-1" />
              Retour
            </Button>
          </Link>
        </div>

        <div className="absolute bottom-6 left-6 right-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-2 text-white/80 mb-2">
              <MapPin className="w-4 h-4" />
              <span>{city.region}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">{city.name}</h1>
            <div className="flex flex-wrap items-center gap-4 text-white/80">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{city.population?.toLocaleString('fr-FR')} habitants</span>
              </div>
              {city.current_mayor && (
                <div className="flex items-center gap-1">
                  <Building2 className="w-4 h-4" />
                  <span>Maire : {city.current_mayor}</span>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bannière résultats T1 */}
      {t1Result && (
        <div className="max-w-7xl mx-auto px-4 pt-6">
          <T1ResultsBanner result={t1Result} onReviserClick={scrollToPrediction} />
        </div>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">

          <TabsList className="bg-white shadow-sm border border-slate-200">
            <TabsTrigger value="learn" className="gap-1.5 text-sm">
              <BookOpen className="w-3.5 h-3.5" />
              Comprendre
            </TabsTrigger>
            <TabsTrigger value="surveys" className="gap-1.5 text-sm">
              <BarChart3 className="w-3.5 h-3.5" />
              Sondages
            </TabsTrigger>
            <TabsTrigger value="prediction" className="gap-1.5 text-sm">
              <Target className="w-3.5 h-3.5" />
              Prédire
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-1.5 text-sm">
              <History className="w-3.5 h-3.5" />
              Historique
            </TabsTrigger>
            <TabsTrigger value="info" className="gap-1.5 text-sm">
              <Lightbulb className="w-3.5 h-3.5" />
              Infos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="learn">
            <CityEducation city={city} />
            {/* Pont contextuel → Sondages */}
            <div className="mt-6 bg-white rounded-2xl border border-slate-100 p-5 flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="font-semibold text-slate-800 text-sm">Vous avez compris le contexte ?</p>
                <p className="text-xs text-slate-400 mt-0.5">Consultez les sondages puis faites votre prédiction</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setActiveTab('surveys')} className="flex items-center gap-1.5 text-xs font-medium text-[#034EA2] border border-[#034EA2]/30 px-3 py-2 rounded-lg hover:bg-[#034EA2]/5 transition-colors">
                  <BarChart3 className="w-3.5 h-3.5" />
                  Voir les sondages
                </button>
                <button onClick={() => setActiveTab('prediction')} className="flex items-center gap-1.5 text-xs font-medium text-white bg-[#034EA2] px-3 py-2 rounded-lg hover:bg-[#023b7a] transition-colors">
                  <Target className="w-3.5 h-3.5" />
                  Prédire
                </button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="surveys">
            <div className="space-y-6">
              <CityLocalNews city={city} />
              <CitySurveys city={city} />
            </div>
            {/* Pont contextuel → Prédiction */}
            <div className="mt-6 bg-[#034EA2]/5 border border-[#034EA2]/15 rounded-2xl p-5 flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="font-semibold text-slate-800 text-sm">Vous avez analysé les sondages ?</p>
                <p className="text-xs text-slate-400 mt-0.5">Engagez votre pronostic et gagnez des points</p>
              </div>
              <button onClick={() => setActiveTab('prediction')} className="flex items-center gap-1.5 text-xs font-semibold text-white bg-[#034EA2] px-4 py-2 rounded-lg hover:bg-[#023b7a] transition-colors">
                <Target className="w-3.5 h-3.5" />
                Faire ma prédiction
              </button>
            </div>
          </TabsContent>

          <TabsContent value="prediction" ref={predictionRef}>
            {/* Indice d'expertise */}
            {user && (
              <div className="mb-6">
                <CityExpertiseIndex city={city} userProgress={null} predictions={userPredictions} quizResponses={[]} />
              </div>
            )}
            <div className="grid lg:grid-cols-2 gap-6">
              <div>
                <PredictionForm 
                  city={city}
                  user={user}
                  existingPredictions={userPredictions}
                  onSubmit={user ? (predictions) => createPrediction.mutateAsync(predictions) : null}
                />
              </div>

              {/* Candidates */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Users className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-slate-800">Candidats déclarés</h3>
                </div>

                {city.candidates?.length > 0 ? (
                  <div className="space-y-4">
                    {city.candidates.map((candidate, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
                      >
                        <div 
                          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                          style={{ backgroundColor: candidate.color || '#6366f1' }}
                        >
                          {candidate.name?.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-slate-800">{candidate.name}</p>
                          <Badge 
                            className="mt-1 text-xs"
                            style={{ 
                              backgroundColor: `${candidate.color || '#6366f1'}20`,
                              color: candidate.color || '#6366f1'
                            }}
                          >
                            {candidate.party}
                          </Badge>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="info">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Situation */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Building2 className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-slate-800">Situation actuelle</h3>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  {city.current_situation || "Informations à venir sur la situation politique de cette ville."}
                </p>
              </div>

              {/* Key issues */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="w-5 h-5 text-orange-500" />
                  <h3 className="font-bold text-slate-800">Enjeux clés</h3>
                </div>
                {city.key_issues?.length > 0 ? (
                  <ul className="space-y-2">
                    {city.key_issues.map((issue, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="bg-orange-100 text-orange-600 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">
                          {i + 1}
                        </span>
                        <span className="text-slate-600">{issue}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-500">Enjeux à définir...</p>
                )}
              </div>

              {/* Political history */}
              <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <History className="w-5 h-5 text-purple-500" />
                  <h3 className="font-bold text-slate-800">Histoire politique</h3>
                </div>
                <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                  {city.political_history || "L'histoire politique de cette ville sera bientôt disponible."}
                </p>
              </div>

              {/* Fun facts */}
              {city.fun_facts?.length > 0 && (
                <div className="lg:col-span-2 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-100">
                  <div className="flex items-center gap-2 mb-4">
                    <Lightbulb className="w-5 h-5 text-amber-600" />
                    <h3 className="font-bold text-slate-800">Le saviez-vous ?</h3>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    {city.fun_facts.map((fact, i) => (
                      <div key={i} className="bg-white/50 rounded-xl p-4">
                        <p className="text-slate-700">{fact}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="history">
            <CityHistory city={city} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}