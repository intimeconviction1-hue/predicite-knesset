import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { ChevronRight, BookOpen, ArrowRight, Users } from 'lucide-react';
import KnessetRulesModule from '@/components/election/KnessetRulesModule';
import CoalitionRulesModule from '@/components/election/CoalitionRulesModule';
import QuizWidget from '@/components/knesset/QuizWidget';
import Hemicycle from '@/components/knesset/Hemicycle';
import CountUp from '@/components/knesset/CountUp';
import ElectionTimeline from '@/components/knesset/ElectionTimeline';

// Schéma « de la voix au siège » — 4 étapes clés du mécanisme, visuellement.
const FLOW = [
  { emoji: '🗳️', t: 'Les voix', d: 'Chaque bulletin va à une liste, au niveau national.' },
  { emoji: '🚪', t: 'Le seuil', d: 'Sous 3,25 %, la liste n\'a aucun siège.' },
  { emoji: '➗', t: 'Répartition', d: 'Les 120 sièges sont répartis à la proportionnelle (méthode d\'Hondt).' },
  { emoji: '🏛️', t: 'Les sièges', d: 'Attribués dans l\'ordre de la liste, de haut en bas.' },
];

const KEY_NUMBERS = [
  { value: 120, suffix: '', label: 'sièges à la Knesset', color: 'var(--p-blue)' },
  { value: 61, suffix: '', label: 'sièges pour la majorité', color: 'var(--p-gold)' },
  { value: 3.25, suffix: ' %', label: 'seuil électoral', color: '#22C55E', decimals: 2 },
];

export default function Learn() {
  return (
    <div className="min-h-screen" style={{ background: 'transparent' }}>
      <div className="relative overflow-hidden">
        <div className="absolute inset-0" style={{
          backgroundImage: "url('/images/learn-hero.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }} />
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(180deg, rgba(5,10,24,0.32) 0%, rgba(5,10,24,0.52) 60%, var(--p-night) 100%)',
        }} />
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse at 15% 0%, rgba(212,175,55,0.15) 0%, transparent 55%)',
        }} />
        <div className="relative max-w-4xl mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex items-center gap-2 text-sm mb-6"
            style={{ color: 'rgba(245,240,232,0.4)' }}
          >
            <Link to={createPageUrl('Home')} className="hover:text-white transition-colors">Accueil</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span style={{ color: 'rgba(245,240,232,0.7)' }}>L'élection</span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.06 }}
            className="flex items-center gap-2 mb-3"
          >
            <BookOpen className="w-4 h-4" style={{ color: 'var(--p-gold)' }} />
            <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--p-gold)' }}>Comprendre avant de pronostiquer</p>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.12 }}
            className="text-3xl md:text-4xl font-black mb-4 leading-tight"
            style={{ fontFamily: 'var(--font-display)', color: 'white' }}
          >
            Les législatives israéliennes, expliquées
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.18 }}
            className="text-base leading-relaxed max-w-2xl"
            style={{ color: 'rgba(245,240,232,0.6)' }}
          >
            Le 27 octobre 2026, Israël élit les 120 membres de la 26ᵉ Knesset. Deux
            choses à comprendre avant de pronostiquer : comment les voix se
            transforment en sièges, et comment un gouvernement se forme une fois
            les résultats connus.
          </motion.p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-10">

        {/* Hémicycle vierge — même composant signature que Home, ici pour visualiser
            d'un coup d'œil les deux chiffres qui structurent tout le reste : 120 sièges, majorité à 61 */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-10%' }}
          transition={{ duration: 0.4 }}
          className="relative overflow-hidden rounded-3xl px-6 pt-8 pb-4 md:px-10"
          style={{ border: '0.5px solid rgba(245,240,232,0.08)' }}
        >
          <div className="absolute inset-0" style={{
            backgroundImage: "url('/images/listes-hero.jpg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }} />
          <div className="absolute inset-0" style={{
            background: 'radial-gradient(ellipse at 50% 0%, rgba(30,58,138,0.2) 0%, rgba(10,18,38,0.6) 65%)',
          }} />
          <div className="relative">
          <Hemicycle seatsByListe={[]} listes={[]} height={170} />
          <div className="grid grid-cols-3 gap-2 -mt-2 pt-4 border-t" style={{ borderColor: 'rgba(245,240,232,0.06)' }}>
            {KEY_NUMBERS.map((n, i) => (
              <div key={n.label} className="text-center">
                <p className="text-2xl md:text-3xl font-black font-mono leading-none" style={{ color: n.color }}>
                  <CountUp value={n.value} decimals={n.decimals} suffix={n.suffix} delay={i * 150} />
                </p>
                <p className="text-[10px] uppercase tracking-wide mt-1.5" style={{ color: 'rgba(245,240,232,0.35)' }}>{n.label}</p>
              </div>
            ))}
          </div>
          </div>
        </motion.div>

        {/* Les primaires — première étape : les partis composent leurs listes,
            AVANT le vote. Pédagogie + statut réel 2026, sourcé. */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-10%' }}
          transition={{ duration: 0.4, delay: 0.04 }}
          className="rounded-2xl border p-6 md:p-8"
          style={{ background: 'var(--p-card)', borderColor: 'var(--p-border)' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5" style={{ color: 'var(--p-gold-text)' }} />
            <h3 className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--p-text)' }}>1. Les primaires : qui choisit les candidats ?</h3>
          </div>
          <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--p-text-60)' }}>
            Avant même le vote, chaque parti compose sa liste de candidats — l'ordre compte, car les sièges sont attribués de haut en bas. Deux méthodes coexistent :
          </p>
          <div className="grid sm:grid-cols-2 gap-3 mb-4">
            <div className="rounded-xl border p-4" style={{ background: 'var(--p-night-2)', borderColor: 'var(--p-border)' }}>
              <p className="text-sm font-bold mb-1" style={{ color: 'var(--p-blue)' }}>Primaires</p>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--p-text-60)' }}>Les adhérents (ou un comité central) votent pour classer les candidats. Minoritaire, mais démocratique en interne.</p>
            </div>
            <div className="rounded-xl border p-4" style={{ background: 'var(--p-night-2)', borderColor: 'var(--p-border)' }}>
              <p className="text-sm font-bold mb-1" style={{ color: 'var(--p-gold-text)' }}>Sélection directe</p>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--p-text-60)' }}>Le chef du parti désigne lui-même sa liste. C'est le cas le plus courant, surtout pour les nouveaux partis.</p>
            </div>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--p-text-60)' }}>
            <b style={{ color: 'var(--p-text)' }}>Où on en est (fin juillet 2026) :</b> Les Démocrates (20 juillet) et le Sionisme religieux (26 juillet) ont voté ; le Likoud tient ses primaires le 4 août. La plupart des autres partis désignent directement. Toutes les listes doivent être déposées avant le <b style={{ color: 'var(--p-text)' }}>9 septembre</b>.
          </p>
          <a href="https://www.jpost.com/israel-news/politics-and-diplomacy/article-902333" target="_blank" rel="noopener noreferrer" className="text-xs mt-3 inline-block hover:opacity-80 transition-opacity" style={{ color: 'var(--p-blue)' }}>
            Source ↗
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-10%' }}
          transition={{ duration: 0.4 }}
        >
          <KnessetRulesModule />
        </motion.div>

        {/* Schéma visuel « de la voix au siège » */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-10%' }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="rounded-2xl border p-6 md:p-8"
          style={{ background: 'var(--p-card)', borderColor: 'var(--p-border)' }}
        >
          <h3 className="text-lg font-bold mb-5" style={{ fontFamily: 'var(--font-display)', color: 'var(--p-text)' }}>De la voix au siège, en 4 étapes</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {FLOW.map((s, i) => (
              <div key={i} className="rounded-xl border p-4 text-center" style={{ background: 'var(--p-night-2)', borderColor: 'var(--p-border)' }}>
                <div className="text-2xl mb-2" aria-hidden="true">{s.emoji}</div>
                <p className="text-sm font-bold mb-1" style={{ color: 'var(--p-text)' }}>{i + 1}. {s.t}</p>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--p-text-40)' }}>{s.d}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-10%' }}
          transition={{ duration: 0.4, delay: 0.08 }}
        >
          <CoalitionRulesModule />
        </motion.div>

        {/* Le calendrier — frise visuelle des grandes étapes du scrutin */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-10%' }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="rounded-2xl border p-6 md:p-8"
          style={{ background: 'var(--p-card)', borderColor: 'var(--p-border)' }}
        >
          <h3 className="text-lg font-bold mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--p-text)' }}>Le calendrier de l'élection</h3>
          <ElectionTimeline />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-10%' }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <QuizWidget />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-10%' }}
          transition={{ duration: 0.4 }}
          whileHover={{ y: -2 }}
          className="rounded-2xl border p-8 text-center transition-colors duration-300 hover:border-[var(--p-border-hover)]"
          style={{ background: 'rgba(30,58,138,0.08)', borderColor: 'var(--p-border)' }}
        >
          <p className="text-sm mb-4" style={{ color: 'var(--p-text-40)' }}>Prêt à mettre ça en pratique ?</p>
          <Link
            to={createPageUrl('Listes')}
            className="group inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-85"
            style={{ background: 'linear-gradient(135deg,#1E3A8A,#2B5CE6)' }}
          >
            Voir les listes et pronostiquer
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
