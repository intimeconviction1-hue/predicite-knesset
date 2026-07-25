import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { ChevronRight, ShieldCheck, Globe, FileWarning, ExternalLink } from 'lucide-react';

const SOURCES = [
  {
    title: 'Sondages sièges',
    icon: Globe,
    color: '#4A7FD4',
    items: [
      'Instituts/médias francophones qui publient ou traduisent des projections sièges avec méthodologie sourcée : i24NEWS (qui réalise aussi ses propres sondages), Times of Israël (édition française), FokusIsrael.',
      "Instituts/médias israéliens d'origine, en hébreu, quand la traduction des chiffres est fidèle : Midgam (Kan 11/Channel 12), Direct Polls (Channel 14), Kantar (Kan 11), Panels Politics, Lazar (Maariv), Statistics (Channel 13).",
      'Règle stricte : aucune donnée inventée, estimée ou extrapolée. Un sondage doit avoir un institut identifié, une date de terrain, une source_url réelle et des chiffres exacts — sinon il n\'est pas publié.',
    ],
  },
  {
    title: 'Résultats officiels',
    icon: ShieldCheck,
    color: '#16794A',
    items: [
      "Commission électorale centrale d'Israël — le résultat définitif national, sièges par liste, provient de son site officiel (votes26.bechirot.gov.il) ou du jeu de données ouvert data.gov.il.",
      'Tant que la structure de données de la 26ᵉ Knesset n\'est pas confirmée, aucun résultat n\'est publié sur PrédiCité par extrapolation ou approximation — voir la note de transparence ci-dessous.',
    ],
  },
];

export default function Methodologie() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--p-night)' }}>
      <div className="relative overflow-hidden">
        <div className="absolute inset-0" style={{
          backgroundImage: "url('/images/methodologie-hero.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }} />
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(180deg, rgba(5,10,24,0.6) 0%, rgba(5,10,24,0.8) 60%, var(--p-night) 100%)',
        }} />
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse at 85% 0%, rgba(34,197,94,0.1) 0%, transparent 55%)',
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
            <span style={{ color: 'rgba(245,240,232,0.7)' }}>Sources & Méthodologie</span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.06 }}
            className="flex items-center gap-2 mb-3 px-3 py-1.5 rounded-full w-fit"
            style={{ background: 'rgba(34,197,94,0.15)', border: '0.5px solid rgba(34,197,94,0.4)' }}
          >
            <motion.div className="w-1.5 h-1.5 rounded-full" style={{ background: '#22C55E' }}
              animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }} />
            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#4ADE80' }}>
              Vérifié en continu · zéro donnée inventée
            </span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.08 }}
            className="text-3xl md:text-4xl font-black mb-4 leading-tight"
            style={{ fontFamily: 'var(--font-display)', color: 'white' }}
          >
            Sources & Méthodologie
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.16 }}
            className="text-base leading-relaxed max-w-2xl"
            style={{ color: 'rgba(245,240,232,0.6)' }}
          >
            PrédiCité ne publie que des données réelles, sourcées et datées.
            Aucun chiffre n'est inventé, estimé ou complété pour « faire joli ».
          </motion.p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
        {SOURCES.map(({ title, icon: Icon, color, items }, index) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-10%' }}
            transition={{ duration: 0.4, delay: index * 0.08 }}
            whileHover={{ y: -2 }}
            className="rounded-2xl border p-6 md:p-8 transition-colors duration-300 hover:border-[var(--p-border-hover)]"
            style={{ background: 'var(--p-card)', borderColor: 'var(--p-border)' }}
          >
            <div className="flex items-center gap-3 mb-4">
              <motion.div
                whileHover={{ scale: 1.08 }}
                transition={{ type: 'spring', stiffness: 300, damping: 12 }}
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: color + '18', border: `1px solid ${color}30` }}
              >
                <Icon className="w-4 h-4" style={{ color }} />
              </motion.div>
              <h2 className="text-lg font-bold" style={{ color: 'var(--p-text)' }}>{title}</h2>
            </div>
            <ul className="space-y-3">
              {items.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm leading-relaxed" style={{ color: 'var(--p-text-60)' }}>
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
        ))}

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-10%' }}
          transition={{ duration: 0.4, delay: SOURCES.length * 0.08 }}
          className="rounded-2xl border p-6 md:p-8"
          style={{ borderColor: 'rgba(212,175,55,0.25)', background: 'rgba(212,175,55,0.05)' }}
        >
          <div className="flex items-center gap-3 mb-3">
            <FileWarning className="w-5 h-5" style={{ color: 'var(--p-gold-text)' }} />
            <h2 className="text-lg font-bold" style={{ color: 'var(--p-text)' }}>Transparence sur une limite actuelle</h2>
            <motion.div className="w-1.5 h-1.5 rounded-full ml-auto flex-shrink-0" style={{ background: 'var(--p-gold)' }}
              animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }} />
          </div>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--p-text-60)' }}>
            Au moment où ces lignes sont écrites, le site officiel de la 26ᵉ Knesset
            n'était pas encore structuré (la Knesset a été dissoute le 17 juillet
            2026, le scrutin est fixé au 27 octobre). Le collecteur de résultats
            vérifie l'accessibilité du site plutôt que d'inventer un résultat — il
            vaut mieux ne rien afficher que d'afficher un chiffre faux.
          </p>
        </motion.div>

        <div className="text-center pt-4">
          <Link
            to={createPageUrl('Listes')}
            className="group inline-flex items-center gap-2 text-sm font-semibold hover:opacity-80 transition-opacity"
            style={{ color: 'var(--p-blue)' }}
          >
            Voir les listes suivies <ExternalLink className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
