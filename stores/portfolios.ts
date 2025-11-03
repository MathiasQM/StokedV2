import { useLiveQuote } from '~/composables/market/useLiveQuote'
import type { PortfolioPosition } from '~~/types/database'

export const usePortfoliosStore = defineStore('portfolios', () => {
  const positions = ref<PortfolioPosition[]>([])
  const pending = ref(false)
  const error = ref<Error | null>(null)

  const { liveQuotes, watchSymbols, unwatchSymbols } = useLiveQuote()
  const { currentPortfolio } = usePortfolio()

  async function fetchPositions() {
    const portfolioId = currentPortfolio.value?.id

    if (!portfolioId) {
      console.log('Fetch skipped: No current portfolio.')
      return
    }

    pending.value = true
    error.value = null

    try {
      const data = await $fetch<PortfolioPosition[]>(
        `/api/portfolios/${portfolioId}/positions`,
      )
      positions.value = data
    } catch (e) {
      error.value = e as Error
      positions.value = []
    } finally {
      pending.value = false
    }
  }

  watch(
    positions,
    (newPositions, oldPositions) => {
      const newSymbols = newPositions.map((p) => p.symbol)
      const oldSymbols = oldPositions?.map((p) => p.symbol) ?? []

      const symbolsToWatch = newSymbols.filter((s) => !oldSymbols.includes(s))
      const symbolsToUnwatch = oldSymbols.filter((s) => !newSymbols.includes(s))

      if (symbolsToWatch.length > 0) {
        console.log('Watching symbols:', symbolsToWatch)
        watchSymbols(symbolsToWatch)
      }

      if (symbolsToUnwatch.length > 0) {
        unwatchSymbols(symbolsToUnwatch)
      }
    },
    { immediate: true },
  )

  const positionsWithCalculations = computed(() => {
    const list = positions.value ?? []
    const quotes = liveQuotes.value

    return list.map((pos) => {
      const q = quotes[pos.symbol]

      const livePrice = q?.close || 0
      const costBasis = pos.shares * pos.costPerShare
      const marketValue = pos.shares * livePrice
      const gainLoss = marketValue - costBasis
      const gainLossPercent = costBasis === 0 ? 0 : (gainLoss / costBasis) * 100
      const todayChangePct =
        q && q.open ? ((q.close - q.open) / q.open) * 100 : 0

      return {
        ...pos,
        livePrice,
        costBasis,
        marketValue,
        gainLoss,
        gainLossPercent,
        todayChangePct: todayChangePct ?? 0,
      }
    })
  })

  const totalMarketValue = computed(() =>
    positionsWithCalculations.value.reduce(
      (total, pos) => total + pos.marketValue,
      0,
    ),
  )

  const totalCostBasis = computed(() =>
    positionsWithCalculations.value.reduce(
      (total, pos) => total + pos.costBasis,
      0,
    ),
  )

  const totalGainLoss = computed(
    () => totalMarketValue.value - totalCostBasis.value,
  )

  watch(
    currentPortfolio,
    () => {
      fetchPositions()
    },
    { immediate: true },
  )

  return {
    // state
    positions,
    pending,
    error,

    // derived
    positionsWithCalculations,
    totalMarketValue,
    totalCostBasis,
    totalGainLoss,
    // actions
    fetchPositions,
  }
})
