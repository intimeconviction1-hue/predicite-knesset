/**
 * Remplace db.integrations.Core.InvokeLLM (Base44) par un appel direct à
 * l'API Anthropic avec l'outil web_search. Nécessite ANTHROPIC_API_KEY dans
 * l'environnement (.env, jamais commité).
 *
 * Le modèle est configurable via ANTHROPIC_MODEL (.env) — 'claude-sonnet-5'
 * par défaut. Ajustez selon ce que votre plan API autorise.
 */

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

// Extrait le premier objet/tableau JSON d'un texte, même s'il est entouré de
// prose (avec web_search, le modèle écrit souvent « J'ai cherché… » avant le
// JSON, et parfois du texte après). On tente le parse direct, puis on isole la
// première structure { … } ou [ … ] équilibrée.
function extractJson(text) {
  const cleaned = (text || '').replace(/```json|```/g, '').trim();
  if (!cleaned) return { ok: false, error: 'réponse vide' };
  try { return { ok: true, value: JSON.parse(cleaned) }; } catch { /* on tente l'extraction */ }

  for (const [open, close] of [['{', '}'], ['[', ']']]) {
    const start = cleaned.indexOf(open);
    const end = cleaned.lastIndexOf(close);
    if (start !== -1 && end > start) {
      const slice = cleaned.slice(start, end + 1);
      try { return { ok: true, value: JSON.parse(slice) }; } catch { /* suivant */ }
    }
  }
  return { ok: false, error: 'aucun JSON valide trouvé', snippet: cleaned.slice(0, 300) };
}

export async function invokeLLMWithWebSearch({ prompt, jsonSchemaHint, maxTokens = 8000 }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY manquant dans l\'environnement (.env).');
  }
  const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';

  const fullPrompt = jsonSchemaHint
    ? `${prompt}\n\nUne fois tes recherches terminées, réponds par un DERNIER message contenant UNIQUEMENT un JSON valide respectant cette forme, sans texte avant ni après, sans balises markdown :\n${jsonSchemaHint}`
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
      // max_uses borne le nombre de recherches, pour garder du budget de tokens
      // à l'écriture du JSON final (sinon la réponse est tronquée/vide).
      tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 5 }],
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

  const parsed = extractJson(text);
  if (!parsed.ok) {
    // stop_reason aide au diagnostic : 'max_tokens' = tronqué (augmenter le
    // budget), 'end_turn' sans JSON = le modèle n'a rien produit d'exploitable.
    throw new Error(
      `Réponse du modèle inexploitable (${parsed.error}) — stop_reason=${data.stop_reason || '?'}`
      + (parsed.snippet ? `\n---\n${parsed.snippet}` : ''),
    );
  }
  return parsed.value;
}
