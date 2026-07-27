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
    const existing = await filterEntity('QuizQuestion', { id });
    if (existing.length > 0) {
      // Met à jour la difficulté (nouveau champ) sans toucher au reste.
      if (existing[0].difficulte !== difficulte) {
        await updateEntity('QuizQuestion', id, { difficulte });
        updated++;
      }
      continue;
    }

    await createEntity('QuizQuestion', {
      id,
      category: q.category,
      difficulte,
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
