import React, { useRef, useEffect, useState, useCallback } from 'react'

const W = 700, H = 460

// Left beaker: Zn in ZnSO4 (anode)
const LBK = { x: 40, y: 130, w: 240, h: 250 }
// Right beaker: Cu in CuSO4 (cathode)
const RBK = { x: 420, y: 130, w: 240, h: 250 }
const SALT_BRIDGE = { x: 220, y: 100, w: 260, h: 50 }
const ZN_X = 120, CU_X = 580
const ELEC_TOP = 105, ELEC_BOT = 340
const VM_CX = 350, VM_Y = 50 // voltmeter

export default function DanielCell() {
  const canvasRef = useRef(null)
  const stateRef = useRef(initState())
  const animRef = useRef(null)
  const runRef = useRef(false)
  const [znConc, setZnConc] = useState(100)
  const [cuConc, setCuConc] = useState(100)
  const [running, setRunning] = useState(false)

  const emf = Math.max(0, 1.10 + 0.0296 * Math.log(cuConc / znConc)).toFixed(2)

  const update = useCallback(() => {
    const s = stateRef.current
    const spd = 0.8

    s.electrons.forEach(e => { e.pos = (e.pos + spd * 0.004) % 1 })

    s.znIons.forEach(ion => {
      ion.x += (Math.random() - 0.5) * 1.2
      ion.y += (Math.random() - 0.5) * 1.2
      ion.x = Math.max(LBK.x + ion.r + 5, Math.min(LBK.x + LBK.w - ion.r - 5, ion.x))
      ion.y = Math.max(LBK.y + ion.r + 5, Math.min(LBK.y + LBK.h - ion.r - 5, ion.y))
    })

    s.cuIons.forEach(ion => {
      // Cu2+ moves toward cathode (CU_X)
      const target = CU_X
      ion.x += (target - ion.x) * 0.008 + (Math.random() - 0.5) * 1.2
      ion.y += (Math.random() - 0.5) * 1.2
      ion.x = Math.max(RBK.x + ion.r + 5, Math.min(RBK.x + RBK.w - ion.r - 5, ion.x))
      ion.y = Math.max(RBK.y + ion.r + 5, Math.min(RBK.y + RBK.h - ion.r - 5, ion.y))
      if (ion.x > CU_X - 20) {
        s.cuDeposit++
        ion.x = RBK.x + 30 + Math.random() * (RBK.w - 60)
        ion.y = RBK.y + 20 + Math.random() * (RBK.h - 40)
      }
    })

    // Salt bridge ions
    s.sbIons.forEach(ion => {
      ion.x += ion.dir * 0.4 + (Math.random() - 0.5) * 0.3
      if (ion.x < SALT_BRIDGE.x + 10) ion.dir = 1
      if (ion.x > SALT_BRIDGE.x + SALT_BRIDGE.w - 10) ion.dir = -1
    })

    // Zn dissolves occasionally
    if (s.electrons[0].pos < 0.01) s.znDeposit = Math.max(0, s.znDeposit - 0.3)
  }, [])

  const draw = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, W, H)

    // External wire
    drawWires(ctx)

    // Electrons
    if (running) {
      stateRef.current.electrons.forEach(e => {
        const pt = ePath(e.pos)
        ctx.beginPath(); ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2); ctx.fillStyle = '#facc15'; ctx.fill()
      })
    }

    // Salt bridge
    ctx.fillStyle = '#1e3a2f'
    ctx.beginPath(); ctx.roundRect(SALT_BRIDGE.x, SALT_BRIDGE.y, SALT_BRIDGE.w, SALT_BRIDGE.h, 20); ctx.fill()
    ctx.strokeStyle = '#4ade80'; ctx.lineWidth = 2; ctx.stroke()
    lbl(ctx, 'Salt Bridge (KNO₃ in agar)', SALT_BRIDGE.x + SALT_BRIDGE.w / 2, SALT_BRIDGE.y + 28, '#4ade80', 10)

    // Salt bridge ions
    stateRef.current.sbIons.forEach(ion => {
      ctx.beginPath(); ctx.arc(ion.x, SALT_BRIDGE.y + 35, 7, 0, Math.PI * 2)
      ctx.fillStyle = ion.color; ctx.globalAlpha = 0.7; ctx.fill(); ctx.globalAlpha = 1
      ctx.fillStyle = '#fff'; ctx.font = 'bold 7px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText(ion.sym, ion.x, SALT_BRIDGE.y + 35); ctx.textBaseline = 'alphabetic'
    })

    // Left beaker (Zn/ZnSO4)
    ctx.fillStyle = 'rgba(250,204,21,0.08)'
    ctx.fillRect(LBK.x + 4, LBK.y + 4, LBK.w - 8, LBK.h - 8)
    drawBeaker(ctx, LBK)
    lbl(ctx, 'ZnSO₄(aq)', LBK.x + LBK.w / 2, LBK.y + LBK.h + 18, '#fde68a', 12)

    // Right beaker (Cu/CuSO4)
    const blueAlpha = 0.05 + (cuConc / 100) * 0.18
    ctx.fillStyle = `rgba(59,130,246,${blueAlpha})`
    ctx.fillRect(RBK.x + 4, RBK.y + 4, RBK.w - 8, RBK.h - 8)
    drawBeaker(ctx, RBK)
    lbl(ctx, 'CuSO₄(aq)', RBK.x + RBK.w / 2, RBK.y + RBK.h + 18, '#93c5fd', 12)

    // Zn electrode (anode) — shows dissolution
    const s = stateRef.current
    const znH = Math.max(20, 200 - s.znDeposit * 2)
    ctx.fillStyle = '#a3a3a3'; ctx.fillRect(ZN_X - 7, ELEC_TOP, 14, znH)
    // Zn2+ being produced around electrode
    lbl(ctx, 'Anode (−)', ZN_X, ELEC_TOP - 14, '#fde68a')
    lbl(ctx, 'Zn', ZN_X, ELEC_TOP + znH / 2 + 5, '#e5e7eb', 11)

    // Cu electrode (cathode) — shows deposit
    ctx.fillStyle = '#92400e'; ctx.fillRect(CU_X - 7, ELEC_TOP, 14, 200)
    if (s.cuDeposit > 0) {
      const dH = Math.min(s.cuDeposit * 0.5, 50)
      ctx.fillStyle = '#b45309'; ctx.fillRect(CU_X - 10, ELEC_BOT - dH, 20, dH)
    }
    lbl(ctx, 'Cathode (+)', CU_X, ELEC_TOP - 14, '#93c5fd')
    lbl(ctx, 'Cu', CU_X, ELEC_TOP + 105, '#e5e7eb', 11)

    // Ions in left beaker
    s.znIons.forEach(ion => drawIon(ctx, ion.x, ion.y, ion.sym, ion.color, 12))
    // Ions in right beaker
    s.cuIons.forEach(ion => drawIon(ctx, ion.x, ion.y, ion.sym, ion.color, 12))

    // Voltmeter
    drawVoltmeter(ctx, emf)

    // Equations
    lbl(ctx, 'Zn → Zn²⁺ + 2e⁻', LBK.x + LBK.w / 2, LBK.y + LBK.h + 34, '#facc15', 10)
    lbl(ctx, 'Cu²⁺ + 2e⁻ → Cu', RBK.x + RBK.w / 2, RBK.y + RBK.h + 34, '#60a5fa', 10)
    lbl(ctx, `E°cell = +1.10 V  |  Actual EMF ≈ ${emf} V`, W / 2, H - 10, '#6b7280', 10)
  }, [running, cuConc, emf])

  useEffect(() => {
    const loop = () => { if (runRef.current) update(); draw(); animRef.current = requestAnimationFrame(loop) }
    animRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animRef.current)
  }, [draw, update])

  useEffect(() => { runRef.current = running }, [running])

  const reset = () => { stateRef.current = initState(); setRunning(false); runRef.current = false }

  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} className="sim-canvas" />
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card">
          <label className="text-xs text-gray-400 block mb-2">[ZnSO₄]: <span className="text-yellow-400 font-bold">{znConc}%</span></label>
          <input type="range" min={10} max={200} value={znConc} onChange={e => setZnConc(+e.target.value)} className="control-slider" />
        </div>
        <div className="card">
          <label className="text-xs text-gray-400 block mb-2">[CuSO₄]: <span className="text-blue-400 font-bold">{cuConc}%</span></label>
          <input type="range" min={10} max={200} value={cuConc} onChange={e => setCuConc(+e.target.value)} className="control-slider" />
        </div>
        <div className="card flex gap-3 items-center justify-center">
          <button onClick={() => setRunning(r => !r)} className={`px-4 py-2 rounded-lg font-semibold text-sm ${running ? 'bg-red-800 hover:bg-red-700' : 'bg-green-700 hover:bg-green-600'} text-white`}>
            {running ? '⏸ Pause' : '▶ Start'}
          </button>
          <button onClick={reset} className="px-4 py-2 rounded-lg font-semibold text-sm bg-gray-700 hover:bg-gray-600 text-white">↺ Reset</button>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="card border-yellow-800/40">
          <p className="text-yellow-400 font-semibold mb-1">Anode (Zn, −) — Oxidation</p>
          <p className="font-mono text-xs text-gray-300 bg-gray-800 rounded p-2">Zn(s) → Zn²⁺(aq) + 2e⁻   E°red = −0.76 V</p>
          <p className="text-gray-500 text-xs mt-1">Zn dissolves; Zn²⁺ enters solution</p>
        </div>
        <div className="card border-blue-800/40">
          <p className="text-blue-400 font-semibold mb-1">Cathode (Cu, +) — Reduction</p>
          <p className="font-mono text-xs text-gray-300 bg-gray-800 rounded p-2">Cu²⁺(aq) + 2e⁻ → Cu(s)   E°red = +0.34 V</p>
          <p className="text-gray-500 text-xs mt-1">Cu²⁺ deposited; solution fades</p>
        </div>
      </div>
    </div>
  )
}

function initState() {
  const znIons = [], cuIons = [], sbIons = []
  for (let i = 0; i < 12; i++) {
    znIons.push({ x: LBK.x + 20 + Math.random() * (LBK.w - 40), y: LBK.y + 20 + Math.random() * (LBK.h - 40), sym: i < 7 ? 'Zn²⁺' : 'SO₄²⁻', color: i < 7 ? '#facc15' : '#818cf8', r: 12 })
    cuIons.push({ x: RBK.x + 20 + Math.random() * (RBK.w - 40), y: RBK.y + 20 + Math.random() * (RBK.h - 40), sym: i < 7 ? 'Cu²⁺' : 'SO₄²⁻', color: i < 7 ? '#f97316' : '#818cf8', r: 12 })
  }
  for (let i = 0; i < 8; i++) {
    sbIons.push({ x: SALT_BRIDGE.x + 20 + Math.random() * (SALT_BRIDGE.w - 40), sym: i < 4 ? 'K⁺' : 'NO₃⁻', color: i < 4 ? '#86efac' : '#fca5a5', dir: i < 4 ? -1 : 1 })
  }
  return { znIons, cuIons, sbIons, electrons: [0, 0.33, 0.66].map(p => ({ pos: p })), znDeposit: 0, cuDeposit: 0 }
}

function drawWires(ctx) {
  ctx.strokeStyle = '#475569'; ctx.lineWidth = 2.5
  ctx.beginPath(); ctx.moveTo(ZN_X, ELEC_TOP); ctx.lineTo(ZN_X, VM_Y + 20); ctx.lineTo(VM_CX - 25, VM_Y + 20); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(CU_X, ELEC_TOP); ctx.lineTo(CU_X, VM_Y + 20); ctx.lineTo(VM_CX + 25, VM_Y + 20); ctx.stroke()
}

function ePath(t) {
  const s1 = ELEC_TOP - (VM_Y + 20), s2 = (VM_CX - 25) - ZN_X
  const s3 = 50 // through voltmeter
  const s4 = CU_X - (VM_CX + 25), s5 = ELEC_TOP - (VM_Y + 20)
  const total = s1 + s2 + s3 + s4 + s5, d = t * total
  if (d < s1) return { x: ZN_X, y: ELEC_TOP - d }
  if (d < s1 + s2) return { x: ZN_X + (d - s1), y: VM_Y + 20 }
  if (d < s1 + s2 + s3) return { x: VM_CX - 25 + (d - s1 - s2), y: VM_Y + 20 }
  if (d < s1 + s2 + s3 + s4) return { x: VM_CX + 25 + (d - s1 - s2 - s3), y: VM_Y + 20 }
  return { x: CU_X, y: VM_Y + 20 + (d - s1 - s2 - s3 - s4) }
}

function drawVoltmeter(ctx, emf) {
  ctx.beginPath(); ctx.arc(VM_CX, VM_Y + 20, 22, 0, Math.PI * 2)
  ctx.fillStyle = '#1e293b'; ctx.fill(); ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2; ctx.stroke()
  lbl(ctx, 'V', VM_CX, VM_Y + 18, '#94a3b8', 10)
  lbl(ctx, `${emf}V`, VM_CX, VM_Y + 30, '#4ade80', 9)
}

function drawBeaker(ctx, bk) {
  ctx.beginPath()
  ctx.moveTo(bk.x + 10, bk.y); ctx.lineTo(bk.x + 10, bk.y + bk.h)
  ctx.lineTo(bk.x + bk.w - 10, bk.y + bk.h); ctx.lineTo(bk.x + bk.w - 10, bk.y)
  ctx.strokeStyle = '#6b7280'; ctx.lineWidth = 3; ctx.stroke()
  ctx.beginPath(); ctx.moveTo(bk.x, bk.y); ctx.lineTo(bk.x + bk.w, bk.y); ctx.stroke()
}

function drawIon(ctx, x, y, sym, color, r) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fillStyle = color; ctx.globalAlpha = 0.8; ctx.fill(); ctx.globalAlpha = 1
  ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 1; ctx.stroke()
  ctx.fillStyle = '#fff'; ctx.font = `bold ${sym.length > 3 ? 7 : 8}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillText(sym, x, y); ctx.textBaseline = 'alphabetic'
}

function lbl(ctx, text, x, y, color = '#9ca3af', size = 12) {
  ctx.fillStyle = color; ctx.font = `${size}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText(text, x, y)
}
