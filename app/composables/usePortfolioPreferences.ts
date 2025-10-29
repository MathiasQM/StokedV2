import { ref, watch } from 'vue'

export const usePortfolioPreferences = () => {
  const lastPortfolioSlug = useCookie('lastPortfolioSlug', {
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: '/',
  })

  const setLastUsedPortfolio = (slug: string) => {
    lastPortfolioSlug.value = slug
  }

  const getLastUsedPortfolio = () => {
    return lastPortfolioSlug.value
  }

  const { currentPortfolio } = usePortfolio()

  const portfolioSettings = ref({})

  const getStorageKey = (portfolioId) => {
    if (!portfolioId) return null
    return `portfolio-settings-${portfolioId}`
  }

  watch(
    currentPortfolio,
    (newPortfolio) => {
      if (process.client && newPortfolio?.id) {
        const key = getStorageKey(newPortfolio.id)
        const storedSettings = localStorage.getItem(key)
        portfolioSettings.value = storedSettings
          ? JSON.parse(storedSettings)
          : {}
      } else {
        portfolioSettings.value = {}
      }
    },
    { immediate: true },
  )

  watch(
    portfolioSettings,
    (newSettings) => {
      if (process.client && currentPortfolio.value?.id) {
        const key = getStorageKey(currentPortfolio.value.id)
        localStorage.setItem(key, JSON.stringify(newSettings))
      }
    },
    { deep: true },
  )

  const useManagedSetting = (key: any, defaultValue: any) => {
    return computed({
      get() {
        return portfolioSettings.value[key] ?? defaultValue
      },
      set(newValue) {
        portfolioSettings.value = {
          ...portfolioSettings.value,
          [key]: newValue,
        }
      },
    })
  }

  return {
    // Global preference functions
    setLastUsedPortfolio,
    getLastUsedPortfolio,

    // Portfolio-specific settings manager
    useManagedSetting,
  }
}
