export const GEMINI_MODELS = [
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
  { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
]

// Free-tier model first — it is the default provider/model for the app.
export const OPENROUTER_MODELS = [
  { id: 'meta-llama/llama-3.2-3b-instruct:free', name: 'Llama 3.2 3B Instruct (free)' },
  { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B Instruct (free)' },
  { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash (free)' },
  { id: 'deepseek/deepseek-chat-v3-0324:free', name: 'DeepSeek V3 (free)' },
  { id: 'qwen/qwen-2.5-72b-instruct:free', name: 'Qwen 2.5 72B (free)' },
  { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
  { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
  { id: 'anthropic/claude-sonnet-4-5', name: 'Claude Sonnet 4.5' },
  { id: 'anthropic/claude-haiku-4-5', name: 'Claude Haiku 4.5' },
  { id: 'openai/gpt-4.1', name: 'GPT-4.1' },
  { id: 'openai/gpt-4.1-mini', name: 'GPT-4.1 Mini' },
  { id: 'meta-llama/llama-4-maverick', name: 'Llama 4 Maverick' },
  { id: 'deepseek/deepseek-chat-v3-0324', name: 'DeepSeek V3' },
  { id: 'qwen/qwen-2.5-72b-instruct', name: 'Qwen 2.5 72B' },
]

export const OLLAMA_MODELS = [
  { id: 'llama3.2', name: 'Llama 3.2 (1B / 3B)' },
  { id: 'llama3.3', name: 'Llama 3.3 (70B)' },
  { id: 'deepseek-r1', name: 'DeepSeek R1' },
  { id: 'gemma3', name: 'Gemma 3' },
  { id: 'qwen3', name: 'Qwen3' },
  { id: 'qwen2.5', name: 'Qwen 2.5' },
  { id: 'mistral', name: 'Mistral 7B' },
  { id: 'phi4', name: 'Phi-4' },
]

export function getModelsForProvider(provider) {
  if (provider === 'gemini') return GEMINI_MODELS
  if (provider === 'openrouter') return OPENROUTER_MODELS
  if (provider === 'ollama') return OLLAMA_MODELS
  return []
}
