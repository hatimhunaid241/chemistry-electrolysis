// Shared LIGHT-THEME canvas palette + drawing helpers for every simulation.
// All simulations render on a white background with dark, WCAG-AA-legible text.

export const CV = {
  bg: '#ffffff',
  panel: '#f1f5f9',        // slate-100  — battery / voltmeter / info boxes
  panelStroke: '#cbd5e1',  // slate-300
  wire: '#64748b',         // slate-500  — clearly visible on white
  electron: '#f59e0b',     // amber-500  — electron dots
  electronCore: '#fef3c7', // amber-100  — inner highlight
  beaker: '#94a3b8',       // slate-400  — glassware outline
  text: '#475569',         // slate-600  — default label
  textStrong: '#1e293b',   // slate-800  — headings / electrode captions
  textMuted: '#64748b',    // slate-500
  pos: '#dc2626',          // red-600    — + terminal
  neg: '#2563eb',          // blue-600   — − terminal
  anode: '#b45309',        // amber-700
  cathode: '#475569',      // slate-600
  grid: '#e2e8f0',         // slate-200  — chart gridlines
  axis: '#94a3b8',
}

// Pick black or white text for maximum contrast against a hex fill colour.
export function contrastText(hex) {
  const c = hex.replace('#', '')
  const full = c.length === 3 ? c.split('').map(x => x + x).join('') : c
  const r = parseInt(full.slice(0, 2), 16)
  const g = parseInt(full.slice(2, 4), 16)
  const b = parseInt(full.slice(4, 6), 16)
  // relative luminance
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return lum > 0.6 ? '#1e293b' : '#ffffff'
}

export function label(ctx, text, x, y, color = CV.text, size = 12, align = 'center') {
  ctx.fillStyle = color
  ctx.font = `${size}px sans-serif`
  ctx.textAlign = align
  ctx.textBaseline = 'alphabetic'
  ctx.fillText(text, x, y)
}

export function clearLight(ctx, w, h) {
  ctx.fillStyle = CV.bg
  ctx.fillRect(0, 0, w, h)
}

// DC power supply box centred at cx, top at y, given width w.
export function drawBattery(ctx, cx, y, w = 180, h = 26, caption = 'DC Power Supply') {
  ctx.fillStyle = CV.panel
  ctx.beginPath(); ctx.roundRect(cx - w / 2, y, w, h, 5); ctx.fill()
  ctx.strokeStyle = CV.panelStroke; ctx.lineWidth = 1.5; ctx.stroke()
  ctx.font = 'bold 13px monospace'
  ctx.textAlign = 'left'; ctx.fillStyle = CV.pos; ctx.fillText('+', cx - w / 2 + 8, y + h / 2 + 5)
  ctx.textAlign = 'right'; ctx.fillStyle = CV.neg; ctx.fillText('−', cx + w / 2 - 8, y + h / 2 + 5)
  ctx.textAlign = 'center'; ctx.fillStyle = CV.textMuted; ctx.font = '10px sans-serif'
  ctx.fillText(caption, cx, y + h / 2 + 4)
}

// Polyline wire through an array of {x,y} points.
export function drawWire(ctx, points, color = CV.wire, width = 2) {
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.setLineDash([])
  ctx.beginPath()
  points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)))
  ctx.stroke()
}

// Rectangular beaker: side walls + rim, optional solution fill colour.
export function drawBeaker(ctx, x, y, w, h, solution) {
  if (solution) { ctx.fillStyle = solution; ctx.fillRect(x + 4, y + 4, w - 8, h - 8) }
  ctx.strokeStyle = CV.beaker; ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(x + 10, y); ctx.lineTo(x + 10, y + h)
  ctx.lineTo(x + w - 10, y + h); ctx.lineTo(x + w - 10, y)
  ctx.stroke()
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y); ctx.stroke()
}

export function drawElectrode(ctx, x, top, bot, color, width = 14) {
  ctx.fillStyle = color
  ctx.fillRect(x - width / 2, top, width, bot - top)
}

export function drawElectron(ctx, x, y) {
  ctx.beginPath(); ctx.arc(x, y, 4.5, 0, Math.PI * 2)
  ctx.fillStyle = CV.electron; ctx.fill()
  ctx.beginPath(); ctx.arc(x - 1, y - 1, 1.6, 0, Math.PI * 2)
  ctx.fillStyle = CV.electronCore; ctx.fill()
}

// Ion bubble with auto-contrast label text and a subtle dark outline so even
// pale ions (Ag⁺, Mg²⁺) stay visible on white.
export function drawIon(ctx, x, y, symbol, fill, r = 13) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fillStyle = fill; ctx.globalAlpha = 0.92; ctx.fill(); ctx.globalAlpha = 1
  ctx.strokeStyle = 'rgba(15,23,42,0.25)'; ctx.lineWidth = 1; ctx.stroke()
  ctx.fillStyle = contrastText(fill)
  ctx.font = `bold ${symbol.length > 3 ? 8 : 9}px sans-serif`
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillText(symbol, x, y)
  ctx.textBaseline = 'alphabetic'
}

export function drawBubble(ctx, x, y, r, color, alpha = 0.8) {
  ctx.globalAlpha = alpha
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.stroke()
  ctx.globalAlpha = alpha * 0.2; ctx.fillStyle = color; ctx.fill()
  ctx.globalAlpha = 1
}
