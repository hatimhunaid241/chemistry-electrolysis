import React, { useRef, useEffect } from 'react'
import { useLang } from '../i18n/LanguageContext'
import { CV } from '../simulations/simTheme'

// Light-theme multi-series line chart drawn on a canvas.
// data: array of sample objects (each has an x value under `xKey` + series keys).
export default function LiveChart({ data, series, xKey = 't', xLabel }) {
  const ref = useRef(null)
  const { pick } = useLang()

  useEffect(() => {
    const canvas = ref.current; if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width, H = canvas.height
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H)
    const pad = { l: 46, r: 12, t: 14, b: 34 }
    const plotW = W - pad.l - pad.r, plotH = H - pad.t - pad.b

    // axes
    ctx.strokeStyle = CV.axis; ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, pad.t + plotH); ctx.lineTo(pad.l + plotW, pad.t + plotH); ctx.stroke()

    if (!data || data.length === 0) {
      ctx.fillStyle = CV.textMuted; ctx.font = '12px sans-serif'; ctx.textAlign = 'center'
      ctx.fillText('—', W / 2, H / 2)
      return
    }

    const xs = data.map(d => d[xKey] ?? 0)
    const maxX = Math.max(...xs, 1)
    let maxY = 0
    series.forEach(s => data.forEach(d => { const v = d[s.key]; if (typeof v === 'number' && v > maxY) maxY = v }))
    maxY = maxY || 1
    const niceY = Math.ceil(maxY * 1.1)

    const X = (x) => pad.l + (x / maxX) * plotW
    const Y = (y) => pad.t + plotH - (y / niceY) * plotH

    // gridlines + y labels
    ctx.fillStyle = CV.textMuted; ctx.font = '10px sans-serif'; ctx.textAlign = 'right'
    for (let i = 0; i <= 4; i++) {
      const gy = pad.t + (plotH / 4) * i
      ctx.strokeStyle = CV.grid; ctx.beginPath(); ctx.moveTo(pad.l, gy); ctx.lineTo(pad.l + plotW, gy); ctx.stroke()
      ctx.fillText((niceY * (1 - i / 4)).toFixed(niceY < 5 ? 2 : 0), pad.l - 6, gy + 3)
    }
    // x labels
    ctx.textAlign = 'center'
    for (let i = 0; i <= 4; i++) {
      const gx = pad.l + (plotW / 4) * i
      ctx.fillText(((maxX * i) / 4).toFixed(0), gx, pad.t + plotH + 16)
    }
    ctx.fillStyle = CV.text
    ctx.fillText(pick(xLabel) || 't', pad.l + plotW / 2, H - 4)

    // series lines
    series.forEach(s => {
      ctx.strokeStyle = s.color; ctx.lineWidth = 2; ctx.beginPath()
      data.forEach((d, i) => {
        const v = d[s.key]; if (typeof v !== 'number') return
        const px = X(d[xKey] ?? 0), py = Y(v)
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py)
      })
      ctx.stroke()
      const last = data[data.length - 1]
      if (typeof last[s.key] === 'number') { ctx.fillStyle = s.color; ctx.beginPath(); ctx.arc(X(last[xKey]), Y(last[s.key]), 3, 0, Math.PI * 2); ctx.fill() }
    })

    // legend
    let lx = pad.l + 6
    series.forEach(s => {
      ctx.fillStyle = s.color; ctx.fillRect(lx, pad.t + 2, 10, 4)
      ctx.fillStyle = CV.text; ctx.font = '10px sans-serif'; ctx.textAlign = 'left'
      const txt = pick(s.label)
      ctx.fillText(txt, lx + 14, pad.t + 7)
      lx += 20 + ctx.measureText(txt).width + 8
    })
  }, [data, series, xKey, xLabel, pick])

  return <canvas ref={ref} width={640} height={220} className="w-full rounded-xl border border-slate-200 bg-white" />
}
