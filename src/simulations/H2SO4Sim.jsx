import React, { useRef, useEffect, useState, useCallback } from 'react'

// Hoffman voltameter: U-tube with H2 at cathode, O2 at anode, 2:1 volume ratio
const W = 700, H = 460
const BAT_CX = 350, BAT_Y = 20

// Left tube (cathode - H2) and right tube (anode - O2)
const LT = { x: 160, tubeW: 60, y: 80, h: 300 } // left = cathode
const RT = { x: 480, tubeW: 60, y: 80, h: 300 }  // right = anode
const BOTTOM = { x: 160, y: 360, w: 380 }          // connecting bottom

export default function H2SO4Sim() {
  const canvasRef = useRef(null)
  const stateRef = useRef({ h2Vol: 0, o2Vol: 0, ions: initIons(), bubbles: [], electrons: [0, 0.33, 0.66].map(p => ({ pos: p })), time: 0 })
  const animRef = useRef(null)
  const runRef = useRef(false)
  const [voltage, setVoltage] = useState(6)
  const [running, setRunning] = useState(false)

  const update = useCallback(() => {
    const s = stateRef.current
    const spd = voltage / 6
    s.time++
    s.electrons.forEach(e => { e.pos = (e.pos + spd * 0.005) % 1 })

    // Produce gas every N frames
    if (s.time % Math.max(1, Math.round(8 / spd)) === 0) {
      // H₂ at cathode (left): 2 units per tick
      s.h2Vol = Math.min(s.h2Vol + 2, 100)
      // O₂ at anode (right): 1 unit per tick
      s.o2Vol = Math.min(s.o2Vol + 1, 100)
      s.bubbles.push({ tube: 'L', x: LT.x + LT.tubeW / 2 + (Math.random() - 0.5) * 15, y: LT.y + LT.h - 30, r: 4 + Math.random() * 3, alpha: 0.8 })
      s.bubbles.push({ tube: 'L', x: LT.x + LT.tubeW / 2 + (Math.random() - 0.5) * 15, y: LT.y + LT.h - 30, r: 4 + Math.random() * 3, alpha: 0.8 })
      s.bubbles.push({ tube: 'R', x: RT.x + RT.tubeW / 2 + (Math.random() - 0.5) * 15, y: RT.y + RT.h - 30, r: 4 + Math.random() * 3, alpha: 0.8 })
    }

    s.ions.forEach(ion => {
      const targetX = ion.isCation ? LT.x + LT.tubeW / 2 : RT.x + RT.tubeW / 2
      ion.x += (targetX - ion.x) * 0.008 * spd + (Math.random() - 0.5) * 0.5
      ion.y += (Math.random() - 0.5)
      const minY = BOTTOM.y - 30, maxY = BOTTOM.y + 40
      ion.y = Math.max(minY, Math.min(maxY, ion.y))
    })

    s.bubbles.forEach(b => { b.y -= 0.8 + Math.random() * 0.3; b.alpha -= 0.007 })
    s.bubbles = s.bubbles.filter(b => b.alpha > 0.05 && b.y > (b.tube === 'L' ? LT.y : RT.y))
  }, [voltage])

  const draw = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d')
    const s = stateRef.current
    ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, W, H)

    drawBat(ctx); drawWires(ctx)

    // Electron dots
    if (running) {
      s.electrons.forEach(e => {
        const pt = ePath(e.pos)
        ctx.beginPath(); ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2); ctx.fillStyle = '#facc15'; ctx.fill()
      })
    }

    // U-tube apparatus
    const solutionColor = 'rgba(100,149,237,0.18)'
    // Left tube (cathode)
    drawTube(ctx, LT.x, LT.y, LT.tubeW, LT.h, solutionColor, s.h2Vol)
    // Right tube (anode)
    drawTube(ctx, RT.x, RT.y, RT.tubeW, RT.h, solutionColor, s.o2Vol)
    // Bottom connector
    ctx.fillStyle = solutionColor
    ctx.fillRect(BOTTOM.x + LT.tubeW, BOTTOM.y, BOTTOM.w - LT.tubeW - RT.tubeW, 50)
    ctx.strokeStyle = '#6b7280'; ctx.lineWidth = 3
    ctx.strokeRect(BOTTOM.x + LT.tubeW - 1, BOTTOM.y, BOTTOM.w - LT.tubeW - RT.tubeW + 2, 50)

    // Gas pockets (top of each tube)
    // H₂ pocket (left)
    const h2H = (s.h2Vol / 100) * (LT.h - 40)
    if (h2H > 0) {
      ctx.fillStyle = 'rgba(147,197,253,0.25)'
      ctx.fillRect(LT.x + 3, LT.y + 3, LT.tubeW - 6, h2H)
      lbl(ctx, 'H₂', LT.x + LT.tubeW / 2, LT.y + h2H / 2 + 5, '#93c5fd', 13)
    }
    // O₂ pocket (right)
    const o2H = (s.o2Vol / 100) * (RT.h - 40)
    if (o2H > 0) {
      ctx.fillStyle = 'rgba(253,186,116,0.2)'
      ctx.fillRect(RT.x + 3, RT.y + 3, RT.tubeW - 6, o2H)
      lbl(ctx, 'O₂', RT.x + RT.tubeW / 2, RT.y + o2H / 2 + 5, '#fb923c', 13)
    }

    // Electrodes
    const midL = LT.x + LT.tubeW / 2
    const midR = RT.x + RT.tubeW / 2
    ctx.fillStyle = '#374151'; ctx.fillRect(midL - 5, LT.y + LT.h - 50, 10, 40)
    ctx.fillStyle = '#374151'; ctx.fillRect(midR - 5, RT.y + RT.h - 50, 10, 40)
    lbl(ctx, 'Cathode (−)', midL, LT.y + LT.h + 15, '#e2e8f0')
    lbl(ctx, 'Anode (+)', midR, RT.y + RT.h + 15, '#e2e8f0')

    // Ions in bottom tube
    s.ions.forEach(ion => {
      ctx.beginPath(); ctx.arc(ion.x, ion.y, 11, 0, Math.PI * 2)
      ctx.fillStyle = ion.color; ctx.globalAlpha = 0.8; ctx.fill(); ctx.globalAlpha = 1
      ctx.fillStyle = '#fff'; ctx.font = 'bold 8px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText(ion.symbol, ion.x, ion.y); ctx.textBaseline = 'alphabetic'
    })

    // Bubbles
    s.bubbles.forEach(b => {
      ctx.globalAlpha = b.alpha; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2)
      const col = b.tube === 'L' ? '#93c5fd' : '#fb923c'
      ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.stroke()
      ctx.globalAlpha = 0.1; ctx.fillStyle = col; ctx.fill(); ctx.globalAlpha = 1
    })

    // Volume ratio indicator
    const ratio = s.o2Vol > 0 ? (s.h2Vol / s.o2Vol).toFixed(1) : '—'
    lbl(ctx, `H₂:O₂ volume ratio = ${ratio} : 1`, BAT_CX, H - 40, '#9ca3af', 12)
    lbl(ctx, 'Theoretical ratio = 2 : 1', BAT_CX, H - 22, '#6b7280', 11)
    lbl(ctx, `Voltage: ${voltage}V  |  Electrolyte: Dilute H₂SO₄(aq)`, BAT_CX, H - 6, '#6b7280', 10)

    // Reactions
    lbl(ctx, '2H⁺ + 2e⁻ → H₂', midL, LT.y + LT.h + 30, '#60a5fa', 10)
    lbl(ctx, '2H₂O → O₂ + 4H⁺ + 4e⁻', midR, RT.y + RT.h + 30, '#fb923c', 10)
  }, [voltage, running])

  useEffect(() => {
    const loop = () => { if (runRef.current) update(); draw(); animRef.current = requestAnimationFrame(loop) }
    animRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animRef.current)
  }, [draw, update])

  useEffect(() => { runRef.current = running }, [running])

  const reset = () => {
    stateRef.current = { h2Vol: 0, o2Vol: 0, ions: initIons(), bubbles: [], electrons: [0, 0.33, 0.66].map(p => ({ pos: p })), time: 0 }
    setRunning(false); runRef.current = false
  }

  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} className="sim-canvas" />
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card">
          <label className="text-xs text-gray-400 block mb-2">Voltage: <span className="text-blue-400 font-bold">{voltage} V</span></label>
          <input type="range" min={2} max={15} value={voltage} onChange={e => setVoltage(+e.target.value)} className="control-slider" />
        </div>
        <div className="card flex gap-3 items-center justify-center">
          <button onClick={() => setRunning(r => !r)} className={`px-4 py-2 rounded-lg font-semibold text-sm ${running ? 'bg-red-800 hover:bg-red-700' : 'bg-green-700 hover:bg-green-600'} text-white`}>
            {running ? '⏸ Pause' : '▶ Start'}
          </button>
          <button onClick={reset} className="px-4 py-2 rounded-lg font-semibold text-sm bg-gray-700 hover:bg-gray-600 text-white">↺ Reset</button>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="card border-blue-800/40">
          <p className="text-blue-400 font-semibold mb-1">Cathode (−) — H₂ gas</p>
          <p className="font-mono text-xs text-gray-300 bg-gray-800 rounded p-2">2H⁺(aq) + 2e⁻ → H₂(g)</p>
        </div>
        <div className="card border-orange-800/40">
          <p className="text-orange-400 font-semibold mb-1">Anode (+) — O₂ gas</p>
          <p className="font-mono text-xs text-gray-300 bg-gray-800 rounded p-2">2H₂O(l) → O₂(g) + 4H⁺(aq) + 4e⁻</p>
          <p className="text-gray-500 text-xs mt-1">Volume H₂ : O₂ = 2 : 1</p>
        </div>
      </div>
    </div>
  )
}

function initIons() {
  const ions = []
  for (let i = 0; i < 16; i++) {
    const isCation = i < 8
    ions.push({
      x: BOTTOM.x + LT.tubeW + Math.random() * (BOTTOM.w - LT.tubeW - RT.tubeW),
      y: BOTTOM.y + 10 + Math.random() * 30,
      symbol: isCation ? 'H⁺' : 'SO₄²⁻',
      color: isCation ? '#60a5fa' : '#818cf8',
      isCation,
    })
  }
  return ions
}

function drawTube(ctx, x, y, w, h, solColor, gasVol) {
  const solH = h - (gasVol / 100) * (h - 40) - 10
  ctx.fillStyle = solColor; ctx.fillRect(x + 3, y + (h - solH), w - 6, solH)
  ctx.strokeStyle = '#6b7280'; ctx.lineWidth = 3
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + h); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(x + w, y); ctx.lineTo(x + w, y + h); ctx.stroke()
  ctx.beginPath(); ctx.roundRect(x - 5, y - 5, w + 10, 15, 5); ctx.strokeStyle = '#9ca3af'; ctx.stroke()
}

function drawBat(ctx) {
  ctx.fillStyle = '#1e293b'; ctx.beginPath(); ctx.roundRect(BAT_CX - 90, BAT_Y, 180, 26, 5); ctx.fill()
  ctx.strokeStyle = '#475569'; ctx.lineWidth = 1.5; ctx.stroke()
  ctx.font = 'bold 13px monospace'; ctx.textAlign = 'left'; ctx.fillStyle = '#ef4444'; ctx.fillText('+', BAT_CX - 82, BAT_Y + 17)
  ctx.textAlign = 'right'; ctx.fillStyle = '#60a5fa'; ctx.fillText('−', BAT_CX + 82, BAT_Y + 17)
  ctx.textAlign = 'center'; ctx.fillStyle = '#64748b'; ctx.font = '10px sans-serif'; ctx.fillText('DC Power Supply', BAT_CX, BAT_Y + 17)
}

function drawWires(ctx) {
  const cathX = LT.x + LT.tubeW / 2
  const anodX = RT.x + RT.tubeW / 2
  ctx.strokeStyle = '#475569'; ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(BAT_CX - 90, BAT_Y + 13); ctx.lineTo(anodX, BAT_Y + 13); ctx.lineTo(anodX, LT.y + LT.h - 30); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(BAT_CX + 90, BAT_Y + 13); ctx.lineTo(cathX, BAT_Y + 13); ctx.lineTo(cathX, LT.y + LT.h - 30); ctx.stroke()
}

function ePath(t) {
  const cathX = LT.x + LT.tubeW / 2, anodX = RT.x + RT.tubeW / 2
  const elecTop = LT.y + LT.h - 30
  const s1 = elecTop - (BAT_Y + 13), s2 = anodX - cathX, s3 = elecTop - (BAT_Y + 13)
  const total = s1 + s2 + s3, d = t * total
  if (d < s1) return { x: anodX, y: elecTop - d }
  if (d < s1 + s2) return { x: anodX - (d - s1), y: BAT_Y + 13 }
  return { x: cathX, y: BAT_Y + 13 + (d - s1 - s2) }
}

function lbl(ctx, text, x, y, color = '#9ca3af', size = 12) {
  ctx.fillStyle = color; ctx.font = `${size}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText(text, x, y)
}
