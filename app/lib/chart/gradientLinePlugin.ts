export const gradientLinePlugin: Plugin<'line'> = {
  id: 'gradientLine',

  afterDraw(chart) {
    const ds = chart.data.datasets[0]
    if (!ds?.data.length) return

    const idx = ds.data.length - 1
    const point = ds.data[idx] as any

    const xVal = typeof point === 'number' ? idx : point.x
    const yVal = typeof point === 'number' ? point : point.y
    if (!isFinite(yVal)) return

    const x = chart.scales.x.getPixelForValue(xVal)
    const y = chart.scales.y.getPixelForValue(yVal)

    const { ctx, canvas } = chart

    /* ───── push a new state and override the clip ───── */
    ctx.save()
    ctx.beginPath()
    ctx.rect(
      0,
      0, // allow drawing above chartArea.top
      canvas.width,
      chart.chartArea.bottom, // only up to bottom of chart
    )
    ctx.clip()

    /* gradient stroke */
    const grad = ctx.createLinearGradient(0, y - 100, 0, y + 100)
    grad.addColorStop(0, 'rgba(0,0,0,0)')
    grad.addColorStop(0.5, (ds.borderColor as string) ?? '#ff5000')
    grad.addColorStop(1, 'rgba(0,0,0,0)')

    ctx.lineWidth = 1
    ctx.strokeStyle = grad
    ctx.beginPath()
    ctx.moveTo(x, y - 100)
    ctx.lineTo(x, y + 100)
    ctx.stroke()

    ctx.restore() // pop only *our* state
  },
}
