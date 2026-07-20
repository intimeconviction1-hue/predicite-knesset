import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Flame, Zap } from 'lucide-react';

const ELECTION_DATE = new Date('2026-03-15T08:00:00');

export default function ElectionCountdown() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [phase, setPhase] = useState('campaign');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = ELECTION_DATE - now;
      
      if (difference <= 0) {
        setPhase('results');
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      if (days <= 7) setPhase('final');
      else if (days <= 30) setPhase('intense');
      else setPhase('campaign');

      return {
        days,
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      };
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, []);

  const phaseStyles = {
    campaign: { bg: 'from-blue-600 to-indigo-700', icon: Clock },
    intense: { bg: 'from-orange-500 to-red-600', icon: Flame },
    final: { bg: 'from-red-600 to-pink-600', icon: Zap },
    results: { bg: 'from-emerald-500 to-teal-600', icon: Zap }
  };

  const { bg, icon: PhaseIcon } = phaseStyles[phase];

  const TimeBlock = ({ value, label }) => (
    <motion.div
      className="flex flex-col items-center"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring" }}
    >
      <motion.div
        key={value}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-3 min-w-[70px] md:min-w-[90px]"
      >
        <span className="text-3xl md:text-5xl font-bold text-white tabular-nums">
          {String(value).padStart(2, '0')}
        </span>
      </motion.div>
      <span className="text-white/80 text-xs md:text-sm mt-2 uppercase tracking-wider">
        {label}
      </span>
    </motion.div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-r ${bg} rounded-2xl p-6 md:p-8 shadow-2xl`}
    >
      <div className="flex items-center justify-center gap-2 mb-6">
        <PhaseIcon className="w-6 h-6 text-white animate-pulse" />
        <h2 className="text-white text-lg md:text-xl font-semibold">
          {phase === 'results' ? '🎉 Les résultats sont là !' : 
           phase === 'final' ? '🔥 Dernière ligne droite !' :
           phase === 'intense' ? '⚡ La campagne s\'intensifie !' :
           '📅 Élections municipales 2026'}
        </h2>
      </div>

      <div className="flex justify-center items-center gap-3 md:gap-6">
        <TimeBlock value={timeLeft.days} label="Jours" />
        <span className="text-white/60 text-3xl md:text-5xl font-light">:</span>
        <TimeBlock value={timeLeft.hours} label="Heures" />
        <span className="text-white/60 text-3xl md:text-5xl font-light">:</span>
        <TimeBlock value={timeLeft.minutes} label="Min" />
        <span className="text-white/60 text-3xl md:text-5xl font-light hidden md:block">:</span>
        <div className="hidden md:block">
          <TimeBlock value={timeLeft.seconds} label="Sec" />
        </div>
      </div>

      <p className="text-white/70 text-center mt-6 text-sm">
        Premier tour : 15 mars 2026 • Second tour : 22 mars 2026
      </p>
    </motion.div>
  );
}