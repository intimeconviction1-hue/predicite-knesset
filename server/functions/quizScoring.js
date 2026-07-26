import { randomUUID } from 'node:crypto';
import { filterEntity, createEntity, updateEntity } from '../db/index.js';
import { ensureUserProgress } from './miscFunctions.js';

const POINTS_PER_CORRECT = 10;

export async function submitQuizAnswer(user_email, { question_id, chosen_index }) {
  const question = (await filterEntity('QuizQuestion', { id: question_id }))[0];
  if (!question) throw new Error('Question introuvable');

  const already = (await filterEntity('QuizReponse', { user_email, question_id }))[0];
  if (already) {
    return {
      already_answered: true,
      is_correct: !!already.is_correct,
      correct_index: question.correct_index,
      explanation: question.explanation,
    };
  }

  const is_correct = chosen_index === question.correct_index;
  await createEntity('QuizReponse', { id: randomUUID(), user_email, question_id, is_correct });

  if (is_correct) {
    const up = await ensureUserProgress(user_email);
    await updateEntity('UserProgress', up.id, {
      learning_points: (up.learning_points || 0) + POINTS_PER_CORRECT,
      total_points: (up.total_points || 0) + POINTS_PER_CORRECT,
    });
  }

  return {
    already_answered: false,
    is_correct,
    correct_index: question.correct_index,
    explanation: question.explanation,
  };
}
