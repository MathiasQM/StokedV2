export const useIntervalRefresh = (fn: () => any, ms = 60_000) => {
  if (import.meta.client) {
    const id = setInterval(fn, ms)
    onUnmounted(() => clearInterval(id))
  }
}
