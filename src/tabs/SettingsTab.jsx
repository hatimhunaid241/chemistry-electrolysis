import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import { useLang, LANGS } from '../i18n/LanguageContext'
import { getModelsForProvider } from '../utils/models'
import { generateQuestion } from '../utils/ai'

const PROVIDERS = [
  { id: 'openrouter', name: { en: 'OpenRouter', zh: 'OpenRouter' }, icon: '🟣', description: { en: 'Unified API for 100+ models, including free ones. Default provider.', zh: '統一存取 100+ 個模型（含免費），為預設供應商。' }, keyLabel: { en: 'OpenRouter API Key', zh: 'OpenRouter API 金鑰' }, keyPlaceholder: 'sk-or-...', docsUrl: 'https://openrouter.ai/keys' },
  { id: 'gemini', name: { en: 'Google Gemini', zh: 'Google Gemini' }, icon: '🔵', description: { en: "Access Google's Gemini models via the Generative AI API.", zh: '透過 Generative AI API 使用 Google Gemini 模型。' }, keyLabel: { en: 'Gemini API Key', zh: 'Gemini API 金鑰' }, keyPlaceholder: 'AIza...', docsUrl: 'https://aistudio.google.com/apikey' },
  { id: 'ollama', name: { en: 'Ollama (Local)', zh: 'Ollama（本機）' }, icon: '🟢', description: { en: 'Run models locally with no API key. Requires Ollama running.', zh: '在本機運行模型，無需金鑰。須先運行 Ollama。' }, keyLabel: { en: 'Ollama Server URL', zh: 'Ollama 伺服器網址' }, keyPlaceholder: 'http://localhost:11434', docsUrl: 'https://ollama.ai' },
]

export default function SettingsTab() {
  const { aiSettings, setAISettings } = useApp()
  const { t, lang, setLang, pick } = useLang()
  const [saved, setSaved] = useState(false)
  const [showKey, setShowKey] = useState(false)
  const [cleared, setCleared] = useState(false)
  const [testStatus, setTestStatus] = useState('')

  const provider = PROVIDERS.find(p => p.id === aiSettings.provider) ?? PROVIDERS[0]
  const models = getModelsForProvider(aiSettings.provider)

  const update = (field, value) => { setSaved(false); setCleared(false); setAISettings({ ...aiSettings, [field]: value }) }
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000) }
  const clearKey = () => { update('apiKey', ''); setCleared(true) }

  const test = async () => {
    setTestStatus('testing')
    try {
      await generateQuestion(aiSettings, { topic: 'Electrolysis basics', difficulty: 20, lang, type: 'mcq' })
      setTestStatus('ok')
    } catch (e) { setTestStatus('error:' + e.message) }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">{t('settings_title')}</h2>
        <p className="text-slate-500 text-sm mt-1">{t('settings_subtitle')}</p>
      </div>

      {/* Language */}
      <div className="card mb-5">
        <h3 className="font-semibold text-slate-900 mb-1">{t('settings_language')}</h3>
        <p className="text-xs text-slate-500 mb-3">{t('settings_lang_desc')}</p>
        <div className="flex gap-2">
          {LANGS.map(l => (
            <button key={l.id} onClick={() => setLang(l.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${lang === l.id ? 'bg-blue-600 border-blue-500 text-white' : 'border-slate-300 text-slate-600 hover:border-slate-400'}`}>
              {l.name}
            </button>
          ))}
        </div>
      </div>

      {/* Provider */}
      <div className="card mb-5">
        <h3 className="font-semibold text-slate-900 mb-3">{t('settings_provider')}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {PROVIDERS.map(p => (
            <button key={p.id} onClick={() => update('provider', p.id)}
              className={`border rounded-xl p-4 text-left transition-all ${aiSettings.provider === p.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}>
              <div className="text-2xl mb-2">{p.icon}</div>
              <div className="font-semibold text-sm text-slate-900">{pick(p.name)}</div>
              <div className="text-xs text-slate-500 mt-1">{pick(p.description)}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Model */}
      <div className="card mb-5">
        <h3 className="font-semibold text-slate-900 mb-3">{t('settings_model')}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {models.map(m => (
            <button key={m.id} onClick={() => update('model', m.id)}
              className={`border rounded-lg px-3 py-2 text-left text-sm transition-all ${aiSettings.model === m.id ? 'border-blue-500 bg-blue-50 text-slate-900' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>
              <span className="font-medium">{m.name}</span>
            </button>
          ))}
        </div>
        <div className="mt-3">
          <label className="text-xs text-slate-500 block mb-1">{t('settings_custom_model')}</label>
          <input value={aiSettings.model} onChange={e => update('model', e.target.value)} placeholder="e.g. meta-llama/llama-3.2-3b-instruct:free"
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none font-mono" />
        </div>
      </div>

      {/* Key / URL */}
      <div className="card mb-5">
        <h3 className="font-semibold text-slate-900 mb-3">{pick(provider.keyLabel)}</h3>
        {aiSettings.provider !== 'ollama' ? (
          <>
            <div className="relative">
              <input type={showKey ? 'text' : 'password'} value={aiSettings.apiKey} onChange={e => update('apiKey', e.target.value)} placeholder={provider.keyPlaceholder}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 pr-20 text-sm text-slate-700 focus:border-blue-500 focus:outline-none font-mono" />
              <button onClick={() => setShowKey(s => !s)} className="absolute right-3 top-2 text-xs text-slate-500 hover:text-slate-700">
                {showKey ? t('settings_hide') : t('settings_show')}
              </button>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <button onClick={clearKey} className="text-xs text-red-600 hover:text-red-500 border border-red-200 rounded px-2 py-1">{t('btn_clear_key')}</button>
              {cleared && <span className="text-xs text-slate-500">{t('settings_key_cleared')}</span>}
            </div>
          </>
        ) : (
          <input type="text" value={aiSettings.ollamaUrl} onChange={e => update('ollamaUrl', e.target.value)} placeholder={provider.keyPlaceholder}
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none font-mono" />
        )}
        <p className="text-xs text-slate-500 mt-2">
          {t('settings_key_note')}{' '}
          <a href={provider.docsUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{t('settings_get_key')}</a>
        </p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <button onClick={save} className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-2.5 rounded-xl transition">
          {saved ? t('btn_saved') : t('btn_save')}
        </button>
        <button onClick={test} disabled={testStatus === 'testing'} className="bg-slate-200 hover:bg-slate-300 disabled:opacity-50 text-slate-700 font-semibold px-5 py-2.5 rounded-xl transition">
          {testStatus === 'testing' ? t('btn_testing') : t('btn_test')}
        </button>
        {testStatus === 'ok' && <span className="flex items-center text-green-600 text-sm">{t('settings_connected')}</span>}
        {testStatus.startsWith('error:') && <span className="flex items-center text-red-600 text-xs">{testStatus.replace('error:', '')}</span>}
      </div>

      <div className="mt-8 card">
        <h3 className="font-semibold text-slate-900 mb-3">{t('settings_tips')}</h3>
        <ul className="space-y-2 text-sm text-slate-600">
          <li>• {lang === 'zh' ? '預設使用 OpenRouter 的免費 Llama 3.2 3B 模型 —— 只需在 openrouter.ai 取得免費金鑰。' : 'Defaults to the free Llama 3.2 3B model on OpenRouter — just grab a free key at openrouter.ai.'}</li>
          <li>• {lang === 'zh' ? '較強模型（Gemini 2.5、Claude、GPT-4.1）能生成更佳的結構題。' : 'Stronger models (Gemini 2.5, Claude, GPT-4.1) give better structured questions.'}</li>
          <li>• {lang === 'zh' ? '題目每次即時生成，數值會變化，永不重複。' : 'Questions are generated fresh each time — numbers change, so you never run out.'}</li>
          <li>• {lang === 'zh' ? '金鑰只儲存在此裝置，直接傳送至供應商。' : 'Your key stays on this device and is sent directly to the provider only.'}</li>
        </ul>
      </div>
    </div>
  )
}
