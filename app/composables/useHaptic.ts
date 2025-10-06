export const useHaptic = () => {
  const trigger = (duration: number = 5) => {
    if (window.navigator && window.navigator.vibrate) {
      // Check if the Vibration API is supported by the browser

      window.navigator.vibrate(duration)
    } else {
      // Fallback to the iOS 18+ input workaround
      const hapticLabel = document.getElementById(
        'haptic-label',
      ) as HTMLLabelElement

      if (hapticLabel) {
        const clickEvent = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          view: window,
        })

        hapticLabel.dispatchEvent(clickEvent)
      }
    }
  }

  return {
    triggerHaptic: trigger,
  }
}
