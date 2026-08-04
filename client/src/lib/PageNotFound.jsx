import { Link, useLocation } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function PageNotFound() {
  const location = useLocation();
  const pageName = location.pathname.substring(1);

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--p-night)' }}>
      <div className="max-w-md w-full text-center">
        <Compass className="w-10 h-10 mx-auto mb-5" style={{ color: 'var(--p-gold)' }} />

        <p className="p-mono-gold text-sm mb-2">404</p>
        <h1 className="p-display text-3xl mb-3">Page introuvable</h1>
        <p className="p-body text-sm mb-8">
          {pageName ? (
            <>La page <span className="font-medium">« {pageName} »</span> n'existe pas ou plus.</>
          ) : (
            "Cette page n'existe pas ou plus."
          )}
        </p>

        <Link to={createPageUrl('Home')} className="p-btn-gold inline-block">
          ← Retour à l'accueil
        </Link>
      </div>
    </div>
  );
}
