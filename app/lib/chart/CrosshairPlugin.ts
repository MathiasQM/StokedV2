import type { Plugin } from 'chart.js'

/**
 *  • Draws a dashed cross-hair that snaps to every x-index
 *  • Keeps hover state alive even when the finger drifts vertically
 *  • Provides `_cross`, `_hoverIdx`, `_isHovering` flags for Vue UI
 */
export const pointerCrosshair: Plugin<'line'> = {
  id: 'pointerCrosshair',

  /* ───────────────────────────────────────────────────────── afterEvent */
  afterEvent(chart, args) {
    const e = args.event
    const store = chart as any
    const area = chart.chartArea
    const meta = chart.getDatasetMeta(0)

    /* 0. clear when pointer leaves canvas horizontally or on mouseout */
    if (e.type === 'mouseout' || e.x < area.left || e.x > area.right) {
      store._cross = undefined
      store._isHovering = false
      store._lastVibIdx = undefined
      chart.draw()
      return
    }

    /* 1. try regular hit-test (snaps to nearest x-index) */
    const hit = chart.getElementsAtEventForMode(
      e,
      'index',
      { intersect: false, axis: 'x' },
      false,
    )[0] as any | undefined

    let pt = hit?.element // Chart.js point element

    /* 2. fallback: map pointer-X → nearest parsed data point */
    if (!pt) {
      const xScale = chart.scales.x
      const xValue = xScale.getValueForPixel(e.x) // domain value (ms epoch)
      if (xValue == null) return // out of scale

      const parsed = meta._parsed as any[] // [{x,y}, …]
      let idx = parsed.findIndex((p) => p.x >= xValue)
      if (idx === -1) idx = parsed.length - 1
      pt = meta.data[idx]
    }

    /* 3. clamp Y so cross-hair never leaves plot vertically */
    const clampedY = Math.min(Math.max(pt.y, area.top), area.bottom)
    store._cross = { x: pt.x, y: clampedY }
    store._hoverIdx = pt.index // used by segment fade
    store._isHovering = true
    chart.draw() // paint-only pass

    /* 4. optional haptic tick on Android */
    const isAndroid = /Android/i.test(navigator.userAgent)
    if (isAndroid && navigator.vibrate && store._lastVibIdx !== pt.index) {
      navigator.vibrate(12) // subtle pulse
      store._lastVibIdx = pt.index
    }
  },

  /* ───────────────────────────────────────────────────────── afterDraw */
  afterDraw(chart) {
    const pos = (chart as any)._cross
    if (!pos) return

    const { ctx, chartArea } = chart
    ctx.save()
    ctx.lineWidth = 1
    ctx.setLineDash([4, 4])
    ctx.strokeStyle = '#94a3b8' // slate-400

    /* vertical */
    ctx.beginPath()
    ctx.moveTo(pos.x, chartArea.top)
    ctx.lineTo(pos.x, chartArea.bottom)
    ctx.stroke()

    /* horizontal */
    ctx.beginPath()
    ctx.moveTo(chartArea.left, pos.y)
    ctx.lineTo(chartArea.right, pos.y)
    ctx.stroke()

    ctx.restore()
  },
}
