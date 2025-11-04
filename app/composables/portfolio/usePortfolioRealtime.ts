import { ref, computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useLiveQuote } from '~/composables/market/useLiveQuote'
import { usePortfoliosStore } from '~~/stores/portfolios'

export function usePortfolioRealtime() {
  const store = usePortfoliosStore()
  const { positions } = storeToRefs(store)

  const { liveQuotes, watchSymbols, unwatchSymbols } = useLiveQuote()

  //   Symbols that need to be watched are derived from the current positions
  watch(
    positions,
    (newPositions, oldPositions) => {
      const newSymbols = newPositions.map((p) => `${p.symbol}.${p.exchange}`)
      const oldSymbols =
        oldPositions?.map((p) => `${p.symbol}.${p.exchange}`) ?? []

      const symbolsToWatch = newSymbols.filter((s) => !oldSymbols.includes(s))
      const symbolsToUnwatch = oldSymbols.filter((s) => !newSymbols.includes(s))

      if (symbolsToWatch.length > 0) watchSymbols(symbolsToWatch)
      if (symbolsToUnwatch.length > 0) unwatchSymbols(symbolsToUnwatch)
    },
    { immediate: true, deep: true },
  )

  const positionsWithCalculations = computed(() => {
    const list = positions.value ?? []
    const quotes = liveQuotes.value

    return list.map((pos) => {
      const fullSymbol = `${pos.symbol}.${pos.exchange}`
      const q = quotes[fullSymbol]

      const livePrice = q?.close || 0
      const openPrice = q?.open || 0
      const costBasis = pos.shares * pos.costPerShare
      const marketValue = pos.shares * livePrice
      const gainLoss = marketValue - costBasis
      const gainLossPercent = costBasis === 0 ? 0 : (gainLoss / costBasis) * 100
      const todayChangePct =
        q && q.open ? ((q.close - q.open) / q.open) * 100 : 0
      const todayChangeDollar = (livePrice - openPrice) * pos.shares

      return {
        ...pos,
        livePrice, // The most current price
        costBasis,
        marketValue,
        gainLoss,
        gainLossPercent,
        todayChangePct: todayChangePct ?? 0,
        todayChangeDollar: todayChangeDollar ?? 0, // <-- ADD THIS
      }
    })
  })

  // --- Totals ---
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

  const portfolioGainLossPercent = computed(() => {
    if (totalCostBasis.value === 0) return 0
    return (totalGainLoss.value / totalCostBasis.value) * 100
  })

  /**
   * Total portfolio value change for the day (in dollars).
   */
  const portfolioTodayChangeDollar = computed(() =>
    positionsWithCalculations.value.reduce(
      (total, pos) => total + pos.todayChangeDollar,
      0,
    ),
  )

  /**
   * The total market value of the portfolio at the start of the day.
   * (Current Value - Today's Change)
   */
  const portfolioMarketValueAtOpen = computed(() => {
    return totalMarketValue.value - portfolioTodayChangeDollar.value
  })

  /**
   * Total portfolio value change for the day (as a percentage).
   */
  const portfolioTodayChangePercent = computed(() => {
    const mktValAtOpen = portfolioMarketValueAtOpen.value
    if (mktValAtOpen === 0) return 0
    // (Change / Original Value) * 100
    return (portfolioTodayChangeDollar.value / mktValAtOpen) * 100
  })

  return {
    // The store's state (passed through)
    positions: store.positions,
    pending: store.pending,
    error: store.error,

    // The new derived values
    positionsWithCalculations,
    totalMarketValue,
    totalCostBasis,
    totalGainLoss,
    portfolioGainLossPercent,
    portfolioTodayChangeDollar,
    portfolioTodayChangePercent,
  }
}
