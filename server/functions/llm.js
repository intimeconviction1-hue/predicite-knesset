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

async function callAnthropic({ apiKey, model, fullPrompt, maxTokens, maxUses }) {
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
      tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: maxUses }],
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
  return { data, text };
}

export async function invokeLLMWithWebSearch({ prompt, jsonSchemaHint, maxTokens = 12000 }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY manquant dans l\'environnement (.env).');
  }
  const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';

  const fullPrompt = jsonSchemaHint
    ? `${prompt}\n\nUne fois tes recherches terminées, réponds par un DERNIER message contenant UNIQUEMENT un JSON valide respectant cette forme, sans texte avant ni après, sans balises markdown :\n${jsonSchemaHint}`
    : prompt;

  // Le problème observé : avec web_search, le modèle dépense tout son budget de
  // tokens en recherches et n'écrit jamais le JSON (stop_reason=max_tokens,
  // réponse vide). Repli : on réessaie en bornant DRASTIQUEMENT les recherches
  // pour forcer le modèle à répondre avec ce qu'il a déjà trouvé.
  const tentatives = [
    { maxUses: 3, maxTokens },
    { maxUses: 1, maxTokens: Math.max(maxTokens, 12000) },
  ];

  let dernierDiag = 'inconnu';
  for (const t of tentatives) {
    const { data, text } = await callAnthropic({ apiKey, model, fullPrompt, maxTokens: t.maxTokens, maxUses: t.maxUses });
    const parsed = extractJson(text);
    if (parsed.ok) return parsed.value;
    dernierDiag = `${parsed.error} — stop_reason=${data.stop_reason || '?'}`;
    // Si ce n'est PAS un problème de budget, inutile de réessayer.
    if (data.stop_reason !== 'max_tokens') break;
  }
  throw new Error(`Réponse du modèle inexploitable (${dernierDiag}).`);
}
