import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MailCheck, ArrowLeft } from 'lucide-react';
import { base44 } from '@/api/client';

// Connexion en deux temps : on saisit son adresse, on reçoit un lien.
//
// Pourquoi ce n'est plus instantané. Jusqu'au 2026-08-07, taper une adresse
// suffisait à ouvrir la session correspondante — y compris celle de quelqu'un
// d'autre. Sur un classement public, pendant un scrutin polarisé, c'est une
// usurpation à un champ de formulaire. L'aller-retour par la boîte mail est le
// prix de la preuve, et c'est le moins cher : pas de mot de passe à choisir,
// pas de mot de passe à retenir, pas de mot de passe à perdre.
//
// La voie administrateur reste séparée et immédiate (clé serveur) : faire
// dépendre l'accès admin d'un envoi SMTP reviendrait à s'enfermer dehors le soir
// du scrutin si l'envoi tombe.

const MESSAGES_RETOUR = {
  invalide: "Ce lien n'est plus valable — il a peut-être déjà servi, ou expiré. Demandes-en un nouveau, c'est immédiat.",
};

export default function Login() {
  const params = new URLSearchParams(window.location.search);
  const returnTo = params.get('return_to') || '/';
  const messageRetour = MESSAGES_RETOUR[params.get('lien')] || '';

  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const [modeAdmin, setModeAdmin] = useState(false);
  const [envoye, setEnvoye] = useState(false);
  const [error, setError] = useState(messageRetour);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // `return_to` peut être une URL absolue (redirectToLogin passe
  // window.location.href). Le serveur n'accepte qu'un chemin interne et retombe
  // sinon sur l'accueil ; on lui envoie donc directement la partie utile plutôt
  // que de compter sur ce repli.
  const cheminDeRetour = (() => {
    try { return new URL(returnTo, window.location.origin).pathname + new URL(returnTo, window.location.origin).search; }
    catch { return '/'; }
  })();

  const demanderLien = async (e) => {
    e.preventDefault();
    setError(''); setIsSubmitting(true);
    try {
      await base44.auth.demanderLien(email, fullName, cheminDeRetour);
      setEnvoye(true);
    } catch (err) {
      setError(err.message || "Le lien n'a pas pu être envoyé.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const connexionAdmin = async (e) => {
    e.preventDefault();
    setError(''); setIsSubmitting(true);
    try {
      await base44.auth.login(email, fullName, adminKey || undefined);
      window.location.href = cheminDeRetour;
    } catch (err) {
      setError(err.message || 'Connexion impossible.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const champ = 'w-full mt-1 px-3 py-2.5 rounded-lg bg-transparent border text-[var(--p-text)] text-sm outline-none transition-colors focus:border-[var(--p-gold)]';

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'transparent' }}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm rounded-2xl border p-8"
        style={{ background: 'var(--p-card)', borderColor: 'var(--p-border)' }}
      >
        <AnimatePresence mode="wait">
          {envoye ? (
            <motion.div key="envoye" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <MailCheck className="w-9 h-9 mb-4" style={{ color: 'var(--p-green-text)' }} />
              <h1 className="text-xl font-black mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--p-text)' }}>
                Regarde ta boîte
              </h1>
              <p className="text-sm mb-4 leading-relaxed" style={{ color: 'var(--p-text-60)' }}>
                Un lien de connexion vient de partir vers <b style={{ color: 'var(--p-text)' }}>{email}</b>.
                Il est valable 20 minutes et ne fonctionne qu'une fois.
              </p>
              {/* Dit franchement plutôt que découvert dix minutes plus tard : le
                  message part d'une boîte ordinaire, donc il atterrit parfois
                  dans les indésirables. Autant l'annoncer que laisser quelqu'un
                  conclure qu'on ne lui a rien envoyé. */}
              <p className="text-[11px] mb-6 leading-relaxed" style={{ color: 'var(--p-text-40)' }}>
                Rien au bout d'une minute ? Regarde dans les indésirables — c'est là
                qu'atterrissent le plus souvent les premiers messages.
              </p>
              <button
                type="button"
                onClick={() => { setEnvoye(false); setError(''); }}
                className="inline-flex items-center gap-1.5 text-[11px] underline underline-offset-2 transition-opacity hover:opacity-70"
                style={{ color: 'var(--p-text-40)' }}
              >
                <ArrowLeft className="w-3 h-3" /> Changer d'adresse
              </button>
            </motion.div>
          ) : (
            <motion.div key="formulaire" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h1 className="text-2xl font-black mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--p-text)' }}>PrédiCité</h1>
              <p className="text-sm mb-6" style={{ color: 'var(--p-text-40)' }}>
                {modeAdmin
                  ? 'Connexion administrateur — clé requise.'
                  : 'Entre ton adresse : on t\'envoie un lien pour te connecter. Pas de mot de passe.'}
              </p>

              <form onSubmit={modeAdmin ? connexionAdmin : demanderLien} className="space-y-4">
                <div>
                  <label htmlFor="login-email" className="text-xs font-semibold" style={{ color: 'var(--p-text-60)' }}>Email</label>
                  <input
                    id="login-email" type="email" required autoComplete="email"
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    className={champ} style={{ borderColor: 'var(--p-border-hover)' }}
                    placeholder="toi@exemple.com"
                  />
                </div>

                <div>
                  <label htmlFor="login-fullname" className="text-xs font-semibold" style={{ color: 'var(--p-text-60)' }}>
                    Nom affiché (optionnel)
                  </label>
                  <input
                    id="login-fullname" type="text" autoComplete="nickname"
                    value={fullName} onChange={(e) => setFullName(e.target.value)}
                    className={champ} style={{ borderColor: 'var(--p-border-hover)' }}
                    placeholder="Comment tu apparais au classement"
                  />
                </div>

                {modeAdmin && (
                  <div>
                    <label htmlFor="login-admin-key" className="text-xs font-semibold" style={{ color: 'var(--p-text-60)' }}>Clé administrateur</label>
                    <input
                      id="login-admin-key" type="password" autoComplete="off"
                      value={adminKey} onChange={(e) => setAdminKey(e.target.value)}
                      className={champ} style={{ borderColor: 'var(--p-border-hover)' }}
                      placeholder="••••••••"
                    />
                  </div>
                )}

                {error && <p role="alert" className="text-xs leading-relaxed" style={{ color: 'var(--p-red)' }}>{error}</p>}

                <button type="submit" disabled={isSubmitting} className="p-btn-deep w-full justify-center">
                  {isSubmitting
                    ? (modeAdmin ? 'Connexion…' : 'Envoi…')
                    : (modeAdmin ? 'Se connecter' : 'Recevoir mon lien')}
                </button>
              </form>

              <button
                type="button"
                onClick={() => { setModeAdmin(!modeAdmin); setError(''); setAdminKey(''); }}
                className="mt-5 text-[11px] underline underline-offset-2 transition-opacity hover:opacity-70"
                style={{ color: 'var(--p-text-40)' }}
              >
                {modeAdmin ? 'Revenir à la connexion normale' : 'Connexion administrateur'}
              </button>

              <p className="text-[11px] mt-6 leading-relaxed" style={{ color: 'var(--p-text-40)' }}>
                Ton email sert à retrouver ton score et tes pronostics, et à te renvoyer
                ce lien. Pas de publicité, aucune revente.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
