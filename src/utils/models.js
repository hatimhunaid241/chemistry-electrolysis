export const GEMINI_MODELS = [
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
  { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
]

export const OPENROUTER_MODELS = [
  { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro (OR)' },
  { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash (OR)' },
  { id: 'anthropic/claude-opus-4', name: 'Claude Opus 4' },
  { id: 'anthropic/claude-sonnet-4-5', name: 'Claude Sonnet 4.5' },
  { id: 'anthropic/claude-haiku-4-5', name: 'Claude Haiku 4.5' },
  { id: 'openai/gpt-4.1', name: 'GPT-4.1' },
  { id: 'openai/gpt-4.1-mini', name: 'GPT-4.1 Mini' },
  { id: 'openai/o4-mini', name: 'o4-mini' },
  { id: 'meta-llama/llama-4-maverick', name: 'Llama 4 Maverick' },
  { id: 'meta-llama/llama-4-scout', name: 'Llama 4 Scout' },
  { id: 'deepseek/deepseek-r2', name: 'DeepSeek R2' },
  { id: 'deepseek/deepseek-chat-v3-5', name: 'DeepSeek Chat V3.5' },
  { id: 'mistralai/mistral-large-2411', name: 'Mistral Large' },
  { id: 'qwen/qwen3-235b-a22b', name: 'Qwen3 235B' },
]

export const OLLAMA_MODELS = [
  { id: 'llama3.3', name: 'Llama 3.3 (8B / 70B)' },
  { id: 'llama3.2', name: 'Llama 3.2 (1B / 3B)' },
  { id: 'deepseek-r1', name: 'DeepSeek R1' },
  { id: 'gemma3', name: 'Gemma 3' },
  { id: 'qwen3', name: 'Qwen3' },
  { id: 'qwen2.5', name: 'Qwen 2.5' },
  { id: 'qwen2.5-coder', name: 'Qwen2.5 Coder' },
  { id: 'mistral', name: 'Mistral 7B' },
  { id: 'phi4', name: 'Phi-4' },
  { id: 'phi4-mini', name: 'Phi-4 Mini' },
  { id: 'dolphin3', name: 'Dolphin 3' },
]

export function getModelsForProvider(provider) {
  if (provider === 'gemini') return GEMINI_MODELS
  if (provider === 'openrouter') return OPENROUTER_MODELS
  if (provider === 'ollama') return OLLAMA_MODELS
  return []
}
