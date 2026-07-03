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
  for (let i = 0; i < 30; i++) {
    const type = i % 3 === 0 ? 'SO4' : i % 3 === 1 ? 'Cu' : 'H'
    ions.push({
      x: 120 + Math.random() * 460, y: 150 + Math.random() * 200,
      symbol: type === 'Cu' ? 'Cu²⁺' : type === 'SO4' ? 'SO₄²⁻' : 'H⁺',
      color: type === 'Cu' ? '#f97316' : type === 'SO4' ? '#818cf8' : '#22c55e',
      isCation: type !== 'SO4', type, r: type === 'SO4' ? 15 : 12,
    })
  }
  return { ions, bubbles: [], copperDeposit: 0, o2: 0, anodeMass: 100, electrons: [0, 0.33, 0.66].map(p => ({ pos: p })) }
}

export default function CuSO4Sim({ activeElectrodes = false, onSample }) {
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
  const [concentration, setConc] = useState(50)
  const [running, setRunning] = useState(false)

  if (!stateRef.current) stateRef.current = initState()

  const update = useCallback(() => {
    const s = stateRef.current
    const spd = voltage / 6
    s.electrons.forEach(e => { e.pos = (e.pos + spd * 0.004) % 1 })
    s.ions.forEach(ion => {
      const target = ion.isCation ? CATHODE_X : ANODE_X
      ion.x += (target - ion.x) * 0.009 * spd + (Math.random() - 0.5) * 0.6
      ion.y += (Math.random() - 0.5) * 0.9
      ion.y = Math.max(BK.y + ion.r + 5, Math.min(BK.y + BK.h - ion.r - 5, ion.y))
      if (ion.isCation && ion.x > CATHODE_X - 18) { if (ion.type === 'Cu') s.copperDeposit++; respawn(ion) }
      if (!ion.isCation && ion.x < ANODE_X + 18) {
        if (!activeElectrodes) { s.o2 += 0.5; s.bubbles.push({ x: ANODE_X + (Math.random() - 0.5) * 10, y: ELEC_BOT - 15, r: 5, alpha: 0.8, color: '#38bdf8' }) }
        else s.anodeMass = Math.max(0, s.anodeMass - 0.05)
        respawn(ion)
      }
    })
    s.bubbles.forEach(b => { b.y -= 0.7; b.alpha -= 0.006 })
    s.bubbles = s.bubbles.filter(b => b.alpha > 0.05 && b.y > BK.y)
  }, [voltage, activeElectrodes])

  const draw = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d')
    const s = stateRef.current
    clearLight(ctx, W, H)
    drawWire(ctx, [{ x: BAT_CX - 90, y: WIRE_Y }, { x: ANODE_X, y: WIRE_Y }, { x: ANODE_X, y: ELEC_TOP }])
    drawWire(ctx, [{ x: BAT_CX + 90, y: WIRE_Y }, { x: CATHODE_X, y: WIRE_Y }, { x: CATHODE_X, y: ELEC_TOP }])
    if (running) s.electrons.forEach(e => { const p = ePath(e.pos); drawElectron(ctx, p.x, p.y) })
    drawBattery(ctx, BAT_CX, BAT_Y)

    const blueness = Math.max(0.05, (concentration / 100) - (s.copperDeposit / 2000))
    drawBeaker(ctx, BK.x, BK.y, BK.w, BK.h, `rgba(37,99,235,${blueness * 0.28})`)

    drawElectrode(ctx, ANODE_X, ELEC_TOP, ELEC_BOT, activeElectrodes ? CV.anode : '#475569')
    drawElectrode(ctx, CATHODE_X, ELEC_TOP, ELEC_BOT, '#475569')
    if (activeElectrodes) {
      const massFrac = s.anodeMass / 100
      ctx.fillStyle = '#92400e'
      ctx.fillRect(ANODE_X - 7, ELEC_TOP + (1 - massFrac) * (ELEC_BOT - ELEC_TOP), 14, massFrac * (ELEC_BOT - ELEC_TOP))
    }
    if (s.copperDeposit > 0) {
      const dH = Math.min(s.copperDeposit * 0.8, 100)
      ctx.fillStyle = '#b45309'; ctx.fillRect(CATHODE_X - 8, ELEC_BOT - dH, 16, dH)
      ctx.fillStyle = '#f97316'; ctx.fillRect(CATHODE_X - 6, ELEC_BOT - dH, 12, dH * 0.3)
    }
    label(ctx, `${t('anode')} (+)`, ANODE_X, ELEC_TOP - 10, CV.textStrong)
    label(ctx, `${t('cathode')} (−)`, CATHODE_X, ELEC_TOP - 10, CV.textStrong)
    label(ctx, activeElectrodes ? '(Cu)' : '(C)', ANODE_X, ELEC_TOP - 24, CV.textMuted, 10)
    label(ctx, activeElectrodes ? '(Cu)' : '(C)', CATHODE_X, ELEC_TOP - 24, CV.textMuted, 10)

    s.ions.forEach(ion => drawIon(ctx, ion.x, ion.y, ion.symbol, ion.color, ion.r))
    s.bubbles.forEach(b => drawBubble(ctx, b.x, b.y, b.r, b.color, b.alpha))

    label(ctx, 'CuSO₄(aq)', BAT_CX, BK.y + BK.h + 18, CV.textStrong, 13)
    label(ctx, activeElectrodes ? (lang === 'zh' ? '活性銅電極' : 'Active Cu electrodes') : (lang === 'zh' ? '惰性碳電極' : 'Inert C electrodes'), BAT_CX, BK.y + BK.h + 34, CV.textMuted, 11)
    label(ctx, activeElectrodes ? 'Cu → Cu²⁺ + 2e⁻' : '2H₂O → O₂ + 4H⁺ + 4e⁻', ANODE_X, BK.y + BK.h + 50, '#7c3aed', 10)
    label(ctx, 'Cu²⁺ + 2e⁻ → Cu', CATHODE_X, BK.y + BK.h + 50, '#ea580c', 10)
  }, [voltage, concentration, running, activeElectrodes, t, lang])

  useEffect(() => {
    const loop = () => {
      if (runRef.current) {
        update(); frameRef.current++
        if (frameRef.current >= 60) {
          frameRef.current = 0; secRef.current++
          const s = stateRef.current
          onSampleRef.current?.({ t: secRef.current, cu: Math.round(s.copperDeposit), o2: Math.round(s.o2), anode: +s.anodeMass.toFixed(1) })
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
          <label className="text-xs text-slate-500 block mb-2">CuSO₄ {t('concentration')}: <span className="text-blue-600 font-bold">{concentration}%</span></label>
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
        <div className="card border-amber-200">
          <p className="text-amber-700 font-semibold mb-1">{t('anode')} (+) — {t('oxidation')}</p>
          <p className="font-mono text-xs text-slate-700 bg-slate-100 rounded p-2">{activeElectrodes ? 'Cu(s) → Cu²⁺(aq) + 2e⁻' : '2H₂O(l) → O₂(g) + 4H⁺(aq) + 4e⁻'}</p>
          <p className="text-slate-500 text-xs mt-1">{activeElectrodes ? (lang === 'zh' ? '銅陽極溶解' : 'Copper anode dissolves') : (lang === 'zh' ? '產生 O₂ 氣泡' : 'O₂ bubbles form')}</p>
        </div>
        <div className="card border-orange-200">
          <p className="text-orange-600 font-semibold mb-1">{t('cathode')} (−) — {t('reduction')}</p>
          <p className="font-mono text-xs text-slate-700 bg-slate-100 rounded p-2">Cu²⁺(aq) + 2e⁻ → Cu(s)</p>
          <p className="text-slate-500 text-xs mt-1">{lang === 'zh' ? '沉積紅棕色銅' : 'Reddish-brown Cu deposits'}</p>
        </div>
      </div>
    </div>
  )
}

function ePath(tt) {
  const seg1 = ELEC_TOP - WIRE_Y, seg2 = CATHODE_X - ANODE_X
  const total = seg1 + seg2 + seg1, d = tt * total
  if (d < seg1) return { x: ANODE_X, y: ELEC_TOP - d }
  if (d < seg1 + seg2) return { x: ANODE_X + (d - seg1), y: WIRE_Y }
  return { x: CATHODE_X, y: WIRE_Y + (d - seg1 - seg2) }
}
function respawn(ion) { ion.x = 130 + Math.random() * 440; ion.y = 150 + Math.random() * 200 }
