export function useTrendAnimation(
  chart: () => Chart | undefined,
  { segmentSize = 100, interval = 20 } = {},
) {
  const opaque = ref(-1)
  let timer: number | undefined

  const tick = () => {
    const c = chart()
    if (!c) return
    const ds: any = c.data.datasets[0]
    ds.opaqueIndex = opaque.value
    c.update('none') // <= draw instantly
  }

  function start() {
    stop()
    opaque.value = 0
    timer = window.setInterval(() => {
      const c = chart()
      if (!c) return
      const len = c.data.datasets[0].data.length
      if (opaque.value >= len + segmentSize + 50) {
        const ds: any = c.data.datasets[0]
        const final = ds.finalColor ?? ds.borderColor // use custom if present
        ds.segment.borderColor = final
        ds.borderColor = final // solid line
        c.update('none')
        return
      }
      opaque.value += segmentSize - 90 // same “-90 +100” hop as original
    }, interval)
  }
  const stop = () => {
    if (timer) window.clearInterval(timer)
  }

  watchEffect(tick)
  onUnmounted(stop)

  return { start, stop }
}
