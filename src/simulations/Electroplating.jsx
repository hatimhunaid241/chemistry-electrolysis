import React, { useRef, useEffect, useState, useCallback } from 'react'
import { useLang } from '../i18n/LanguageContext'
import { CV, clearLight, drawBattery, drawWire, drawBeaker, drawElectrode, drawElectron, drawIon, label } from './simTheme'

const W = 700, H = 472
const BK = { x: 80, y: 120, w: 540, h: 270 }
const ANODE_X = 210, CATHODE_X = 490
const ELEC_TOP = 90, ELEC_BOT = 355
const BAT_CX = 350, BAT_Y = 20, WIRE_Y = BAT_Y + 13

const METAL_OPTIONS = [
  { id: 'ag', name: { en: 'Silver (Ag)', zh: '銀 (Ag)' }, sym: 'Ag', ionSym: 'Ag⁺', ionColor: '#a3a3a3', metalColor: '#9ca3af', solColor: 'rgba(148,163,184,0.12)', electrolyte: 'AgNO₃(aq)' },
  { id: 'cu', name: { en: 'Copper (Cu)', zh: '銅 (Cu)' }, sym: 'Cu', ionSym: 'Cu²⁺', ionColor: '#f97316', metalColor: '#b45309', solColor: 'rgba(37,99,235,0.14)', electrolyte: 'CuSO₄(aq)' },
  { id: 'ni', name: { en: 'Nickel (Ni)', zh: '鎳 (Ni)' }, sym: 'Ni', ionSym: 'Ni²⁺', ionColor: '#84cc16', metalColor: '#4d7c0f', solColor: 'rgba(132,204,22,0.10)', electrolyte: 'NiSO₄(aq)' },
  { id: 'cr', name: { en: 'Chromium (Cr)', zh: '鉻 (Cr)' }, sym: 'Cr', ionSym: 'Cr³⁺', ionColor: '#06b6d4', metalColor: '#155e75', solColor: 'rgba(6,182,212,0.10)', electrolyte: 'Cr₂(SO₄)₃(aq)' },
]
const OBJECT_OPTIONS = [
  { id: 'spoon', name: { en: 'Spoon', zh: '匙羹' } },
  { id: 'ring', name: { en: 'Ring', zh: '戒指' } },
  { id: 'plate', name: { en: 'Plate', zh: '碟' } },
]

function initState() {
  return { ions: Array.from({ length: 24 }, (_, i) => ({ x: 120 + Math.random() * 460, y: 150 + Math.random() * 200, isCation: i < 12, r: 12 })), platingThickness: 0, anodeMass: 100, electrons: [0, 0.33, 0.66].map(p => ({ pos: p })) }
}

export default function ElectroplatingSim({ onSample }) {
  const { t, lang, pick } = useLang()
  const canvasRef = useRef(null)
  const stateRef = useRef(initState())
  const animRef = useRef(null)
  const runRef = useRef(false)
  const onSampleRef = useRef(onSample)
  useEffect(() => { onSampleRef.current = onSample }, [onSample])

  const [voltage, setVoltage] = useState(6)
  const [current, setCurrent] = useState(1.0)
  const [time, setTime] = useState(0)
  const [running, setRunning] = useState(false)
  const [metal, setMetal] = useState(METAL_OPTIONS[0])
  const [object, setObject] = useState(OBJECT_OPTIONS[0])

  const charge = current * time
  const F = 96500
  const z = metal.id === 'cr' ? 3 : metal.id === 'ag' ? 1 : 2
  const M = { ag: 108, cu: 63.5, ni: 58.7, cr: 52 }[metal.id]
  const massDeposited = ((charge / F) * (M / z)).toFixed(4)

  useEffect(() => {
    let tm
    if (running) tm = setInterval(() => setTime(p => p + 1), 1000)
    return () => clearInterval(tm)
  }, [running])

  // Emit a data sample whenever time advances while running.
  useEffect(() => {
    if (running && time > 0) onSampleRef.current?.({ t: time, mass: +massDeposited, charge: Math.round(charge) })
  }, [time, running, massDeposited, charge])

  const update = useCallback(() => {
    const s = stateRef.current
    const spd = voltage / 6
    s.electrons.forEach(e => { e.pos = (e.pos + spd * 0.004) % 1 })
    s.ions.forEach(ion => {
      const target = ion.isCation ? CATHODE_X : ANODE_X
      ion.x += (target - ion.x) * 0.01 * spd + (Math.random() - 0.5) * 0.7
      ion.y += (Math.random() - 0.5)
      ion.y = Math.max(BK.y + ion.r + 5, Math.min(BK.y + BK.h - ion.r - 5, ion.y))
      if (ion.isCation && ion.x > CATHODE_X - 18) { s.platingThickness = Math.min(s.platingThickness + 0.08, 30); respawn(ion) }
      if (!ion.isCation && ion.x < ANODE_X + 18) { s.anodeMass = Math.max(0, s.anodeMass - 0.03); respawn(ion) }
    })
  }, [voltage])

  const draw = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d')
    const s = stateRef.current
    clearLight(ctx, W, H)
    drawWire(ctx, [{ x: BAT_CX - 90, y: WIRE_Y }, { x: ANODE_X, y: WIRE_Y }, { x: ANODE_X, y: ELEC_TOP }])
    drawWire(ctx, [{ x: BAT_CX + 90, y: WIRE_Y }, { x: CATHODE_X, y: WIRE_Y }, { x: CATHODE_X, y: ELEC_TOP }])
    if (running) s.electrons.forEach(e => { const p = ePath(e.pos); drawElectron(ctx, p.x, p.y) })
    drawBattery(ctx, BAT_CX, BAT_Y)

    drawBeaker(ctx, BK.x, BK.y, BK.w, BK.h, metal.solColor)
    const anodeH = 20 + (s.anodeMass / 100) * (ELEC_BOT - ELEC_TOP - 20)
    drawElectrode(ctx, ANODE_X, ELEC_TOP, ELEC_TOP + anodeH, metal.metalColor, 16)
    label(ctx, `${t('anode')} (+)`, ANODE_X, ELEC_TOP - 22, CV.textStrong)
    label(ctx, metal.sym, ANODE_X, ELEC_TOP - 10, CV.textMuted, 10)

    drawElectrode(ctx, CATHODE_X, ELEC_TOP, ELEC_BOT, '#64748b', 16)
    if (s.platingThickness > 0) { ctx.fillStyle = metal.metalColor; ctx.globalAlpha = 0.75; ctx.fillRect(CATHODE_X - 8 - s.platingThickness / 2, ELEC_TOP, 16 + s.platingThickness, ELEC_BOT - ELEC_TOP); ctx.globalAlpha = 1 }
    label(ctx, `${t('cathode')} (−)`, CATHODE_X, ELEC_TOP - 22, CV.textStrong)
    label(ctx, pick(object.name), CATHODE_X, ELEC_TOP - 10, CV.textMuted, 10)

    s.ions.forEach(ion => drawIon(ctx, ion.x, ion.y, ion.isCation ? metal.ionSym : 'NO₃⁻', ion.isCation ? metal.ionColor : '#818cf8', ion.r))

    label(ctx, metal.electrolyte, BAT_CX, BK.y + BK.h + 18, CV.textStrong, 13)
    label(ctx, `${metal.sym} ${lang === 'zh' ? '電鍍於' : 'plating on'} ${pick(object.name)}`, BAT_CX, BK.y + BK.h + 34, CV.textMuted, 11)

    // Faraday info box — centred between the electrodes, clear of the bottom labels.
    const fbx = 245, fby = BK.y + 8, fbw = 210, fbCx = fbx + fbw / 2
    ctx.globalAlpha = 0.95; ctx.fillStyle = CV.panel; ctx.beginPath(); ctx.roundRect(fbx, fby, fbw, 70, 8); ctx.fill(); ctx.globalAlpha = 1
    ctx.strokeStyle = CV.panelStroke; ctx.lineWidth = 1; ctx.stroke()
    label(ctx, lang === 'zh' ? '⚗ 法拉第計算' : '⚗ Faraday Calculation', fbCx, fby + 17, CV.textStrong, 10)
    label(ctx, `Q = ${current}A × ${time}s = ${charge.toFixed(0)} C`, fbCx, fby + 33, CV.text, 9)
    label(ctx, `n(e⁻) = ${(charge / F).toFixed(5)} mol`, fbCx, fby + 47, CV.text, 9)
    label(ctx, `${lang === 'zh' ? '沉積質量' : 'Mass'} = ${massDeposited} g`, fbCx, fby + 63, '#16a34a', 10)

    label(ctx, `${metal.ionSym} → ${metal.sym} (${lang === 'zh' ? '陽極溶解' : 'anode dissolves'})`, ANODE_X, BK.y + BK.h + 50, CV.textMuted, 10)
    label(ctx, `${metal.ionSym} + ${z}e⁻ → ${metal.sym}`, CATHODE_X, BK.y + BK.h + 50, CV.textMuted, 10)
  }, [running, metal, object, current, time, massDeposited, charge, t, lang, pick])

  useEffect(() => {
    const loop = () => { if (runRef.current) update(); draw(); animRef.current = requestAnimationFrame(loop) }
    animRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animRef.current)
  }, [draw, update])

  useEffect(() => { runRef.current = running }, [running])
  const reset = () => { stateRef.current = initState(); setTime(0); setRunning(false); runRef.current = false; onSampleRef.current?.({ reset: true }) }

  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} className="sim-canvas" />
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card">
          <label className="text-xs text-slate-500 block mb-2">{lang === 'zh' ? '電鍍金屬' : 'Plating Metal'}</label>
          <select value={metal.id} onChange={e => { setMetal(METAL_OPTIONS.find(m => m.id === e.target.value)); reset() }} className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-sm text-slate-700">
            {METAL_OPTIONS.map(m => <option key={m.id} value={m.id}>{pick(m.name)}</option>)}
          </select>
        </div>
        <div className="card">
          <label className="text-xs text-slate-500 block mb-2">{lang === 'zh' ? '被鍍物件' : 'Object to Plate'}</label>
          <select value={object.id} onChange={e => setObject(OBJECT_OPTIONS.find(o => o.id === e.target.value))} className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-sm text-slate-700">
            {OBJECT_OPTIONS.map(o => <option key={o.id} value={o.id}>{pick(o.name)}</option>)}
          </select>
        </div>
        <div className="card">
          <label className="text-xs text-slate-500 block mb-2">{t('current')}: <span className="text-blue-600 font-bold">{current} A</span></label>
          <input type="range" min={0.1} max={5} step={0.1} value={current} onChange={e => setCurrent(+e.target.value)} className="control-slider" />
        </div>
        <div className="card flex gap-2 items-center justify-center">
          <button onClick={() => setRunning(r => !r)} className={`px-3 py-2 rounded-lg font-semibold text-sm text-white ${running ? 'bg-red-600 hover:bg-red-500' : 'bg-green-600 hover:bg-green-500'}`}>
            {running ? t('btn_pause') : t('btn_start')}
          </button>
          <button onClick={reset} className="px-3 py-2 rounded-lg font-semibold text-sm bg-slate-200 hover:bg-slate-300 text-slate-700">↺</button>
        </div>
      </div>
    </div>
  )
}

function respawn(ion) { ion.x = 130 + Math.random() * 440; ion.y = 150 + Math.random() * 200 }
function ePath(tt) {
  const s1 = ELEC_TOP - WIRE_Y, s2 = CATHODE_X - ANODE_X
  const total = s1 + s2 + s1, d = tt * total
  if (d < s1) return { x: ANODE_X, y: ELEC_TOP - d }
  if (d < s1 + s2) return { x: ANODE_X + (d - s1), y: WIRE_Y }
  return { x: CATHODE_X, y: WIRE_Y + (d - s1 - s2) }
}
