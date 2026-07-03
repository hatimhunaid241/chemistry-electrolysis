import React, { useRef, useEffect, useState, useCallback } from 'react'
import { useLang } from '../i18n/LanguageContext'
import { CV, clearLight, drawBattery, drawWire, drawBeaker, drawElectrode, drawElectron, drawIon, drawBubble, label } from './simTheme'

const W = 700, H = 470
const BEAKER = { x: 80, y: 120, w: 540, h: 270 }
const ANODE_X = 210, CATHODE_X = 490
const ELEC_TOP = 90, ELEC_BOT = 350
const WIRE_Y = 33, BAT_CX = 350, BAT_Y = 20

function initState() {
  const ions = []
  for (let i = 0; i < 24; i++) {
    const isCation = i < 12
    ions.push({
      x: 120 + Math.random() * 460, y: 150 + Math.random() * 210,
      symbol: isCation ? 'Pb²⁺' : 'Br⁻',
      color: isCation ? '#f97316' : '#60a5fa',
      isCation, r: 14, discharged: false, alpha: 1,
    })
  }
  return { ions, bubbles: [], pb: 0, br2: 0, electrons: [0, 0.33, 0.66].map(p => ({ pos: p })) }
}

export default function MoltenPbBr2Sim({ onSample }) {
  const { t, lang } = useLang()
  const canvasRef = useRef(null)
  const stateRef = useRef(initState())
  const animRef = useRef(null)
  const runningRef = useRef(false)
  const frameRef = useRef(0)
  const secRef = useRef(0)
  const onSampleRef = useRef(onSample)
  useEffect(() => { onSampleRef.current = onSample }, [onSample])

  const [voltage, setVoltage] = useState(6)
  const [running, setRunning] = useState(false)
  const [temp, setTemp] = useState(500)

  const draw = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d')
    const s = stateRef.current
    clearLight(ctx, W, H)

    drawWire(ctx, [{ x: BAT_CX - 90, y: WIRE_Y }, { x: ANODE_X, y: WIRE_Y }, { x: ANODE_X, y: ELEC_TOP }])
    drawWire(ctx, [{ x: BAT_CX + 90, y: WIRE_Y }, { x: CATHODE_X, y: WIRE_Y }, { x: CATHODE_X, y: ELEC_TOP }])
    if (running) s.electrons.forEach(e => { const p = electronPos(e.pos); drawElectron(ctx, p.x, p.y) })
    drawBattery(ctx, BAT_CX, BAT_Y)
    label(ctx, '→ e⁻', ANODE_X + 60, WIRE_Y - 6, CV.electron, 10)

    drawBeaker(ctx, BEAKER.x, BEAKER.y, BEAKER.w, BEAKER.h, 'rgba(250,140,70,0.10)')

    drawElectrode(ctx, ANODE_X, ELEC_TOP, ELEC_BOT, CV.anode)
    drawElectrode(ctx, CATHODE_X, ELEC_TOP, ELEC_BOT, CV.cathode)
    label(ctx, `${t('anode')} (+)`, ANODE_X, ELEC_TOP - 10, CV.textStrong, 12)
    label(ctx, `${t('cathode')} (−)`, CATHODE_X, ELEC_TOP - 10, CV.textStrong, 12)

    if (s.pb > 0) {
      const dH = Math.min(s.pb * 3, 80)
      ctx.fillStyle = '#64748b'
      ctx.fillRect(CATHODE_X - 8, ELEC_BOT - dH, 16, dH)
      label(ctx, 'Pb(l)', CATHODE_X + 34, ELEC_BOT - dH / 2, CV.textMuted, 11)
    }

    s.ions.forEach(ion => { if (!ion.discharged) drawIon(ctx, ion.x, ion.y, ion.symbol, ion.color, ion.r) })
    s.bubbles.forEach(b => drawBubble(ctx, b.x, b.y, b.r, '#a855f7', b.alpha))

    label(ctx, 'Molten PbBr₂', BAT_CX, BEAKER.y + BEAKER.h + 20, CV.textStrong, 13)
    label(ctx, '2Br⁻ → Br₂ + 2e⁻', ANODE_X, BEAKER.y + BEAKER.h + 40, '#7c3aed', 11)
    label(ctx, 'Pb²⁺ + 2e⁻ → Pb', CATHODE_X, BEAKER.y + BEAKER.h + 40, CV.textMuted, 11)
  }, [voltage, running, temp, t])

  const update = useCallback(() => {
    const s = stateRef.current
    const speed = (voltage / 6) * (temp / 500) * 0.9
    s.electrons.forEach(e => { e.pos = (e.pos + speed * 0.004) % 1 })
    s.ions.forEach(ion => {
      if (ion.discharged) return
      const target = ion.isCation ? CATHODE_X : ANODE_X
      ion.x += (target - ion.x) * 0.012 * speed + (Math.random() - 0.5) * 0.5
      ion.y += (Math.random() - 0.5) * 0.8
      ion.y = Math.max(BEAKER.y + ion.r + 5, Math.min(BEAKER.y + BEAKER.h - ion.r - 5, ion.y))
      if (ion.isCation && ion.x > CATHODE_X - 20) { s.pb++; respawnIon(ion) }
      if (!ion.isCation && ion.x < ANODE_X + 20) {
        s.br2 += 0.5
        s.bubbles.push({ x: ANODE_X + (Math.random() - 0.5) * 12, y: ELEC_BOT - 20, r: 5 + Math.random() * 4, alpha: 0.8 })
        respawnIon(ion)
      }
    })
    s.bubbles.forEach(b => { b.y -= 0.6; b.r += 0.05; b.alpha -= 0.005 })
    s.bubbles = s.bubbles.filter(b => b.alpha > 0.05 && b.y > BEAKER.y)
  }, [voltage, temp])

  function respawnIon(ion) { ion.x = 120 + Math.random() * 460; ion.y = 150 + Math.random() * 210; ion.discharged = false }

  function electronPos(tt) {
    const seg1 = ELEC_TOP - WIRE_Y, seg2 = CATHODE_X - ANODE_X
    const total = seg1 + seg2 + seg1, d = tt * total
    if (d < seg1) return { x: ANODE_X, y: ELEC_TOP - d }
    if (d < seg1 + seg2) return { x: ANODE_X + (d - seg1), y: WIRE_Y }
    return { x: CATHODE_X, y: WIRE_Y + (d - seg1 - seg2) }
  }

  useEffect(() => {
    const loop = () => {
      if (runningRef.current) {
        update()
        frameRef.current++
        if (frameRef.current >= 60) {
          frameRef.current = 0; secRef.current++
          const s = stateRef.current
          onSampleRef.current?.({ t: secRef.current, pb: Math.round(s.pb), br2: Math.round(s.br2) })
        }
      }
      draw()
      animRef.current = requestAnimationFrame(loop)
    }
    animRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animRef.current)
  }, [draw, update])

  useEffect(() => { runningRef.current = running }, [running])

  const reset = () => {
    stateRef.current = initState(); setRunning(false); runningRef.current = false
    frameRef.current = 0; secRef.current = 0; onSampleRef.current?.({ reset: true })
  }

  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} className="sim-canvas" />
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card">
          <label className="text-xs text-slate-500 block mb-2">{t('voltage')}: <span className="text-blue-600 font-bold">{voltage} V</span></label>
          <input type="range" min={2} max={12} value={voltage} onChange={e => setVoltage(+e.target.value)} className="control-slider" />
        </div>
        <div className="card">
          <label className="text-xs text-slate-500 block mb-2">{t('temperature')}: <span className="text-amber-600 font-bold">{temp}°C</span></label>
          <input type="range" min={400} max={900} value={temp} onChange={e => setTemp(+e.target.value)} className="control-slider" />
        </div>
        <div className="card flex gap-3 items-center justify-center">
          <button onClick={() => setRunning(r => !r)} className={`px-4 py-2 rounded-lg font-semibold text-sm text-white ${running ? 'bg-red-600 hover:bg-red-500' : 'bg-green-600 hover:bg-green-500'}`}>
            {running ? t('btn_pause') : t('btn_start')}
          </button>
          <button onClick={reset} className="px-4 py-2 rounded-lg font-semibold text-sm bg-slate-200 hover:bg-slate-300 text-slate-700">{t('btn_reset')}</button>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="card border-amber-200">
          <p className="text-amber-700 font-semibold mb-1">{t('anode')} (+) — {t('oxidation')}</p>
          <p className="font-mono text-xs text-slate-700 bg-slate-100 rounded p-2">2Br⁻(l) → Br₂(g) + 2e⁻</p>
          <p className="text-slate-500 text-xs mt-1">{lang === 'zh' ? '產生棕／紫色 Br₂ 蒸氣' : 'Brown/purple Br₂ vapour forms'}</p>
        </div>
        <div className="card border-slate-300">
          <p className="text-slate-600 font-semibold mb-1">{t('cathode')} (−) — {t('reduction')}</p>
          <p className="font-mono text-xs text-slate-700 bg-slate-100 rounded p-2">Pb²⁺(l) + 2e⁻ → Pb(l)</p>
          <p className="text-slate-500 text-xs mt-1">{lang === 'zh' ? '生成灰色液態鉛' : 'Grey liquid lead metal forms'}</p>
        </div>
      </div>
    </div>
  )
}
