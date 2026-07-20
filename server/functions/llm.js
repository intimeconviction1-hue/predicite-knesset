/**
 * Remplace db.integrations.Core.InvokeLLM (Base44) par un appel direct à
 * l'API Anthropic avec l'outil web_search. Nécessite ANTHROPIC_API_KEY dans
 * l'environnement (.env, jamais commité).
 *
 * Le modèle est configurable via ANTHROPIC_MODEL (.env) — 'claude-sonnet-5'
 * par défaut. Ajustez selon ce que votre plan API autorise.
 */

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

export async function invokeLLMWithWebSearch({ prompt, jsonSchemaHint, maxTokens = 4000 }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY manquant dans l\'environnement (.env).');
  }
  const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';

  const fullPrompt = jsonSchemaHint
    ? `${prompt}\n\nRéponds UNIQUEMENT avec un JSON valide respectant cette forme, sans texte avant ni après, sans balises markdown :\n${jsonSchemaHint}`
    : prompt;

  const res = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: fullPrompt }],
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Anthropic API ${res.status}: ${errText.slice(0, 500)}`);
  }

  const data = await res.json();
  const text = (data.content || [])
    .map(block => (block.type === 'text' ? block.text : ''))
    .filter(Boolean)
    .join('\n');

  const cleaned = text.replace(/```json|```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    throw new Error(`Réponse du modèle non parseable en JSON : ${e.message}\n---\n${cleaned.slice(0, 800)}`);
  }
}
