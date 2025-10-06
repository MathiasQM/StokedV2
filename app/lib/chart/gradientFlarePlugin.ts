export const gradientFlarePlugin: Plugin<'line'> = {
  id: 'gradientFlarePlugin',

  afterDraw(chart) {
    const ds = chart.data.datasets?.[0]
    if (!ds || !Array.isArray(ds.data) || ds.data.length === 0) return

    const last = ds.data[ds.data.length - 1] as any
    if (!last || typeof last !== 'object') return

    const xVal = typeof last === 'number' ? ds.data.length - 1 : last.x
    const yVal = typeof last === 'number' ? last : last.y
    if (!isFinite(yVal)) return

    const x = chart.scales.x.getPixelForValue(xVal)
    const y = chart.scales.y.getPixelForValue(yVal)

    const { ctx, canvas } = chart
    ctx.save()
    ctx.beginPath()
    ctx.rect(0, 0, canvas.width, chart.chartArea.bottom)
    ctx.clip()

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
    ctx.restore()
  },
}
