import { defineStore } from 'pinia'
import type { Position } from '~~/types/portfolios'
import type { Quote } from '@@/types/eodhd'
import { useMarketQuote } from '~/composables/market/useMarketQuote'
import { usePortfolio } from '~/composables/usePortfolio'

export const usePortfolioStore = defineStore('portfolio', () => {
  /* Mock data; replace with DB fetch later */
  const { currentPortfolio, getPositions } = usePortfolio()
  const positions = ref<Position[]>([])

  watch(
    currentPortfolio,
    async (newPortfolio) => {
      if (!newPortfolio) return
      positions.value = await getPositions()
      await refresh()
    },
    { immediate: true },
  )

  const { fetchLiveQuotes } = useMarketQuote()
  const quotes = ref<Record<string, Quote>>({})
  const loading = ref(false)

  /* Load all quotes in one batched call */
  const refresh = async () => {
    if (!positions.value.length) return
    loading.value = true
    try {
      const data = await fetchLiveQuotes(positions.value.map((p) => p.symbol))
      quotes.value = data
    } catch (e) {
      console.error('Failed to fetch quotes:', e)
    } finally {
      loading.value = false
    }
  }

  /* Helpers */
  const marketValue = computed(() =>
    positions.value.reduce(
      (sum, p) => sum + (quotes.value[p.symbol]?.close ?? 0) * p.shares,
      0,
    ),
  )
  const costBasis = computed(() =>
    positions.value.reduce((sum, p) => sum + p.cost * p.shares, 0),
  )
  const gain = computed(() => marketValue.value - costBasis.value)
  const gainPct = computed(() => (gain.value / costBasis.value) * 100)

  return { positions, quotes, loading, refresh, marketValue, gain, gainPct }
})
