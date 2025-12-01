import { Chart } from 'chart.js/auto'

export function useTrendAnimation(
  chart: () => Chart | undefined | null,
  { segmentSize = 5, interval = 10 } = {},
) {
  const scanIndex = ref(-1)
  let timer: number | undefined

  const tick = () => {
    const c = chart()
    if (!c) return
    const ds: any = c.data.datasets[0]
    if (!ds) return

    ds.scanIndex = scanIndex.value
    c.update('none') // <= draw instantly
  }

  function start() {
    stop()
    scanIndex.value = 0
    timer = window.setInterval(() => {
      const c = chart()
      if (!c) return

      const ds: any = c.data.datasets[0]
      if (!ds || !ds.data) return

      const len = ds.data.length
      // Run until the scan window has fully passed the line
      if (scanIndex.value >= len + 50) {
        stop()
        scanIndex.value = -1 // Reset to -1 to turn off glow
        return
      }
      scanIndex.value += segmentSize
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
