import React, { useRef, useEffect, useState, useCallback } from 'react'
import { useLang } from '../i18n/LanguageContext'
import { CV, clearLight, drawBattery, drawWire, drawBeaker, drawElectrode, drawElectron, label } from './simTheme'

const W = 700, H = 400
const BK = { x: 220, y: 150, w: 260, h: 200 }
const ANODE_X = 300, CATHODE_X = 400
const ELEC_TOP = 120, ELEC_BOT = 320
const BAT_CX = 350, BAT_Y = 20, WIRE_Y = BAT_Y + 13
const BULB = { x: 350, y: 95 }

// conducts: 0 = none, 1 = strong, 0.4 = weak
const SUBSTANCES = [
  { id: 'nacl_s', name: { en: 'Solid NaCl', zh: '固態 NaCl' }, conducts: 0, carriers: { en: 'Ions fixed in lattice — none mobile', zh: '離子固定於晶格 —— 無可移動載子' } },
  { id: 'nacl_l', name: { en: 'Molten NaCl', zh: '熔融 NaCl' }, conducts: 1, carriers: { en: 'Mobile Na⁺ and Cl⁻ ions', zh: '可移動的 Na⁺ 及 Cl⁻ 離子' } },
  { id: 'nacl_aq', name: { en: 'NaCl(aq)', zh: 'NaCl(aq)' }, conducts: 1, carriers: { en: 'Mobile Na⁺ and Cl⁻ ions', zh: '可移動的 Na⁺ 及 Cl⁻ 離子' } },
  { id: 'hcl', name: { en: 'Dilute HCl(aq)', zh: '稀鹽酸 HCl(aq)' }, conducts: 1, carriers: { en: 'Mobile H⁺ and Cl⁻ ions', zh: '可移動的 H⁺ 及 Cl⁻ 離子' } },
  { id: 'sugar', name: { en: 'Sugar solution', zh: '糖溶液' }, conducts: 0, carriers: { en: 'Neutral molecules — no ions', zh: '中性分子 —— 沒有離子' } },
  { id: 'ethanol', name: { en: 'Ethanol', zh: '乙醇' }, conducts: 0, carriers: { en: 'Covalent molecules — no ions', zh: '共價分子 —— 沒有離子' } },
  { id: 'water', name: { en: 'Distilled water', zh: '蒸餾水' }, conducts: 0, carriers: { en: 'Negligible ions', zh: '離子極少' } },
  { id: 'copper', name: { en: 'Copper metal', zh: '銅金屬' }, conducts: 1, carriers: { en: 'Delocalised (sea of) electrons', zh: '離域電子（電子海）' } },
  { id: 'graphite', name: { en: 'Graphite', zh: '石墨' }, conducts: 1, carriers: { en: 'Delocalised electrons', zh: '離域電子' } },
]

export default function ConductivityTester({ onSample }) {
  const { t, lang, pick } = useLang()
  const canvasRef = useRef(null)
  const animRef = useRef(null)
  const runRef = useRef(false)
  const elecRef = useRef([0, 0.25, 0.5, 0.75].map(p => ({ pos: p })))
  const frameRef = useRef(0)
  const secRef = useRef(0)
  const onSampleRef = useRef(onSample)
  useEffect(() => { onSampleRef.current = onSample }, [onSample])

  const [subId, setSubId] = useState(SUBSTANCES[1].id)
  const [running, setRunning] = useState(false)
  const sub = SUBSTANCES.find(s => s.id === subId)
  const isMetal = sub.id === 'copper' || sub.id === 'graphite'
  const current = (sub.conducts * 0.6).toFixed(2) // Amps, illustrative

  const draw = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d')
    clearLight(ctx, W, H)

    // wires from the battery down to each electrode
    drawWire(ctx, [{ x: BAT_CX - 70, y: WIRE_Y }, { x: ANODE_X, y: WIRE_Y }, { x: ANODE_X, y: ELEC_TOP }])
    drawWire(ctx, [{ x: BAT_CX + 70, y: WIRE_Y }, { x: CATHODE_X, y: WIRE_Y }, { x: CATHODE_X, y: ELEC_TOP }])

    const lit = running && sub.conducts > 0

    // Sample. Electrodes are ALWAYS drawn (dipping in), so wires never float.
    if (isMetal) {
      // The metal/graphite sample is a solid bar bridging the two electrodes.
      const barTop = ELEC_BOT - 34
      ctx.fillStyle = sub.id === 'copper' ? '#b45309' : '#334155'
      ctx.fillRect(ANODE_X - 6, barTop, (CATHODE_X - ANODE_X) + 12, 34)
      drawElectrode(ctx, ANODE_X, ELEC_TOP, barTop + 6, '#475569', 10)
      drawElectrode(ctx, CATHODE_X, ELEC_TOP, barTop + 6, '#475569', 10)
      label(ctx, pick(sub.name), BAT_CX, ELEC_BOT + 26, CV.textStrong, 12)
    } else {
      const filled = sub.id !== 'nacl_s'
      drawBeaker(ctx, BK.x, BK.y, BK.w, BK.h, filled ? (sub.conducts > 0 ? 'rgba(37,99,235,0.10)' : 'rgba(148,163,184,0.12)') : undefined)
      if (sub.id === 'nacl_s') { ctx.fillStyle = '#cbd5e1'; ctx.fillRect(BK.x + 20, BK.y + BK.h - 44, BK.w - 40, 36) }
      drawElectrode(ctx, ANODE_X, ELEC_TOP, ELEC_BOT, '#475569', 10)
      drawElectrode(ctx, CATHODE_X, ELEC_TOP, ELEC_BOT, '#475569', 10)
      label(ctx, pick(sub.name), BAT_CX, BK.y + BK.h + 22, CV.textStrong, 12)
    }

    // Electrons flow only when conducting AND powered.
    if (lit) {
      elecRef.current.forEach(e => {
        const d = e.pos
        let x, y
        if (d < 0.25) { x = ANODE_X; y = ELEC_TOP - (ELEC_TOP - WIRE_Y) * (d / 0.25) }
        else if (d < 0.5) { x = ANODE_X + (CATHODE_X - ANODE_X) * ((d - 0.25) / 0.25); y = WIRE_Y }
        else if (d < 0.75) { x = CATHODE_X; y = WIRE_Y + (ELEC_TOP - WIRE_Y) * ((d - 0.5) / 0.25) }
        else { x = CATHODE_X; y = ELEC_TOP }
        drawElectron(ctx, x, y)
      })
    }

    // Bulb (drawn over the wires), ammeter and battery on top so electrons tuck behind them.
    ctx.beginPath(); ctx.arc(BULB.x, BULB.y, 16, 0, Math.PI * 2)
    ctx.fillStyle = lit ? (sub.conducts >= 1 ? '#fde047' : '#fef08a') : '#e2e8f0'
    ctx.fill(); ctx.strokeStyle = lit ? '#eab308' : CV.panelStroke; ctx.lineWidth = 2; ctx.stroke()
    if (lit) { ctx.globalAlpha = 0.25; ctx.beginPath(); ctx.arc(BULB.x, BULB.y, 26, 0, Math.PI * 2); ctx.fillStyle = '#fde047'; ctx.fill(); ctx.globalAlpha = 1 }
    label(ctx, lang === 'zh' ? '燈泡' : 'Bulb', BULB.x + 40, BULB.y + 4, CV.textMuted, 10, 'left')
    label(ctx, `A: ${current}`, BULB.x - 40, BULB.y + 4, sub.conducts > 0 && running ? '#16a34a' : CV.textMuted, 11, 'right')
    drawBattery(ctx, BAT_CX, BAT_Y, 140)

    label(ctx, sub.conducts > 0 ? (lang === 'zh' ? '✓ 導電' : '✓ Conducts') : (lang === 'zh' ? '✗ 不導電' : '✗ Does not conduct'), BAT_CX, H - 14, sub.conducts > 0 ? '#16a34a' : '#dc2626', 13)
  }, [running, sub, current, isMetal, lang, pick])

  useEffect(() => {
    const loop = () => {
      if (runRef.current) {
        if (sub.conducts > 0) elecRef.current.forEach(e => { e.pos = (e.pos + 0.006 * sub.conducts) % 1 })
        frameRef.current++
        if (frameRef.current >= 60) { frameRef.current = 0; secRef.current++; onSampleRef.current?.({ t: secRef.current, current: +current }) }
      }
      draw(); animRef.current = requestAnimationFrame(loop)
    }
    animRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animRef.current)
  }, [draw, sub, current])

  useEffect(() => { runRef.current = running }, [running])

  const changeSub = (id) => { setSubId(id); secRef.current = 0; frameRef.current = 0; onSampleRef.current?.({ reset: true }) }

  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} className="sim-canvas" />
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card sm:col-span-2">
          <label className="text-xs text-slate-500 block mb-2">{lang === 'zh' ? '測試樣本' : 'Test substance'}</label>
          <div className="flex flex-wrap gap-2">
            {SUBSTANCES.map(s => (
              <button key={s.id} onClick={() => changeSub(s.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${subId === s.id ? 'bg-blue-600 border-blue-500 text-white' : 'border-slate-300 text-slate-600 hover:border-slate-400'}`}>
                {pick(s.name)}
              </button>
            ))}
          </div>
        </div>
        <div className="card flex items-center justify-center">
          <button onClick={() => setRunning(r => !r)} className={`px-4 py-2 rounded-lg font-semibold text-sm text-white ${running ? 'bg-red-600 hover:bg-red-500' : 'bg-green-600 hover:bg-green-500'}`}>
            {running ? (lang === 'zh' ? '⏸ 關閉電源' : '⏸ Power off') : (lang === 'zh' ? '▶ 開啟電源' : '▶ Power on')}
          </button>
        </div>
      </div>
      <div className={`mt-4 card text-sm ${sub.conducts > 0 ? 'border-green-200' : 'border-slate-200'}`}>
        <p className="font-semibold mb-1" style={{ color: sub.conducts > 0 ? '#15803d' : '#475569' }}>
          {sub.conducts > 0 ? (lang === 'zh' ? '導電體' : 'Conductor') : (lang === 'zh' ? '非導電體' : 'Non-conductor')}
          {isMetal ? (lang === 'zh' ? '（金屬性導電）' : ' (metallic)') : sub.conducts > 0 ? (lang === 'zh' ? '（電解質）' : ' (electrolyte)') : ''}
        </p>
        <p className="text-slate-600">{lang === 'zh' ? '載流子：' : 'Charge carriers: '}{pick(sub.carriers)}</p>
      </div>
    </div>
  )
}
