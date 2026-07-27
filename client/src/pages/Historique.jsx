import React, { useState } from 'react';
import { base44 } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronDown, Landmark, ExternalLink, Info } from 'lucide-react';
import QuizWidget from '@/components/knesset/QuizWidget';

function EvolutionChart({ elections }) {
  if (!elections || elections.length < 2) return null;
  const sorted = [...elections].sort((a, b) => a.knesset_number - b.knesset_number);
  const W = 720, H = 220, padL = 30, padR = 12, padT = 12, padB = 28;
  const maxSeats = 60;
  const x = (i) => padL + (i / (sorted.length - 1)) * (W - padL - padR);
  const y = (seats) => padT + (1 - seats / maxSeats) * (H - padT - padB);

  const perElection = sorted.map(e => {
    const results = [...(e.results || [])].sort((a, b) => b.seats - a.seats);
    return { knesset_number: e.knesset_number, first: results[0]?.seats || 0, second: results[1]?.seats || 0 };
  });

  const linePath = (key) => perElection.map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(d[key])}`).join(' ');
  const majorityY = y(61);

  return (
    <div className="rounded-2xl border p-5 mb-6" style={{ background: 'var(--p-card)', borderColor: 'var(--p-border)' }}>
      <p className="text-sm font-bold mb-1" style={{ color: 'var(--p-text)' }}>Évolution : 1er et 2e parti, élection par élection</p>
      <p className="text-xs mb-4" style={{ color: 'var(--p-text-40)' }}>De la domination Mapaï/Alignement à la fragmentation actuelle — chaque point est un vrai résultat, pas une estimation.</p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ overflow: 'visible' }}>
        <line x1={padL} y1={majorityY} x2={W - padR} y2={majorityY} stroke="var(--p-gold)" strokeDasharray="3 4" strokeWidth="1" opacity="0.5" />
        <text x={W - padR} y={majorityY - 5} textAnchor="end" fontSize="9" fill="var(--p-gold-text)">majorité (61)</text>

        {[0, 20, 40, 60].map(v => (
          <text key={v} x={padL - 6} y={y(v) + 3} textAnchor="end" fontSize="9" fill="var(--p-text-25)">{v}</text>
        ))}

        <path d={linePath('first')} fill="none" stroke="var(--p-gold)" strokeWidth="2" />
        <path d={linePath('second')} fill="none" stroke="var(--p-blue)" strokeWidth="2" opacity="0.7" />

        {perElection.map((d, i) => (
          <g key={i}>
            <circle cx={x(i)} cy={y(d.first)} r="2.5" fill="var(--p-gold)" />
            <circle cx={x(i)} cy={y(d.second)} r="2.5" fill="var(--p-blue)" opacity="0.7" />
            {(i === 0 || i === perElection.length - 1 || i % 4 === 0) && (
              <text x={x(i)} y={H - padB + 14} textAnchor="middle" fontSize="8" fill="var(--p-text-25)">{d.knesset_number}e</text>
            )}
          </g>
        ))}
      </svg>
      <div className="flex items-center gap-4 mt-2 text-xs">
        <span className="flex items-center gap-1.5" style={{ color: 'var(--p-text-40)' }}><span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: 'var(--p-gold)' }} /> 1er parti</span>
        <span className="flex items-center gap-1.5" style={{ color: 'var(--p-text-40)' }}><span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: 'var(--p-blue)' }} /> 2e parti</span>
      </div>
    </div>
  );
}

function ElectionCard({ election, index, slugByName }) {
  const [open, setOpen] = useState(false);
  const results = [...(election.results || [])].sort((a, b) => b.seats - a.seats);
  const winner = results[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10%' }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.3) }}
      className="rounded-2xl border overflow-hidden transition-colors duration-300 hover:border-[var(--p-border-hover)]"
      style={{ background: 'var(--p-card)', borderColor: 'var(--p-border)' }}
    >
      <button onClick={() => setOpen(o => !o)} className="w-full text-left px-5 py-4 flex items-center gap-4">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-sm"
          style={{ background: 'rgba(212,175,55,0.1)', color: 'var(--p-gold-text)', fontFamily: "'JetBrains Mono',monospace" }}
        >
          {election.knesset_number === 1 ? '1re' : `${election.knesset_number}e`}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-sm" style={{ color: 'var(--p-text)' }}>{election.name}</h3>
            <span className="text-xs" style={{ color: 'var(--p-text-25)' }}>
              {new Date(election.election_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
          <p className="text-xs mt-0.5" style={{ color: 'var(--p-text-40)' }}>
            {winner ? `${winner.party_name} en tête (${winner.seats} sièges)` : ''}
            {election.pm_after ? ` · PM : ${election.pm_after}` : ' · aucun gouvernement formé'}
          </p>
        </div>
        <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} style={{ color: 'var(--p-text-25)' }} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-1 border-t space-y-4" style={{ borderColor: 'var(--p-border)' }}>
              <div className="flex flex-wrap gap-4 text-xs pt-4" style={{ color: 'var(--p-text-40)' }}>
                {election.turnout_pct != null && <span>Participation : <strong style={{ color: 'var(--p-text)' }}>{election.turnout_pct}%</strong></span>}
                {election.threshold_pct != null && <span>Seuil électoral : <strong style={{ color: 'var(--p-text)' }}>{election.threshold_pct}%</strong></span>}
              </div>

              <div className="space-y-1.5">
                {results.map((r, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    {(() => {
                      const slug = slugByName?.get(r.party_name?.trim().toLowerCase());
                      return slug ? (
                        <Link to={`${createPageUrl('Liste')}?slug=${slug}`} className="w-40 truncate flex-shrink-0 hover:underline" style={{ color: 'var(--p-blue)' }}>{r.party_name}</Link>
                      ) : (
                        <span className="w-40 truncate flex-shrink-0" style={{ color: 'var(--p-text-60)' }}>{r.party_name}</span>
                      );
                    })()}
                    <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--p-border-hover)' }}>
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${(r.seats / (results[0]?.seats || 1)) * 100}%`, background: i === 0 ? 'var(--p-gold)' : 'var(--p-blue)', opacity: i === 0 ? 1 : 0.55 }}
                      />
                    </div>
                    <span className="w-8 text-right font-bold tabular-nums flex-shrink-0" style={{ fontFamily: "'JetBrains Mono',monospace", color: 'var(--p-text)' }}>{r.seats}</span>
                  </div>
                ))}
              </div>

              {election.notes && (
                <div className="flex items-start gap-2 text-xs rounded-lg p-3" style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)' }}>
                  <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: 'var(--p-gold-text)' }} />
                  <p style={{ color: 'var(--p-text-60)' }}>{election.notes}</p>
                </div>
              )}

              <a href={election.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold hover:opacity-80 transition-opacity" style={{ color: 'var(--p-blue)' }}>
                Source <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function Historique() {
  const { data: elections = [], isLoading } = useQuery({
    queryKey: ['knesset-historique'],
    queryFn: () => base44.entities.KnessetHistorique.list('-knesset_number', 30),
  });

  // Map nom de parti -> slug de la liste actuelle, pour lier un resultat
  // historique a la fiche du parti UNIQUEMENT si le nom correspond exactement.
  const { data: listesActuelles = [] } = useQuery({
    queryKey: ['historique-listes'],
    queryFn: () => base44.entities.Liste.filter({ is_active: true }),
  });
  const slugByName = new Map(listesActuelles.map(l => [l.name_fr.trim().toLowerCase(), l.slug]));

  return (
    <div className="min-h-screen" style={{ background: 'transparent' }}>
      <div className="relative overflow-hidden">
        <div className="absolute inset-0" style={{
          backgroundImage: "url('/images/methodologie-hero.jpg')",
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
            <span style={{ color: 'rgba(245,240,232,0.7)' }} aria-current="page">Historique</span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.06 }}
            className="flex items-center gap-2 mb-3"
          >
            <Landmark className="w-4 h-4" style={{ color: 'var(--p-gold)' }} />
            <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--p-gold)' }}>Depuis 1949</p>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.12 }}
            className="text-3xl md:text-4xl font-black mb-4 leading-tight"
            style={{ fontFamily: 'var(--font-display)', color: 'white' }}
          >
            L'histoire des Knesset
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.18 }}
            className="text-base leading-relaxed max-w-2xl"
            style={{ color: 'rgba(245,240,232,0.6)' }}
          >
            Chaque élection depuis la création de l'État, avec la composition réelle de la Knesset qui en est sortie — sourcée élection par élection, sans donnée inventée.
          </motion.p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="flex items-start gap-2 mb-6 text-xs rounded-lg p-3" style={{ background: 'rgba(43,92,230,0.06)', border: '1px solid var(--p-border)', color: 'var(--p-text-40)' }}>
          <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: 'var(--p-blue)' }} />
          <p>Les 25 élections de l'histoire d'Israël, de 1949 à 2022, chacune sourcée et vérifiée individuellement (la somme des sièges de chaque scrutin fait exactement 120).</p>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: 'var(--p-border)' }} />)}
          </div>
        ) : (
          <>
            <EvolutionChart elections={elections} />
            <div className="space-y-3">
              {elections.map((e, i) => <ElectionCard key={e.id} election={e} index={i} slugByName={slugByName} />)}
            </div>
          </>
        )}

        <div className="mt-8">
          <QuizWidget category="historique" title="Testez vos connaissances" />
        </div>

        <div className="flex items-center justify-center gap-2 mt-8 pt-6 border-t text-sm text-center" style={{ borderColor: 'var(--p-border)', color: 'var(--p-text-40)' }}>
          <span>Envie de pronostiquer plutôt que de regarder en arrière ? <Link to={createPageUrl('Listes')} className="underline hover:opacity-80" style={{ color: 'var(--p-blue)' }}>Voir les listes 2026</Link></span>
        </div>
      </div>
    </div>
  );
}
