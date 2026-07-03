import React, { useRef, useEffect, useState, useCallback } from 'react'
import { useLang } from '../i18n/LanguageContext'
import { CV, clearLight, drawWire, drawBeaker, drawElectron, drawIon, label } from './simTheme'

const W = 700, H = 460
const LBK = { x: 40, y: 130, w: 240, h: 250 }   // Zn / ZnSO₄ (anode)
const RBK = { x: 420, y: 130, w: 240, h: 250 }   // Cu / CuSO₄ (cathode)
const SALT_BRIDGE = { x: 220, y: 100, w: 260, h: 50 }
const ZN_X = 120, CU_X = 580
const ELEC_TOP = 105, ELEC_BOT = 340
const VM_CX = 350, VM_Y = 50

export default function DanielCell({ onSample }) {
  const { t, lang } = useLang()
  const canvasRef = useRef(null)
  const stateRef = useRef(initState())
  const animRef = useRef(null)
  const runRef = useRef(false)
  const frameRef = useRef(0)
  const secRef = useRef(0)
  const onSampleRef = useRef(onSample)
  useEffect(() => { onSampleRef.current = onSample }, [onSample])

  const [znConc, setZnConc] = useState(100)
  const [cuConc, setCuConc] = useState(100)
  const [running, setRunning] = useState(false)
  const emf = Math.max(0, 1.10 + 0.0296 * Math.log(cuConc / znConc)).toFixed(2)

  const update = useCallback(() => {
    const s = stateRef.current
    s.electrons.forEach(e => { e.pos = (e.pos + 0.8 * 0.004) % 1 })
    s.znIons.forEach(ion => {
      ion.x += (Math.random() - 0.5) * 1.2; ion.y += (Math.random() - 0.5) * 1.2
      ion.x = Math.max(LBK.x + ion.r + 5, Math.min(LBK.x + LBK.w - ion.r - 5, ion.x))
      ion.y = Math.max(LBK.y + ion.r + 5, Math.min(LBK.y + LBK.h - ion.r - 5, ion.y))
    })
    s.cuIons.forEach(ion => {
      ion.x += (CU_X - ion.x) * 0.008 + (Math.random() - 0.5) * 1.2; ion.y += (Math.random() - 0.5) * 1.2
      ion.x = Math.max(RBK.x + ion.r + 5, Math.min(RBK.x + RBK.w - ion.r - 5, ion.x))
      ion.y = Math.max(RBK.y + ion.r + 5, Math.min(RBK.y + RBK.h - ion.r - 5, ion.y))
      if (ion.x > CU_X - 20) { s.cuDeposit++; ion.x = RBK.x + 30 + Math.random() * (RBK.w - 60); ion.y = RBK.y + 20 + Math.random() * (RBK.h - 40) }
    })
    s.sbIons.forEach(ion => { ion.x += ion.dir * 0.4 + (Math.random() - 0.5) * 0.3; if (ion.x < SALT_BRIDGE.x + 10) ion.dir = 1; if (ion.x > SALT_BRIDGE.x + SALT_BRIDGE.w - 10) ion.dir = -1 })
    if (s.electrons[0].pos < 0.01) s.znDeposit = Math.min(60, s.znDeposit + 0.3)
  }, [])

  const draw = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d')
    const s = stateRef.current
    clearLight(ctx, W, H)

    drawWire(ctx, [{ x: ZN_X, y: ELEC_TOP }, { x: ZN_X, y: VM_Y + 20 }, { x: VM_CX - 25, y: VM_Y + 20 }], CV.wire, 2.5)
    drawWire(ctx, [{ x: CU_X, y: ELEC_TOP }, { x: CU_X, y: VM_Y + 20 }, { x: VM_CX + 25, y: VM_Y + 20 }], CV.wire, 2.5)
    if (running) s.electrons.forEach(e => { const p = ePath(e.pos); drawElectron(ctx, p.x, p.y) })

    // Salt bridge
    ctx.fillStyle = '#dcfce7'; ctx.beginPath(); ctx.roundRect(SALT_BRIDGE.x, SALT_BRIDGE.y, SALT_BRIDGE.w, SALT_BRIDGE.h, 20); ctx.fill()
    ctx.strokeStyle = '#22c55e'; ctx.lineWidth = 2; ctx.stroke()
    label(ctx, lang === 'zh' ? '鹽橋（KNO₃ 於瓊脂）' : 'Salt Bridge (KNO₃ in agar)', SALT_BRIDGE.x + SALT_BRIDGE.w / 2, SALT_BRIDGE.y + 28, '#15803d', 10)
    s.sbIons.forEach(ion => drawIon(ctx, ion.x, SALT_BRIDGE.y + 35, ion.sym, ion.color, 7))

    drawBeaker(ctx, LBK.x, LBK.y, LBK.w, LBK.h, 'rgba(234,179,8,0.07)')
    label(ctx, 'ZnSO₄(aq)', LBK.x + LBK.w / 2, LBK.y + LBK.h + 18, '#b45309', 12)
    const blueAlpha = 0.05 + (cuConc / 100) * 0.18
    drawBeaker(ctx, RBK.x, RBK.y, RBK.w, RBK.h, `rgba(37,99,235,${blueAlpha})`)
    label(ctx, 'CuSO₄(aq)', RBK.x + RBK.w / 2, RBK.y + RBK.h + 18, '#2563eb', 12)

    const znH = Math.max(20, 200 - s.znDeposit * 2)
    ctx.fillStyle = '#94a3b8'; ctx.fillRect(ZN_X - 7, ELEC_TOP, 14, znH)
    label(ctx, `${t('anode')} (−)`, ZN_X, ELEC_TOP - 14, '#b45309')
    label(ctx, 'Zn', ZN_X, ELEC_TOP + znH / 2 + 5, CV.textStrong, 11)
    ctx.fillStyle = '#92400e'; ctx.fillRect(CU_X - 7, ELEC_TOP, 14, 200)
    if (s.cuDeposit > 0) { const dH = Math.min(s.cuDeposit * 0.5, 50); ctx.fillStyle = '#b45309'; ctx.fillRect(CU_X - 10, ELEC_BOT - dH, 20, dH) }
    label(ctx, `${t('cathode')} (+)`, CU_X, ELEC_TOP - 14, '#2563eb')
    label(ctx, 'Cu', CU_X, ELEC_TOP + 105, CV.textStrong, 11)

    s.znIons.forEach(ion => drawIon(ctx, ion.x, ion.y, ion.sym, ion.color, 12))
    s.cuIons.forEach(ion => drawIon(ctx, ion.x, ion.y, ion.sym, ion.color, 12))

    // Voltmeter
    ctx.beginPath(); ctx.arc(VM_CX, VM_Y + 20, 22, 0, Math.PI * 2); ctx.fillStyle = CV.panel; ctx.fill(); ctx.strokeStyle = CV.panelStroke; ctx.lineWidth = 2; ctx.stroke()
    label(ctx, 'V', VM_CX, VM_Y + 17, CV.textMuted, 10)
    label(ctx, `${emf}V`, VM_CX, VM_Y + 31, '#16a34a', 10)

    label(ctx, 'Zn → Zn²⁺ + 2e⁻', LBK.x + LBK.w / 2, LBK.y + LBK.h + 34, '#b45309', 10)
    label(ctx, 'Cu²⁺ + 2e⁻ → Cu', RBK.x + RBK.w / 2, RBK.y + RBK.h + 34, '#2563eb', 10)
    label(ctx, `E°cell = +1.10 V  |  ${lang === 'zh' ? '實際 EMF' : 'Actual EMF'} ≈ ${emf} V`, W / 2, H - 10, CV.textMuted, 10)
  }, [running, cuConc, emf, t, lang])

  useEffect(() => {
    const loop = () => {
      if (runRef.current) {
        update(); frameRef.current++
        if (frameRef.current >= 60) {
          frameRef.current = 0; secRef.current++
          onSampleRef.current?.({ t: secRef.current, emf: +emf, cu: Math.round(stateRef.current.cuDeposit) })
        }
      }
      draw(); animRef.current = requestAnimationFrame(loop)
    }
    animRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animRef.current)
  }, [draw, update, emf])

  useEffect(() => { runRef.current = running }, [running])
  const reset = () => { stateRef.current = initState(); setRunning(false); runRef.current = false; frameRef.current = 0; secRef.current = 0; onSampleRef.current?.({ reset: true }) }

  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} className="sim-canvas" />
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card">
          <label className="text-xs text-slate-500 block mb-2">[ZnSO₄]: <span className="text-amber-600 font-bold">{znConc}%</span></label>
          <input type="range" min={10} max={200} value={znConc} onChange={e => setZnConc(+e.target.value)} className="control-slider" />
        </div>
        <div className="card">
          <label className="text-xs text-slate-500 block mb-2">[CuSO₄]: <span className="text-blue-600 font-bold">{cuConc}%</span></label>
          <input type="range" min={10} max={200} value={cuConc} onChange={e => setCuConc(+e.target.value)} className="control-slider" />
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
          <p className="text-amber-700 font-semibold mb-1">{t('anode')} (Zn, −) — {t('oxidation')}</p>
          <p className="font-mono text-xs text-slate-700 bg-slate-100 rounded p-2">Zn(s) → Zn²⁺(aq) + 2e⁻   E°red = −0.76 V</p>
          <p className="text-slate-500 text-xs mt-1">{lang === 'zh' ? 'Zn 溶解，Zn²⁺ 進入溶液' : 'Zn dissolves; Zn²⁺ enters solution'}</p>
        </div>
        <div className="card border-blue-200">
          <p className="text-blue-600 font-semibold mb-1">{t('cathode')} (Cu, +) — {t('reduction')}</p>
          <p className="font-mono text-xs text-slate-700 bg-slate-100 rounded p-2">Cu²⁺(aq) + 2e⁻ → Cu(s)   E°red = +0.34 V</p>
          <p className="text-slate-500 text-xs mt-1">{lang === 'zh' ? 'Cu²⁺ 沉積，溶液顏色變淡' : 'Cu²⁺ deposited; solution fades'}</p>
        </div>
      </div>
    </div>
  )
}

function initState() {
  const znIons = [], cuIons = [], sbIons = []
  for (let i = 0; i < 12; i++) {
    znIons.push({ x: LBK.x + 20 + Math.random() * (LBK.w - 40), y: LBK.y + 20 + Math.random() * (LBK.h - 40), sym: i < 7 ? 'Zn²⁺' : 'SO₄²⁻', color: i < 7 ? '#eab308' : '#818cf8', r: 12 })
    cuIons.push({ x: RBK.x + 20 + Math.random() * (RBK.w - 40), y: RBK.y + 20 + Math.random() * (RBK.h - 40), sym: i < 7 ? 'Cu²⁺' : 'SO₄²⁻', color: i < 7 ? '#f97316' : '#818cf8', r: 12 })
  }
  for (let i = 0; i < 8; i++) sbIons.push({ x: SALT_BRIDGE.x + 20 + Math.random() * (SALT_BRIDGE.w - 40), sym: i < 4 ? 'K⁺' : 'NO₃⁻', color: i < 4 ? '#4ade80' : '#f87171', dir: i < 4 ? -1 : 1 })
  return { znIons, cuIons, sbIons, electrons: [0, 0.33, 0.66].map(p => ({ pos: p })), znDeposit: 0, cuDeposit: 0 }
}
function ePath(tt) {
  const s1 = ELEC_TOP - (VM_Y + 20), s2 = (VM_CX - 25) - ZN_X, s3 = 50, s4 = CU_X - (VM_CX + 25), s5 = s1
  const total = s1 + s2 + s3 + s4 + s5, d = tt * total
  if (d < s1) return { x: ZN_X, y: ELEC_TOP - d }
  if (d < s1 + s2) return { x: ZN_X + (d - s1), y: VM_Y + 20 }
  if (d < s1 + s2 + s3) return { x: VM_CX - 25 + (d - s1 - s2), y: VM_Y + 20 }
  if (d < s1 + s2 + s3 + s4) return { x: VM_CX + 25 + (d - s1 - s2 - s3), y: VM_Y + 20 }
  return { x: CU_X, y: VM_Y + 20 + (d - s1 - s2 - s3 - s4) }
}
