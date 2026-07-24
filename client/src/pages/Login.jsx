import React, { useState } from 'react';
import { base44 } from '@/api/client';

export default function Login() {
  const params = new URLSearchParams(window.location.search);
  const returnTo = params.get('return_to') || '/';
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await base44.auth.login(email, fullName);
      window.location.href = returnTo;
    } catch (err) {
      setError(err.message || 'Connexion impossible.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--p-night)' }}>
      <div className="w-full max-w-sm rounded-2xl border border-white/10 p-8" style={{ background: 'rgba(255,255,255,0.03)' }}>
        <h1 className="text-2xl font-black text-white mb-1" style={{ fontFamily: 'var(--font-display)' }}>PrédiCité</h1>
        <p className="text-sm mb-6" style={{ color: 'rgba(245,240,232,0.45)' }}>
          Connexion par email — pas de mot de passe pour l'instant.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold" style={{ color: 'rgba(245,240,232,0.5)' }}>Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mt-1 px-3 py-2.5 rounded-lg bg-transparent border text-white text-sm"
              style={{ borderColor: 'rgba(255,255,255,0.15)' }}
              placeholder="vous@exemple.com"
            />
          </div>
          <div>
            <label className="text-xs font-semibold" style={{ color: 'rgba(245,240,232,0.5)' }}>Nom (optionnel, première connexion)</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full mt-1 px-3 py-2.5 rounded-lg bg-transparent border text-white text-sm"
              style={{ borderColor: 'rgba(255,255,255,0.15)' }}
              placeholder="Prénom Nom"
            />
          </div>

          {error && <p className="text-xs" style={{ color: '#F47090' }}>{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 rounded-lg font-bold text-sm text-white disabled:opacity-50"
            style={{ background: '#1E3A8A' }}
          >
            {isSubmitting ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <p className="text-[11px] mt-6 leading-relaxed" style={{ color: 'rgba(245,240,232,0.25)' }}>
          Auth minimale par email, adaptée à un usage personnel ou petit cercle.
          À durcir (mot de passe, lien magique ou OAuth) avant toute ouverture à un
          public plus large.
        </p>
      </div>
    </div>
  );
}
