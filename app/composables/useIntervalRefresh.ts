import { onUnmounted, ref } from 'vue' // <-- 1. Import ref

/**
 * Executes a function on the hour and every 15 minutes thereafter
 * (e.g., at :00, :15, :30, :45) and provides a reactive countdown.
 * @param fn The function to execute.
 * @returns A reactive ref (countdown) with the time remaining (MM:SS).
 */
export const useIntervalRefresh = (fn: () => any) => {
  // 2. Create a reactive ref for the countdown string
  const countdown = ref('00:00')

  if (import.meta.client) {
    let initialTimeoutId: number | undefined
    let refreshIntervalId: number | undefined // For the actual refresh
    let countdownIntervalId: number | undefined // For the 1-second display timer

    const fifteenMinutesInMs = 15 * 60 * 1000

    // This function schedules the *actual* data refresh
    const scheduleRefresh = () => {
      const now = new Date()
      const msPastTheHour =
        (now.getMinutes() * 60 + now.getSeconds()) * 1000 +
        now.getMilliseconds()
      const remainder = msPastTheHour % fifteenMinutesInMs
      const delay = remainder === 0 ? 0 : fifteenMinutesInMs - remainder

      initialTimeoutId = window.setTimeout(() => {
        fn()
        refreshIntervalId = window.setInterval(fn, fifteenMinutesInMs)
      }, delay)
    }

    // 3. This new function updates the countdown display every second
    const updateCountdown = () => {
      const now = new Date()
      const msPastTheHour =
        (now.getMinutes() * 60 + now.getSeconds()) * 1000 +
        now.getMilliseconds()
      const remainder = msPastTheHour % fifteenMinutesInMs
      const msRemaining = fifteenMinutesInMs - remainder

      // Format to MM:SS
      const totalSeconds = Math.floor(msRemaining / 1000)
      const minutes = Math.floor(totalSeconds / 60)
      const seconds = totalSeconds % 60

      countdown.value = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }

    // 4. Start both processes
    scheduleRefresh() // Schedule the data refresh
    updateCountdown() // Run countdown logic once immediately
    countdownIntervalId = window.setInterval(updateCountdown, 1000) // Update countdown every second

    // 5. Clean up all timers on unmount
    onUnmounted(() => {
      window.clearTimeout(initialTimeoutId)
      window.clearInterval(refreshIntervalId)
      window.clearInterval(countdownIntervalId) // <-- Clear the new interval
    })
  }

  // 6. Return the reactive countdown for the component to use
  return { countdown }
}
