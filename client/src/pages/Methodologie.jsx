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
    color: '#22C55E',
    items: [
      "Commission électorale centrale d'Israël — le résultat définitif national, sièges par liste, provient de son site officiel (votes26.bechirot.gov.il) ou du jeu de données ouvert data.gov.il.",
      'Tant que la structure de données de la 26ᵉ Knesset n\'est pas confirmée, aucun résultat n\'est publié sur PrédiCité par extrapolation ou approximation — voir la note de transparence ci-dessous.',
    ],
  },
];

export default function Methodologie() {
  return (
    <div className="min-h-screen" style={{ background: '#050505' }}>
      <div className="relative border-b border-white/8" style={{ background: 'rgba(7,18,42,0.98)' }}>
        <div className="max-w-4xl mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex items-center gap-2 text-white/30 text-sm mb-6"
          >
            <Link to={createPageUrl('Home')} className="hover:text-white/60 transition-colors">Accueil</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-white/60">Sources & Méthodologie</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.08 }}
            className="text-3xl md:text-4xl font-black text-white mb-4 leading-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Sources & Méthodologie
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.16 }}
            className="text-white/50 text-base leading-relaxed max-w-2xl"
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
            className="rounded-2xl border border-white/10 p-6 md:p-8"
            style={{ background: 'rgba(255,255,255,0.03)' }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: color + '18', border: `1px solid ${color}30` }}>
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <h2 className="text-lg font-bold text-white">{title}</h2>
            </div>
            <ul className="space-y-3">
              {items.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-white/55 leading-relaxed">
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
            <FileWarning className="w-5 h-5" style={{ color: 'var(--p-gold)' }} />
            <h2 className="text-lg font-bold text-white">Transparence sur une limite actuelle</h2>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(245,240,232,0.6)' }}>
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
            className="inline-flex items-center gap-2 text-sm font-semibold hover:opacity-80 transition-opacity"
            style={{ color: '#4A7FD4' }}
          >
            Voir les listes suivies <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
