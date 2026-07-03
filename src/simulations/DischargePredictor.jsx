import React, { useRef, useEffect, useState, useCallback } from 'react'
import { useLang } from '../i18n/LanguageContext'
import { CV, clearLight, drawBattery, drawWire, drawBeaker, drawElectrode, label } from './simTheme'

const W = 700, H = 400
const BK = { x: 150, y: 110, w: 400, h: 210 }
const ANODE_X = 250, CATHODE_X = 450
const ELEC_TOP = 80, ELEC_BOT = 290
const BAT_CX = 350, BAT_Y = 20, WIRE_Y = BAT_Y + 13

// Cations ordered by ease of discharge at cathode (bottom = easiest / most noble)
const CATIONS = [
  { id: 'K', sym: 'K⁺', E: -2.93 }, { id: 'Na', sym: 'Na⁺', E: -2.71 }, { id: 'Ca', sym: 'Ca²⁺', E: -2.87 },
  { id: 'Mg', sym: 'Mg²⁺', E: -2.37 }, { id: 'Al', sym: 'Al³⁺', E: -1.66 }, { id: 'Zn', sym: 'Zn²⁺', E: -0.76 },
  { id: 'Fe', sym: 'Fe²⁺', E: -0.44 }, { id: 'Pb', sym: 'Pb²⁺', E: -0.13 }, { id: 'H', sym: 'H⁺', E: 0.0 },
  { id: 'Cu', sym: 'Cu²⁺', E: 0.34 }, { id: 'Ag', sym: 'Ag⁺', E: 0.80 },
]
const NOBLE = ['Pb', 'Cu', 'Ag'] // deposited as metal at cathode from aqueous solution
const ANIONS = [
  { id: 'SO4', sym: 'SO₄²⁻', halide: false }, { id: 'NO3', sym: 'NO₃⁻', halide: false },
  { id: 'Cl', sym: 'Cl⁻', halide: true, gas: 'Cl₂' }, { id: 'Br', sym: 'Br⁻', halide: true, gas: 'Br₂' }, { id: 'I', sym: 'I⁻', halide: true, gas: 'I₂' },
]

export default function DischargePredictor() {
  const { t, lang } = useLang()
  const canvasRef = useRef(null)
  const animRef = useRef(null)

  const [catId, setCatId] = useState('Cu')
  const [anId, setAnId] = useState('SO4')
  const [conc, setConc] = useState('conc') // 'conc' | 'dilute'
  const [electrode, setElectrode] = useState('inert') // 'inert' | 'active'

  const cat = CATIONS.find(c => c.id === catId)
  const an = ANIONS.find(a => a.id === anId)

  // Cathode prediction
  const catMetal = NOBLE.includes(cat.id)
  const cathode = catMetal
    ? { product: cat.id, half: `${cat.sym} + ${cat.sym.includes('³') ? 3 : cat.sym.includes('⁺') && !cat.sym.includes('²') ? 1 : 2}e⁻ → ${cat.id}(s)`, why: { en: `${cat.sym} is below H in the series, so the metal is deposited in preference to H₂.`, zh: `${cat.sym} 在電化學序中低於 H，故金屬優先於 H₂ 析出。` } }
    : { product: 'H₂', half: '2H₂O + 2e⁻ → H₂ + 2OH⁻', why: { en: `${cat.sym} is too reactive to be discharged; water is reduced to H₂ instead.`, zh: `${cat.sym} 太活潑不能放電，改為還原水生成 H₂。` } }

  // Anode prediction
  let anode
  if (electrode === 'active') {
    anode = { product: 'Cu²⁺', half: 'Cu(s) → Cu²⁺(aq) + 2e⁻', why: { en: 'Active copper anode dissolves in preference to any ion being oxidised.', zh: '活性銅陽極溶解，優先於任何離子被氧化。' } }
  } else if (an.halide && conc === 'conc') {
    anode = { product: an.gas, half: `2${an.sym} → ${an.gas} + 2e⁻`, why: { en: `Concentrated ${an.sym} is discharged in preference to water.`, zh: `濃 ${an.sym} 優先於水放電。` } }
  } else {
    anode = { product: 'O₂', half: '2H₂O → O₂ + 4H⁺ + 4e⁻', why: { en: an.halide ? `${an.sym} is too dilute; water is oxidised to O₂ instead.` : `${an.sym} is not discharged; water is oxidised to O₂.`, zh: an.halide ? `${an.sym} 太稀，改為氧化水生成 O₂。` : `${an.sym} 不放電，氧化水生成 O₂。` } }
  }

  const draw = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d')
    clearLight(ctx, W, H)
    drawWire(ctx, [{ x: BAT_CX - 90, y: WIRE_Y }, { x: ANODE_X, y: WIRE_Y }, { x: ANODE_X, y: ELEC_TOP }])
    drawWire(ctx, [{ x: BAT_CX + 90, y: WIRE_Y }, { x: CATHODE_X, y: WIRE_Y }, { x: CATHODE_X, y: ELEC_TOP }])
    drawBattery(ctx, BAT_CX, BAT_Y)

    drawBeaker(ctx, BK.x, BK.y, BK.w, BK.h, 'rgba(37,99,235,0.06)')
    drawElectrode(ctx, ANODE_X, ELEC_TOP, ELEC_BOT, electrode === 'active' ? CV.anode : '#475569')
    drawElectrode(ctx, CATHODE_X, ELEC_TOP, ELEC_BOT, '#475569')
    label(ctx, `${t('anode')} (+)`, ANODE_X, ELEC_TOP - 8, CV.textStrong)
    label(ctx, `${t('cathode')} (−)`, CATHODE_X, ELEC_TOP - 8, CV.textStrong)
    label(ctx, electrode === 'active' ? (lang === 'zh' ? '活性 Cu' : 'active Cu') : (lang === 'zh' ? '惰性' : 'inert'), ANODE_X, ELEC_TOP - 22, CV.textMuted, 10)

    // Product tags
    tag(ctx, ANODE_X, BK.y + 30, anode.product, '#7c3aed')
    tag(ctx, CATHODE_X, BK.y + 30, cathode.product, '#16a34a')

    label(ctx, `${lang === 'zh' ? '電解質' : 'Electrolyte'}: ${cat.sym} / ${an.sym} (${conc === 'conc' ? (lang === 'zh' ? '濃' : 'conc.') : (lang === 'zh' ? '稀' : 'dilute')})`, BAT_CX, BK.y + BK.h + 22, CV.textStrong, 12)
    label(ctx, anode.half, ANODE_X, BK.y + BK.h + 42, '#7c3aed', 10)
    label(ctx, cathode.half, CATHODE_X, BK.y + BK.h + 42, '#16a34a', 10)
  }, [cat, an, conc, electrode, cathode, anode, t, lang])

  useEffect(() => {
    const loop = () => { draw(); animRef.current = requestAnimationFrame(loop) }
    animRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animRef.current)
  }, [draw])

  const pill = (active) => `px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${active ? 'bg-blue-600 border-blue-500 text-white' : 'border-slate-300 text-slate-600 hover:border-slate-400'}`

  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} className="sim-canvas" />
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card">
          <label className="text-xs text-slate-500 block mb-2">{lang === 'zh' ? '陽離子（陰極）' : 'Cation (cathode)'}</label>
          <div className="flex flex-wrap gap-1.5">{CATIONS.map(c => <button key={c.id} onClick={() => setCatId(c.id)} className={pill(catId === c.id)}>{c.sym}</button>)}</div>
        </div>
        <div className="card">
          <label className="text-xs text-slate-500 block mb-2">{lang === 'zh' ? '陰離子（陽極）' : 'Anion (anode)'}</label>
          <div className="flex flex-wrap gap-1.5">{ANIONS.map(a => <button key={a.id} onClick={() => setAnId(a.id)} className={pill(anId === a.id)}>{a.sym}</button>)}</div>
        </div>
        <div className="card">
          <label className="text-xs text-slate-500 block mb-2">{t('concentration')}</label>
          <div className="flex gap-2">
            <button onClick={() => setConc('conc')} className={pill(conc === 'conc')}>{lang === 'zh' ? '濃' : 'Concentrated'}</button>
            <button onClick={() => setConc('dilute')} className={pill(conc === 'dilute')}>{lang === 'zh' ? '稀' : 'Dilute'}</button>
          </div>
        </div>
        <div className="card">
          <label className="text-xs text-slate-500 block mb-2">{lang === 'zh' ? '電極' : 'Electrode'}</label>
          <div className="flex gap-2">
            <button onClick={() => setElectrode('inert')} className={pill(electrode === 'inert')}>{lang === 'zh' ? '惰性 (C/Pt)' : 'Inert (C/Pt)'}</button>
            <button onClick={() => setElectrode('active')} className={pill(electrode === 'active')}>{lang === 'zh' ? '活性 (Cu)' : 'Active (Cu)'}</button>
          </div>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="card border-purple-200">
          <p className="text-purple-700 font-semibold mb-1">{t('anode')} → {anode.product}</p>
          <p className="text-slate-600 text-xs">{lang === 'zh' ? anode.why.zh : anode.why.en}</p>
        </div>
        <div className="card border-green-200">
          <p className="text-green-700 font-semibold mb-1">{t('cathode')} → {cathode.product}</p>
          <p className="text-slate-600 text-xs">{lang === 'zh' ? cathode.why.zh : cathode.why.en}</p>
        </div>
      </div>
    </div>
  )
}

function tag(ctx, x, y, text, color) {
  ctx.font = 'bold 13px sans-serif'
  const w = ctx.measureText(text).width + 18
  ctx.fillStyle = '#fff'; ctx.strokeStyle = color; ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.roundRect(x - w / 2, y - 13, w, 22, 6); ctx.fill(); ctx.stroke()
  ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillText(text, x, y - 1); ctx.textBaseline = 'alphabetic'
}
