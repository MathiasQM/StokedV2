import { Chart } from 'chart.js/auto'

export function useTrendAnimation(
  chart: () => Chart | undefined | null,
  { segmentSize = 100, interval = 20 } = {},
) {
  const opaque = ref(-1)
  let timer: number | undefined

  const tick = () => {
    const c = chart()
    if (!c) return
    const ds: any = c.data.datasets[0]
    if (!ds) return

    ds.opaqueIndex = opaque.value
    c.update('none') // <= draw instantly
  }

  function start() {
    stop()
    opaque.value = 0
    timer = window.setInterval(() => {
      const c = chart()
      if (!c) return

      const ds: any = c.data.datasets[0]
      if (!ds || !ds.data) return

      const len = ds.data.length
      if (opaque.value >= len + segmentSize + 50) {
        const final = ds.finalColor ?? ds.borderColor // use custom if present
        ds.segment.borderColor = final
        ds.borderColor = final // solid line
        c.update('none')
        stop() // Stop the timer once done
        return
      }
      opaque.value += segmentSize - 90 // same “-90 +100” hop as original
    }, interval)
  }

  const stop = () => {
    if (timer) {
      window.clearInterval(timer)
      timer = undefined
    }
  }

  watchEffect(tick)
  onUnmounted(stop)

  return { start, stop }
}
