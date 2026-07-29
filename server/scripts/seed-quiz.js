// Importe docs/KNESSET_SEED_QUIZ.json dans la table quiz_questions.
// Usage : npm run seed:quiz (depuis server/)
import 'dotenv/config';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { initDb, filterEntity, createEntity, updateEntity, pool } from '../db/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const seedPath = path.join(__dirname, '..', '..', 'docs', 'KNESSET_SEED_QUIZ.json');

function idFor(q) {
  return crypto.createHash('sha1').update(q.question).digest('hex');
}

// Difficulté : celle du JSON si fournie, sinon répartition déterministe pour que
// les trois niveaux soient peuplés dès le départ (à affiner ensuite au contenu).
const DIFF_CYCLE = ['decouverte', 'connaisseur', 'expert'];
function difficulteFor(q, i) {
  return DIFF_CYCLE.includes(q.difficulte) ? q.difficulte : DIFF_CYCLE[i % 3];
}

// Thème : explicite dans le JSON, sinon dérivé de la catégorie (rétrocompat).
const CATEGORY_TO_THEME = { regles: 'systeme_electoral', historique: 'histoire', actualite: 'actu' };
function themeFor(q) {
  return q.theme || CATEGORY_TO_THEME[q.category] || null;
}

async function main() {
  if (!fs.existsSync(seedPath)) {
    console.error(`Fichier introuvable : ${seedPath}`);
    process.exit(1);
  }
  await initDb();

  const seed = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
  const questions = seed.questions || [];

  let created = 0, updated = 0;
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const id = idFor(q);
    const difficulte = difficulteFor(q, i);
    const theme = themeFor(q);
    const existing = await filterEntity('QuizQuestion', { id });
    if (existing.length > 0) {
      // Met à jour difficulté + thème (nouveaux champs) sans toucher au reste.
      const patch = {};
      if (existing[0].difficulte !== difficulte) patch.difficulte = difficulte;
      if (theme && existing[0].theme !== theme) patch.theme = theme;
      if (Object.keys(patch).length > 0) { await updateEntity('QuizQuestion', id, patch); updated++; }
      continue;
    }

    await createEntity('QuizQuestion', {
      id,
      category: q.category,
      difficulte,
      theme,
      question: q.question,
      choices: q.choices,
      correct_index: q.correct_index,
      explanation: q.explanation || null,
      source_url: q.source_url || null,
    });
    created++;
  }

  console.log(`Import terminé : ${created} créée(s), ${updated} difficulté(s) mise(s) à jour.`);
  await pool.end();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
