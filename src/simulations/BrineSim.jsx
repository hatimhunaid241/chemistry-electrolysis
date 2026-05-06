import React, { useRef, useEffect, useState, useCallback } from 'react'

const W = 700, H = 440
const BK = { x: 80, y: 120, w: 540, h: 270 }
const ANODE_X = 210, CATHODE_X = 490
const ELEC_TOP = 90, ELEC_BOT = 355
const BAT_CX = 350, BAT_Y = 20

function initState() {
  const ions = []
  for (let i = 0; i < 32; i++) {
    const t = i % 4
    ions.push({
      x: 120 + Math.random() * 460, y: 150 + Math.random() * 200,
      type: t === 0 ? 'Na' : t === 1 ? 'Cl' : t === 2 ? 'H' : 'OH',
      get symbol() { return { Na: 'Na⁺', Cl: 'Cl⁻', H: 'H⁺', OH: 'OH⁻' }[this.type] },
      get color() { return { Na: '#facc15', Cl: '#34d399', H: '#60a5fa', OH: '#f87171' }[this.type] },
      get isCation() { return this.type === 'Na' || this.type === 'H' },
      r: 13,
    })
  }
  return { ions, h2Bubbles: [], cl2Bubbles: [], electrons: [0, 0.33, 0.66].map(p => ({ pos: p })), naohFormed: 0 }
}

export default function BrineSim() {
  const canvasRef = useRef(null)
  const stateRef = useRef(null)
  const animRef = useRef(null)
  const runRef = useRef(false)
  const [voltage, setVoltage] = useState(6)
  const [concentration, setConc] = useState(80) // high = Cl2 at anode, low = O2
  const [running, setRunning] = useState(false)

  if (!stateRef.current) stateRef.current = initState()

  const anodeProduct = concentration > 40 ? 'Cl₂' : 'O₂'

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
        // Na⁺ not discharged, H⁺/H₂O → H₂
        s.h2Bubbles.push({ x: CATHODE_X + (Math.random() - 0.5) * 10, y: ELEC_BOT - 15, r: 5, alpha: 0.8 })
        s.naohFormed++
        respawn(ion)
      }
      if (!ion.isCation && ion.x < ANODE_X + 18) {
        if (concentration > 40) {
          s.cl2Bubbles.push({ x: ANODE_X + (Math.random() - 0.5) * 10, y: ELEC_BOT - 15, r: 5, alpha: 0.8 })
        } else {
          s.h2Bubbles.push({ x: ANODE_X + (Math.random() - 0.5) * 10, y: ELEC_BOT - 15, r: 5, alpha: 0.8 })
        }
        respawn(ion)
      }
    })
    const decay = b => { b.y -= 0.7; b.alpha -= 0.006 }
    s.h2Bubbles.forEach(decay); s.cl2Bubbles.forEach(decay)
    s.h2Bubbles = s.h2Bubbles.filter(b => b.alpha > 0.05 && b.y > BK.y)
    s.cl2Bubbles = s.cl2Bubbles.filter(b => b.alpha > 0.05 && b.y > BK.y)
  }, [voltage, concentration])

  const draw = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d')
    const s = stateRef.current
    ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, W, H)
    drawBat(ctx); drawWires(ctx)
    if (running) {
      s.electrons.forEach(e => {
        const pt = ePath(e.pos)
        ctx.beginPath(); ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2); ctx.fillStyle = '#facc15'; ctx.fill()
      })
    }
    // Solution color
    const clAlpha = (concentration / 100) * 0.08
    ctx.fillStyle = `rgba(167,243,208,${clAlpha + 0.03})`
    ctx.fillRect(BK.x + 4, BK.y + 4, BK.w - 8, BK.h - 8)
    drawBeaker(ctx)

    // NaOH region (near cathode, as OH- builds up)
    if (s.naohFormed > 20) {
      ctx.fillStyle = `rgba(239,68,68,${Math.min(s.naohFormed / 800, 0.08)})`
      ctx.fillRect(CATHODE_X - 80, BK.y + 4, 80, BK.h - 8)
    }

    // Electrodes
    ctx.fillStyle = '#1e3a5f'; ctx.fillRect(ANODE_X - 7, ELEC_TOP, 14, ELEC_BOT - ELEC_TOP)
    ctx.fillStyle = '#1e3a5f'; ctx.fillRect(CATHODE_X - 7, ELEC_TOP, 14, ELEC_BOT - ELEC_TOP)
    lbl(ctx, 'Anode (+)', ANODE_X, ELEC_TOP - 10, '#e2e8f0')
    lbl(ctx, 'Cathode (−)', CATHODE_X, ELEC_TOP - 10, '#e2e8f0')

    // Ions
    s.ions.forEach(ion => {
      ctx.beginPath(); ctx.arc(ion.x, ion.y, ion.r, 0, Math.PI * 2)
      ctx.fillStyle = ion.color; ctx.globalAlpha = 0.85; ctx.fill()
      ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1; ctx.stroke(); ctx.globalAlpha = 1
      ctx.fillStyle = '#fff'; ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText(ion.symbol, ion.x, ion.y); ctx.textBaseline = 'alphabetic'
    })

    // H₂ bubbles (cathode)
    s.h2Bubbles.forEach(b => bubble(ctx, b, '#bfdbfe'))
    // Cl₂ / O₂ bubbles (anode)
    s.cl2Bubbles.forEach(b => bubble(ctx, b, concentration > 40 ? '#bbf7d0' : '#f0f9ff'))

    // Gas labels above beaker
    const cathodeGas = 'H₂ (colourless)'
    const anodeGas = concentration > 40 ? 'Cl₂ (yellow-green)' : 'O₂ (colourless)'
    lbl(ctx, anodeGas, ANODE_X, BK.y - 10, concentration > 40 ? '#4ade80' : '#93c5fd', 11)
    lbl(ctx, cathodeGas, CATHODE_X, BK.y - 10, '#93c5fd', 11)

    lbl(ctx, 'NaCl(aq) Brine', BAT_CX, BK.y + BK.h + 18, '#9ca3af', 13)
    lbl(ctx, `[NaCl]: ${concentration}% — ${concentration > 40 ? 'Cl₂ at anode' : 'O₂ at anode (dilute)'}`, BAT_CX, BK.y + BK.h + 34, '#64748b', 11)
    lbl(ctx, '2H₂O + 2e⁻ → H₂ + 2OH⁻', CATHODE_X, BK.y + BK.h + 50, '#60a5fa', 10)
    const anodeRxn = concentration > 40 ? '2Cl⁻ → Cl₂ + 2e⁻' : '2H₂O → O₂ + 4H⁺ + 4e⁻'
    lbl(ctx, anodeRxn, ANODE_X, BK.y + BK.h + 50, '#34d399', 10)
  }, [voltage, concentration, running])

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
          <label className="text-xs text-gray-400 block mb-2">Voltage: <span className="text-blue-400 font-bold">{voltage} V</span></label>
          <input type="range" min={2} max={15} value={voltage} onChange={e => setVoltage(+e.target.value)} className="control-slider" />
        </div>
        <div className="card">
          <label className="text-xs text-gray-400 block mb-2">NaCl Concentration: <span className={`font-bold ${concentration > 40 ? 'text-green-400' : 'text-blue-400'}`}>{concentration}%</span>
            <span className="text-gray-600 ml-1">{concentration > 40 ? '(concentrated → Cl₂)' : '(dilute → O₂)'}</span>
          </label>
          <input type="range" min={5} max={100} value={concentration} onChange={e => setConc(+e.target.value)} className="control-slider" />
        </div>
        <div className="card flex gap-3 items-center justify-center">
          <button onClick={() => setRunning(r => !r)} className={`px-4 py-2 rounded-lg font-semibold text-sm ${running ? 'bg-red-800 hover:bg-red-700' : 'bg-green-700 hover:bg-green-600'} text-white`}>
            {running ? '⏸ Pause' : '▶ Start'}
          </button>
          <button onClick={reset} className="px-4 py-2 rounded-lg font-semibold text-sm bg-gray-700 hover:bg-gray-600 text-white">↺ Reset</button>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="card border-green-800/40">
          <p className="text-green-400 font-semibold mb-1">Anode (+) — {anodeProduct}</p>
          <p className="font-mono text-xs text-gray-300 bg-gray-800 rounded p-2">
            {concentration > 40 ? '2Cl⁻(aq) → Cl₂(g) + 2e⁻' : '2H₂O(l) → O₂(g) + 4H⁺(aq) + 4e⁻'}
          </p>
        </div>
        <div className="card border-blue-800/40">
          <p className="text-blue-400 font-semibold mb-1">Cathode (−) — H₂</p>
          <p className="font-mono text-xs text-gray-300 bg-gray-800 rounded p-2">2H₂O(l) + 2e⁻ → H₂(g) + 2OH⁻(aq)</p>
          <p className="text-gray-500 text-xs mt-1">NaOH remains in solution</p>
        </div>
      </div>
    </div>
  )
}

function ePath(t) {
  const s1 = ELEC_TOP - (BAT_Y + 13), s2 = CATHODE_X - ANODE_X, s3 = ELEC_TOP - (BAT_Y + 13)
  const total = s1 + s2 + s3, d = t * total
  if (d < s1) return { x: ANODE_X, y: ELEC_TOP - d }
  if (d < s1 + s2) return { x: ANODE_X + (d - s1), y: BAT_Y + 13 }
  return { x: CATHODE_X, y: BAT_Y + 13 + (d - s1 - s2) }
}
function respawn(ion) { ion.x = 130 + Math.random() * 440; ion.y = 150 + Math.random() * 200 }
function bubble(ctx, b, color) {
  ctx.globalAlpha = b.alpha; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2)
  ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.stroke(); ctx.globalAlpha = 0.1; ctx.fillStyle = color; ctx.fill(); ctx.globalAlpha = 1
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
