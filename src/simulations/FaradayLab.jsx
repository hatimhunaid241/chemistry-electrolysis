import React, { useRef, useEffect, useState, useCallback } from 'react'
import { useLang } from '../i18n/LanguageContext'
import { CV, clearLight, drawBattery, drawWire, drawBeaker, drawElectrode, drawElectron, label } from './simTheme'

const W = 700, H = 380
const BK = { x: 150, y: 110, w: 400, h: 230 }
const ANODE_X = 250, CATHODE_X = 450
const ELEC_TOP = 80, ELEC_BOT = 305
const BAT_CX = 350, BAT_Y = 20, WIRE_Y = BAT_Y + 13
const F = 96500

const SPECIES = [
  { id: 'cu', label: { en: 'Copper  Cu²⁺ + 2e⁻ → Cu', zh: '銅  Cu²⁺ + 2e⁻ → Cu' }, M: 63.5, z: 2, unit: 'g', gas: false, color: '#b45309' },
  { id: 'ag', label: { en: 'Silver  Ag⁺ + e⁻ → Ag', zh: '銀  Ag⁺ + e⁻ → Ag' }, M: 108, z: 1, unit: 'g', gas: false, color: '#9ca3af' },
  { id: 'pb', label: { en: 'Lead  Pb²⁺ + 2e⁻ → Pb', zh: '鉛  Pb²⁺ + 2e⁻ → Pb' }, M: 207, z: 2, unit: 'g', gas: false, color: '#64748b' },
  { id: 'h2', label: { en: 'Hydrogen  2H⁺ + 2e⁻ → H₂', zh: '氫  2H⁺ + 2e⁻ → H₂' }, M: 2, z: 2, unit: 'L', gas: true, color: '#2563eb' },
  { id: 'o2', label: { en: 'Oxygen  2H₂O → O₂ + 4H⁺ + 4e⁻', zh: '氧  2H₂O → O₂ + 4H⁺ + 4e⁻' }, M: 32, z: 4, unit: 'L', gas: true, color: '#ea580c' },
]

export default function FaradayLab({ onSample }) {
  const { t, lang, pick } = useLang()
  const canvasRef = useRef(null)
  const animRef = useRef(null)
  const runRef = useRef(false)
  const elecRef = useRef([0, 0.33, 0.66].map(p => ({ pos: p })))
  const onSampleRef = useRef(onSample)
  useEffect(() => { onSampleRef.current = onSample }, [onSample])

  const [current, setCurrent] = useState(2.0)
  const [time, setTime] = useState(0)
  const [running, setRunning] = useState(false)
  const [spId, setSpId] = useState('cu')
  const sp = SPECIES.find(s => s.id === spId)

  const Q = current * time
  const nE = Q / F
  const n = nE / sp.z
  const amount = sp.gas ? n * 24 : n * sp.M // gas volume (L, 24 L/mol at r.t.p) or mass (g)

  useEffect(() => {
    let tm
    if (running) tm = setInterval(() => setTime(p => p + 1), 1000)
    return () => clearInterval(tm)
  }, [running])

  useEffect(() => {
    if (running && time > 0) onSampleRef.current?.({ t: time, amount: +amount.toFixed(4), charge: Math.round(Q), moles: +n.toFixed(5) })
  }, [time, running, amount, Q, n])

  const draw = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d')
    clearLight(ctx, W, H)
    drawWire(ctx, [{ x: BAT_CX - 90, y: WIRE_Y }, { x: ANODE_X, y: WIRE_Y }, { x: ANODE_X, y: ELEC_TOP }])
    drawWire(ctx, [{ x: BAT_CX + 90, y: WIRE_Y }, { x: CATHODE_X, y: WIRE_Y }, { x: CATHODE_X, y: ELEC_TOP }])
    if (running) elecRef.current.forEach(e => { const p = ePath(e.pos); drawElectron(ctx, p.x, p.y) })
    drawBattery(ctx, BAT_CX, BAT_Y)

    drawBeaker(ctx, BK.x, BK.y, BK.w, BK.h, 'rgba(37,99,235,0.07)')
    drawElectrode(ctx, ANODE_X, ELEC_TOP, ELEC_BOT, '#475569')
    drawElectrode(ctx, CATHODE_X, ELEC_TOP, ELEC_BOT, '#475569')
    // deposit / gas indicator on cathode
    const frac = Math.min(amount / (sp.gas ? 0.5 : 2), 1)
    if (frac > 0) { ctx.fillStyle = sp.color; ctx.globalAlpha = sp.gas ? 0.4 : 0.85; ctx.fillRect(CATHODE_X - 9, ELEC_BOT - frac * 120, 18, frac * 120); ctx.globalAlpha = 1 }
    label(ctx, `${t('anode')} (+)`, ANODE_X, ELEC_TOP - 8, CV.textStrong)
    label(ctx, `${t('cathode')} (−)`, CATHODE_X, ELEC_TOP - 8, CV.textStrong)

    // Ammeter reading in-circuit
    label(ctx, `A = ${current.toFixed(1)}`, BAT_CX, WIRE_Y - 18, '#16a34a', 11)

    // Live calculation panel
    ctx.fillStyle = CV.panel; ctx.beginPath(); ctx.roundRect(12, H - 92, 250, 80, 8); ctx.fill()
    ctx.strokeStyle = CV.panelStroke; ctx.lineWidth = 1; ctx.stroke()
    label(ctx, `Q = I·t = ${current.toFixed(1)} × ${time} = ${Q.toFixed(0)} C`, 20, H - 72, CV.text, 10, 'left')
    label(ctx, `n(e⁻) = Q/F = ${nE.toFixed(5)} mol`, 20, H - 56, CV.text, 10, 'left')
    label(ctx, `n = n(e⁻)/${sp.z} = ${n.toFixed(5)} mol`, 20, H - 40, CV.text, 10, 'left')
    label(ctx, `${sp.gas ? (lang === 'zh' ? '體積' : 'Volume') : (lang === 'zh' ? '質量' : 'Mass')} = ${amount.toFixed(4)} ${sp.unit}`, 20, H - 22, '#16a34a', 12, 'left')
  }, [running, sp, current, time, Q, nE, n, amount, t, lang])

  useEffect(() => {
    const loop = () => {
      if (runRef.current) elecRef.current.forEach(e => { e.pos = (e.pos + current * 0.0016) % 1 })
      draw(); animRef.current = requestAnimationFrame(loop)
    }
    animRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animRef.current)
  }, [draw, current])

  useEffect(() => { runRef.current = running }, [running])
  const reset = () => { setTime(0); setRunning(false); runRef.current = false; onSampleRef.current?.({ reset: true }) }

  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} className="sim-canvas" />
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card">
          <label className="text-xs text-slate-500 block mb-2">{lang === 'zh' ? '被電解物種' : 'Species discharged'}</label>
          <select value={spId} onChange={e => { setSpId(e.target.value); reset() }} className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-sm text-slate-700">
            {SPECIES.map(s => <option key={s.id} value={s.id}>{pick(s.label)}</option>)}
          </select>
        </div>
        <div className="card">
          <label className="text-xs text-slate-500 block mb-2">{t('current')} I: <span className="text-blue-600 font-bold">{current.toFixed(1)} A</span></label>
          <input type="range" min={0.5} max={10} step={0.1} value={current} onChange={e => setCurrent(+e.target.value)} className="control-slider" />
        </div>
        <div className="card flex gap-3 items-center justify-center">
          <button onClick={() => setRunning(r => !r)} className={`px-4 py-2 rounded-lg font-semibold text-sm text-white ${running ? 'bg-red-600 hover:bg-red-500' : 'bg-green-600 hover:bg-green-500'}`}>
            {running ? t('btn_pause') : t('btn_start')}
          </button>
          <button onClick={reset} className="px-4 py-2 rounded-lg font-semibold text-sm bg-slate-200 hover:bg-slate-300 text-slate-700">{t('btn_reset')}</button>
        </div>
      </div>
      <div className="mt-4 card text-sm">
        <p className="text-slate-600">{lang === 'zh'
          ? `使用 F = 96 500 C mol⁻¹、氣體莫耳體積 = 24 L mol⁻¹（室溫室壓）。改變電流與時間，觀察沉積量與電荷 Q = I·t 成正比（法拉第第一定律）。`
          : `Uses F = 96 500 C mol⁻¹ and molar gas volume = 24 L mol⁻¹ (r.t.p.). Vary current and time and watch the amount deposited stay proportional to the charge Q = I·t (Faraday's first law).`}</p>
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
