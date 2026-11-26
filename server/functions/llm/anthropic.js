/* Anthropic adapter for the LLM bus. The key comes from Secret Manager (ANTHROPIC_API_KEY), never from the app. */
'use strict';
const Anthropic = require('@anthropic-ai/sdk').default;

let client = null;
const get = () => client || (client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, maxRetries: 2 }));

async function turn({ route, system, messages, tools, maxTokens }) {
  const res = await get().beta.messages.create({
    model: route.modelo,
    max_tokens: maxTokens || 16000,
    // the system prompt and tool list never change between calls, so they are served from cache after the first
    system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
    tools,
    messages,
    output_config: { effort: route.effort || 'medium' },
    // if this model declines a request, the API retries it on a fallback model inside the same call
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
  });
  return { content: res.content, stop_reason: res.stop_reason, stop_details: res.stop_details, usage: res.usage, modelo: res.model };
}

function describeError(e) {
  if (e instanceof Anthropic.AuthenticationError) return 'chave da Anthropic inválida';
  if (e instanceof Anthropic.PermissionDeniedError) return 'chave sem permissão (confira os créditos)';
  if (e instanceof Anthropic.RateLimitError) return 'limite de uso atingido, tente em instantes';
  if (e instanceof Anthropic.BadRequestError) return 'pedido recusado: ' + e.message;
  if (e instanceof Anthropic.APIError) return `erro ${e.status}: ${e.message}`;
  return String(e?.message || e);
}
const isFatal = e => e instanceof Anthropic.BadRequestError;

module.exports = { turn, describeError, isFatal };
