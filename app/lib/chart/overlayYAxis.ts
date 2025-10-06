import type { Plugin } from 'chart.js'
import { Chart } from 'chart.js'

export const overlayYAxis: Plugin<'line'> = {
  id: 'overlayYAxis',
  afterDatasetsDraw(chart) {
    const yScale = chart.scales.y
    if (!yScale) return

    const ctx = chart.ctx
    const font = Chart.defaults.font
    const x = chart.chartArea.right - 4

    const half = font.size / 2
    const topSafe = chart.chartArea.top + half // top text centre
    const bottomSafe = chart.chartArea.bottom - half // bottom text centre

    ctx.save()
    ctx.font = `${font.size}px ${font.family}`
    ctx.fillStyle = '#b0b0b0'
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'

    const ticks = yScale.ticks
    const step = Math.ceil(ticks.length / 4)

    ticks.forEach((t, i) => {
      if (i % step) return

      let y = yScale.getPixelForTick(i)

      if (y < topSafe) y = topSafe
      if (y > bottomSafe) y = bottomSafe

      if (y === topSafe) ctx.textBaseline = 'top'
      else if (y === bottomSafe) ctx.textBaseline = 'bottom'
      else ctx.textBaseline = 'middle'

      ctx.fillText(t.label!, x, y)
    })

    ctx.restore()
  },
}
