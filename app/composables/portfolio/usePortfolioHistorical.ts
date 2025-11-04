// /composables/usePortfolioHistorical.ts
import { ref, watch, computed } from 'vue'
import { usePortfolio } from '~/composables/usePortfolio'

// Define the shape of the data you expect from your new API
interface HistoricalDataPoint {
  date: string
  value: number
}

export function usePortfolioHistorical() {
  const { currentPortfolio } = usePortfolio()

  // 1. State for this composable
  const period = ref<'1D' | '1W' | '1M' | 'YTD' | 'ALL'>('1M')
  const chartData = ref<HistoricalDataPoint[]>([])
  const pending = ref(false)
  const error = ref<Error | null>(null)

  // 2. Its own fetcher
  async function fetchHistoricalPerformance() {
    const portfolioId = currentPortfolio.value?.id
    if (!portfolioId) return

    pending.value = true
    error.value = null
    try {
      // This is a NEW API ENDPOINT you will need to create
      chartData.value = await $fetch<HistoricalDataPoint[]>(
        `/api/portfolios/${portfolioId}/performance?period=${period.value}`,
      )
    } catch (e) {
      error.value = e as Error
      chartData.value = []
    } finally {
      pending.value = false
    }
  }

  // 3. Watch for changes to re-fetch
  watch([currentPortfolio, period], fetchHistoricalPerformance, {
    immediate: true,
  })

  // 4. Its own derived calculations
  const totalChange = computed(() => {
    if (chartData.value.length < 2) return 0
    const startValue = chartData.value[0].value
    const endValue = chartData.value[chartData.value.length - 1].value
    return endValue - startValue
  })

  const totalChangePercent = computed(() => {
    if (chartData.value.length < 2 || chartData.value[0].value === 0) return 0
    const startValue = chartData.value[0].value
    const endValue = chartData.value[chartData.value.length - 1].value
    return ((endValue - startValue) / startValue) * 100
  })

  return {
    // State
    period, // Components can set this ref (e.g., v-model)
    chartData,
    pending,
    error,
    // Derived
    totalChange,
    totalChangePercent,
  }
}
