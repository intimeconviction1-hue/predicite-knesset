// Importe docs/KNESSET_SEED_QUIZ.json dans la table quiz_questions.
// Usage : npm run seed:quiz (depuis server/)
import 'dotenv/config';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { initDb, filterEntity, createEntity, pool } from '../db/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const seedPath = path.join(__dirname, '..', '..', 'docs', 'KNESSET_SEED_QUIZ.json');

function idFor(q) {
  return crypto.createHash('sha1').update(q.question).digest('hex');
}

async function main() {
  if (!fs.existsSync(seedPath)) {
    console.error(`Fichier introuvable : ${seedPath}`);
    process.exit(1);
  }
  await initDb();

  const seed = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
  const questions = seed.questions || [];

  let created = 0, skipped = 0;
  for (const q of questions) {
    const id = idFor(q);
    const existing = await filterEntity('QuizQuestion', { id });
    if (existing.length > 0) { skipped++; continue; }

    await createEntity('QuizQuestion', {
      id,
      category: q.category,
      question: q.question,
      choices: q.choices,
      correct_index: q.correct_index,
      explanation: q.explanation || null,
      source_url: q.source_url || null,
    });
    created++;
  }

  console.log(`Import terminé : ${created} question(s) créée(s), ${skipped} déjà présente(s) (ignorées).`);
  await pool.end();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
