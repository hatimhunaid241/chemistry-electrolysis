import React, { useRef, useEffect, useState, useCallback } from 'react'
import { useLang } from '../i18n/LanguageContext'
import { CV, clearLight, drawBattery, drawWire, drawElectron, drawIon, drawBubble, label } from './simTheme'

// Hoffman voltameter: two tubes, H₂ at cathode, O₂ at anode, 2:1 volume ratio.
const W = 700, H = 500
const BAT_CX = 350, BAT_Y = 20, WIRE_Y = BAT_Y + 13
const LT = { x: 160, tubeW: 60, y: 80, h: 300 }  // left = cathode (H₂)
const RT = { x: 480, tubeW: 60, y: 80, h: 300 }   // right = anode (O₂)
const BOTTOM = { x: 160, y: 360, w: 380 }

export default function H2SO4Sim({ onSample }) {
  const { t, lang } = useLang()
  const canvasRef = useRef(null)
  const stateRef = useRef(makeState())
  const animRef = useRef(null)
  const runRef = useRef(false)
  const frameRef = useRef(0)
  const secRef = useRef(0)
  const onSampleRef = useRef(onSample)
  useEffect(() => { onSampleRef.current = onSample }, [onSample])

  const [voltage, setVoltage] = useState(6)
  const [running, setRunning] = useState(false)

  const update = useCallback(() => {
    const s = stateRef.current
    const spd = voltage / 6
    s.time++
    s.electrons.forEach(e => { e.pos = (e.pos + spd * 0.005) % 1 })
    if (s.time % Math.max(1, Math.round(8 / spd)) === 0) {
      s.h2Vol = Math.min(s.h2Vol + 2, 100)
      s.o2Vol = Math.min(s.o2Vol + 1, 100)
      s.bubbles.push({ tube: 'L', x: LT.x + LT.tubeW / 2 + (Math.random() - 0.5) * 15, y: LT.y + LT.h - 30, r: 4 + Math.random() * 3, alpha: 0.8 })
      s.bubbles.push({ tube: 'L', x: LT.x + LT.tubeW / 2 + (Math.random() - 0.5) * 15, y: LT.y + LT.h - 30, r: 4 + Math.random() * 3, alpha: 0.8 })
      s.bubbles.push({ tube: 'R', x: RT.x + RT.tubeW / 2 + (Math.random() - 0.5) * 15, y: RT.y + RT.h - 30, r: 4 + Math.random() * 3, alpha: 0.8 })
    }
    s.ions.forEach(ion => {
      const targetX = ion.isCation ? LT.x + LT.tubeW / 2 : RT.x + RT.tubeW / 2
      ion.x += (targetX - ion.x) * 0.008 * spd + (Math.random() - 0.5) * 0.5
      ion.y += (Math.random() - 0.5)
      ion.y = Math.max(BOTTOM.y - 30, Math.min(BOTTOM.y + 40, ion.y))
    })
    s.bubbles.forEach(b => { b.y -= 0.8; b.alpha -= 0.007 })
    s.bubbles = s.bubbles.filter(b => b.alpha > 0.05 && b.y > (b.tube === 'L' ? LT.y : RT.y))
  }, [voltage])

  const draw = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d')
    const s = stateRef.current
    clearLight(ctx, W, H)
    const cathX = LT.x + LT.tubeW / 2, anodX = RT.x + RT.tubeW / 2
    drawWire(ctx, [{ x: BAT_CX - 90, y: WIRE_Y }, { x: anodX, y: WIRE_Y }, { x: anodX, y: LT.y + LT.h - 30 }])
    drawWire(ctx, [{ x: BAT_CX + 90, y: WIRE_Y }, { x: cathX, y: WIRE_Y }, { x: cathX, y: LT.y + LT.h - 30 }])
    if (running) s.electrons.forEach(e => { const p = ePath(e.pos); drawElectron(ctx, p.x, p.y) })
    drawBattery(ctx, BAT_CX, BAT_Y)

    const sol = 'rgba(37,99,235,0.10)'
    drawTube(ctx, LT.x, LT.y, LT.tubeW, LT.h, sol, s.h2Vol)
    drawTube(ctx, RT.x, RT.y, RT.tubeW, RT.h, sol, s.o2Vol)
    ctx.fillStyle = sol; ctx.fillRect(BOTTOM.x + LT.tubeW, BOTTOM.y, BOTTOM.w - LT.tubeW - RT.tubeW, 50)
    ctx.strokeStyle = CV.beaker; ctx.lineWidth = 3
    ctx.strokeRect(BOTTOM.x + LT.tubeW - 1, BOTTOM.y, BOTTOM.w - LT.tubeW - RT.tubeW + 2, 50)

    const h2H = (s.h2Vol / 100) * (LT.h - 40)
    if (h2H > 0) { ctx.fillStyle = 'rgba(59,130,246,0.22)'; ctx.fillRect(LT.x + 3, LT.y + 3, LT.tubeW - 6, h2H); label(ctx, 'H₂', LT.x + LT.tubeW / 2, LT.y + h2H / 2 + 5, '#1d4ed8', 13) }
    const o2H = (s.o2Vol / 100) * (RT.h - 40)
    if (o2H > 0) { ctx.fillStyle = 'rgba(234,88,12,0.18)'; ctx.fillRect(RT.x + 3, RT.y + 3, RT.tubeW - 6, o2H); label(ctx, 'O₂', RT.x + RT.tubeW / 2, RT.y + o2H / 2 + 5, '#ea580c', 13) }

    ctx.fillStyle = '#475569'; ctx.fillRect(cathX - 5, LT.y + LT.h - 50, 10, 40)
    ctx.fillStyle = '#475569'; ctx.fillRect(anodX - 5, RT.y + RT.h - 50, 10, 40)

    s.ions.forEach(ion => drawIon(ctx, ion.x, ion.y, ion.symbol, ion.color, 11))
    s.bubbles.forEach(b => drawBubble(ctx, b.x, b.y, b.r, b.tube === 'L' ? '#3b82f6' : '#ea580c', b.alpha))

    // Bottom labels — electrode captions + reactions on the sides, ratio in the centre.
    label(ctx, `${t('cathode')} (−)`, cathX, 430, CV.textStrong)
    label(ctx, `${t('anode')} (+)`, anodX, 430, CV.textStrong)
    label(ctx, '2H⁺ + 2e⁻ → H₂', cathX, 448, '#1d4ed8', 10)
    label(ctx, '2H₂O → O₂ + 4H⁺ + 4e⁻', anodX, 448, '#ea580c', 10)
    const ratio = s.o2Vol > 0 ? (s.h2Vol / s.o2Vol).toFixed(1) : '—'
    label(ctx, `H₂ : O₂ ${lang === 'zh' ? '體積比' : 'volume ratio'} = ${ratio} : 1`, BAT_CX, 474, CV.textStrong, 12)
    label(ctx, `${lang === 'zh' ? '理論比' : 'Theoretical ratio'} = 2 : 1`, BAT_CX, 492, CV.textMuted, 11)
  }, [voltage, running, t, lang])

  useEffect(() => {
    const loop = () => {
      if (runRef.current) {
        update(); frameRef.current++
        if (frameRef.current >= 60) {
          frameRef.current = 0; secRef.current++
          const s = stateRef.current
          onSampleRef.current?.({ t: secRef.current, h2: +s.h2Vol.toFixed(1), o2: +s.o2Vol.toFixed(1) })
        }
      }
      draw(); animRef.current = requestAnimationFrame(loop)
    }
    animRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animRef.current)
  }, [draw, update])

  useEffect(() => { runRef.current = running }, [running])
  const reset = () => { stateRef.current = makeState(); setRunning(false); runRef.current = false; frameRef.current = 0; secRef.current = 0; onSampleRef.current?.({ reset: true }) }

  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} className="sim-canvas" />
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card">
          <label className="text-xs text-slate-500 block mb-2">{t('voltage')}: <span className="text-blue-600 font-bold">{voltage} V</span></label>
          <input type="range" min={2} max={15} value={voltage} onChange={e => setVoltage(+e.target.value)} className="control-slider" />
        </div>
        <div className="card flex gap-3 items-center justify-center">
          <button onClick={() => setRunning(r => !r)} className={`px-4 py-2 rounded-lg font-semibold text-sm text-white ${running ? 'bg-red-600 hover:bg-red-500' : 'bg-green-600 hover:bg-green-500'}`}>
            {running ? t('btn_pause') : t('btn_start')}
          </button>
          <button onClick={reset} className="px-4 py-2 rounded-lg font-semibold text-sm bg-slate-200 hover:bg-slate-300 text-slate-700">{t('btn_reset')}</button>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="card border-blue-200">
          <p className="text-blue-600 font-semibold mb-1">{t('cathode')} (−) — H₂</p>
          <p className="font-mono text-xs text-slate-700 bg-slate-100 rounded p-2">2H⁺(aq) + 2e⁻ → H₂(g)</p>
        </div>
        <div className="card border-orange-200">
          <p className="text-orange-600 font-semibold mb-1">{t('anode')} (+) — O₂</p>
          <p className="font-mono text-xs text-slate-700 bg-slate-100 rounded p-2">2H₂O(l) → O₂(g) + 4H⁺(aq) + 4e⁻</p>
          <p className="text-slate-500 text-xs mt-1">{lang === 'zh' ? '體積 H₂ : O₂ = 2 : 1' : 'Volume H₂ : O₂ = 2 : 1'}</p>
        </div>
      </div>
    </div>
  )
}

function makeState() {
  return { h2Vol: 0, o2Vol: 0, ions: initIons(), bubbles: [], electrons: [0, 0.33, 0.66].map(p => ({ pos: p })), time: 0 }
}
function initIons() {
  const ions = []
  for (let i = 0; i < 16; i++) {
    const isCation = i < 8
    ions.push({
      x: BOTTOM.x + LT.tubeW + Math.random() * (BOTTOM.w - LT.tubeW - RT.tubeW),
      y: BOTTOM.y + 10 + Math.random() * 30,
      symbol: isCation ? 'H⁺' : 'SO₄²⁻', color: isCation ? '#2563eb' : '#818cf8', isCation,
    })
  }
  return ions
}
function drawTube(ctx, x, y, w, h, solColor, gasVol) {
  const solH = h - (gasVol / 100) * (h - 40) - 10
  ctx.fillStyle = solColor; ctx.fillRect(x + 3, y + (h - solH), w - 6, solH)
  ctx.strokeStyle = CV.beaker; ctx.lineWidth = 3
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + h); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(x + w, y); ctx.lineTo(x + w, y + h); ctx.stroke()
  ctx.beginPath(); ctx.roundRect(x - 5, y - 5, w + 10, 15, 5); ctx.stroke()
}
function ePath(tt) {
  const cathX = LT.x + LT.tubeW / 2, anodX = RT.x + RT.tubeW / 2, elecTop = LT.y + LT.h - 30
  const s1 = elecTop - WIRE_Y, s2 = anodX - cathX
  const total = s1 + s2 + s1, d = tt * total
  if (d < s1) return { x: anodX, y: elecTop - d }
  if (d < s1 + s2) return { x: anodX - (d - s1), y: WIRE_Y }
  return { x: cathX, y: WIRE_Y + (d - s1 - s2) }
}
