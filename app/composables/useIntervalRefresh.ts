import { onUnmounted } from 'vue' // Or your framework's equivalent

/**
 * Executes a function on the hour and every 15 minutes thereafter
 * (e.g., at :00, :15, :30, :45).
 * @param fn The function to execute.
 */
export const useIntervalRefresh = (fn: () => any) => {
  if (import.meta.client) {
    let initialTimeoutId: number | undefined
    let intervalId: number | undefined

    const fifteenMinutesInMs = 15 * 60 * 1000

    const scheduleRuns = () => {
      const now = new Date()
      const msPastTheHour =
        (now.getMinutes() * 60 + now.getSeconds()) * 1000 +
        now.getMilliseconds()
      const remainder = msPastTheHour % fifteenMinutesInMs
      const delay = remainder === 0 ? 0 : fifteenMinutesInMs - remainder

      initialTimeoutId = window.setTimeout(() => {
        fn()

        intervalId = window.setInterval(fn, fifteenMinutesInMs)
      }, delay)
    }

    scheduleRuns()

    onUnmounted(() => {
      window.clearTimeout(initialTimeoutId)
      window.clearInterval(intervalId)
    })
  }
}
