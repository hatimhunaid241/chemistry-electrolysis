// Shared drawing helpers for all simulations

export function drawRoundedRect(ctx, x, y, w, h, r, fill, stroke) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
  if (fill) { ctx.fillStyle = fill; ctx.fill() }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke() }
}

export function drawBeaker(ctx, x, y, w, h, solutionColor) {
  // Solution fill
  ctx.fillStyle = solutionColor
  ctx.fillRect(x + 4, y + 4, w - 8, h - 8)
  // Beaker outline
  ctx.beginPath()
  ctx.moveTo(x + 10, y)
  ctx.lineTo(x + 10, y + h)
  ctx.lineTo(x + w - 10, y + h)
  ctx.lineTo(x + w - 10, y)
  ctx.strokeStyle = '#9ca3af'
  ctx.lineWidth = 3
  ctx.stroke()
  // Top rim
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x + w, y)
  ctx.strokeStyle = '#9ca3af'
  ctx.lineWidth = 3
  ctx.stroke()
}

export function drawElectrode(ctx, x, topY, botY, label, isAnode) {
  const color = isAnode ? '#b45309' : '#4b5563'
  ctx.fillStyle = color
  ctx.fillRect(x - 6, topY, 12, botY - topY)
  ctx.fillStyle = '#fff'
  ctx.font = 'bold 13px monospace'
  ctx.textAlign = 'center'
  ctx.fillText(label, x, topY - 8)
}

export function drawBattery(ctx, cx, y, w) {
  const h = 28
  drawRoundedRect(ctx, cx - w / 2, y, w, h, 5, '#1f2937', '#6b7280')
  // Positive terminal
  ctx.fillStyle = '#ef4444'
  ctx.font = 'bold 14px monospace'
  ctx.textAlign = 'left'
  ctx.fillText('+', cx - w / 2 + 8, y + h / 2 + 5)
  // Negative terminal
  ctx.fillStyle = '#60a5fa'
  ctx.textAlign = 'right'
  ctx.fillText('−', cx + w / 2 - 8, y + h / 2 + 5)
  ctx.textAlign = 'center'
  ctx.fillStyle = '#9ca3af'
  ctx.font = '10px sans-serif'
  ctx.fillText('DC Power Supply', cx, y + h / 2 + 4)
}

export function drawWires(ctx, bx, by, bw, bh, anodeX, cathodeX, elecTopY) {
  ctx.strokeStyle = '#6b7280'
  ctx.lineWidth = 2
  ctx.setLineDash([])
  // Battery left (+) to anode
  const batLeft = bx - bw / 2
  const batRight = bx + bw / 2
  ctx.beginPath()
  ctx.moveTo(batLeft, by + bh / 2)
  ctx.lineTo(anodeX, by + bh / 2)
  ctx.lineTo(anodeX, elecTopY)
  ctx.stroke()
  // Battery right (−) to cathode
  ctx.beginPath()
  ctx.moveTo(batRight, by + bh / 2)
  ctx.lineTo(cathodeX, by + bh / 2)
  ctx.lineTo(cathodeX, elecTopY)
  ctx.stroke()
}

export function drawElectrons(ctx, electrons, anodeX, cathodeX, wireY) {
  // Electrons are [{pos: 0..1}] travelling anode→cathode on external wire
  electrons.forEach(e => {
    // path: anode top → up to wireY → right to cathode top
    const totalLen = (wireY - 60) + (cathodeX - anodeX) + (wireY - 60)
    const travelDist = e.pos * totalLen
    let ex, ey
    const seg1 = wireY - 60 // anode vertical segment (up from elec top to wire level)
    const seg2 = cathodeX - anodeX // horizontal segment
    if (travelDist < seg1) {
      ex = anodeX
      ey = 60 + seg1 - travelDist
    } else if (travelDist < seg1 + seg2) {
      ex = anodeX + (travelDist - seg1)
      ey = wireY
    } else {
      ex = cathodeX
      ey = wireY + (travelDist - seg1 - seg2)
    }
    ctx.beginPath()
    ctx.arc(ex, ey, 4, 0, Math.PI * 2)
    ctx.fillStyle = '#facc15'
    ctx.fill()
    ctx.beginPath()
    ctx.arc(ex, ey, 2, 0, Math.PI * 2)
    ctx.fillStyle = '#fef9c3'
    ctx.fill()
  })
}

export function drawIon(ctx, x, y, symbol, color, r = 14) {
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fillStyle = color
  ctx.globalAlpha = 0.9
  ctx.fill()
  ctx.globalAlpha = 1
  ctx.strokeStyle = 'rgba(255,255,255,0.3)'
  ctx.lineWidth = 1
  ctx.stroke()
  ctx.fillStyle = '#fff'
  ctx.font = `bold ${symbol.length > 3 ? 8 : 9}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(symbol, x, y)
  ctx.textBaseline = 'alphabetic'
}

export function drawBubble(ctx, x, y, r, color) {
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.strokeStyle = color
  ctx.lineWidth = 1.5
  ctx.globalAlpha = 0.7
  ctx.stroke()
  ctx.globalAlpha = 0.15
  ctx.fillStyle = color
  ctx.fill()
  ctx.globalAlpha = 1
}

export function label(ctx, text, x, y, color = '#9ca3af', size = 11) {
  ctx.font = `${size}px sans-serif`
  ctx.fillStyle = color
  ctx.textAlign = 'center'
  ctx.fillText(text, x, y)
}

export function initIons(count, { minX, maxX, minY, maxY }, cationSymbol, anionSymbol, cationColor, anionColor) {
  const ions = []
  for (let i = 0; i < count; i++) {
    const isCation = i < count / 2
    ions.push({
      x: minX + Math.random() * (maxX - minX),
      y: minY + Math.random() * (maxY - minY),
      vx: 0, vy: 0,
      symbol: isCation ? cationSymbol : anionSymbol,
      color: isCation ? cationColor : anionColor,
      isCation,
      r: 13,
      alpha: 1,
    })
  }
  return ions
}
