import React, { useState } from 'react';
import { motion } from 'framer-motion';
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
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm rounded-2xl border border-white/10 p-8"
        style={{ background: 'rgba(255,255,255,0.03)' }}
      >
        <h1 className="text-2xl font-black text-white mb-1" style={{ fontFamily: 'var(--font-display)' }}>PrédiCité</h1>
        <p className="text-sm mb-6" style={{ color: 'var(--p-text-40)' }}>
          Connexion par email — pas de mot de passe pour l'instant.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="login-email" className="text-xs font-semibold" style={{ color: 'var(--p-text-60)' }}>Email</label>
            <input
              id="login-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mt-1 px-3 py-2.5 rounded-lg bg-transparent border text-white text-sm outline-none transition-colors focus:border-[var(--p-gold)]"
              style={{ borderColor: 'var(--p-border-hover)' }}
              placeholder="vous@exemple.com"
            />
          </div>
          <div>
            <label htmlFor="login-fullname" className="text-xs font-semibold" style={{ color: 'var(--p-text-60)' }}>Nom (optionnel, première connexion)</label>
            <input
              id="login-fullname"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full mt-1 px-3 py-2.5 rounded-lg bg-transparent border text-white text-sm outline-none transition-colors focus:border-[var(--p-gold)]"
              style={{ borderColor: 'var(--p-border-hover)' }}
              placeholder="Prénom Nom"
            />
          </div>

          {error && (
            <p role="alert" className="text-xs" style={{ color: '#F47090' }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 rounded-lg font-bold text-sm text-white transition-opacity hover:opacity-88 disabled:opacity-50"
            style={{ background: '#1E3A8A' }}
          >
            {isSubmitting ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <p className="text-[11px] mt-6 leading-relaxed" style={{ color: 'var(--p-text-25)' }}>
          Auth minimale par email, adaptée à un usage personnel ou petit cercle.
          À durcir (mot de passe, lien magique ou OAuth) avant toute ouverture à un
          public plus large.
        </p>
      </motion.div>
    </div>
  );
}
