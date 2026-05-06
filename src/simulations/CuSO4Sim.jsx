import React, { useRef, useEffect, useState, useCallback } from 'react'

const W = 700, H = 440
const BK = { x: 80, y: 120, w: 540, h: 270 }
const ANODE_X = 210, CATHODE_X = 490
const ELEC_TOP = 90, ELEC_BOT = 355
const BAT_CX = 350, BAT_Y = 20

function initState(activeElectrodes) {
  const ions = []
  for (let i = 0; i < 30; i++) {
    const type = i % 3 === 0 ? 'SO4' : i % 3 === 1 ? 'Cu' : 'H'
    ions.push({
      x: 120 + Math.random() * 460,
      y: 150 + Math.random() * 200,
      symbol: type === 'Cu' ? 'Cu²⁺' : type === 'SO4' ? 'SO₄²⁻' : 'H⁺',
      color: type === 'Cu' ? '#f97316' : type === 'SO4' ? '#818cf8' : '#34d399',
      isCation: type !== 'SO4',
      type,
      r: type === 'SO4' ? 15 : 12,
    })
  }
  return { ions, bubbles: [], copperDeposit: 0, anodeMass: 100, electrons: [0, 0.33, 0.66].map(p => ({ pos: p })) }
}

export default function CuSO4Sim({ activeElectrodes = false }) {
  const canvasRef = useRef(null)
  const stateRef = useRef(null)
  const animRef = useRef(null)
  const runRef = useRef(false)
  const [voltage, setVoltage] = useState(6)
  const [concentration, setConc] = useState(50)
  const [running, setRunning] = useState(false)

  if (!stateRef.current) stateRef.current = initState(activeElectrodes)

  const update = useCallback(() => {
    const s = stateRef.current
    const spd = voltage / 6

    s.electrons.forEach(e => { e.pos = (e.pos + spd * 0.004) % 1 })

    s.ions.forEach(ion => {
      const target = ion.isCation ? CATHODE_X : ANODE_X
      ion.x += (target - ion.x) * 0.009 * spd + (Math.random() - 0.5) * 0.6
      ion.y += (Math.random() - 0.5) * 0.9
      ion.y = Math.max(BK.y + ion.r + 5, Math.min(BK.y + BK.h - ion.r - 5, ion.y))

      if (ion.isCation && ion.x > CATHODE_X - 18) {
        // Cu²⁺ deposited at cathode
        if (ion.type === 'Cu') s.copperDeposit++
        // O₂ bubble at anode (from H) — handled via anode check
        respawn(ion)
      }
      if (!ion.isCation && ion.x < ANODE_X + 18) {
        if (!activeElectrodes) {
          // Inert: water oxidised → O₂
          s.bubbles.push({ x: ANODE_X + (Math.random() - 0.5) * 10, y: ELEC_BOT - 15, r: 5, alpha: 0.8, color: '#f0f9ff' })
        } else {
          // Active Cu anode: Cu dissolves, no bubble — ion goes back to solution
          // anode mass decreases
          s.anodeMass = Math.max(0, s.anodeMass - 0.05)
        }
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

    ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, W, H)

    drawBat(ctx)
    drawWires(ctx)

    // Electrons
    if (running) {
      s.electrons.forEach(e => {
        const pt = ePath(e.pos)
        ctx.beginPath(); ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2)
        ctx.fillStyle = '#facc15'; ctx.fill()
      })
    }

    // Solution color based on Cu²⁺ concentration
    const blueness = Math.max(0.05, (concentration / 100) - (s.copperDeposit / 2000))
    ctx.fillStyle = `rgba(59,130,246,${blueness * 0.3})`
    ctx.fillRect(BK.x + 4, BK.y + 4, BK.w - 8, BK.h - 8)
    drawBeaker(ctx)

    // Electrodes
    const anodeColor = activeElectrodes ? '#b45309' : '#374151'
    ctx.fillStyle = anodeColor; ctx.fillRect(ANODE_X - 7, ELEC_TOP, 14, ELEC_BOT - ELEC_TOP)
    ctx.fillStyle = '#374151'; ctx.fillRect(CATHODE_X - 7, ELEC_TOP, 14, ELEC_BOT - ELEC_TOP)

    // Anode mass indicator (active)
    if (activeElectrodes) {
      const massFrac = s.anodeMass / 100
      ctx.fillStyle = '#92400e'
      ctx.fillRect(ANODE_X - 7, ELEC_TOP + (1 - massFrac) * (ELEC_BOT - ELEC_TOP), 14, massFrac * (ELEC_BOT - ELEC_TOP))
    }

    // Cu deposit at cathode
    if (s.copperDeposit > 0) {
      const dH = Math.min(s.copperDeposit * 0.8, 100)
      ctx.fillStyle = '#b45309'
      ctx.fillRect(CATHODE_X - 8, ELEC_BOT - dH, 16, dH)
      ctx.fillStyle = '#f97316'
      ctx.fillRect(CATHODE_X - 6, ELEC_BOT - dH, 12, dH * 0.3)
    }

    // Electrode labels
    lbl(ctx, `Anode (+)`, ANODE_X, ELEC_TOP - 10, '#e2e8f0')
    lbl(ctx, `Cathode (−)`, CATHODE_X, ELEC_TOP - 10, '#e2e8f0')
    lbl(ctx, activeElectrodes ? '(Cu)' : '(C)', ANODE_X, ELEC_TOP - 24, '#9ca3af', 10)
    lbl(ctx, activeElectrodes ? '(Cu)' : '(C)', CATHODE_X, ELEC_TOP - 24, '#9ca3af', 10)

    // Ions
    s.ions.forEach(ion => {
      ctx.beginPath(); ctx.arc(ion.x, ion.y, ion.r, 0, Math.PI * 2)
      ctx.fillStyle = ion.color; ctx.globalAlpha = 0.85; ctx.fill()
      ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1; ctx.stroke()
      ctx.globalAlpha = 1
      ctx.fillStyle = '#fff'; ctx.font = `bold ${ion.r < 13 ? 8 : 9}px sans-serif`
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText(ion.symbol, ion.x, ion.y)
      ctx.textBaseline = 'alphabetic'
    })

    // Bubbles
    s.bubbles.forEach(b => {
      ctx.globalAlpha = b.alpha
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2)
      ctx.strokeStyle = b.color; ctx.lineWidth = 1.5; ctx.stroke()
      ctx.globalAlpha = 0.1; ctx.fillStyle = b.color; ctx.fill()
      ctx.globalAlpha = 1
    })

    // Info
    lbl(ctx, 'CuSO₄(aq)', BAT_CX, BK.y + BK.h + 18, '#9ca3af', 13)
    lbl(ctx, `Voltage: ${voltage}V  |  Conc: ${concentration}%`, BAT_CX, H - 10, '#6b7280', 11)
    lbl(ctx, activeElectrodes ? 'Active Cu electrodes' : 'Inert C electrodes', BAT_CX, BK.y + BK.h + 34, '#64748b', 11)

    // Reaction labels
    const anodeRxn = activeElectrodes ? 'Cu → Cu²⁺ + 2e⁻' : '2H₂O → O₂ + 4H⁺ + 4e⁻'
    lbl(ctx, anodeRxn, ANODE_X, BK.y + BK.h + 50, '#a78bfa', 10)
    lbl(ctx, 'Cu²⁺ + 2e⁻ → Cu', CATHODE_X, BK.y + BK.h + 50, '#f97316', 10)
  }, [voltage, concentration, running, activeElectrodes])

  useEffect(() => {
    const loop = () => { if (runRef.current) update(); draw(); animRef.current = requestAnimationFrame(loop) }
    animRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animRef.current)
  }, [draw, update])

  useEffect(() => { runRef.current = running }, [running])

  const reset = () => { stateRef.current = initState(activeElectrodes); setRunning(false); runRef.current = false }

  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} className="sim-canvas" />
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card">
          <label className="text-xs text-gray-400 block mb-2">Voltage: <span className="text-blue-400 font-bold">{voltage} V</span></label>
          <input type="range" min={2} max={15} value={voltage} onChange={e => setVoltage(+e.target.value)} className="control-slider" />
        </div>
        <div className="card">
          <label className="text-xs text-gray-400 block mb-2">CuSO₄ Concentration: <span className="text-blue-400 font-bold">{concentration}%</span></label>
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
        <div className="card border-amber-800/40">
          <p className="text-amber-400 font-semibold mb-1">Anode (+) — Oxidation</p>
          <p className="font-mono text-xs text-gray-300 bg-gray-800 rounded p-2">
            {activeElectrodes ? 'Cu(s) → Cu²⁺(aq) + 2e⁻' : '2H₂O(l) → O₂(g) + 4H⁺(aq) + 4e⁻'}
          </p>
          <p className="text-gray-500 text-xs mt-1">{activeElectrodes ? 'Copper anode dissolves' : 'O₂ bubbles form'}</p>
        </div>
        <div className="card border-orange-800/40">
          <p className="text-orange-400 font-semibold mb-1">Cathode (−) — Reduction</p>
          <p className="font-mono text-xs text-gray-300 bg-gray-800 rounded p-2">Cu²⁺(aq) + 2e⁻ → Cu(s)</p>
          <p className="text-gray-500 text-xs mt-1">Reddish-brown Cu deposits</p>
        </div>
      </div>
    </div>
  )
}

function ePath(t) {
  const seg1 = ELEC_TOP - (BAT_Y + 13)
  const seg2 = CATHODE_X - ANODE_X
  const seg3 = ELEC_TOP - (BAT_Y + 13)
  const total = seg1 + seg2 + seg3
  const d = t * total
  if (d < seg1) return { x: ANODE_X, y: ELEC_TOP - d }
  if (d < seg1 + seg2) return { x: ANODE_X + (d - seg1), y: BAT_Y + 13 }
  return { x: CATHODE_X, y: BAT_Y + 13 + (d - seg1 - seg2) }
}

function respawn(ion) {
  ion.x = 130 + Math.random() * 440
  ion.y = 150 + Math.random() * 200
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
