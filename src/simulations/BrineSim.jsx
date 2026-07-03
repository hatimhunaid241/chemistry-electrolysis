import React, { useRef, useEffect, useState, useCallback } from 'react'
import { useLang } from '../i18n/LanguageContext'
import { CV, clearLight, drawBattery, drawWire, drawBeaker, drawElectrode, drawElectron, drawIon, drawBubble, label } from './simTheme'

const W = 700, H = 470
const BK = { x: 80, y: 120, w: 540, h: 270 }
const ANODE_X = 210, CATHODE_X = 490
const ELEC_TOP = 90, ELEC_BOT = 355
const BAT_CX = 350, BAT_Y = 20, WIRE_Y = BAT_Y + 13

function initState() {
  const ions = []
  for (let i = 0; i < 32; i++) {
    const t = i % 4
    ions.push({
      x: 120 + Math.random() * 460, y: 150 + Math.random() * 200,
      type: t === 0 ? 'Na' : t === 1 ? 'Cl' : t === 2 ? 'H' : 'OH',
      get symbol() { return { Na: 'Na⁺', Cl: 'Cl⁻', H: 'H⁺', OH: 'OH⁻' }[this.type] },
      get color() { return { Na: '#eab308', Cl: '#16a34a', H: '#2563eb', OH: '#ef4444' }[this.type] },
      get isCation() { return this.type === 'Na' || this.type === 'H' },
      r: 13,
    })
  }
  return { ions, h2Bubbles: [], anodeBubbles: [], electrons: [0, 0.33, 0.66].map(p => ({ pos: p })), naohFormed: 0, h2: 0, anodeGas: 0 }
}

export default function BrineSim({ onSample }) {
  const { t, lang } = useLang()
  const canvasRef = useRef(null)
  const stateRef = useRef(null)
  const animRef = useRef(null)
  const runRef = useRef(false)
  const frameRef = useRef(0)
  const secRef = useRef(0)
  const onSampleRef = useRef(onSample)
  useEffect(() => { onSampleRef.current = onSample }, [onSample])

  const [voltage, setVoltage] = useState(6)
  const [concentration, setConc] = useState(80)
  const [running, setRunning] = useState(false)

  if (!stateRef.current) stateRef.current = initState()
  const concentrated = concentration > 40
  const anodeProduct = concentrated ? 'Cl₂' : 'O₂'

  const update = useCallback(() => {
    const s = stateRef.current
    const spd = voltage / 6
    s.electrons.forEach(e => { e.pos = (e.pos + spd * 0.004) % 1 })
    s.ions.forEach(ion => {
      const target = ion.isCation ? CATHODE_X : ANODE_X
      ion.x += (target - ion.x) * 0.01 * spd + (Math.random() - 0.5) * 0.7
      ion.y += (Math.random() - 0.5)
      ion.y = Math.max(BK.y + ion.r + 5, Math.min(BK.y + BK.h - ion.r - 5, ion.y))
      if (ion.isCation && ion.x > CATHODE_X - 18) {
        s.h2Bubbles.push({ x: CATHODE_X + (Math.random() - 0.5) * 10, y: ELEC_BOT - 15, r: 5, alpha: 0.8 })
        s.naohFormed++; s.h2 += 0.5; respawn(ion)
      }
      if (!ion.isCation && ion.x < ANODE_X + 18) {
        s.anodeBubbles.push({ x: ANODE_X + (Math.random() - 0.5) * 10, y: ELEC_BOT - 15, r: 5, alpha: 0.8 })
        s.anodeGas += 0.5; respawn(ion)
      }
    })
    const decay = b => { b.y -= 0.7; b.alpha -= 0.006 }
    s.h2Bubbles.forEach(decay); s.anodeBubbles.forEach(decay)
    s.h2Bubbles = s.h2Bubbles.filter(b => b.alpha > 0.05 && b.y > BK.y)
    s.anodeBubbles = s.anodeBubbles.filter(b => b.alpha > 0.05 && b.y > BK.y)
  }, [voltage, concentration])

  const draw = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d')
    const s = stateRef.current
    clearLight(ctx, W, H)
    drawWire(ctx, [{ x: BAT_CX - 90, y: WIRE_Y }, { x: ANODE_X, y: WIRE_Y }, { x: ANODE_X, y: ELEC_TOP }])
    drawWire(ctx, [{ x: BAT_CX + 90, y: WIRE_Y }, { x: CATHODE_X, y: WIRE_Y }, { x: CATHODE_X, y: ELEC_TOP }])
    if (running) s.electrons.forEach(e => { const p = ePath(e.pos); drawElectron(ctx, p.x, p.y) })
    drawBattery(ctx, BAT_CX, BAT_Y)

    drawBeaker(ctx, BK.x, BK.y, BK.w, BK.h, `rgba(34,197,94,${(concentration / 100) * 0.12 + 0.03})`)
    if (s.naohFormed > 20) { ctx.fillStyle = `rgba(239,68,68,${Math.min(s.naohFormed / 800, 0.1)})`; ctx.fillRect(CATHODE_X - 80, BK.y + 4, 80, BK.h - 8) }

    drawElectrode(ctx, ANODE_X, ELEC_TOP, ELEC_BOT, '#334155')
    drawElectrode(ctx, CATHODE_X, ELEC_TOP, ELEC_BOT, '#334155')
    label(ctx, `${t('anode')} (+)`, ANODE_X, ELEC_TOP - 10, CV.textStrong)
    label(ctx, `${t('cathode')} (−)`, CATHODE_X, ELEC_TOP - 10, CV.textStrong)

    s.ions.forEach(ion => drawIon(ctx, ion.x, ion.y, ion.symbol, ion.color, ion.r))
    s.h2Bubbles.forEach(b => drawBubble(ctx, b.x, b.y, b.r, '#3b82f6', b.alpha))
    s.anodeBubbles.forEach(b => drawBubble(ctx, b.x, b.y, b.r, concentrated ? '#16a34a' : '#38bdf8', b.alpha))

    const anodeGas = concentrated ? (lang === 'zh' ? 'Cl₂（黃綠色）' : 'Cl₂ (yellow-green)') : (lang === 'zh' ? 'O₂（無色）' : 'O₂ (colourless)')
    label(ctx, anodeGas, ANODE_X, BK.y - 10, concentrated ? '#16a34a' : '#0284c7', 11)
    label(ctx, lang === 'zh' ? 'H₂（無色）' : 'H₂ (colourless)', CATHODE_X, BK.y - 10, '#2563eb', 11)
    label(ctx, 'NaCl(aq) Brine', BAT_CX, BK.y + BK.h + 18, CV.textStrong, 13)
    label(ctx, `[NaCl]: ${concentration}% — ${concentrated ? (lang === 'zh' ? '陽極放出 Cl₂' : 'Cl₂ at anode') : (lang === 'zh' ? '陽極放出 O₂（稀）' : 'O₂ at anode (dilute)')}`, BAT_CX, BK.y + BK.h + 34, CV.textMuted, 11)
    label(ctx, '2H₂O + 2e⁻ → H₂ + 2OH⁻', CATHODE_X, BK.y + BK.h + 50, '#2563eb', 10)
    label(ctx, concentrated ? '2Cl⁻ → Cl₂ + 2e⁻' : '2H₂O → O₂ + 4H⁺ + 4e⁻', ANODE_X, BK.y + BK.h + 50, '#16a34a', 10)
  }, [voltage, concentration, running, concentrated, t, lang])

  useEffect(() => {
    const loop = () => {
      if (runRef.current) {
        update(); frameRef.current++
        if (frameRef.current >= 60) {
          frameRef.current = 0; secRef.current++
          const s = stateRef.current
          onSampleRef.current?.({ t: secRef.current, h2: Math.round(s.h2), anode: Math.round(s.anodeGas), naoh: Math.round(s.naohFormed / 2) })
        }
      }
      draw(); animRef.current = requestAnimationFrame(loop)
    }
    animRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animRef.current)
  }, [draw, update])

  useEffect(() => { runRef.current = running }, [running])
  const reset = () => { stateRef.current = initState(); setRunning(false); runRef.current = false; frameRef.current = 0; secRef.current = 0; onSampleRef.current?.({ reset: true }) }

  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} className="sim-canvas" />
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card">
          <label className="text-xs text-slate-500 block mb-2">{t('voltage')}: <span className="text-blue-600 font-bold">{voltage} V</span></label>
          <input type="range" min={2} max={15} value={voltage} onChange={e => setVoltage(+e.target.value)} className="control-slider" />
        </div>
        <div className="card">
          <label className="text-xs text-slate-500 block mb-2">NaCl {t('concentration')}: <span className={`font-bold ${concentrated ? 'text-green-600' : 'text-blue-600'}`}>{concentration}%</span>
            <span className="text-slate-400 ml-1">{concentrated ? (lang === 'zh' ? '(濃 → Cl₂)' : '(conc. → Cl₂)') : (lang === 'zh' ? '(稀 → O₂)' : '(dilute → O₂)')}</span>
          </label>
          <input type="range" min={5} max={100} value={concentration} onChange={e => setConc(+e.target.value)} className="control-slider" />
        </div>
        <div className="card flex gap-3 items-center justify-center">
          <button onClick={() => setRunning(r => !r)} className={`px-4 py-2 rounded-lg font-semibold text-sm text-white ${running ? 'bg-red-600 hover:bg-red-500' : 'bg-green-600 hover:bg-green-500'}`}>
            {running ? t('btn_pause') : t('btn_start')}
          </button>
          <button onClick={reset} className="px-4 py-2 rounded-lg font-semibold text-sm bg-slate-200 hover:bg-slate-300 text-slate-700">{t('btn_reset')}</button>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="card border-green-200">
          <p className="text-green-700 font-semibold mb-1">{t('anode')} (+) — {anodeProduct}</p>
          <p className="font-mono text-xs text-slate-700 bg-slate-100 rounded p-2">{concentrated ? '2Cl⁻(aq) → Cl₂(g) + 2e⁻' : '2H₂O(l) → O₂(g) + 4H⁺(aq) + 4e⁻'}</p>
        </div>
        <div className="card border-blue-200">
          <p className="text-blue-600 font-semibold mb-1">{t('cathode')} (−) — H₂</p>
          <p className="font-mono text-xs text-slate-700 bg-slate-100 rounded p-2">2H₂O(l) + 2e⁻ → H₂(g) + 2OH⁻(aq)</p>
          <p className="text-slate-500 text-xs mt-1">{lang === 'zh' ? 'NaOH 留在溶液中' : 'NaOH remains in solution'}</p>
        </div>
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
function respawn(ion) { ion.x = 130 + Math.random() * 440; ion.y = 150 + Math.random() * 200 }
