import React, { useRef, useEffect, useState, useCallback } from 'react'

const W = 700, H = 460
const BAT_CX = 350, BAT_Y = 30

// Left chamber (anode/fuel): H2 supply
const LA = { x: 60, y: 110, w: 200, h: 280 }
// Right chamber (cathode/air): O2 supply
const RC = { x: 440, y: 110, w: 200, h: 280 }
// Membrane
const MEM = { x: 285, y: 110, w: 130, h: 280 }
const ANODE_X = 180, CATHODE_X = 520
const ELEC_TOP = 115, ELEC_BOT = 375

const ELECTROLYTES = [
  { id: 'alkaline', name: 'Alkaline (KOH)', anodeRxn: 'H₂ + 2OH⁻ → 2H₂O + 2e⁻', cathodeRxn: 'O₂ + 2H₂O + 4e⁻ → 4OH⁻', memLabel: 'OH⁻ migrates →', color: '#d1fae5' },
  { id: 'acidic', name: 'Acidic (H₂SO₄/PEM)', anodeRxn: 'H₂ → 2H⁺ + 2e⁻', cathodeRxn: 'O₂ + 4H⁺ + 4e⁻ → 2H₂O', memLabel: '← H⁺ migrates', color: '#fce7f3' },
]

function initState() {
  const h2Mols = [], o2Mols = [], ions = []
  for (let i = 0; i < 12; i++) {
    h2Mols.push({ x: LA.x + 20 + Math.random() * (LA.w - 40), y: LA.y + 20 + Math.random() * (LA.h - 40), vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5 })
    o2Mols.push({ x: RC.x + 20 + Math.random() * (RC.w - 40), y: RC.y + 20 + Math.random() * (RC.h - 40), vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5 })
  }
  for (let i = 0; i < 10; i++) {
    ions.push({ x: MEM.x + 10 + Math.random() * (MEM.w - 20), y: MEM.y + 20 + Math.random() * (MEM.h - 40), dir: Math.random() > 0.5 ? 1 : -1 })
  }
  return { h2Mols, o2Mols, ions, electrons: [0, 0.33, 0.66].map(p => ({ pos: p })), h2oBubbles: [], power: 0 }
}

export default function FuelCellSim() {
  const canvasRef = useRef(null)
  const stateRef = useRef(initState())
  const animRef = useRef(null)
  const runRef = useRef(false)
  const [electrolyte, setElectrolyte] = useState(ELECTROLYTES[0])
  const [running, setRunning] = useState(false)
  const [load, setLoad] = useState(50)

  const update = useCallback(() => {
    const s = stateRef.current
    const spd = load / 50

    s.electrons.forEach(e => { e.pos = (e.pos + spd * 0.004) % 1 })

    // H2 molecules bounce around anode chamber
    s.h2Mols.forEach(m => {
      m.x += m.vx; m.y += m.vy
      if (m.x < LA.x + 10 || m.x > LA.x + LA.w - 10) m.vx *= -1
      if (m.y < LA.y + 10 || m.y > LA.y + LA.h - 10) m.vy *= -1
      // React at anode
      if (m.x > ANODE_X - 20) {
        m.x = LA.x + 20 + Math.random() * 60
        m.y = LA.y + 20 + Math.random() * (LA.h - 40)
        s.h2oBubbles.push({ x: RC.x + 20 + Math.random() * (RC.w - 40), y: RC.y + RC.h - 30, r: 4, alpha: 0.8, side: 'right' })
      }
    })

    // O2 molecules bounce around cathode chamber
    s.o2Mols.forEach(m => {
      m.x += m.vx; m.y += m.vy
      if (m.x < RC.x + 10 || m.x > RC.x + RC.w - 10) m.vx *= -1
      if (m.y < RC.y + 10 || m.y > RC.y + RC.h - 10) m.vy *= -1
    })

    // Membrane ions migrate
    s.ions.forEach(ion => {
      ion.x += ion.dir * 0.3 + (Math.random() - 0.5) * 0.3
      ion.y += (Math.random() - 0.5) * 0.4
      if (ion.x < MEM.x + 8) ion.dir = 1
      if (ion.x > MEM.x + MEM.w - 8) ion.dir = -1
      ion.y = Math.max(MEM.y + 10, Math.min(MEM.y + MEM.h - 10, ion.y))
    })

    s.h2oBubbles.forEach(b => { b.y -= 0.8; b.alpha -= 0.008 })
    s.h2oBubbles = s.h2oBubbles.filter(b => b.alpha > 0.05 && b.y > (b.side === 'right' ? RC.y : LA.y))
  }, [load])

  const draw = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d')
    const s = stateRef.current
    ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, W, H)

    // External circuit (load resistor / motor)
    ctx.strokeStyle = '#475569'; ctx.lineWidth = 2.5
    ctx.beginPath(); ctx.moveTo(ANODE_X, ELEC_TOP); ctx.lineTo(ANODE_X, BAT_Y + 20); ctx.lineTo(BAT_CX - 20, BAT_Y + 20); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(CATHODE_X, ELEC_TOP); ctx.lineTo(CATHODE_X, BAT_Y + 20); ctx.lineTo(BAT_CX + 20, BAT_Y + 20); ctx.stroke()

    // Load symbol (resistor)
    ctx.fillStyle = '#1e293b'; ctx.beginPath(); ctx.roundRect(BAT_CX - 20, BAT_Y + 10, 40, 20, 4); ctx.fill()
    ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 1.5; ctx.stroke()
    lbl(ctx, 'Load', BAT_CX, BAT_Y + 23, '#f59e0b', 9)
    const outputW = ((load / 100) * 40).toFixed(1)
    lbl(ctx, `${outputW}W`, BAT_CX, BAT_Y + 8, '#4ade80', 9)

    // Electrons
    if (running) {
      s.electrons.forEach(e => {
        const pt = ePath(e.pos)
        ctx.beginPath(); ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2); ctx.fillStyle = '#facc15'; ctx.fill()
      })
    }

    // Anode chamber
    ctx.fillStyle = 'rgba(252,165,165,0.08)'; ctx.fillRect(LA.x, LA.y, LA.w, LA.h)
    ctx.strokeStyle = '#6b7280'; ctx.lineWidth = 2.5
    ctx.strokeRect(LA.x, LA.y, LA.w, LA.h)
    lbl(ctx, 'Anode Chamber', LA.x + LA.w / 2, LA.y - 8, '#fca5a5', 11)
    lbl(ctx, 'H₂ fuel supply', LA.x + LA.w / 2, LA.y + LA.h + 16, '#fca5a5', 10)

    // Cathode chamber
    ctx.fillStyle = 'rgba(147,197,253,0.08)'; ctx.fillRect(RC.x, RC.y, RC.w, RC.h)
    ctx.strokeStyle = '#6b7280'; ctx.lineWidth = 2.5
    ctx.strokeRect(RC.x, RC.y, RC.w, RC.h)
    lbl(ctx, 'Cathode Chamber', RC.x + RC.w / 2, RC.y - 8, '#93c5fd', 11)
    lbl(ctx, 'O₂ / Air supply', RC.x + RC.w / 2, RC.y + RC.h + 16, '#93c5fd', 10)

    // Membrane
    ctx.fillStyle = electrolyte.id === 'alkaline' ? 'rgba(52,211,153,0.12)' : 'rgba(244,114,182,0.12)'
    ctx.fillRect(MEM.x, MEM.y, MEM.w, MEM.h)
    ctx.strokeStyle = electrolyte.id === 'alkaline' ? '#34d399' : '#f472b6'
    ctx.lineWidth = 2; ctx.strokeRect(MEM.x, MEM.y, MEM.w, MEM.h)
    lbl(ctx, 'Electrolyte', MEM.x + MEM.w / 2, MEM.y + MEM.h / 2 - 10, electrolyte.id === 'alkaline' ? '#34d399' : '#f472b6', 10)
    lbl(ctx, 'Membrane', MEM.x + MEM.w / 2, MEM.y + MEM.h / 2 + 4, electrolyte.id === 'alkaline' ? '#34d399' : '#f472b6', 10)
    lbl(ctx, electrolyte.memLabel, MEM.x + MEM.w / 2, MEM.y + MEM.h / 2 + 20, '#9ca3af', 8)

    // Electrodes
    ctx.fillStyle = '#374151'; ctx.fillRect(ANODE_X - 6, ELEC_TOP, 12, ELEC_BOT - ELEC_TOP)
    ctx.fillStyle = '#374151'; ctx.fillRect(CATHODE_X - 6, ELEC_TOP, 12, ELEC_BOT - ELEC_TOP)
    lbl(ctx, 'Anode (−)', ANODE_X, ELEC_TOP - 10, '#fca5a5', 11)
    lbl(ctx, 'Cathode (+)', CATHODE_X, ELEC_TOP - 10, '#93c5fd', 11)

    // H2 molecules (anode chamber)
    s.h2Mols.forEach(m => {
      ctx.beginPath(); ctx.arc(m.x, m.y, 9, 0, Math.PI * 2)
      ctx.fillStyle = '#fca5a5'; ctx.globalAlpha = 0.7; ctx.fill(); ctx.globalAlpha = 1
      ctx.fillStyle = '#fff'; ctx.font = 'bold 7px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText('H₂', m.x, m.y); ctx.textBaseline = 'alphabetic'
    })

    // O2 molecules (cathode chamber)
    s.o2Mols.forEach(m => {
      ctx.beginPath(); ctx.arc(m.x, m.y, 10, 0, Math.PI * 2)
      ctx.fillStyle = '#93c5fd'; ctx.globalAlpha = 0.7; ctx.fill(); ctx.globalAlpha = 1
      ctx.fillStyle = '#fff'; ctx.font = 'bold 7px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText('O₂', m.x, m.y); ctx.textBaseline = 'alphabetic'
    })

    // Membrane ions
    const ionColor = electrolyte.id === 'alkaline' ? '#34d399' : '#f472b6'
    const ionSym = electrolyte.id === 'alkaline' ? 'OH⁻' : 'H⁺'
    s.ions.forEach(ion => {
      ctx.beginPath(); ctx.arc(ion.x, ion.y, 8, 0, Math.PI * 2)
      ctx.fillStyle = ionColor; ctx.globalAlpha = 0.7; ctx.fill(); ctx.globalAlpha = 1
      ctx.fillStyle = '#fff'; ctx.font = 'bold 6px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText(ionSym, ion.x, ion.y); ctx.textBaseline = 'alphabetic'
    })

    // H₂O product bubbles
    s.h2oBubbles.forEach(b => {
      ctx.globalAlpha = b.alpha; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2)
      ctx.strokeStyle = '#bfdbfe'; ctx.lineWidth = 1.5; ctx.stroke()
      ctx.globalAlpha = 0.1; ctx.fillStyle = '#bfdbfe'; ctx.fill(); ctx.globalAlpha = 1
    })
    // H2O label
    if (electrolyte.id === 'acidic') lbl(ctx, 'H₂O forms', CATHODE_X - 30, ELEC_BOT + 12, '#bfdbfe', 10)
    if (electrolyte.id === 'alkaline') lbl(ctx, 'H₂O forms', ANODE_X + 30, ELEC_BOT + 12, '#34d399', 10)

    // Reaction equations
    lbl(ctx, electrolyte.anodeRxn, ANODE_X + LA.w / 2 - 20, LA.y + LA.h + 32, '#fca5a5', 9)
    lbl(ctx, electrolyte.cathodeRxn, RC.x + RC.w / 2, RC.y + RC.h + 32, '#93c5fd', 9)
    lbl(ctx, `Overall: 2H₂ + O₂ → 2H₂O`, W / 2, H - 24, '#9ca3af', 11)
    lbl(ctx, `EMF ≈ 1.23 V  |  Load: ${load}%  |  Efficiency ~60%`, W / 2, H - 8, '#6b7280', 10)
  }, [running, electrolyte, load])

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
          <label className="text-xs text-gray-400 block mb-2">Electrolyte Type</label>
          <div className="flex gap-2">
            {ELECTROLYTES.map(e => (
              <button key={e.id} onClick={() => { setElectrolyte(e); reset() }}
                className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${electrolyte.id === e.id ? 'bg-blue-700 border-blue-600 text-white' : 'border-gray-700 text-gray-400 hover:border-gray-500'}`}>
                {e.name}
              </button>
            ))}
          </div>
        </div>
        <div className="card">
          <label className="text-xs text-gray-400 block mb-2">Load: <span className="text-yellow-400 font-bold">{load}%</span></label>
          <input type="range" min={10} max={100} value={load} onChange={e => setLoad(+e.target.value)} className="control-slider" />
        </div>
        <div className="card flex gap-3 items-center justify-center">
          <button onClick={() => setRunning(r => !r)} className={`px-4 py-2 rounded-lg font-semibold text-sm ${running ? 'bg-red-800 hover:bg-red-700' : 'bg-green-700 hover:bg-green-600'} text-white`}>
            {running ? '⏸ Pause' : '▶ Start'}
          </button>
          <button onClick={reset} className="px-3 py-2 rounded-lg font-semibold text-sm bg-gray-700 hover:bg-gray-600 text-white">↺</button>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="card border-red-900/40">
          <p className="text-red-300 font-semibold mb-1">Anode (−) — Oxidation</p>
          <p className="font-mono text-xs text-gray-300 bg-gray-800 rounded p-2">{electrolyte.anodeRxn}</p>
        </div>
        <div className="card border-blue-900/40">
          <p className="text-blue-300 font-semibold mb-1">Cathode (+) — Reduction</p>
          <p className="font-mono text-xs text-gray-300 bg-gray-800 rounded p-2">{electrolyte.cathodeRxn}</p>
        </div>
      </div>
    </div>
  )
}

function ePath(t) {
  const s1 = ELEC_TOP - (BAT_Y + 20), s2 = (BAT_CX - 20) - ANODE_X, s3 = 40
  const s4 = CATHODE_X - (BAT_CX + 20), s5 = s1
  const total = s1 + s2 + s3 + s4 + s5, d = t * total
  if (d < s1) return { x: ANODE_X, y: ELEC_TOP - d }
  if (d < s1 + s2) return { x: ANODE_X + (d - s1), y: BAT_Y + 20 }
  if (d < s1 + s2 + s3) return { x: BAT_CX - 20 + (d - s1 - s2), y: BAT_Y + 20 }
  if (d < s1 + s2 + s3 + s4) return { x: BAT_CX + 20 + (d - s1 - s2 - s3), y: BAT_Y + 20 }
  return { x: CATHODE_X, y: BAT_Y + 20 + (d - s1 - s2 - s3 - s4) }
}

function lbl(ctx, text, x, y, color = '#9ca3af', size = 12) {
  ctx.fillStyle = color; ctx.font = `${size}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText(text, x, y)
}
