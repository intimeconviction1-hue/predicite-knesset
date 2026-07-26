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
        <div className="p-tricolor"><div /><div /><div /></div>
        <div className="absolute inset-x-0 top-0 h-[360px] pointer-events-none" style={{
          background: 'radial-gradient(ellipse 70% 100% at 50% 0%, rgba(212,175,55,0.16), transparent 62%)',
        }} />
        <div className="relative max-w-4xl mx-auto px-4 py-14">
          <div className="flex items-center gap-2 text-sm mb-6" style={{ color: 'var(--p-text-40)' }}>
            <Link to={createPageUrl('Home')} className="hover:text-[var(--p-text)] transition-colors">Accueil</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span style={{ color: 'var(--p-text-60)' }} aria-current="page">Actu</span>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <Newspaper className="w-4 h-4" style={{ color: 'var(--p-gold-text)' }} />
            <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--p-gold-text)' }}>La campagne en direct</p>
          </div>
          <motion.h1
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
            className="text-3xl md:text-5xl font-black mb-4 leading-tight"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--p-text)', letterSpacing: '-0.02em' }}
          >
            Actu Knesset 2026
          </motion.h1>
          <p className="text-base md:text-lg leading-relaxed max-w-2xl" style={{ color: 'var(--p-text-60)' }}>
            Un flux automatique de vrais médias francophones, complété par quelques résumés PrédiCité traduits de sources israéliennes quand l'info manque en français — toujours signalés et sourcés.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="flex items-start gap-2 mb-6 text-xs rounded-lg p-3" style={{ background: 'rgba(43,92,230,0.06)', border: '1px solid var(--p-border)', color: 'var(--p-text-40)' }}>
          <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: 'var(--p-blue)' }} />
          <p>Flux automatique (Google News) rafraîchi régulièrement, plus quelques <b style={{ color: 'var(--p-gold-text)', fontWeight: 600 }}>résumés PrédiCité</b> traduits de sources israéliennes — toujours signalés comme tels et sourcés. Chaque élément renvoie vers l'article d'origine.</p>
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
            {items.map((item, i) => item.curated ? (
              // Résumé PrédiCité — carte distincte (liseré doré + badge) pour ne
              // jamais être confondu avec un article de presse original.
              <motion.a
                key={item.link + i}
                href={item.link} target="_blank" rel="noopener noreferrer"
                initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-5%' }}
                transition={{ duration: 0.3, delay: Math.min(i * 0.03, 0.3) }}
                whileHover={{ y: -1 }}
                className="block rounded-xl p-4 transition-colors duration-200"
                style={{ background: 'var(--p-card)', border: '1px solid var(--p-gold-border)', borderLeft: '3px solid var(--p-gold)' }}
              >
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="p-badge p-badge-gold">Résumé PrédiCité</span>
                  {item.source && <span className="text-xs" style={{ color: 'var(--p-text-40)' }}>d'après {item.source}</span>}
                </div>
                <p className="text-sm font-semibold leading-snug" style={{ color: 'var(--p-text)' }}>{item.title}</p>
                {item.summary && <p className="text-[13px] leading-relaxed mt-1.5" style={{ color: 'var(--p-text-60)' }}>{item.summary}</p>}
                <div className="flex items-center gap-2 mt-2.5 text-xs" style={{ color: 'var(--p-text-40)' }}>
                  <span>{timeAgo(item.pubDate)}</span><span>·</span>
                  <span className="inline-flex items-center gap-1 font-semibold" style={{ color: 'var(--p-blue)' }}>Lire l'original <ExternalLink className="w-3 h-3" /></span>
                </div>
              </motion.a>
            ) : (
              <motion.a
                key={item.link + i}
                href={item.link} target="_blank" rel="noopener noreferrer"
                initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
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

        <div className="flex items-center justify-center gap-2 mt-8 pt-6 border-t text-sm text-center" style={{ borderColor: 'var(--p-border)', color: 'var(--p-text-40)' }}>
          <span>Cette actu vous inspire un pronostic ? <Link to={createPageUrl('Listes')} className="underline hover:opacity-80" style={{ color: 'var(--p-blue)' }}>Voir les listes</Link> ou <Link to={createPageUrl('PremierMinistre')} className="underline hover:opacity-80" style={{ color: 'var(--p-blue)' }}>pronostiquer le Premier ministre</Link>.</span>
        </div>
      </div>
    </div>
  );
}
