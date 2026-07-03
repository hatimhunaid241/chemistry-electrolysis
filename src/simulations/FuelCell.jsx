import React, { useRef, useEffect, useState, useCallback } from 'react'
import { useLang } from '../i18n/LanguageContext'
import { CV, clearLight, drawWire, drawElectron, drawBubble, label } from './simTheme'

const W = 700, H = 460
const BAT_CX = 350, BAT_Y = 30, WIRE_Y = BAT_Y + 20
const LA = { x: 60, y: 110, w: 200, h: 280 }    // anode chamber (H₂)
const RC = { x: 440, y: 110, w: 200, h: 280 }    // cathode chamber (O₂)
const MEM = { x: 285, y: 110, w: 130, h: 280 }
const ANODE_X = 180, CATHODE_X = 520
const ELEC_TOP = 115, ELEC_BOT = 375

const ELECTROLYTES = [
  { id: 'alkaline', name: { en: 'Alkaline (KOH)', zh: '鹼性 (KOH)' }, anodeRxn: 'H₂ + 2OH⁻ → 2H₂O + 2e⁻', cathodeRxn: 'O₂ + 2H₂O + 4e⁻ → 4OH⁻', memLabel: { en: 'OH⁻ migrates →', zh: 'OH⁻ 遷移 →' }, ion: 'OH⁻', color: '#10b981' },
  { id: 'acidic', name: { en: 'Acidic (H₂SO₄/PEM)', zh: '酸性 (H₂SO₄/PEM)' }, anodeRxn: 'H₂ → 2H⁺ + 2e⁻', cathodeRxn: 'O₂ + 4H⁺ + 4e⁻ → 2H₂O', memLabel: { en: '← H⁺ migrates', zh: '← H⁺ 遷移' }, ion: 'H⁺', color: '#db2777' },
]

function initState() {
  const h2Mols = [], o2Mols = [], ions = []
  for (let i = 0; i < 12; i++) {
    h2Mols.push({ x: LA.x + 20 + Math.random() * (LA.w - 40), y: LA.y + 20 + Math.random() * (LA.h - 40), vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5 })
    o2Mols.push({ x: RC.x + 20 + Math.random() * (RC.w - 40), y: RC.y + 20 + Math.random() * (RC.h - 40), vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5 })
  }
  for (let i = 0; i < 10; i++) ions.push({ x: MEM.x + 10 + Math.random() * (MEM.w - 20), y: MEM.y + 20 + Math.random() * (MEM.h - 40), dir: Math.random() > 0.5 ? 1 : -1 })
  return { h2Mols, o2Mols, ions, electrons: [0, 0.33, 0.66].map(p => ({ pos: p })), h2oBubbles: [], water: 0 }
}

export default function FuelCellSim({ onSample }) {
  const { t, lang, pick } = useLang()
  const canvasRef = useRef(null)
  const stateRef = useRef(initState())
  const animRef = useRef(null)
  const runRef = useRef(false)
  const frameRef = useRef(0)
  const secRef = useRef(0)
  const onSampleRef = useRef(onSample)
  useEffect(() => { onSampleRef.current = onSample }, [onSample])

  const [electrolyte, setElectrolyte] = useState(ELECTROLYTES[0])
  const [running, setRunning] = useState(false)
  const [load, setLoad] = useState(50)

  const update = useCallback(() => {
    const s = stateRef.current
    const spd = load / 50
    s.electrons.forEach(e => { e.pos = (e.pos + spd * 0.004) % 1 })
    s.h2Mols.forEach(m => {
      m.x += m.vx; m.y += m.vy
      if (m.x < LA.x + 10 || m.x > LA.x + LA.w - 10) m.vx *= -1
      if (m.y < LA.y + 10 || m.y > LA.y + LA.h - 10) m.vy *= -1
      if (m.x > ANODE_X - 20) { m.x = LA.x + 20 + Math.random() * 60; m.y = LA.y + 20 + Math.random() * (LA.h - 40); s.water += 0.5; s.h2oBubbles.push({ x: RC.x + 20 + Math.random() * (RC.w - 40), y: RC.y + RC.h - 30, r: 4, alpha: 0.8, side: 'right' }) }
    })
    s.o2Mols.forEach(m => { m.x += m.vx; m.y += m.vy; if (m.x < RC.x + 10 || m.x > RC.x + RC.w - 10) m.vx *= -1; if (m.y < RC.y + 10 || m.y > RC.y + RC.h - 10) m.vy *= -1 })
    s.ions.forEach(ion => { ion.x += ion.dir * 0.3 + (Math.random() - 0.5) * 0.3; ion.y += (Math.random() - 0.5) * 0.4; if (ion.x < MEM.x + 8) ion.dir = 1; if (ion.x > MEM.x + MEM.w - 8) ion.dir = -1; ion.y = Math.max(MEM.y + 10, Math.min(MEM.y + MEM.h - 10, ion.y)) })
    s.h2oBubbles.forEach(b => { b.y -= 0.8; b.alpha -= 0.008 })
    s.h2oBubbles = s.h2oBubbles.filter(b => b.alpha > 0.05 && b.y > RC.y)
  }, [load])

  const draw = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d')
    const s = stateRef.current
    clearLight(ctx, W, H)

    drawWire(ctx, [{ x: ANODE_X, y: ELEC_TOP }, { x: ANODE_X, y: WIRE_Y }, { x: BAT_CX - 20, y: WIRE_Y }], CV.wire, 2.5)
    drawWire(ctx, [{ x: CATHODE_X, y: ELEC_TOP }, { x: CATHODE_X, y: WIRE_Y }, { x: BAT_CX + 20, y: WIRE_Y }], CV.wire, 2.5)
    if (running) s.electrons.forEach(e => { const p = ePath(e.pos); drawElectron(ctx, p.x, p.y) })
    ctx.fillStyle = CV.panel; ctx.beginPath(); ctx.roundRect(BAT_CX - 20, BAT_Y + 10, 40, 20, 4); ctx.fill()
    ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 1.5; ctx.stroke()
    label(ctx, lang === 'zh' ? '負載' : 'Load', BAT_CX, BAT_Y + 24, '#b45309', 9)
    label(ctx, `${((load / 100) * 40).toFixed(1)}W`, BAT_CX, BAT_Y + 6, '#16a34a', 9)

    ctx.fillStyle = 'rgba(239,68,68,0.06)'; ctx.fillRect(LA.x, LA.y, LA.w, LA.h)
    ctx.strokeStyle = CV.beaker; ctx.lineWidth = 2.5; ctx.strokeRect(LA.x, LA.y, LA.w, LA.h)
    label(ctx, lang === 'zh' ? '陽極室 (−)' : 'Anode Chamber (−)', LA.x + LA.w / 2, LA.y - 8, '#dc2626', 11)
    label(ctx, lang === 'zh' ? 'H₂ 燃料供應' : 'H₂ fuel supply', LA.x + LA.w / 2, LA.y + LA.h + 16, '#dc2626', 10)

    ctx.fillStyle = 'rgba(37,99,235,0.06)'; ctx.fillRect(RC.x, RC.y, RC.w, RC.h)
    ctx.strokeStyle = CV.beaker; ctx.lineWidth = 2.5; ctx.strokeRect(RC.x, RC.y, RC.w, RC.h)
    label(ctx, lang === 'zh' ? '陰極室 (+)' : 'Cathode Chamber (+)', RC.x + RC.w / 2, RC.y - 8, '#2563eb', 11)
    label(ctx, lang === 'zh' ? 'O₂ / 空氣供應' : 'O₂ / Air supply', RC.x + RC.w / 2, RC.y + RC.h + 16, '#2563eb', 10)

    ctx.fillStyle = electrolyte.id === 'alkaline' ? 'rgba(16,185,129,0.12)' : 'rgba(219,39,119,0.10)'; ctx.fillRect(MEM.x, MEM.y, MEM.w, MEM.h)
    ctx.strokeStyle = electrolyte.color; ctx.lineWidth = 2; ctx.strokeRect(MEM.x, MEM.y, MEM.w, MEM.h)
    label(ctx, lang === 'zh' ? '電解質' : 'Electrolyte', MEM.x + MEM.w / 2, MEM.y + MEM.h / 2 - 10, electrolyte.color, 10)
    label(ctx, lang === 'zh' ? '／薄膜' : 'Membrane', MEM.x + MEM.w / 2, MEM.y + MEM.h / 2 + 4, electrolyte.color, 10)
    label(ctx, pick(electrolyte.memLabel), MEM.x + MEM.w / 2, MEM.y + MEM.h / 2 + 20, CV.textMuted, 9)

    ctx.fillStyle = '#475569'; ctx.fillRect(ANODE_X - 6, ELEC_TOP, 12, ELEC_BOT - ELEC_TOP)
    ctx.fillStyle = '#475569'; ctx.fillRect(CATHODE_X - 6, ELEC_TOP, 12, ELEC_BOT - ELEC_TOP)

    s.h2Mols.forEach(m => { ctx.beginPath(); ctx.arc(m.x, m.y, 9, 0, Math.PI * 2); ctx.fillStyle = '#f87171'; ctx.globalAlpha = 0.8; ctx.fill(); ctx.globalAlpha = 1; ctx.fillStyle = '#fff'; ctx.font = 'bold 7px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('H₂', m.x, m.y); ctx.textBaseline = 'alphabetic' })
    s.o2Mols.forEach(m => { ctx.beginPath(); ctx.arc(m.x, m.y, 10, 0, Math.PI * 2); ctx.fillStyle = '#60a5fa'; ctx.globalAlpha = 0.8; ctx.fill(); ctx.globalAlpha = 1; ctx.fillStyle = '#fff'; ctx.font = 'bold 7px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('O₂', m.x, m.y); ctx.textBaseline = 'alphabetic' })
    s.ions.forEach(ion => { ctx.beginPath(); ctx.arc(ion.x, ion.y, 8, 0, Math.PI * 2); ctx.fillStyle = electrolyte.color; ctx.globalAlpha = 0.85; ctx.fill(); ctx.globalAlpha = 1; ctx.fillStyle = '#fff'; ctx.font = 'bold 6px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(electrolyte.ion, ion.x, ion.y); ctx.textBaseline = 'alphabetic' })
    s.h2oBubbles.forEach(b => drawBubble(ctx, b.x, b.y, b.r, '#3b82f6', b.alpha))

    label(ctx, electrolyte.anodeRxn, LA.x + LA.w / 2, LA.y + LA.h + 32, '#dc2626', 9)
    label(ctx, electrolyte.cathodeRxn, RC.x + RC.w / 2, RC.y + RC.h + 32, '#2563eb', 9)
    label(ctx, 'Overall: 2H₂ + O₂ → 2H₂O', W / 2, H - 24, CV.textStrong, 11)
    label(ctx, `EMF ≈ 1.23 V  |  ${lang === 'zh' ? '負載' : 'Load'}: ${load}%  |  ${lang === 'zh' ? '效率' : 'Efficiency'} ~60%`, W / 2, H - 8, CV.textMuted, 10)
  }, [running, electrolyte, load, t, lang, pick])

  useEffect(() => {
    const loop = () => {
      if (runRef.current) {
        update(); frameRef.current++
        if (frameRef.current >= 60) {
          frameRef.current = 0; secRef.current++
          onSampleRef.current?.({ t: secRef.current, power: +((load / 100) * 40).toFixed(1), water: Math.round(stateRef.current.water) })
        }
      }
      draw(); animRef.current = requestAnimationFrame(loop)
    }
    animRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animRef.current)
  }, [draw, update, load])

  useEffect(() => { runRef.current = running }, [running])
  const reset = () => { stateRef.current = initState(); setRunning(false); runRef.current = false; frameRef.current = 0; secRef.current = 0; onSampleRef.current?.({ reset: true }) }

  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} className="sim-canvas" />
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card">
          <label className="text-xs text-slate-500 block mb-2">{lang === 'zh' ? '電解質類型' : 'Electrolyte Type'}</label>
          <div className="flex gap-2">
            {ELECTROLYTES.map(e => (
              <button key={e.id} onClick={() => { setElectrolyte(e); reset() }}
                className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${electrolyte.id === e.id ? 'bg-blue-600 border-blue-500 text-white' : 'border-slate-300 text-slate-600 hover:border-slate-400'}`}>
                {pick(e.name)}
              </button>
            ))}
          </div>
        </div>
        <div className="card">
          <label className="text-xs text-slate-500 block mb-2">{lang === 'zh' ? '負載' : 'Load'}: <span className="text-amber-600 font-bold">{load}%</span></label>
          <input type="range" min={10} max={100} value={load} onChange={e => setLoad(+e.target.value)} className="control-slider" />
        </div>
        <div className="card flex gap-3 items-center justify-center">
          <button onClick={() => setRunning(r => !r)} className={`px-4 py-2 rounded-lg font-semibold text-sm text-white ${running ? 'bg-red-600 hover:bg-red-500' : 'bg-green-600 hover:bg-green-500'}`}>
            {running ? t('btn_pause') : t('btn_start')}
          </button>
          <button onClick={reset} className="px-3 py-2 rounded-lg font-semibold text-sm bg-slate-200 hover:bg-slate-300 text-slate-700">↺</button>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="card border-red-200">
          <p className="text-red-600 font-semibold mb-1">{t('anode')} (−) — {t('oxidation')}</p>
          <p className="font-mono text-xs text-slate-700 bg-slate-100 rounded p-2">{electrolyte.anodeRxn}</p>
        </div>
        <div className="card border-blue-200">
          <p className="text-blue-600 font-semibold mb-1">{t('cathode')} (+) — {t('reduction')}</p>
          <p className="font-mono text-xs text-slate-700 bg-slate-100 rounded p-2">{electrolyte.cathodeRxn}</p>
        </div>
      </div>
    </div>
  )
}

function ePath(tt) {
  const s1 = ELEC_TOP - WIRE_Y, s2 = (BAT_CX - 20) - ANODE_X, s3 = 40, s4 = CATHODE_X - (BAT_CX + 20), s5 = s1
  const total = s1 + s2 + s3 + s4 + s5, d = tt * total
  if (d < s1) return { x: ANODE_X, y: ELEC_TOP - d }
  if (d < s1 + s2) return { x: ANODE_X + (d - s1), y: WIRE_Y }
  if (d < s1 + s2 + s3) return { x: BAT_CX - 20 + (d - s1 - s2), y: WIRE_Y }
  if (d < s1 + s2 + s3 + s4) return { x: BAT_CX + 20 + (d - s1 - s2 - s3), y: WIRE_Y }
  return { x: CATHODE_X, y: WIRE_Y + (d - s1 - s2 - s3 - s4) }
}
