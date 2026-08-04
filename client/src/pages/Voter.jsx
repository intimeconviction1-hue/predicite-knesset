import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { UserCheck, CalendarDays, MapPin, FileText, Landmark, Globe, ArrowRight, Info } from 'lucide-react';
import CinematicHero from '@/components/knesset/CinematicHero';
import AnimatedExplainer from '@/components/knesset/AnimatedExplainer';

// 3ᵉ axe « Voter » : pédagogie PRATIQUE du vote pour les électeurs — comment on
// vote concrètement en Israël. Faits stables et généraux (pas de détail daté).
const VOTER_STEPS = [
  { icon: UserCheck,    color: '#2B5CE6', kicker: 'Qui',        stat: '18+',        title: 'Qui peut voter',      text: "Tout citoyen israélien de 18 ans ou plus, inscrit automatiquement sur les listes électorales." },
  { icon: CalendarDays, color: '#0EA5E9', kicker: 'Quand',      stat: 'jour férié', title: 'Le jour du scrutin',  text: "Le jour de l'élection est un jour férié ; les bureaux de vote sont ouverts toute la journée." },
  { icon: MapPin,       color: '#7A5F1A', kicker: 'Où',         stat: 'ton bureau', title: 'Où voter',            text: "Dans le bureau de vote qui t'est assigné, sur présentation d'une pièce d'identité." },
  { icon: FileText,     color: 'var(--p-green-text)', kicker: 'Le bulletin', stat: 'une liste',  title: 'Un vote par lettres', text: "Dans l'isoloir, tu prends la fiche portant les lettres hébraïques de ta liste et tu la glisses dans une enveloppe." },
  { icon: Landmark,     color: '#D4AF37', kicker: "L'urne",     stat: '✓',          title: "Dans l'urne",         text: "Tu déposes l'enveloppe dans l'urne. C'est un vote papier, pour une liste entière — pas pour un nom." },
];

const NOTES = [
  { icon: FileText, title: 'Le vote par « lettres »', text: "Chaque liste est identifiée par un code de lettres hébraïques imprimé sur son bulletin. Repère les lettres de ta liste avant d'entrer dans l'isoloir." },
  { icon: Globe, title: "Depuis l'étranger", text: "Le vote à distance est très restreint : il n'existe pas de vote par correspondance général. On vote presque toujours physiquement, en Israël." },
];

export default function Voter() {
  return (
    <div className="min-h-screen" style={{ background: 'transparent' }}>
      <CinematicHero
        size="md"
        photos={['/images/knesset-hero.jpg']}
        position="center 30%"
        kicker="Passer à l'acte · côté électeur"
        title="Comment on vote"
        subtitle="Au-delà du jeu : le mode d'emploi concret du vote aux législatives israéliennes — qui, quand, où, et comment se déroule le passage dans l'isoloir."
      />

      <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
        {/* Explainer animé « voter, étape par étape » */}
        <AnimatedExplainer steps={VOTER_STEPS} label="Voter en Israël · étape par étape" />

        <div className="grid sm:grid-cols-2 gap-4">
          {NOTES.map(({ icon: Icon, title, text }) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-10%' }} transition={{ duration: 0.4 }}
              className="rounded-2xl border p-5" style={{ background: 'var(--p-card)', borderColor: 'var(--p-border)' }}
            >
              <Icon className="w-5 h-5 mb-2" style={{ color: 'var(--p-gold-text)' }} />
              <p className="text-sm font-bold mb-1" style={{ color: 'var(--p-text)' }}>{title}</p>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--p-text-60)' }}>{text}</p>
            </motion.div>
          ))}
        </div>

        <div className="flex items-start gap-2 text-xs rounded-xl p-3" style={{ background: 'var(--p-blue-dim)', border: '0.5px solid var(--p-border)', color: 'var(--p-text-40)' }}>
          <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: 'var(--p-blue)' }} />
          <p>Cette page décrit le déroulé général et stable du vote. Pour les démarches officielles et ton bureau de vote, réfère-toi toujours à la Commission électorale centrale.</p>
        </div>

        {/* Vase communicant : voir les lettres des listes */}
        <div className="rounded-2xl p-5 flex items-center justify-between gap-3 flex-wrap" style={{ background: 'var(--p-card)', border: '0.5px solid var(--p-gold-border)' }}>
          <div>
            <p className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--p-text)' }}>Repère les lettres de ta liste</p>
            <p className="text-xs" style={{ color: 'var(--p-text-40)' }}>Chaque liste et son code de lettres, sur sa fiche.</p>
          </div>
          <Link to={createPageUrl('Listes')} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[10px] font-semibold text-sm text-white transition-transform hover:-translate-y-0.5 flex-shrink-0" style={{ background: 'var(--p-blue)', boxShadow: '0 8px 20px -8px rgba(43,92,230,0.6)' }}>
            Les listes <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
