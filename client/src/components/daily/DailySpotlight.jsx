import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import { 
  Sparkles, ArrowRight, Trophy, HelpCircle, 
  Target, Flame, Clock, Gift 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getCampaignPhase } from '@/components/campaign/CampaignPhase';

export default function DailySpotlight() {
  const [phase, setPhase] = useState(getCampaignPhase());
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const interval = setInterval(() => {
      setPhase(getCampaignPhase());
      
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setHours(24, 0, 0, 0);
      const diff = tomorrow - now;
      
      setTimeLeft({
        hours: Math.floor(diff / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000)
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const { data: dailyChallenge } = useQuery({
    queryKey: ['daily-challenge'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const challenges = await base44.entities.DailyChallenge.filter({ date: today });
      return challenges[0];
    }
  });

  const getPhaseContent = () => {
    switch(phase) {
      case 'campaign_start':
        return {
          icon: Target,
          color: 'from-blue-500 to-indigo-600',
          title: '🎯 Rendez-vous du jour',
          subtitle: 'Découvrez les candidats et faites vos premières prédictions',
          actions: [
            { label: 'Quiz découverte', link: 'Quiz', icon: HelpCircle, color: 'bg-blue-600' },
            { label: 'Explorer les villes', link: 'Cities', icon: Target, color: 'bg-indigo-600' }
          ]
        };
      case 'intense':
        return {
          icon: Flame,
          color: 'from-orange-500 to-red-600',
          title: '🔥 Mission du jour',
          subtitle: 'Campagne intense ! Affinez vos prédictions',
          actions: [
            { label: 'Quiz avancé', link: 'Quiz', icon: HelpCircle, color: 'bg-orange-600' },
            { label: 'Prédictions tactiques', link: 'Cities', icon: Target, color: 'bg-red-600' }
          ]
        };
      case 'final_week':
        return {
          icon: Sparkles,
          color: 'from-red-500 to-pink-600',
          title: '⚡ Défi urgent',
          subtitle: 'Dernière semaine ! Doublez vos points',
          actions: [
            { label: 'Quiz express', link: 'Quiz', icon: HelpCircle, color: 'bg-red-600' },
            { label: 'Dernières chances', link: 'Cities', icon: Flame, color: 'bg-pink-600' }
          ]
        };
      case 'eve':
        return {
          icon: Clock,
          color: 'from-purple-600 to-indigo-700',
          title: '⏰ Dernières heures',
          subtitle: 'Prédictions closes à minuit !',
          actions: [
            { label: 'Quiz de la dernière chance', link: 'Quiz', icon: HelpCircle, color: 'bg-purple-600' },
            { label: 'Finalisez tout', link: 'Cities', icon: Clock, color: 'bg-indigo-700' }
          ]
        };
      case 'election_day':
        return {
          icon: Trophy,
          color: 'from-yellow-500 to-amber-600',
          title: '🗳️ C\'EST LE JOUR J',
          subtitle: 'Résultats en direct dès 20h !',
          actions: [
            { label: 'Soirée électorale', link: 'ElectionNight', icon: Trophy, color: 'bg-yellow-600' },
            { label: 'Voir mes prédictions', link: 'Profile', icon: Target, color: 'bg-amber-600' }
          ]
        };
      default:
        return {
          icon: Gift,
          color: 'from-emerald-500 to-teal-600',
          title: '🎁 Activité du jour',
          subtitle: 'Découvrez votre défi quotidien',
          actions: [
            { label: 'Quiz', link: 'Quiz', icon: HelpCircle, color: 'bg-emerald-600' },
            { label: 'Prédictions', link: 'Cities', icon: Target, color: 'bg-teal-600' }
          ]
        };
    }
  };

  const content = getPhaseContent();
  const Icon = content.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden"
    >
      <div className={`bg-gradient-to-r ${content.color} rounded-3xl p-8 shadow-2xl`}>
        {/* Background animation */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-white/20 rounded-full"
              initial={{ 
                x: Math.random() * 100 + '%', 
                y: Math.random() * 100 + '%',
                scale: Math.random() * 0.5 + 0.5
              }}
              animate={{ 
                y: [null, (Math.random() - 0.5) * 100 + '%'],
                x: [null, (Math.random() - 0.5) * 100 + '%'],
                scale: [null, Math.random() * 1.5 + 0.5]
              }}
              transition={{ 
                duration: Math.random() * 3 + 2,
                repeat: Infinity,
                repeatType: 'reverse'
              }}
            />
          ))}
        </div>

        <div className="relative">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <motion.div
                animate={{ 
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 1
                }}
                className="bg-white/20 backdrop-blur-sm rounded-2xl p-4"
              >
                <Icon className="w-10 h-10 text-white" />
              </motion.div>
              
              <div>
                <h2 className="text-3xl font-bold text-white mb-1">
                  {content.title}
                </h2>
                <p className="text-white/90 text-lg">{content.subtitle}</p>
              </div>
            </div>

            {/* Countdown */}
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-3 text-center">
              <div className="text-white/70 text-xs mb-1">Nouveau défi dans</div>
              <div className="text-white font-mono font-bold text-xl">
                {String(timeLeft.hours).padStart(2, '0')}:
                {String(timeLeft.minutes).padStart(2, '0')}:
                {String(timeLeft.seconds).padStart(2, '0')}
              </div>
            </div>
          </div>

          {/* Daily Challenge */}
          {dailyChallenge && (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-white/20 text-white border-white/30">
                      {dailyChallenge.challenge_type === 'quiz' && '❓ Quiz'}
                      {dailyChallenge.challenge_type === 'prediction' && '🎯 Prédiction'}
                      {dailyChallenge.challenge_type === 'survey' && '📊 Sondage'}
                      {dailyChallenge.challenge_type === 'special' && '⭐ Spécial'}
                    </Badge>
                    {dailyChallenge.is_special_event && (
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        <Badge className="bg-yellow-400 text-yellow-900">
                          <Sparkles className="w-3 h-3 mr-1" />
                          Événement
                        </Badge>
                      </motion.div>
                    )}
                  </div>
                  <h3 className="text-white font-bold text-xl mb-2">
                    {dailyChallenge.title}
                  </h3>
                  <p className="text-white/80 text-sm">
                    {dailyChallenge.description}
                  </p>
                </div>
                <div className="text-right ml-4">
                  <div className="bg-white/20 rounded-xl px-4 py-2">
                    <div className="text-white/70 text-xs">Récompense</div>
                    <div className="text-white font-bold text-2xl">
                      {dailyChallenge.points_reward}
                      <span className="text-sm ml-1">pts</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Actions */}
          <div className="grid grid-cols-2 gap-4">
            {content.actions.map((action, i) => {
              const ActionIcon = action.icon;
              return (
                <Link key={i} to={createPageUrl(action.link)}>
                  <motion.div
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button 
                      className={`w-full h-auto ${action.color} hover:opacity-90 text-white border-0 py-4`}
                      size="lg"
                    >
                      <ActionIcon className="w-5 h-5 mr-2" />
                      {action.label}
                      <ArrowRight className="w-4 h-4 ml-auto" />
                    </Button>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}