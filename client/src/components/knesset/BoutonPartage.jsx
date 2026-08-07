import React, { useState } from 'react';
import { Share2, Check, Download, AlertCircle } from 'lucide-react';
import { partagerCarte } from '@/lib/carte-partage';

// Le bouton qui construit une carte et la remet. Une seule implémentation pour
// toutes les pages qui partagent quelque chose : la cascade partage natif →
// téléchargement → presse-papiers, ses trois états d'après-coup, et le retour à
// l'état initial, sont écrits ici et nulle part ailleurs.
//
// L'appelant ne fournit que `construire`, une fonction qui rend un canvas. Elle
// n'est appelée qu'au clic : dessiner une image de 1200×630 au montage de chaque
// page qui en propose une serait payer le rendu pour tous les visiteurs, alors
// que la plupart ne partageront jamais.
//
// L'état d'échec est affiché. Il ne l'était pas : quand les deux chemins
// échouaient, le bouton revenait simplement à « Partager ma projection », ce qui
// se lit comme « rien ne s'est passé, réessaie » alors que rien ne marchera à la
// deuxième tentative non plus.

const ETATS = {
  attente: { label: null, Icon: Share2 },
  partage: { label: 'Partagé !', Icon: Check },
  telecharge: { label: 'Image enregistrée', Icon: Download },
  echec: { label: 'Partage indisponible', Icon: AlertCircle },
};

export default function BoutonPartage({
  construire,
  texte,
  chemin = '/',
  via,
  nomFichier = 'predicite.png',
  label = 'Partager',
  className = '',
  style,
}) {
  const [etat, setEtat] = useState('attente');
  const [occupe, setOccupe] = useState(false);

  async function handle() {
    if (occupe) return;
    setOccupe(true);
    try {
      const canvas = construire();
      if (!canvas) { setEtat('echec'); return; }
      setEtat(await partagerCarte(canvas, { texte, chemin, via, nomFichier }));
    } catch {
      setEtat('echec');
    } finally {
      setOccupe(false);
      setTimeout(() => setEtat('attente'), 2600);
    }
  }

  const { label: labelEtat, Icon } = ETATS[etat];

  return (
    <button
      onClick={handle}
      disabled={occupe}
      aria-live="polite"
      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-[10px] font-semibold text-[13px] transition-transform hover:-translate-y-0.5 disabled:opacity-60 ${className}`}
      style={{
        background: 'var(--p-blue-dim)',
        color: etat === 'echec' ? 'var(--p-red)' : 'var(--p-blue)',
        border: `0.5px solid ${etat === 'echec' ? 'var(--p-red)' : 'var(--p-blue-border)'}`,
        ...style,
      }}
    >
      <Icon className="w-4 h-4" /> {labelEtat || label}
    </button>
  );
}
