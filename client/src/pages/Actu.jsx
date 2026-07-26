import React from 'react';
import { base44 } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { ChevronRight, Newspaper, ExternalLink, Info } from 'lucide-react';

function timeAgo(pubDate) {
  if (!pubDate) return '';
  const d = new Date(pubDate);
  if (Number.isNaN(d.getTime())) return '';
  const diffH = Math.round((Date.now() - d.getTime()) / 3600000);
  if (diffH < 1) return "à l'instant";
  if (diffH < 24) return `il y a ${diffH} h`;
  const diffJ = Math.round(diffH / 24);
  if (diffJ === 1) return 'hier';
  if (diffJ < 7) return `il y a ${diffJ} j`;
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function cleanTitle(title, source) {
  if (!title) return '';
  if (source && title.endsWith(` - ${source}`)) return title.slice(0, -(source.length + 3));
  return title.replace(/\s-\s[^-]{2,40}$/, (m) => (m.length < 40 ? '' : m));
}

export default function Actu() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['actu'],
    queryFn: () => base44.actu.list(),
    staleTime: 10 * 60 * 1000,
  });
  const items = data?.items || [];

  return (
    <div className="min-h-screen" style={{ background: 'transparent' }}>
      <div className="relative overflow-hidden">
        <div className="absolute inset-0" style={{
          backgroundImage: "url('/images/learn-hero.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }} />
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(180deg, rgba(5,10,24,0.35) 0%, rgba(5,10,24,0.55) 60%, var(--p-night) 100%)',
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
            <span style={{ color: 'rgba(245,240,232,0.7)' }} aria-current="page">Actu</span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.06 }}
            className="flex items-center gap-2 mb-3"
          >
            <Newspaper className="w-4 h-4" style={{ color: 'var(--p-gold)' }} />
            <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--p-gold)' }}>La campagne en direct</p>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.12 }}
            className="text-3xl md:text-4xl font-black mb-4 leading-tight"
            style={{ fontFamily: 'var(--font-display)', color: 'white' }}
          >
            Actu Knesset 2026
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.18 }}
            className="text-base leading-relaxed max-w-2xl"
            style={{ color: 'rgba(245,240,232,0.6)' }}
          >
            Ce qui bouge dans la campagne — fusions, sondages, accords de coalition — agrégé automatiquement depuis de vrais médias, sans curation manuelle.
          </motion.p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="flex items-start gap-2 mb-6 text-xs rounded-lg p-3" style={{ background: 'rgba(43,92,230,0.06)', border: '1px solid var(--p-border)', color: 'var(--p-text-40)' }}>
          <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: 'var(--p-blue)' }} />
          <p>Flux automatique (Google News), rafraîchi régulièrement — aucun tri éditorial de notre part. Chaque titre renvoie vers l'article original de son média.</p>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: 'var(--p-border)' }} />)}
          </div>
        ) : isError || items.length === 0 ? (
          <div className="rounded-xl border p-6 text-center text-sm" style={{ borderColor: 'var(--p-border)', color: 'var(--p-text-40)' }}>
            Actualité momentanément indisponible — réessayez dans quelques minutes.
          </div>
        ) : (
          <div className="space-y-2.5">
            {items.map((item, i) => (
              <motion.a
                key={item.link + i}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-5%' }}
                transition={{ duration: 0.3, delay: Math.min(i * 0.03, 0.3) }}
                whileHover={{ y: -1 }}
                className="flex items-start gap-3 rounded-xl border p-4 transition-colors duration-200 hover:border-[var(--p-border-hover)]"
                style={{ background: 'var(--p-card)', borderColor: 'var(--p-border)' }}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold leading-snug" style={{ color: 'var(--p-text)' }}>{cleanTitle(item.title, item.source)}</p>
                  <div className="flex items-center gap-2 mt-1.5 text-xs" style={{ color: 'var(--p-text-40)' }}>
                    {item.source && <span className="font-semibold" style={{ color: 'var(--p-gold-text)' }}>{item.source}</span>}
                    {item.source && item.pubDate && <span>·</span>}
                    <span>{timeAgo(item.pubDate)}</span>
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: 'var(--p-text-25)' }} />
              </motion.a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
