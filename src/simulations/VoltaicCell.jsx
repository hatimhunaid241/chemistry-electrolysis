import React, { useRef, useEffect, useState, useCallback } from 'react'

const W = 700, H = 440
const BK = { x: 100, y: 130, w: 500, h: 250 }
const BAT_CX = 350, BAT_Y = 30
const ANODE_X = 220, CATHODE_X = 480
const ELEC_TOP = 100, ELEC_BOT = 345

const METAL_PAIRS = [
  { anode: 'Zn', cathode: 'Cu', anodeE: -0.76, cathodeE: 0.34, anodeColor: '#a3a3a3', cathodeColor: '#b45309', ionA: 'Zn²⁺', ionC: 'Cu²⁺', ionAcolor: '#facc15', ionCcolor: '#f97316' },
  { anode: 'Fe', cathode: 'Cu', anodeE: -0.44, cathodeE: 0.34, anodeColor: '#78716c', cathodeColor: '#b45309', ionA: 'Fe²⁺', ionC: 'Cu²⁺', ionAcolor: '#f59e0b', ionCcolor: '#f97316' },
  { anode: 'Mg', cathode: 'Cu', anodeE: -2.37, cathodeE: 0.34, anodeColor: '#d1d5db', cathodeColor: '#b45309', ionA: 'Mg²⁺', ionC: 'Cu²⁺', ionAcolor: '#e2e8f0', ionCcolor: '#f97316' },
  { anode: 'Zn', cathode: 'Ag', anodeE: -0.76, cathodeE: 0.80, anodeColor: '#a3a3a3', cathodeColor: '#e2e8f0', ionA: 'Zn²⁺', ionC: 'Ag⁺', ionAcolor: '#facc15', ionCcolor: '#d1d5db' },
  { anode: 'Cu', cathode: 'Ag', anodeE: 0.34, cathodeE: 0.80, anodeColor: '#b45309', cathodeColor: '#e2e8f0', ionA: 'Cu²⁺', ionC: 'Ag⁺', ionAcolor: '#f97316', ionCcolor: '#d1d5db' },
]

function initState(pair) {
  return {
    ions: Array.from({ length: 24 }, (_, i) => ({
      x: 140 + Math.random() * 420, y: 160 + Math.random() * 190,
      isCation: i < 12, r: 12,
    })),
    electrons: [0, 0.33, 0.66].map(p => ({ pos: p })),
    cathodeDeposit: 0,
  }
}

export default function VoltaicCellSim() {
  const canvasRef = useRef(null)
  const stateRef = useRef(null)
  const animRef = useRef(null)
  const runRef = useRef(false)
  const [pairIdx, setPairIdx] = useState(0)
  const [running, setRunning] = useState(false)

  const pair = METAL_PAIRS[pairIdx]
  const emf = (pair.cathodeE - pair.anodeE).toFixed(2)

  if (!stateRef.current) stateRef.current = initState(pair)

  const update = useCallback(() => {
    const s = stateRef.current
    s.electrons.forEach(e => { e.pos = (e.pos + 0.004) % 1 })
    s.ions.forEach(ion => {
      const target = ion.isCation ? cathodeX : anodeX
      ion.x += (target - ion.x) * 0.008 + (Math.random() - 0.5) * 0.8
      ion.y += (Math.random() - 0.5)
      ion.y = Math.max(BK.y + ion.r + 5, Math.min(BK.y + BK.h - ion.r - 5, ion.y))
      if (ion.isCation && ion.x > cathodeX - 18) {
        s.cathodeDeposit++; respawn(ion)
      }
      if (!ion.isCation && ion.x < anodeX + 18) respawn(ion)
    })
  }, [])

  const draw = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d')
    const s = stateRef.current
    ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, W, H)

    // Voltmeter + wires
    ctx.strokeStyle = '#475569'; ctx.lineWidth = 2.5
    ctx.beginPath(); ctx.moveTo(anodeX, elecTop); ctx.lineTo(anodeX, BAT_Y + 20); ctx.lineTo(BAT_CX - 22, BAT_Y + 20); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(cathodeX, elecTop); ctx.lineTo(cathodeX, BAT_Y + 20); ctx.lineTo(BAT_CX + 22, BAT_Y + 20); ctx.stroke()

    // Voltmeter
    ctx.beginPath(); ctx.arc(BAT_CX, BAT_Y + 20, 20, 0, Math.PI * 2)
    ctx.fillStyle = '#1e293b'; ctx.fill(); ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2; ctx.stroke()
    lbl(ctx, 'V', BAT_CX, BAT_Y + 18, '#94a3b8', 10)
    lbl(ctx, `${emf}V`, BAT_CX, BAT_Y + 29, '#4ade80', 9)

    // Electrons
    if (running) {
      s.electrons.forEach(e => {
        const pt = ePath(e.pos, anodeX, cathodeX, elecTop)
        ctx.beginPath(); ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2); ctx.fillStyle = '#facc15'; ctx.fill()
      })
    }

    // Solution
    ctx.fillStyle = 'rgba(100,120,200,0.1)'; ctx.fillRect(BK.x + 4, BK.y + 4, BK.w - 8, BK.h - 8)
    drawBeaker(ctx)

    // Anode electrode
    ctx.fillStyle = pair.anodeColor; ctx.fillRect(anodeX - 8, elecTop, 16, elecBot - elecTop)
    lbl(ctx, `Anode (−)`, anodeX, elecTop - 22, '#fde68a')
    lbl(ctx, pair.anode, anodeX, elecTop - 10, '#9ca3af', 10)

    // Cathode electrode + deposit
    ctx.fillStyle = pair.cathodeColor; ctx.fillRect(cathodeX - 8, elecTop, 16, elecBot - elecTop)
    if (s.cathodeDeposit > 0) {
      const dH = Math.min(s.cathodeDeposit * 0.4, 50)
      ctx.fillStyle = pair.cathodeColor; ctx.globalAlpha = 0.6
      ctx.fillRect(cathodeX - 11, elecBot - dH, 22, dH); ctx.globalAlpha = 1
    }
    lbl(ctx, `Cathode (+)`, cathodeX, elecTop - 22, '#93c5fd')
    lbl(ctx, pair.cathode, cathodeX, elecTop - 10, '#9ca3af', 10)

    // Ions
    s.ions.forEach(ion => {
      ctx.beginPath(); ctx.arc(ion.x, ion.y, ion.r, 0, Math.PI * 2)
      ctx.fillStyle = ion.isCation ? pair.ionCcolor : '#818cf8'
      ctx.globalAlpha = 0.8; ctx.fill(); ctx.globalAlpha = 1
      ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 1; ctx.stroke()
      ctx.fillStyle = '#fff'; ctx.font = 'bold 8px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText(ion.isCation ? pair.ionC : 'SO₄²⁻', ion.x, ion.y); ctx.textBaseline = 'alphabetic'
    })

    // Info
    lbl(ctx, `${pair.anode}-${pair.cathode} Voltaic Cell  |  EMF = ${emf} V`, BAT_CX, BK.y + BK.h + 18, '#9ca3af', 12)
    lbl(ctx, `${pair.anode}(s) → ${pair.ionA}(aq) + ${pair.anode === 'Ag' ? '1' : '2'}e⁻  [E° = ${pair.anodeE}V]`, anodeX, BK.y + BK.h + 38, '#fde68a', 10)
    lbl(ctx, `${pair.ionC}(aq) + ${pair.cathode === 'Ag' ? '1' : '2'}e⁻ → ${pair.cathode}(s)  [E° = ${pair.cathodeE}V]`, cathodeX, BK.y + BK.h + 38, '#93c5fd', 10)
    lbl(ctx, `E°cell = ${pair.cathodeE} − (${pair.anodeE}) = ${emf} V`, BAT_CX, H - 10, '#64748b', 10)
  }, [running, pair, emf])

  useEffect(() => {
    const loop = () => { if (runRef.current) update(); draw(); animRef.current = requestAnimationFrame(loop) }
    animRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animRef.current)
  }, [draw, update])

  useEffect(() => { runRef.current = running }, [running])

  const changePair = (idx) => { stateRef.current = initState(METAL_PAIRS[idx]); setPairIdx(idx); setRunning(false); runRef.current = false }

  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} className="sim-canvas" />
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card sm:col-span-2">
          <label className="text-xs text-gray-400 block mb-2">Metal Pair</label>
          <div className="flex flex-wrap gap-2">
            {METAL_PAIRS.map((p, i) => (
              <button key={i} onClick={() => changePair(i)}
                className={`px-3 py-1 rounded-lg text-sm font-medium border transition-all ${i === pairIdx ? 'bg-blue-600 border-blue-500 text-white' : 'border-gray-700 text-gray-400 hover:border-gray-500'}`}>
                {p.anode}–{p.cathode} ({(p.cathodeE - p.anodeE).toFixed(2)}V)
              </button>
            ))}
          </div>
        </div>
        <div className="card flex gap-3 items-center justify-center">
          <button onClick={() => setRunning(r => !r)} className={`px-4 py-2 rounded-lg font-semibold text-sm ${running ? 'bg-red-800 hover:bg-red-700' : 'bg-green-700 hover:bg-green-600'} text-white`}>
            {running ? '⏸ Pause' : '▶ Start'}
          </button>
        </div>
      </div>
    </div>
  )
}

function respawn(ion) { ion.x = 140 + Math.random() * 420; ion.y = 160 + Math.random() * 190 }

function ePath(t, ax, cx, et) {
  const s1 = et - (BAT_Y + 20), s2 = (BAT_CX - 22) - ax, s3 = 44, s4 = cx - (BAT_CX + 22), s5 = et - (BAT_Y + 20)
  const total = s1 + s2 + s3 + s4 + s5, d = t * total
  if (d < s1) return { x: ax, y: et - d }
  if (d < s1 + s2) return { x: ax + (d - s1), y: BAT_Y + 20 }
  if (d < s1 + s2 + s3) return { x: BAT_CX - 22 + (d - s1 - s2), y: BAT_Y + 20 }
  if (d < s1 + s2 + s3 + s4) return { x: BAT_CX + 22 + (d - s1 - s2 - s3), y: BAT_Y + 20 }
  return { x: cx, y: BAT_Y + 20 + (d - s1 - s2 - s3 - s4) }
}

function drawBeaker(ctx) {
  ctx.beginPath()
  ctx.moveTo(BK.x + 10, BK.y); ctx.lineTo(BK.x + 10, BK.y + BK.h)
  ctx.lineTo(BK.x + BK.w - 10, BK.y + BK.h); ctx.lineTo(BK.x + BK.w - 10, BK.y)
  ctx.strokeStyle = '#6b7280'; ctx.lineWidth = 3; ctx.stroke()
  ctx.beginPath(); ctx.moveTo(BK.x, BK.y); ctx.lineTo(BK.x + BK.w, BK.y); ctx.stroke()
}

function lbl(ctx, text, x, y, color = '#9ca3af', size = 12) {
  ctx.fillStyle = color; ctx.font = `${size}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText(text, x, y)
}
