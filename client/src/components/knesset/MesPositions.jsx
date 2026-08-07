import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/client';
import { Wallet, Clock, Check, X } from 'lucide-react';
import { formatCote, formatProba } from '@/components/knesset/CoteTile';

/**
 * MES POSITIONS — le Portfolio de Polymarket, et surtout le trou dans la boucle.
 *
 * `paris_mises` était écrite à chaque mise et relue UNIQUEMENT par le résolveur.
 * Autrement dit : on misait, on voyait des confettis, et le pari disparaissait
 * de la vue. On n'apprenait qu'on avait gagné que parce que le solde de jetons
 * avait bougé — sans savoir sur quel pari, ni à quelle cote. Sans cette page, il
 * n'y a aucune raison de revenir voir ce que devient sa mise.
 *
 * ⚠️ La cote montrée est celle VERROUILLÉE à la prise du pari, jamais la cote
 * courante du marché : c'est elle qui décidera du gain. Afficher la cote du
 * moment ferait croire à un pari qu'on n'a pas pris.
 *
 * ⚠️ Le « gain potentiel » est un potentiel et le dit. Le total encaissé, lui,
 * ne compte que les paris réellement gagnés — jamais une projection.
 */

const STATUTS = {
  en_jeu:    { label: 'En jeu',    icon: Clock, couleur: 'var(--p-blue)',      fond: 'var(--p-blue-dim)' },
  gagne:     { label: 'Gagné',     icon: Check, couleur: 'var(--p-green-text)', fond: 'var(--p-green-dim)' },
  perdu:     { label: 'Perdu',     icon: X,     couleur: 'var(--p-red)',       fond: 'var(--p-red-dim)' },
  rembourse: { label: 'Remboursé', icon: Check, couleur: 'var(--p-text-40)',   fond: 'var(--p-text-10)' },
};

const dateCourte = (d) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

function Ligne({ m }) {
  const s = STATUTS[m.statut] || STATUTS.en_jeu;
  const Icon = s.icon;
  return (
    <div className="py-3" style={{ borderTop: '0.5px solid var(--p-border)' }}>
      <div className="flex items-start justify-between gap-3 mb-1.5">
        <p className="text-[12.5px] font-semibold leading-snug min-w-0" style={{ color: 'var(--p-text)' }}>{m.question}</p>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide flex-shrink-0"
          style={{ background: s.fond, color: s.couleur }}>
          <Icon className="w-3 h-3" /> {s.label}
        </span>
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap text-[11.5px]" style={{ color: 'var(--p-text-60)' }}>
        <span>
          Ton choix&nbsp;: <b style={{ color: 'var(--p-text)' }}>{m.issue_label}</b>
          <span className="mx-1.5" style={{ color: 'var(--p-text-25)' }}>·</span>
          {dateCourte(m.created_at)}
        </span>
        <span className="flex items-center gap-3">
          <span>
            <span className="p-mono" style={{ color: 'var(--p-text)' }}>{m.mise}</span> jetons
            <span className="mx-1.5" style={{ color: 'var(--p-text-25)' }}>à</span>
            <span className="p-mono" style={{ color: 'var(--p-text)' }}>×{formatCote(m.cote)}</span>
            <span className="ml-1" style={{ color: 'var(--p-text-25)' }}>({formatProba(m.cote)})</span>
          </span>
          <span className="p-mono font-bold" style={{ color: m.statut === 'perdu' ? 'var(--p-text-25)' : 'var(--p-green-text)' }}>
            {m.statut === 'gagne' ? '+' : m.statut === 'en_jeu' ? '→ ' : ''}{m.statut === 'perdu' ? '—' : m.gain_pot}
          </span>
        </span>
      </div>
    </div>
  );
}

export default function MesPositions({ actif = false, cleRafraichissement = 0 }) {
  const { data, isPending, isError } = useQuery({
    queryKey: ['mes-mises', cleRafraichissement],
    queryFn: () => base44.functions.invoke('parisSondages', { action: 'mesMises' }),
    enabled: actif,
    retry: false,
  });

  if (!actif) return null;
  if (isPending) {
    return <div className="h-28 rounded-2xl animate-pulse mb-6" style={{ background: 'var(--p-border)' }} />;
  }
  // En cas d'échec on s'efface, on n'affiche PAS l'état vide : « tu n'as pas
  // encore de pari » serait un mensonge pour quelqu'un qui en a, et c'est
  // exactement ce qui arriverait pendant la minute où le client déployé est en
  // avance sur son serveur.
  if (isError) return null;

  const mises = data?.mises || [];
  const r = data?.resume;

  // Pas encore de pari : on ne montre pas un tableau vide avec des zéros, on
  // dit ce qu'il manque. Un « 0 jeton engagé » en gros est un constat d'échec
  // affiché au joueur avant même qu'il ait joué.
  if (!mises.length) {
    return (
      <div className="p-card p-5 mb-6">
        <div className="flex items-center gap-2 mb-1.5">
          <Wallet className="w-4 h-4" style={{ color: 'var(--p-text-40)' }} />
          <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: 'var(--p-text-40)' }}>Mes paris</span>
        </div>
        <p className="text-sm" style={{ color: 'var(--p-text-60)' }}>
          Tu n’as pas encore de pari en cours. Choisis une issue ci-dessous, et tu la retrouveras ici jusqu’à sa résolution.
        </p>
      </div>
    );
  }

  const enJeu = mises.filter(m => m.statut === 'en_jeu');
  const tranches = mises.filter(m => m.statut !== 'en_jeu');

  return (
    <div className="p-card p-5 mb-6">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
        <div className="flex items-center gap-2">
          <Wallet className="w-4 h-4" style={{ color: 'var(--p-text-40)' }} />
          <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: 'var(--p-text-40)' }}>Mes paris</span>
        </div>
        {r && (
          <div className="flex items-center gap-4 text-[11px]" style={{ color: 'var(--p-text-40)' }}>
            <span>
              <b className="p-mono text-[13px]" style={{ color: 'var(--p-text)' }}>{r.mise_engagee}</b> engagés
            </span>
            <span>
              <b className="p-mono text-[13px]" style={{ color: 'var(--p-green-text)' }}>{r.gain_potentiel}</b> si tout passe
            </span>
            {(r.gagnes > 0 || r.perdus > 0) && (
              <span>
                <b className="p-mono text-[13px]" style={{ color: 'var(--p-text)' }}>{r.gagnes}</b>/{r.gagnes + r.perdus} gagnés
              </span>
            )}
          </div>
        )}
      </div>

      {enJeu.map(m => <Ligne key={m.id} m={m} />)}

      {tranches.length > 0 && (
        <details className="group mt-3">
          <summary className="cursor-pointer list-none text-[11px] font-semibold select-none" style={{ color: 'var(--p-text-40)' }}>
            Voir les {tranches.length} pari{tranches.length > 1 ? 's' : ''} déjà tranché{tranches.length > 1 ? 's' : ''}
          </summary>
          <div className="mt-1">{tranches.map(m => <Ligne key={m.id} m={m} />)}</div>
        </details>
      )}
    </div>
  );
}
