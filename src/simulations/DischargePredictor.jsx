import React, { useRef, useEffect, useState, useCallback } from 'react'
import { useLang } from '../i18n/LanguageContext'
import { CV, clearLight, drawBattery, drawWire, drawBeaker, drawElectrode, drawElectron, label } from './simTheme'

const W = 700, H = 400
const BK = { x: 150, y: 110, w: 400, h: 210 }
const ANODE_X = 250, CATHODE_X = 450
const ELEC_TOP = 80, ELEC_BOT = 290
const BAT_CX = 350, BAT_Y = 20, WIRE_Y = BAT_Y + 13

// Cations ordered by ease of discharge at the cathode.
const CATIONS = [
  { id: 'K', sym: 'K⁺', z: 1 }, { id: 'Na', sym: 'Na⁺', z: 1 }, { id: 'Ca', sym: 'Ca²⁺', z: 2 },
  { id: 'Mg', sym: 'Mg²⁺', z: 2 }, { id: 'Al', sym: 'Al³⁺', z: 3 }, { id: 'Zn', sym: 'Zn²⁺', z: 2 },
  { id: 'Fe', sym: 'Fe²⁺', z: 2 }, { id: 'Pb', sym: 'Pb²⁺', z: 2 }, { id: 'H', sym: 'H⁺', z: 1 },
  { id: 'Cu', sym: 'Cu²⁺', z: 2 }, { id: 'Ag', sym: 'Ag⁺', z: 1 },
]
const NOBLE = ['Pb', 'Cu', 'Ag'] // deposited as metal at the cathode from aqueous solution
const ANIONS = [
  { id: 'SO4', sym: 'SO₄²⁻', halide: false }, { id: 'NO3', sym: 'NO₃⁻', halide: false },
  { id: 'Cl', sym: 'Cl⁻', halide: true, gas: 'Cl₂' }, { id: 'Br', sym: 'Br⁻', halide: true, gas: 'Br₂' }, { id: 'I', sym: 'I⁻', halide: true, gas: 'I₂' },
]

function predict(cat, an, conc, electrode) {
  const cathode = NOBLE.includes(cat.id)
    ? { product: cat.id, half: `${cat.sym} + ${cat.z}e⁻ → ${cat.id}(s)`, why: { en: `${cat.sym} is below H in the series, so the metal is deposited in preference to H₂.`, zh: `${cat.sym} 在電化學序中低於 H，故金屬優先於 H₂ 析出。` } }
    : { product: 'H₂', half: '2H₂O + 2e⁻ → H₂ + 2OH⁻', why: { en: `${cat.sym} is too reactive to be discharged; water is reduced to H₂ instead.`, zh: `${cat.sym} 太活潑不能放電，改為還原水生成 H₂。` } }
  let anode
  if (electrode === 'active') anode = { product: 'Cu²⁺', half: 'Cu(s) → Cu²⁺(aq) + 2e⁻', why: { en: 'The active copper anode dissolves in preference to any ion being oxidised.', zh: '活性銅陽極溶解，優先於任何離子被氧化。' } }
  else if (an.halide && conc === 'conc') anode = { product: an.gas, half: `2${an.sym} → ${an.gas} + 2e⁻`, why: { en: `Concentrated ${an.sym} is discharged in preference to water.`, zh: `濃 ${an.sym} 優先於水放電。` } }
  else anode = { product: 'O₂', half: '2H₂O → O₂ + 4H⁺ + 4e⁻', why: { en: an.halide ? `${an.sym} is too dilute; water is oxidised to O₂ instead.` : `${an.sym} is not discharged; water is oxidised to O₂.`, zh: an.halide ? `${an.sym} 太稀，改為氧化水生成 O₂。` : `${an.sym} 不放電，氧化水生成 O₂。` } }
  return { cathode, anode }
}

export default function DischargePredictor() {
  const { t, lang } = useLang()
  const canvasRef = useRef(null)
  const animRef = useRef(null)
  const runningRef = useRef(false)
  const electronsRef = useRef([0, 0.33, 0.66].map(p => ({ pos: p })))

  const [catId, setCatId] = useState('Cu')
  const [anId, setAnId] = useState('SO4')
  const [conc, setConc] = useState('conc')       // 'conc' | 'dilute'
  const [electrode, setElectrode] = useState('inert') // 'inert' | 'active'
  const [running, setRunning] = useState(false)
  const [runs, setRuns] = useState([])            // logged takes

  const cat = CATIONS.find(c => c.id === catId)
  const an = ANIONS.find(a => a.id === anId)
  const { cathode, anode } = predict(cat, an, conc, electrode)

  useEffect(() => { runningRef.current = running }, [running])

  // Any input change powers the cell off, so each Start is a fresh, discrete take.
  const choose = (fn, val) => { fn(val); setRunning(false) }

  const start = () => {
    if (running) return
    setRunning(true)
    setRuns(prev => [...prev, {
      id: prev.length + 1, cat: cat.sym, an: an.sym, conc, electrode,
      cathode: cathode.product, anode: anode.product,
    }].slice(-20))
  }
  // Reset restores the default experiment setup and powers off (the results log is kept).
  const reset = () => { setCatId('Cu'); setAnId('SO4'); setConc('conc'); setElectrode('inert'); setRunning(false) }

  const draw = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d')
    clearLight(ctx, W, H)
    drawWire(ctx, [{ x: BAT_CX - 90, y: WIRE_Y }, { x: ANODE_X, y: WIRE_Y }, { x: ANODE_X, y: ELEC_TOP }])
    drawWire(ctx, [{ x: BAT_CX + 90, y: WIRE_Y }, { x: CATHODE_X, y: WIRE_Y }, { x: CATHODE_X, y: ELEC_TOP }])
    if (running) electronsRef.current.forEach(e => { const p = ePath(e.pos); drawElectron(ctx, p.x, p.y) })
    drawBattery(ctx, BAT_CX, BAT_Y)

    drawBeaker(ctx, BK.x, BK.y, BK.w, BK.h, 'rgba(37,99,235,0.06)')
    drawElectrode(ctx, ANODE_X, ELEC_TOP, ELEC_BOT, electrode === 'active' ? CV.anode : '#475569')
    drawElectrode(ctx, CATHODE_X, ELEC_TOP, ELEC_BOT, '#475569')
    label(ctx, `${t('anode')} (+)`, ANODE_X, ELEC_TOP - 8, CV.textStrong)
    label(ctx, `${t('cathode')} (−)`, CATHODE_X, ELEC_TOP - 8, CV.textStrong)
    label(ctx, electrode === 'active' ? (lang === 'zh' ? '活性 Cu' : 'active Cu') : (lang === 'zh' ? '惰性' : 'inert'), ANODE_X, ELEC_TOP - 22, CV.textMuted, 10)

    label(ctx, `${lang === 'zh' ? '電解質' : 'Electrolyte'}: ${cat.sym} / ${an.sym} (${conc === 'conc' ? (lang === 'zh' ? '濃' : 'conc.') : (lang === 'zh' ? '稀' : 'dilute')})`, BAT_CX, BK.y + BK.h + 22, CV.textStrong, 12)

    if (running) {
      // Products only appear once the power is on.
      tag(ctx, ANODE_X, BK.y + 30, anode.product, '#7c3aed')
      tag(ctx, CATHODE_X, BK.y + 30, cathode.product, '#16a34a')
      label(ctx, anode.half, ANODE_X, BK.y + BK.h + 42, '#7c3aed', 10)
      label(ctx, cathode.half, CATHODE_X, BK.y + BK.h + 42, '#16a34a', 10)
    } else {
      label(ctx, lang === 'zh' ? '按「開始」通電以顯示產物' : 'Press Start to power on and reveal the products', BAT_CX, BK.y + BK.h + 44, CV.textMuted, 11)
    }
  }, [cat, an, conc, electrode, cathode, anode, running, t, lang])

  useEffect(() => {
    const loop = () => {
      if (runningRef.current) electronsRef.current.forEach(e => { e.pos = (e.pos + 0.004) % 1 })
      draw(); animRef.current = requestAnimationFrame(loop)
    }
    animRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animRef.current)
  }, [draw])

  const pill = (active) => `px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${active ? 'bg-blue-600 border-blue-500 text-white' : 'border-slate-300 text-slate-600 hover:border-slate-400'}`
  const cond = (r) => `${r.conc === 'conc' ? (lang === 'zh' ? '濃' : 'conc.') : (lang === 'zh' ? '稀' : 'dilute')} · ${r.electrode === 'active' ? (lang === 'zh' ? '活性' : 'active') : (lang === 'zh' ? '惰性' : 'inert')}`

  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} className="sim-canvas" />
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card">
          <label className="text-xs text-slate-500 block mb-2">{lang === 'zh' ? '陽離子（陰極）' : 'Cation (cathode)'}</label>
          <div className="flex flex-wrap gap-1.5">{CATIONS.map(c => <button key={c.id} onClick={() => choose(setCatId, c.id)} className={pill(catId === c.id)}>{c.sym}</button>)}</div>
        </div>
        <div className="card">
          <label className="text-xs text-slate-500 block mb-2">{lang === 'zh' ? '陰離子（陽極）' : 'Anion (anode)'}</label>
          <div className="flex flex-wrap gap-1.5">{ANIONS.map(a => <button key={a.id} onClick={() => choose(setAnId, a.id)} className={pill(anId === a.id)}>{a.sym}</button>)}</div>
        </div>
        <div className="card">
          <label className="text-xs text-slate-500 block mb-2">{t('concentration')}</label>
          <div className="flex gap-2">
            <button onClick={() => choose(setConc, 'conc')} className={pill(conc === 'conc')}>{lang === 'zh' ? '濃' : 'Concentrated'}</button>
            <button onClick={() => choose(setConc, 'dilute')} className={pill(conc === 'dilute')}>{lang === 'zh' ? '稀' : 'Dilute'}</button>
          </div>
        </div>
        <div className="card">
          <label className="text-xs text-slate-500 block mb-2">{lang === 'zh' ? '電極' : 'Electrode'}</label>
          <div className="flex gap-2">
            <button onClick={() => choose(setElectrode, 'inert')} className={pill(electrode === 'inert')}>{lang === 'zh' ? '惰性 (C/Pt)' : 'Inert (C/Pt)'}</button>
            <button onClick={() => choose(setElectrode, 'active')} className={pill(electrode === 'active')}>{lang === 'zh' ? '活性 (Cu)' : 'Active (Cu)'}</button>
          </div>
        </div>
      </div>

      {/* Start / Reset */}
      <div className="mt-4 card flex gap-3 items-center justify-center">
        <button onClick={start} disabled={running}
          className={`px-5 py-2 rounded-lg font-semibold text-sm text-white ${running ? 'bg-green-600/60 cursor-default' : 'bg-green-600 hover:bg-green-500'}`}>
          {running ? (lang === 'zh' ? '⚡ 已通電' : '⚡ Powered on') : t('btn_start')}
        </button>
        <button onClick={reset} className="px-5 py-2 rounded-lg font-semibold text-sm bg-slate-200 hover:bg-slate-300 text-slate-700">{t('btn_reset')}</button>
      </div>

      {/* Results log — one row per take (like the CuSO₄ readings table) */}
      <div className="mt-4 card">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold text-slate-900">{lang === 'zh' ? '結果記錄' : 'Results log'}</h4>
          {runs.length > 0 && (
            <button onClick={() => setRuns([])} className="text-xs text-slate-500 hover:text-red-600">{lang === 'zh' ? '清除記錄' : 'Clear log'}</button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-slate-200 px-2 py-1.5 text-left text-blue-700">#</th>
                <th className="border border-slate-200 px-2 py-1.5 text-left text-blue-700">{lang === 'zh' ? '陽離子' : 'Cation'}</th>
                <th className="border border-slate-200 px-2 py-1.5 text-left text-blue-700">{lang === 'zh' ? '陰離子' : 'Anion'}</th>
                <th className="border border-slate-200 px-2 py-1.5 text-left text-blue-700">{lang === 'zh' ? '條件' : 'Conditions'}</th>
                <th className="border border-slate-200 px-2 py-1.5 text-left text-green-700">{lang === 'zh' ? '陰極產物' : 'Cathode →'}</th>
                <th className="border border-slate-200 px-2 py-1.5 text-left text-purple-700">{lang === 'zh' ? '陽極產物' : 'Anode →'}</th>
              </tr>
            </thead>
            <tbody>
              {runs.length === 0 ? (
                <tr><td colSpan={6} className="border border-slate-200 px-2 py-2 text-center text-xs text-slate-400">{lang === 'zh' ? '選擇離子後按「開始」以記錄結果。' : 'Choose ions, then press Start to record a result.'}</td></tr>
              ) : runs.map((r, i) => (
                <tr key={r.id} className={i % 2 ? 'bg-slate-50' : 'bg-white'}>
                  <td className="border border-slate-200 px-2 py-1.5 text-slate-500">{r.id}</td>
                  <td className="border border-slate-200 px-2 py-1.5 text-slate-700 whitespace-nowrap">{r.cat}</td>
                  <td className="border border-slate-200 px-2 py-1.5 text-slate-700 whitespace-nowrap">{r.an}</td>
                  <td className="border border-slate-200 px-2 py-1.5 text-slate-600 whitespace-nowrap text-xs">{cond(r)}</td>
                  <td className="border border-slate-200 px-2 py-1.5 font-semibold text-green-700 whitespace-nowrap">{r.cathode}</td>
                  <td className="border border-slate-200 px-2 py-1.5 font-semibold text-purple-700 whitespace-nowrap">{r.anode}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {running && (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <p className="bg-green-50 border border-green-200 rounded-lg p-2 text-slate-600"><span className="font-semibold text-green-700">{t('cathode')} → {cathode.product}: </span>{lang === 'zh' ? cathode.why.zh : cathode.why.en}</p>
            <p className="bg-purple-50 border border-purple-200 rounded-lg p-2 text-slate-600"><span className="font-semibold text-purple-700">{t('anode')} → {anode.product}: </span>{lang === 'zh' ? anode.why.zh : anode.why.en}</p>
          </div>
        )}
      </div>
    </div>
  )
}

function ePath(tt) {
  const s1 = ELEC_TOP - WIRE_Y, s2 = CATHODE_X - ANODE_X
  const total = s1 + s2 + s1, d = tt * total
  if (d < s1) return { x: ANODE_X, y: ELEC_TOP - d }
  if (d < s1 + s2) return { x: ANODE_X + (d - s1), y: WIRE_Y }
  return { x: CATHODE_X, y: WIRE_Y + (d - s1 - s2) }
}

function tag(ctx, x, y, text, color) {
  ctx.font = 'bold 13px sans-serif'
  const w = ctx.measureText(text).width + 18
  ctx.fillStyle = '#fff'; ctx.strokeStyle = color; ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.roundRect(x - w / 2, y - 13, w, 22, 6); ctx.fill(); ctx.stroke()
  ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillText(text, x, y - 1); ctx.textBaseline = 'alphabetic'
}
