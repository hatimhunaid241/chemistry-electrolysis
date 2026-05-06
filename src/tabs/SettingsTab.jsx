import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import { GEMINI_MODELS, OPENROUTER_MODELS, OLLAMA_MODELS, getModelsForProvider } from '../utils/models'

const PROVIDERS = [
  { id: 'gemini', name: 'Google Gemini', icon: '🔵', description: 'Access Google\'s latest Gemini models via the Generative AI API', keyLabel: 'Gemini API Key', keyPlaceholder: 'AIza...', docsUrl: 'https://aistudio.google.com/apikey' },
  { id: 'openrouter', name: 'OpenRouter', icon: '🟣', description: 'Unified API for 100+ models including Claude, GPT-4, Llama, Gemini and more', keyLabel: 'OpenRouter API Key', keyPlaceholder: 'sk-or-...', docsUrl: 'https://openrouter.ai/keys' },
  { id: 'ollama', name: 'Ollama (Local)', icon: '🟢', description: 'Run models locally with no API key. Requires Ollama running on your machine', keyLabel: 'Ollama Server URL', keyPlaceholder: 'http://localhost:11434', docsUrl: 'https://ollama.ai' },
]

export default function SettingsTab() {
  const { aiSettings, setAISettings } = useApp()
  const [saved, setSaved] = useState(false)
  const [showKey, setShowKey] = useState(false)
  const [testStatus, setTestStatus] = useState('')

  const provider = PROVIDERS.find(p => p.id === aiSettings.provider) ?? PROVIDERS[0]
  const models = getModelsForProvider(aiSettings.provider)

  const update = (field, value) => {
    setSaved(false)
    setAISettings({ ...aiSettings, [field]: value })
  }

  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000) }

  const test = async () => {
    setTestStatus('testing')
    try {
      const { generateQuestion } = await import('../utils/ai')
      await generateQuestion(aiSettings, 'Electrolysis basics', 'easy', 'mcq')
      setTestStatus('ok')
    } catch (e) {
      setTestStatus('error:' + e.message)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">AI Settings</h2>
        <p className="text-gray-500 text-sm mt-1">Configure the AI provider used to generate practice questions</p>
      </div>

      {/* Provider selection */}
      <div className="card mb-5">
        <h3 className="font-semibold text-white mb-3">AI Provider</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {PROVIDERS.map(p => (
            <button key={p.id} onClick={() => update('provider', p.id)}
              className={`border rounded-xl p-4 text-left transition-all ${aiSettings.provider === p.id ? 'border-blue-500 bg-blue-950/30' : 'border-gray-700 hover:border-gray-600'}`}>
              <div className="text-2xl mb-2">{p.icon}</div>
              <div className="font-semibold text-sm text-white">{p.name}</div>
              <div className="text-xs text-gray-500 mt-1">{p.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Model selection */}
      <div className="card mb-5">
        <h3 className="font-semibold text-white mb-3">Model</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {models.map(m => (
            <button key={m.id} onClick={() => update('model', m.id)}
              className={`border rounded-lg px-3 py-2 text-left text-sm transition-all ${aiSettings.model === m.id ? 'border-blue-500 bg-blue-950/30 text-white' : 'border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-300'}`}>
              <span className="font-medium">{m.name}</span>
              <span className="text-xs text-gray-600 ml-2">{m.id}</span>
            </button>
          ))}
        </div>
        {/* Custom model input */}
        <div className="mt-3">
          <label className="text-xs text-gray-400 block mb-1">Or enter custom model ID:</label>
          <input value={aiSettings.model} onChange={e => update('model', e.target.value)}
            placeholder="e.g. google/gemini-2.5-pro"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 focus:border-blue-500 focus:outline-none font-mono" />
        </div>
      </div>

      {/* API Key / URL */}
      <div className="card mb-5">
        <h3 className="font-semibold text-white mb-3">{provider.keyLabel}</h3>
        {aiSettings.provider !== 'ollama' ? (
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={aiSettings.apiKey}
              onChange={e => update('apiKey', e.target.value)}
              placeholder={provider.keyPlaceholder}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 pr-20 text-sm text-gray-300 focus:border-blue-500 focus:outline-none font-mono"
            />
            <button onClick={() => setShowKey(s => !s)} className="absolute right-3 top-2 text-xs text-gray-500 hover:text-gray-300">
              {showKey ? 'Hide' : 'Show'}
            </button>
          </div>
        ) : (
          <input
            type="text"
            value={aiSettings.ollamaUrl}
            onChange={e => update('ollamaUrl', e.target.value)}
            placeholder={provider.keyPlaceholder}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 focus:border-blue-500 focus:outline-none font-mono"
          />
        )}
        <p className="text-xs text-gray-600 mt-2">
          Your key is stored in browser localStorage only — never sent anywhere except to the selected AI provider.{' '}
          <a href={provider.docsUrl} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">Get a key →</a>
        </p>
      </div>

      {/* Ollama info */}
      {aiSettings.provider === 'ollama' && (
        <div className="info-box mb-5">
          <p className="font-semibold text-sm mb-1">Running Ollama locally</p>
          <ol className="list-decimal list-inside text-xs space-y-1">
            <li>Install Ollama from <span className="text-blue-400">ollama.ai</span></li>
            <li>Pull a model: <code className="bg-gray-800 px-1 rounded">ollama pull llama3.3</code></li>
            <li>Make sure Ollama is running (it auto-starts after install)</li>
            <li>CORS: if you get a CORS error, run <code className="bg-gray-800 px-1 rounded">OLLAMA_ORIGINS=* ollama serve</code></li>
          </ol>
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-3">
        <button onClick={save} className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-2.5 rounded-xl transition">
          {saved ? '✓ Saved!' : 'Save Settings'}
        </button>
        <button onClick={test} disabled={testStatus === 'testing'} className="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-xl transition">
          {testStatus === 'testing' ? '⟳ Testing…' : 'Test Connection'}
        </button>
        {testStatus === 'ok' && <span className="flex items-center text-green-400 text-sm">✓ Connected!</span>}
        {testStatus.startsWith('error:') && <span className="flex items-center text-red-400 text-sm text-xs">{testStatus.replace('error:', '')}</span>}
      </div>

      {/* Tips */}
      <div className="mt-8 card bg-gray-900/50">
        <h3 className="font-semibold text-white mb-3">Tips for Best Results</h3>
        <ul className="space-y-2 text-sm text-gray-400">
          <li>• <span className="text-gray-300">Gemini 2.5 Pro/Flash</span> — best quality questions, fast, free tier available</li>
          <li>• <span className="text-gray-300">OpenRouter</span> — try Claude Sonnet or GPT-4.1 for detailed structured questions</li>
          <li>• <span className="text-gray-300">Ollama</span> — fully offline, Qwen3 or DeepSeek-R1 work well for chemistry</li>
          <li>• Questions are generated fresh each time — you'll never run out of practice material</li>
          <li>• Higher difficulty questions match HKDSE Paper 2 extended answer style</li>
        </ul>
      </div>
    </div>
  )
}
