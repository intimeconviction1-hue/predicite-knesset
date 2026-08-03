import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/client';
import ConfettiBurst from '@/components/knesset/ConfettiBurst';
import {
  Landmark, PenLine, Crown, Flame, BookOpen, Coins, Users,
  CalendarCheck, Dices, GraduationCap, Zap, Crosshair, Award, Lock,
} from 'lucide-react';

// Vitrine des badges. Elle montre les badges GAGNÉS **et** ceux qui restent à
// gagner : voir la marche suivante est ce qui fait revenir, une grille qui ne
// montrerait que l'acquis ne dit rien de ce qu'il y a à faire.
//
// Les icônes sont importées nommément plutôt que via `import * as Icons` : un
// import global embarquerait toute la bibliothèque lucide dans le bundle pour
// n'en utiliser que douze.
const ICONES = {
  Landmark, PenLine, Crown, Flame, BookOpen, Coins, Users,
  CalendarCheck, Dices, GraduationCap, Zap, Crosshair,
};

function IconeBadge({ nom, className, style }) {
  const C = ICONES[nom] || Award;   // repli : un badge ajouté plus tard reste affichable
  return <C className={className} style={style} />;
}

export default function BadgeShelf() {
  const [salve, setSalve] = useState(0);
  const dejaFete = useRef(false);

  // Définitions : lisibles publiquement (elles n'ont rien de personnel).
  const { data: definitions = [] } = useQuery({
    queryKey: ['badges-definitions'],
    queryFn: () => base44.entities.Badge.list(),
    staleTime: 60 * 60 * 1000,
  });

  // Palmarès personnel : passe par la couche « functions », jamais par
  // /api/entities — on ne consulte que sa propre ligne.
  const { data: mien } = useQuery({
    queryKey: ['badges-mine'],
    queryFn: () => base44.functions.invoke('badges', { action: 'mine' }),
  });

  const gagnes = mien?.badges || [];
  const nouveaux = mien?.new_badges || [];

  // Un badge fraîchement gagné se célèbre UNE fois. `new_badges` n'est renvoyé
  // qu'à l'appel qui a réellement créé la ligne, mais react-query peut resservir
  // la même réponse depuis son cache : d'où le verrou local.
  useEffect(() => {
    if (nouveaux.length > 0 && !dejaFete.current) {
      dejaFete.current = true;
      setSalve((n) => n + 1);
    }
  }, [nouveaux.length]);

  if (definitions.length === 0) return null;

  const parCode = new Map(gagnes.map(b => [b.code, b]));
  const total = definitions.length;
  const acquis = gagnes.length;

  // Gagnés d'abord (c'est la récompense), puis ceux qui restent à décrocher.
  const ordonnes = [...definitions].sort((a, b) => {
    const ga = parCode.has(a.code) ? 0 : 1;
    const gb = parCode.has(b.code) ? 0 : 1;
    return ga !== gb ? ga - gb : String(a.label).localeCompare(String(b.label), 'fr');
  });

  return (
    <div>
      {/* Les confettis sont en position:fixed. Rendus ici, ils seraient
          positionnés par rapport au premier ancêtre porteur d'un `transform` —
          or .p-card en applique un au survol, ce qui décalerait la salve hors
          de l'écran. Le portail vers <body> supprime le problème à la racine. */}
      {typeof document !== 'undefined' && createPortal(<ConfettiBurst trigger={salve} />, document.body)}

      <div className="flex items-baseline justify-between mb-3">
        <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: 'var(--p-text-40)' }}>
          Tes badges
        </span>
        <span className="font-mono text-xs font-bold" style={{ color: acquis > 0 ? 'var(--p-gold-text)' : 'var(--p-text-25)' }}>
          {acquis}<span style={{ color: 'var(--p-text-25)' }}>/{total}</span>
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {ordonnes.map((b) => {
          const obtenu = parCode.get(b.code);
          return (
            <div
              key={b.code}
              title={obtenu
                ? `${b.label} — obtenu le ${new Date(obtenu.earned_at).toLocaleDateString('fr-FR')}`
                : `${b.label} — ${b.description || 'à débloquer'}`}
              className="rounded-xl p-2.5 flex items-start gap-2.5 transition-colors"
              style={obtenu ? {
                background: 'var(--p-gold-dim)',
                border: '0.5px solid var(--p-gold-border)',
              } : {
                background: 'transparent',
                border: '1px dashed var(--p-border-hover)',
              }}
            >
              <span className="flex-shrink-0 rounded-lg flex items-center justify-center"
                style={{
                  width: 30, height: 30,
                  background: obtenu ? 'var(--p-gold-border)' : 'var(--p-text-10)',
                }}>
                {obtenu
                  ? <IconeBadge nom={b.icon} className="w-4 h-4" style={{ color: 'var(--p-ink)' }} />
                  : <Lock className="w-3.5 h-3.5" style={{ color: 'var(--p-text-25)' }} />}
              </span>

              <span className="min-w-0">
                <span className="block text-[12px] font-bold leading-tight"
                  style={{ color: obtenu ? 'var(--p-text)' : 'var(--p-text-40)' }}>
                  {b.label}
                </span>
                {/* Sur un badge non obtenu, la CONDITION est l'information utile ;
                    sur un badge gagné, c'est la date qui fait la fierté. */}
                <span className="block text-[10px] leading-snug mt-0.5"
                  style={{ color: 'var(--p-text-40)' }}>
                  {obtenu
                    ? new Date(obtenu.earned_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
                    : (b.description || '—')}
                </span>
              </span>
            </div>
          );
        })}
      </div>

      {acquis === 0 && (
        <p className="text-[11px] mt-3" style={{ color: 'var(--p-text-40)' }}>
          Dépose un pronostic, réponds à un quiz ou reviens demain : les premiers badges arrivent vite.
        </p>
      )}
    </div>
  );
}
