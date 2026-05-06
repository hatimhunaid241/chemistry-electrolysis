import React, { useRef, useEffect, useState, useCallback } from 'react'

const W = 700, H = 440
const BEAKER = { x: 80, y: 120, w: 540, h: 270 }
const ANODE_X = 210, CATHODE_X = 490
const ELEC_TOP = 90, ELEC_BOT = 350
const WIRE_Y = 48
const BAT_CX = 350, BAT_Y = 20, BAT_W = 180

function initState() {
  const ions = []
  for (let i = 0; i < 24; i++) {
    const isCation = i < 12
    ions.push({
      x: 120 + Math.random() * 460,
      y: 150 + Math.random() * 210,
      symbol: isCation ? 'Pb²⁺' : 'Br⁻',
      color: isCation ? '#f97316' : '#60a5fa',
      isCation,
      r: 14,
      discharged: false,
      alpha: 1,
    })
  }
  return {
    ions,
    bubbles: [],
    deposits: 0,
    electrons: [0, 0.33, 0.66].map(p => ({ pos: p })),
  }
}

export default function MoltenPbBr2Sim() {
  const canvasRef = useRef(null)
  const stateRef = useRef(initState())
  const animRef = useRef(null)
  const runningRef = useRef(false)

  const [voltage, setVoltage] = useState(6)
  const [running, setRunning] = useState(false)
  const [temp, setTemp] = useState(500)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const s = stateRef.current
    const speed = (voltage / 6) * (temp / 500) * 0.8

    // Background
    ctx.fillStyle = '#0f172a'
    ctx.fillRect(0, 0, W, H)

    // Battery
    drawBattery(ctx)

    // Wires
    drawWires(ctx)

    // Electrons on wire
    if (running) {
      s.electrons.forEach(e => {
        const pt = electronPos(e.pos)
        ctx.beginPath()
        ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2)
        ctx.fillStyle = '#facc15'
        ctx.fill()
      })
    }

    // Electrode arrow labels
    arrowLabel(ctx, ANODE_X - 70, WIRE_Y + 14, '→ e⁻', '#facc15')

    // Beaker solution
    ctx.fillStyle = 'rgba(250,140,70,0.12)'
    ctx.fillRect(BEAKER.x + 4, BEAKER.y + 4, BEAKER.w - 8, BEAKER.h - 8)
    drawBeakerOutline(ctx)

    // Electrodes
    drawElectrode(ctx, ANODE_X, 'Anode (+)', '#b45309')
    drawElectrode(ctx, CATHODE_X, 'Cathode (−)', '#4b5563')

    // Lead deposit at cathode
    if (s.deposits > 0) {
      const dH = Math.min(s.deposits * 3, 80)
      ctx.fillStyle = '#94a3b8'
      ctx.fillRect(CATHODE_X - 8, ELEC_BOT - dH, 16, dH)
      label(ctx, 'Pb(l)', CATHODE_X + 32, ELEC_BOT - dH / 2, '#94a3b8')
    }

    // Ions
    s.ions.forEach(ion => {
      if (ion.discharged) return
      ctx.globalAlpha = ion.alpha
      ctx.beginPath()
      ctx.arc(ion.x, ion.y, ion.r, 0, Math.PI * 2)
      ctx.fillStyle = ion.color
      ctx.fill()
      ctx.strokeStyle = 'rgba(255,255,255,0.2)'
      ctx.lineWidth = 1
      ctx.stroke()
      ctx.globalAlpha = 1
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 9px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(ion.symbol, ion.x, ion.y)
      ctx.textBaseline = 'alphabetic'
    })

    // Bubbles (Br₂ at anode)
    s.bubbles.forEach(b => {
      ctx.globalAlpha = b.alpha
      ctx.beginPath()
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2)
      ctx.strokeStyle = '#a78bfa'
      ctx.lineWidth = 1.5
      ctx.stroke()
      ctx.fillStyle = 'rgba(167,139,250,0.15)'
      ctx.fill()
      ctx.globalAlpha = 1
    })

    // Labels
    label(ctx, 'Molten PbBr₂', BAT_CX, BEAKER.y + BEAKER.h + 20, '#9ca3af', 13)
    label(ctx, `Voltage: ${voltage}V`, 90, H - 15, '#6b7280', 11)
    label(ctx, `Temp: ${temp}°C`, BAT_CX, H - 15, '#6b7280', 11)

    // Reaction labels
    label(ctx, '2Br⁻ → Br₂ + 2e⁻', ANODE_X, BEAKER.y + BEAKER.h + 38, '#a78bfa', 11)
    label(ctx, 'Pb²⁺ + 2e⁻ → Pb', CATHODE_X, BEAKER.y + BEAKER.h + 38, '#94a3b8', 11)
  }, [voltage, running, temp])

  const update = useCallback(() => {
    const s = stateRef.current
    const speed = (voltage / 6) * (temp / 500) * 0.9

    s.electrons.forEach(e => {
      e.pos = (e.pos + speed * 0.004) % 1
    })

    s.ions.forEach(ion => {
      if (ion.discharged) return
      const target = ion.isCation ? CATHODE_X : ANODE_X
      const dx = target - ion.x
      ion.x += dx * 0.012 * speed + (Math.random() - 0.5) * 0.5
      ion.y += (Math.random() - 0.5) * 0.8

      // Clamp to beaker
      ion.y = Math.max(BEAKER.y + ion.r + 5, Math.min(BEAKER.y + BEAKER.h - ion.r - 5, ion.y))

      // Discharge check
      if (ion.isCation && ion.x > CATHODE_X - 20) {
        ion.discharged = true
        s.deposits++
        respawnIon(ion)
      }
      if (!ion.isCation && ion.x < ANODE_X + 20) {
        ion.discharged = true
        s.bubbles.push({ x: ANODE_X + (Math.random() - 0.5) * 12, y: ELEC_BOT - 20, r: 5 + Math.random() * 4, alpha: 0.8 })
        respawnIon(ion)
      }
    })

    s.bubbles.forEach(b => {
      b.y -= 0.6 + Math.random() * 0.3
      b.r += 0.05
      b.alpha -= 0.005
    })
    s.bubbles = s.bubbles.filter(b => b.alpha > 0.05 && b.y > BEAKER.y)
  }, [voltage, temp])

  function respawnIon(ion) {
    ion.x = 120 + Math.random() * 460
    ion.y = 150 + Math.random() * 210
    ion.discharged = false
  }

  function electronPos(t) {
    // wire path: anode top → left → battery top → right → cathode top
    const seg1 = ELEC_TOP - WIRE_Y   // anode up to wire
    const seg2 = CATHODE_X - ANODE_X // across
    const seg3 = ELEC_TOP - WIRE_Y   // cathode down
    const total = seg1 + seg2 + seg3
    const d = t * total
    if (d < seg1) return { x: ANODE_X, y: ELEC_TOP - d }
    if (d < seg1 + seg2) return { x: ANODE_X + (d - seg1), y: WIRE_Y }
    return { x: CATHODE_X, y: WIRE_Y + (d - seg1 - seg2) }
  }

  useEffect(() => {
    const loop = () => {
      if (runningRef.current) update()
      draw()
      animRef.current = requestAnimationFrame(loop)
    }
    animRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animRef.current)
  }, [draw, update])

  useEffect(() => { runningRef.current = running }, [running])

  const reset = () => {
    stateRef.current = initState()
    setRunning(false)
    runningRef.current = false
  }

  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} className="sim-canvas" />
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card">
          <label className="text-xs text-gray-400 block mb-2">Voltage: <span className="text-blue-400 font-bold">{voltage} V</span></label>
          <input type="range" min={2} max={12} value={voltage} onChange={e => setVoltage(+e.target.value)} className="control-slider" />
        </div>
        <div className="card">
          <label className="text-xs text-gray-400 block mb-2">Temperature: <span className="text-orange-400 font-bold">{temp}°C</span></label>
          <input type="range" min={400} max={900} value={temp} onChange={e => setTemp(+e.target.value)} className="control-slider" />
        </div>
        <div className="card flex gap-3 items-center justify-center">
          <button onClick={() => setRunning(r => !r)} className={`px-4 py-2 rounded-lg font-semibold text-sm ${running ? 'bg-red-800 hover:bg-red-700' : 'bg-green-700 hover:bg-green-600'} text-white`}>
            {running ? '⏸ Pause' : '▶ Start'}
          </button>
          <button onClick={reset} className="px-4 py-2 rounded-lg font-semibold text-sm bg-gray-700 hover:bg-gray-600 text-white">↺ Reset</button>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="card border-amber-800/40">
          <p className="text-amber-400 font-semibold mb-1">Anode (+) — Oxidation</p>
          <p className="font-mono text-xs text-gray-300 bg-gray-800 rounded p-2">2Br⁻(l) → Br₂(g) + 2e⁻</p>
          <p className="text-gray-500 text-xs mt-1">Brown/purple Br₂ vapour forms</p>
        </div>
        <div className="card border-slate-600/40">
          <p className="text-slate-400 font-semibold mb-1">Cathode (−) — Reduction</p>
          <p className="font-mono text-xs text-gray-300 bg-gray-800 rounded p-2">Pb²⁺(l) + 2e⁻ → Pb(l)</p>
          <p className="text-gray-500 text-xs mt-1">Grey liquid lead metal forms</p>
        </div>
      </div>
    </div>
  )
}

function drawBattery(ctx) {
  ctx.fillStyle = '#1e293b'
  ctx.beginPath(); ctx.roundRect(BAT_CX - 90, BAT_Y, 180, 26, 5); ctx.fill()
  ctx.strokeStyle = '#475569'; ctx.lineWidth = 1.5; ctx.stroke()
  ctx.font = 'bold 13px monospace'
  ctx.textAlign = 'left'; ctx.fillStyle = '#ef4444'; ctx.fillText('+', BAT_CX - 82, BAT_Y + 17)
  ctx.textAlign = 'right'; ctx.fillStyle = '#60a5fa'; ctx.fillText('−', BAT_CX + 82, BAT_Y + 17)
  ctx.textAlign = 'center'; ctx.fillStyle = '#64748b'; ctx.font = '10px sans-serif'
  ctx.fillText('DC Power Supply', BAT_CX, BAT_Y + 17)
}

function drawWires(ctx) {
  ctx.strokeStyle = '#475569'; ctx.lineWidth = 2; ctx.setLineDash([])
  ctx.beginPath()
  ctx.moveTo(BAT_CX - 90, BAT_Y + 13)
  ctx.lineTo(ANODE_X, BAT_Y + 13)
  ctx.lineTo(ANODE_X, ELEC_TOP)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(BAT_CX + 90, BAT_Y + 13)
  ctx.lineTo(CATHODE_X, BAT_Y + 13)
  ctx.lineTo(CATHODE_X, ELEC_TOP)
  ctx.stroke()
}

function drawBeakerOutline(ctx) {
  ctx.beginPath()
  ctx.moveTo(BEAKER.x + 10, BEAKER.y)
  ctx.lineTo(BEAKER.x + 10, BEAKER.y + BEAKER.h)
  ctx.lineTo(BEAKER.x + BEAKER.w - 10, BEAKER.y + BEAKER.h)
  ctx.lineTo(BEAKER.x + BEAKER.w - 10, BEAKER.y)
  ctx.strokeStyle = '#6b7280'; ctx.lineWidth = 3; ctx.stroke()
  ctx.beginPath(); ctx.moveTo(BEAKER.x, BEAKER.y); ctx.lineTo(BEAKER.x + BEAKER.w, BEAKER.y)
  ctx.stroke()
}

function drawElectrode(ctx, x, lbl, color) {
  ctx.fillStyle = color
  ctx.fillRect(x - 7, ELEC_TOP, 14, ELEC_BOT - ELEC_TOP)
  ctx.fillStyle = '#e2e8f0'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'
  ctx.fillText(lbl, x, ELEC_TOP - 10)
}

function arrowLabel(ctx, x, y, text, color) {
  ctx.fillStyle = color; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center'
  ctx.fillText(text, x + 60, y)
}

function label(ctx, text, x, y, color, size) {
  ctx.fillStyle = color; ctx.font = `${size}px sans-serif`; ctx.textAlign = 'center'
  ctx.fillText(text, x, y)
}
