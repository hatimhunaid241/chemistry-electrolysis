import React, { useRef, useEffect, useState, useCallback } from 'react'

const W = 700, H = 440
const BK = { x: 80, y: 120, w: 540, h: 270 }
const ANODE_X = 210, CATHODE_X = 490
const ELEC_TOP = 90, ELEC_BOT = 355
const BAT_CX = 350, BAT_Y = 20

const METAL_OPTIONS = [
  { id: 'ag', name: 'Silver (Ag)', ionSym: 'Ag⁺', ionColor: '#e2e8f0', metalColor: '#c0c0c0', solColor: 'rgba(200,200,220,0.1)', electrolyte: 'AgNO₃(aq)' },
  { id: 'cu', name: 'Copper (Cu)', ionSym: 'Cu²⁺', ionColor: '#f97316', metalColor: '#b45309', solColor: 'rgba(59,130,246,0.15)', electrolyte: 'CuSO₄(aq)' },
  { id: 'ni', name: 'Nickel (Ni)', ionSym: 'Ni²⁺', ionColor: '#a3e635', metalColor: '#4d7c0f', solColor: 'rgba(163,230,53,0.08)', electrolyte: 'NiSO₄(aq)' },
  { id: 'cr', name: 'Chromium (Cr)', ionSym: 'Cr³⁺', ionColor: '#67e8f9', metalColor: '#155e75', solColor: 'rgba(103,232,249,0.08)', electrolyte: 'CrSO₄(aq)' },
]

const OBJECT_OPTIONS = [
  { id: 'spoon', name: 'Spoon' },
  { id: 'ring', name: 'Ring' },
  { id: 'plate', name: 'Plate' },
]

function initState() {
  return {
    ions: Array.from({ length: 24 }, (_, i) => ({
      x: 120 + Math.random() * 460, y: 150 + Math.random() * 200,
      isCation: i < 12, r: 12,
    })),
    platingThickness: 0,
    anodeMass: 100,
    electrons: [0, 0.33, 0.66].map(p => ({ pos: p })),
    bubbles: [],
  }
}

export default function ElectroplatingSim() {
  const canvasRef = useRef(null)
  const stateRef = useRef(initState())
  const animRef = useRef(null)
  const runRef = useRef(false)

  const [voltage, setVoltage] = useState(6)
  const [current, setCurrent] = useState(1.0)
  const [time, setTime] = useState(0)
  const [running, setRunning] = useState(false)
  const [metal, setMetal] = useState(METAL_OPTIONS[0])
  const [object, setObject] = useState(OBJECT_OPTIONS[0])

  useEffect(() => {
    let t
    if (running) t = setInterval(() => setTime(p => p + 1), 1000)
    return () => clearInterval(t)
  }, [running])

  // Faraday calculation
  const charge = current * time // Coulombs
  const F = 96500
  const z = metal.id === 'cr' ? 3 : metal.id === 'ag' ? 1 : 2
  const M = { ag: 108, cu: 63.5, ni: 58.7, cr: 52 }[metal.id]
  const massDeposited = ((charge / F) * (M / z)).toFixed(4)

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
        s.platingThickness = Math.min(s.platingThickness + 0.08, 30)
        respawn(ion)
      }
      if (!ion.isCation && ion.x < ANODE_X + 18) {
        s.anodeMass = Math.max(0, s.anodeMass - 0.03)
        respawn(ion)
      }
    })
  }, [voltage])

  const draw = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, W, H)

    drawBat(ctx); drawWires(ctx)

    if (running) {
      stateRef.current.electrons.forEach(e => {
        const pt = ePath(e.pos)
        ctx.beginPath(); ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2); ctx.fillStyle = '#facc15'; ctx.fill()
      })
    }

    // Solution
    ctx.fillStyle = metal.solColor; ctx.fillRect(BK.x + 4, BK.y + 4, BK.w - 8, BK.h - 8)
    drawBeaker(ctx)

    // Anode (plating metal)
    const s = stateRef.current
    const anodeFrac = s.anodeMass / 100
    const anodeH = 20 + anodeFrac * (ELEC_BOT - ELEC_TOP - 20)
    ctx.fillStyle = metal.metalColor; ctx.fillRect(ANODE_X - 8, ELEC_TOP, 16, anodeH)
    lbl(ctx, `Anode (+)`, ANODE_X, ELEC_TOP - 22, '#e2e8f0')
    lbl(ctx, metal.name.split(' ')[0], ANODE_X, ELEC_TOP - 10, '#9ca3af', 10)

    // Cathode (object being plated)
    ctx.fillStyle = '#4b5563'; ctx.fillRect(CATHODE_X - 8, ELEC_TOP, 16, ELEC_BOT - ELEC_TOP)
    // Plating layer
    if (s.platingThickness > 0) {
      ctx.fillStyle = metal.metalColor
      ctx.globalAlpha = 0.7
      ctx.fillRect(CATHODE_X - 8 - s.platingThickness / 2, ELEC_TOP, 16 + s.platingThickness, ELEC_BOT - ELEC_TOP)
      ctx.globalAlpha = 1
    }
    lbl(ctx, `Cathode (−)`, CATHODE_X, ELEC_TOP - 22, '#e2e8f0')
    lbl(ctx, object.name, CATHODE_X, ELEC_TOP - 10, '#9ca3af', 10)

    // Ions
    s.ions.forEach(ion => {
      ctx.beginPath(); ctx.arc(ion.x, ion.y, ion.r, 0, Math.PI * 2)
      ctx.fillStyle = ion.isCation ? metal.ionColor : '#818cf8'
      ctx.globalAlpha = 0.8; ctx.fill(); ctx.globalAlpha = 1
      ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 1; ctx.stroke()
      ctx.fillStyle = '#fff'; ctx.font = 'bold 8px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText(ion.isCation ? metal.ionSym : 'NO₃⁻', ion.x, ion.y); ctx.textBaseline = 'alphabetic'
    })

    // Labels
    lbl(ctx, metal.electrolyte, BAT_CX, BK.y + BK.h + 18, '#9ca3af', 13)
    lbl(ctx, `${metal.name.split(' ')[0]} plating on ${object.name}`, BAT_CX, BK.y + BK.h + 34, '#64748b', 11)

    // Faraday info box
    ctx.fillStyle = '#1e293b'; ctx.beginPath(); ctx.roundRect(10, H - 80, 200, 68, 8); ctx.fill()
    ctx.strokeStyle = '#334155'; ctx.lineWidth = 1; ctx.stroke()
    lbl(ctx, '⚗ Faraday Calculations', 110, H - 62, '#94a3b8', 10)
    lbl(ctx, `Q = ${current}A × ${time}s = ${charge.toFixed(0)} C`, 110, H - 48, '#cbd5e1', 9)
    lbl(ctx, `n(e⁻) = ${(charge / F).toFixed(5)} mol`, 110, H - 36, '#cbd5e1', 9)
    lbl(ctx, `Mass deposited = ${massDeposited} g`, 110, H - 22, '#4ade80', 10)

    lbl(ctx, `${metal.ionSym} → ${metal.name.split(' ')[0]} + ${z}e⁻ (anode dissolves)`, ANODE_X, BK.y + BK.h + 50, '#9ca3af', 10)
    lbl(ctx, `${metal.ionSym} + ${z}e⁻ → ${metal.name.split(' ')[0]} (deposits)`, CATHODE_X, BK.y + BK.h + 50, '#9ca3af', 10)
  }, [running, metal, object, current, time, massDeposited])

  useEffect(() => {
    const loop = () => { if (runRef.current) update(); draw(); animRef.current = requestAnimationFrame(loop) }
    animRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animRef.current)
  }, [draw, update])

  useEffect(() => { runRef.current = running }, [running])

  const reset = () => { stateRef.current = initState(); setTime(0); setRunning(false); runRef.current = false }

  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} className="sim-canvas" />
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card">
          <label className="text-xs text-gray-400 block mb-2">Plating Metal</label>
          <select value={metal.id} onChange={e => { setMetal(METAL_OPTIONS.find(m => m.id === e.target.value)); reset() }} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-sm text-gray-300">
            {METAL_OPTIONS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
        <div className="card">
          <label className="text-xs text-gray-400 block mb-2">Object to Plate</label>
          <select value={object.id} onChange={e => setObject(OBJECT_OPTIONS.find(o => o.id === e.target.value))} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-sm text-gray-300">
            {OBJECT_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        </div>
        <div className="card">
          <label className="text-xs text-gray-400 block mb-2">Current: <span className="text-blue-400 font-bold">{current} A</span></label>
          <input type="range" min={0.1} max={5} step={0.1} value={current} onChange={e => setCurrent(+e.target.value)} className="control-slider" />
        </div>
        <div className="card flex gap-2 items-center justify-center">
          <button onClick={() => setRunning(r => !r)} className={`px-3 py-2 rounded-lg font-semibold text-sm ${running ? 'bg-red-800 hover:bg-red-700' : 'bg-green-700 hover:bg-green-600'} text-white`}>
            {running ? '⏸ Pause' : '▶ Start'}
          </button>
          <button onClick={reset} className="px-3 py-2 rounded-lg font-semibold text-sm bg-gray-700 hover:bg-gray-600 text-white">↺</button>
        </div>
      </div>
    </div>
  )
}

function respawn(ion) { ion.x = 130 + Math.random() * 440; ion.y = 150 + Math.random() * 200 }
function ePath(t) {
  const s1 = ELEC_TOP - (BAT_Y + 13), s2 = CATHODE_X - ANODE_X, s3 = s1
  const total = s1 + s2 + s3, d = t * total
  if (d < s1) return { x: ANODE_X, y: ELEC_TOP - d }
  if (d < s1 + s2) return { x: ANODE_X + (d - s1), y: BAT_Y + 13 }
  return { x: CATHODE_X, y: BAT_Y + 13 + (d - s1 - s2) }
}
function drawBat(ctx) {
  ctx.fillStyle = '#1e293b'; ctx.beginPath(); ctx.roundRect(BAT_CX - 90, BAT_Y, 180, 26, 5); ctx.fill()
  ctx.strokeStyle = '#475569'; ctx.lineWidth = 1.5; ctx.stroke()
  ctx.font = 'bold 13px monospace'; ctx.textAlign = 'left'; ctx.fillStyle = '#ef4444'; ctx.fillText('+', BAT_CX - 82, BAT_Y + 17)
  ctx.textAlign = 'right'; ctx.fillStyle = '#60a5fa'; ctx.fillText('−', BAT_CX + 82, BAT_Y + 17)
  ctx.textAlign = 'center'; ctx.fillStyle = '#64748b'; ctx.font = '10px sans-serif'; ctx.fillText('DC Power Supply', BAT_CX, BAT_Y + 17)
}
function drawWires(ctx) {
  ctx.strokeStyle = '#475569'; ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(BAT_CX - 90, BAT_Y + 13); ctx.lineTo(ANODE_X, BAT_Y + 13); ctx.lineTo(ANODE_X, ELEC_TOP); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(BAT_CX + 90, BAT_Y + 13); ctx.lineTo(CATHODE_X, BAT_Y + 13); ctx.lineTo(CATHODE_X, ELEC_TOP); ctx.stroke()
}
function drawBeaker(ctx) {
  ctx.beginPath()
  ctx.moveTo(BK.x + 10, BK.y); ctx.lineTo(BK.x + 10, BK.y + BK.h); ctx.lineTo(BK.x + BK.w - 10, BK.y + BK.h); ctx.lineTo(BK.x + BK.w - 10, BK.y)
  ctx.strokeStyle = '#6b7280'; ctx.lineWidth = 3; ctx.stroke()
  ctx.beginPath(); ctx.moveTo(BK.x, BK.y); ctx.lineTo(BK.x + BK.w, BK.y); ctx.stroke()
}
function lbl(ctx, text, x, y, color = '#9ca3af', size = 12) {
  ctx.fillStyle = color; ctx.font = `${size}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText(text, x, y)
}
