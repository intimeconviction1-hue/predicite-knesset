import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/client';

export default function Login() {
  const params = new URLSearchParams(window.location.search);
  const returnTo = params.get('return_to') || '/';
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const [showAdminKey, setShowAdminKey] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await base44.auth.login(email, fullName, adminKey || undefined);
      window.location.href = returnTo;
    } catch (err) {
      setError(err.message || 'Connexion impossible.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'transparent' }}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm rounded-2xl border p-8"
        style={{ background: 'var(--p-card)', borderColor: 'var(--p-border)' }}
      >
        <h1 className="text-2xl font-black mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--p-text)' }}>PrédiCité</h1>
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
              className="w-full mt-1 px-3 py-2.5 rounded-lg bg-transparent border text-[var(--p-text)] text-sm outline-none transition-colors focus:border-[var(--p-gold)]"
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
              className="w-full mt-1 px-3 py-2.5 rounded-lg bg-transparent border text-[var(--p-text)] text-sm outline-none transition-colors focus:border-[var(--p-gold)]"
              style={{ borderColor: 'var(--p-border-hover)' }}
              placeholder="Prénom Nom"
            />
          </div>

          {showAdminKey && (
            <div>
              <label htmlFor="login-admin-key" className="text-xs font-semibold" style={{ color: 'var(--p-text-60)' }}>Clé administrateur</label>
              <input
                id="login-admin-key"
                type="password"
                autoComplete="off"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                className="w-full mt-1 px-3 py-2.5 rounded-lg bg-transparent border text-[var(--p-text)] text-sm outline-none transition-colors focus:border-[var(--p-gold)]"
                style={{ borderColor: 'var(--p-border-hover)' }}
                placeholder="••••••••"
              />
            </div>
          )}

          {error && (
            <p role="alert" className="text-xs" style={{ color: 'var(--p-red)' }}>{error}</p>
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

        {!showAdminKey && (
          <button
            type="button"
            onClick={() => setShowAdminKey(true)}
            className="mt-5 text-[11px] underline underline-offset-2 transition-opacity hover:opacity-70"
            style={{ color: 'var(--p-text-25)' }}
          >
            Connexion administrateur
          </button>
        )}

        <p className="text-[11px] mt-6 leading-relaxed" style={{ color: 'var(--p-text-25)' }}>
          Connexion joueur par email, sans mot de passe — à durcir (lien magique
          ou OAuth) avant une ouverture plus large. Le rôle administrateur, lui,
          exige une clé serveur.
        </p>
      </motion.div>
    </div>
  );
}
