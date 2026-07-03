import React, { useRef, useEffect, useState, useCallback } from 'react'
import { useLang } from '../i18n/LanguageContext'
import { CV, clearLight, drawWire, drawBeaker, drawElectrode, drawElectron, drawIon, label } from './simTheme'

const W = 700, H = 462
const BK = { x: 100, y: 130, w: 500, h: 250 }
const VM_CX = 350, VM_Y = 30
const anodeX = 220, cathodeX = 480
const elecTop = 100, elecBot = 345

const METAL_PAIRS = [
  { anode: 'Zn', cathode: 'Cu', anodeE: -0.76, cathodeE: 0.34, anodeColor: '#94a3b8', cathodeColor: '#b45309', ionC: 'Cu²⁺', ionA: 'Zn²⁺', ionCcolor: '#f97316' },
  { anode: 'Fe', cathode: 'Cu', anodeE: -0.44, cathodeE: 0.34, anodeColor: '#78716c', cathodeColor: '#b45309', ionC: 'Cu²⁺', ionA: 'Fe²⁺', ionCcolor: '#f97316' },
  { anode: 'Mg', cathode: 'Cu', anodeE: -2.37, cathodeE: 0.34, anodeColor: '#a1a1aa', cathodeColor: '#b45309', ionC: 'Cu²⁺', ionA: 'Mg²⁺', ionCcolor: '#f97316' },
  { anode: 'Zn', cathode: 'Ag', anodeE: -0.76, cathodeE: 0.80, anodeColor: '#94a3b8', cathodeColor: '#9ca3af', ionC: 'Ag⁺', ionA: 'Zn²⁺', ionCcolor: '#a3a3a3' },
  { anode: 'Cu', cathode: 'Ag', anodeE: 0.34, cathodeE: 0.80, anodeColor: '#b45309', cathodeColor: '#9ca3af', ionC: 'Ag⁺', ionA: 'Cu²⁺', ionCcolor: '#a3a3a3' },
]

function initState() {
  return { ions: Array.from({ length: 24 }, (_, i) => ({ x: 140 + Math.random() * 420, y: 160 + Math.random() * 190, isCation: i < 12, r: 12 })), electrons: [0, 0.33, 0.66].map(p => ({ pos: p })), cathodeDeposit: 0 }
}

export default function VoltaicCellSim({ onSample }) {
  const { t, lang } = useLang()
  const canvasRef = useRef(null)
  const stateRef = useRef(null)
  const animRef = useRef(null)
  const runRef = useRef(false)
  const frameRef = useRef(0)
  const secRef = useRef(0)
  const onSampleRef = useRef(onSample)
  useEffect(() => { onSampleRef.current = onSample }, [onSample])

  const [pairIdx, setPairIdx] = useState(0)
  const [running, setRunning] = useState(false)
  const pair = METAL_PAIRS[pairIdx]
  const emf = (pair.cathodeE - pair.anodeE).toFixed(2)
  if (!stateRef.current) stateRef.current = initState()

  const update = useCallback(() => {
    const s = stateRef.current
    s.electrons.forEach(e => { e.pos = (e.pos + 0.004) % 1 })
    s.ions.forEach(ion => {
      const target = ion.isCation ? cathodeX : anodeX
      ion.x += (target - ion.x) * 0.008 + (Math.random() - 0.5) * 0.8
      ion.y += (Math.random() - 0.5)
      ion.y = Math.max(BK.y + ion.r + 5, Math.min(BK.y + BK.h - ion.r - 5, ion.y))
      if (ion.isCation && ion.x > cathodeX - 18) { s.cathodeDeposit++; respawn(ion) }
      if (!ion.isCation && ion.x < anodeX + 18) respawn(ion)
    })
  }, [])

  const draw = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d')
    const s = stateRef.current
    clearLight(ctx, W, H)

    drawWire(ctx, [{ x: anodeX, y: elecTop }, { x: anodeX, y: VM_Y + 20 }, { x: VM_CX - 22, y: VM_Y + 20 }], CV.wire, 2.5)
    drawWire(ctx, [{ x: cathodeX, y: elecTop }, { x: cathodeX, y: VM_Y + 20 }, { x: VM_CX + 22, y: VM_Y + 20 }], CV.wire, 2.5)
    if (running) s.electrons.forEach(e => { const p = ePath(e.pos); drawElectron(ctx, p.x, p.y) })
    ctx.beginPath(); ctx.arc(VM_CX, VM_Y + 20, 20, 0, Math.PI * 2); ctx.fillStyle = CV.panel; ctx.fill(); ctx.strokeStyle = CV.panelStroke; ctx.lineWidth = 2; ctx.stroke()
    label(ctx, 'V', VM_CX, VM_Y + 17, CV.textMuted, 10)
    label(ctx, `${emf}V`, VM_CX, VM_Y + 30, '#16a34a', 10)

    drawBeaker(ctx, BK.x, BK.y, BK.w, BK.h, 'rgba(59,130,246,0.06)')

    drawElectrode(ctx, anodeX, elecTop, elecBot, pair.anodeColor, 16)
    label(ctx, `${t('anode')} (−)`, anodeX, elecTop - 22, '#b45309')
    label(ctx, pair.anode, anodeX, elecTop - 10, CV.textMuted, 10)
    drawElectrode(ctx, cathodeX, elecTop, elecBot, pair.cathodeColor, 16)
    if (s.cathodeDeposit > 0) { const dH = Math.min(s.cathodeDeposit * 0.4, 50); ctx.fillStyle = pair.cathodeColor; ctx.globalAlpha = 0.7; ctx.fillRect(cathodeX - 11, elecBot - dH, 22, dH); ctx.globalAlpha = 1 }
    label(ctx, `${t('cathode')} (+)`, cathodeX, elecTop - 22, '#2563eb')
    label(ctx, pair.cathode, cathodeX, elecTop - 10, CV.textMuted, 10)

    s.ions.forEach(ion => drawIon(ctx, ion.x, ion.y, ion.isCation ? pair.ionC : 'SO₄²⁻', ion.isCation ? pair.ionCcolor : '#818cf8', ion.r))

    label(ctx, `${pair.anode}-${pair.cathode} ${lang === 'zh' ? '伏打電池' : 'Voltaic Cell'}  |  EMF = ${emf} V`, VM_CX, BK.y + BK.h + 18, CV.textStrong, 12)
    label(ctx, `${pair.anode}(s) → ${pair.ionA}(aq) + ${pair.anode === 'Ag' ? '1' : '2'}e⁻`, anodeX, BK.y + BK.h + 38, '#b45309', 10)
    label(ctx, `${pair.ionC}(aq) + ${pair.cathode === 'Ag' ? '1' : '2'}e⁻ → ${pair.cathode}(s)`, cathodeX, BK.y + BK.h + 38, '#2563eb', 10)
    label(ctx, `E°cell = ${pair.cathodeE} − (${pair.anodeE}) = ${emf} V`, VM_CX, H - 10, CV.textMuted, 10)
  }, [running, pair, emf, t, lang])

  useEffect(() => {
    const loop = () => {
      if (runRef.current) {
        update(); frameRef.current++
        if (frameRef.current >= 60) {
          frameRef.current = 0; secRef.current++
          onSampleRef.current?.({ t: secRef.current, emf: +emf, deposit: Math.round(stateRef.current.cathodeDeposit) })
        }
      }
      draw(); animRef.current = requestAnimationFrame(loop)
    }
    animRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animRef.current)
  }, [draw, update, emf])

  useEffect(() => { runRef.current = running }, [running])
  const changePair = (idx) => { stateRef.current = initState(); setPairIdx(idx); setRunning(false); runRef.current = false; frameRef.current = 0; secRef.current = 0; onSampleRef.current?.({ reset: true }) }

  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} className="sim-canvas" />
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card sm:col-span-2">
          <label className="text-xs text-slate-500 block mb-2">{lang === 'zh' ? '金屬配對' : 'Metal Pair'}</label>
          <div className="flex flex-wrap gap-2">
            {METAL_PAIRS.map((p, i) => (
              <button key={i} onClick={() => changePair(i)}
                className={`px-3 py-1 rounded-lg text-sm font-medium border transition-all ${i === pairIdx ? 'bg-blue-600 border-blue-500 text-white' : 'border-slate-300 text-slate-600 hover:border-slate-400'}`}>
                {p.anode}–{p.cathode} ({(p.cathodeE - p.anodeE).toFixed(2)}V)
              </button>
            ))}
          </div>
        </div>
        <div className="card flex gap-3 items-center justify-center">
          <button onClick={() => setRunning(r => !r)} className={`px-4 py-2 rounded-lg font-semibold text-sm text-white ${running ? 'bg-red-600 hover:bg-red-500' : 'bg-green-600 hover:bg-green-500'}`}>
            {running ? t('btn_pause') : t('btn_start')}
          </button>
        </div>
      </div>
    </div>
  )
}

function respawn(ion) { ion.x = 140 + Math.random() * 420; ion.y = 160 + Math.random() * 190 }
function ePath(tt) {
  const s1 = elecTop - (VM_Y + 20), s2 = (VM_CX - 22) - anodeX, s3 = 44, s4 = cathodeX - (VM_CX + 22), s5 = s1
  const total = s1 + s2 + s3 + s4 + s5, d = tt * total
  if (d < s1) return { x: anodeX, y: elecTop - d }
  if (d < s1 + s2) return { x: anodeX + (d - s1), y: VM_Y + 20 }
  if (d < s1 + s2 + s3) return { x: VM_CX - 22 + (d - s1 - s2), y: VM_Y + 20 }
  if (d < s1 + s2 + s3 + s4) return { x: VM_CX + 22 + (d - s1 - s2 - s3), y: VM_Y + 20 }
  return { x: cathodeX, y: VM_Y + 20 + (d - s1 - s2 - s3 - s4) }
}
