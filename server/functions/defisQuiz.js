// Défi série : pari en JETONS (gratuits) sur N bonnes réponses de quiz
// d'affilée. Plus la série visée est longue, plus le multiplicateur paie. Une
// mauvaise réponse et la mise est perdue. Stocké sur user_progress (defi_*).
import { pool, filterEntity, updateEntity } from '../db/index.js';

const OBJECTIFS = { 3: 2, 5: 4, 10: 10 };   // objectif -> multiplicateur de gain
const MISE_MIN = 20, MISE_MAX = 300;

export async function getDefiSerie(user_email) {
  const up = (await filterEntity('UserProgress', { user_email }))[0];
  if (!up) return null;
  const enCours = up.defi_statut === 'en_cours';
  return {
    statut: up.defi_statut || null,
    objectif: up.defi_objectif || null,
    mise: up.defi_mise || null,
    mult: up.defi_mult || null,
    progres: up.defi_progres || 0,
    gain_pot: enCours ? Math.round((up.defi_mise || 0) * (up.defi_mult || 0)) : null,
    jetons: up.jetons ?? 0,
    options: OBJECTIFS,
  };
}

export async function startDefiSerie(user_email, body) {
  const objectif = Math.round(Number(body.objectif));
  const mise = Math.round(Number(body.mise));
  if (!OBJECTIFS[objectif]) throw new Error('Objectif invalide (3, 5 ou 10 bonnes réponses).');
  if (!Number.isFinite(mise) || mise < MISE_MIN || mise > MISE_MAX) throw new Error(`Mise entre ${MISE_MIN} et ${MISE_MAX} jetons.`);

  const up = (await filterEntity('UserProgress', { user_email }))[0];
  if (!up) throw new Error('Profil introuvable.');
  if (up.defi_statut === 'en_cours') throw new Error('Tu as déjà un défi série en cours.');

  const debit = await pool.query(
    'UPDATE user_progress SET jetons = jetons - $1 WHERE user_email = $2 AND jetons >= $1',
    [mise, user_email]
  );
  if (debit.rowCount !== 1) throw new Error('Jetons insuffisants.');

  const mult = OBJECTIFS[objectif];
  await updateEntity('UserProgress', up.id, {
    defi_objectif: objectif, defi_mise: mise, defi_mult: mult, defi_progres: 0, defi_statut: 'en_cours',
  });
  return { ok: true, objectif, mise, mult, gain_pot: Math.round(mise * mult) };
}

// Appelé après chaque réponse de quiz. Renvoie l'évolution du défi, ou null si
// aucun défi actif. Idempotent vis-à-vis d'un défi déjà résolu.
export async function updateDefiOnAnswer(user_email, is_correct) {
  const up = (await filterEntity('UserProgress', { user_email }))[0];
  if (!up || up.defi_statut !== 'en_cours') return null;

  if (!is_correct) {
    await clearDefi(up.id);
    return { defi: 'perdu', mise: up.defi_mise, objectif: up.defi_objectif };
  }

  const progres = (up.defi_progres || 0) + 1;
  if (progres >= up.defi_objectif) {
    const gain = Math.round((up.defi_mise || 0) * (up.defi_mult || 0));
    await updateEntity('UserProgress', up.id, {
      jetons: (up.jetons ?? 0) + gain,
      defi_objectif: null, defi_mise: null, defi_mult: null, defi_progres: 0, defi_statut: null,
    });
    return { defi: 'gagne', gain, objectif: up.defi_objectif };
  }

  await updateEntity('UserProgress', up.id, { defi_progres: progres });
  return { defi: 'en_cours', progres, objectif: up.defi_objectif };
}

async function clearDefi(id) {
  await updateEntity('UserProgress', id, {
    defi_objectif: null, defi_mise: null, defi_mult: null, defi_progres: 0, defi_statut: null,
  });
}
