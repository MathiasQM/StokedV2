import type { LiveQuote, HistoricalQuote } from '@@/types/eodhd'
import { useMarketStore, type DataRange } from '@@/stores/market/useMarketStore'
import { storeToRefs } from 'pinia'

export const useMarketQuote = () => {
  const marketStore = useMarketStore()
  const { selectedRange } = storeToRefs(marketStore)
  const route = useRoute()
  const symbol = route.params.symbol as string

  // per-session memo cache
  const liveQuotesCache = useState<Record<string, LiveQuote>>(
    `live-quotes-cache`,
    () => ({}),
  )
  const fetchedAt = useState<Record<string, number>>(`quote-at`, () => ({}))
  const range = useState<string>(`quote-range`, () => '')
  const historicalQuotesCache = useState<Record<string, HistoricalQuote[]>>(
    `historical-quotes-cache`,
    () => ({}),
  )

  const fullHistoricalQuotesCache = useState<Record<string, HistoricalQuote[]>>(
    'full-historical',
    () => ({}),
  )

  const fetchLiveQuotes = async (
    symbols: string | string[],
    ttl = 60_000,
  ): Promise<LiveQuote[]> => {
    const list = Array.isArray(symbols) ? symbols : [symbols]
    const now = Date.now()

    const todo = list.filter(
      (s) => !fetchedAt.value[s] || now - fetchedAt.value[s] > ttl,
    )

    if (todo.length) {
      const urlSafe = encodeURIComponent(todo.join(','))
      const { data, error } = await useFetch<LiveQuote | LiveQuote[]>(
        `/api/quote?symbols=${urlSafe}`,
        { server: true, method: 'GET' },
      )

      if (error.value) throw error.value

      const arr = Array.isArray(data.value) ? data.value : [data.value]
      for (const q of arr) {
        liveQuotesCache.value[q.code] = q
        range.value = selectedRange.value
        fetchedAt.value[q.code] = now
      }
    }

    return Object.fromEntries(
      list.map((s) => [s, liveQuotesCache.value[s]]),
    ) as Record<string, LiveQuote | undefined>
  }

  const fetchHistorical = async (
    symbol: string,
  ): Promise<HistoricalQuote[]> => {
    if (
      historicalQuotesCache.value[symbol]?.length &&
      range.value === selectedRange.value
    ) {
      console.log(`Using cached historical quotes for ${symbol}`)
      return historicalQuotesCache.value[symbol]
    }

    console.log(
      `Fetching historical quotes for ${symbol} (${selectedRange.value})`,
    )

    const from = getFromDate(selectedRange.value)
    const url = `/api/eod?symbol=${symbol}&from=${from.toISOString().slice(0, 10)}`
    const { data, error } = await useFetch<HistoricalQuote[]>(url, {
      server: true,
      method: 'GET',
    })

    if (error.value) {
      console.error('Fetch error:', error.value)
      throw error.value
    }

    if (!data.value || !Array.isArray(data.value) || data.value.length === 0) {
      throw new Error(`No historical data received for ${symbol}`)
    }

    historicalQuotesCache.value[symbol] = data.value
    range.value = selectedRange.value
    return data.value
  }
  const fetchCombinedQuotes = async (
    symbol: string,
  ): Promise<HistoricalQuote[]> => {
    const [historical, liveQuotes] = await Promise.all([
      fetchHistorical(symbol),
      fetchLiveQuotes(symbol),
    ])

    const live = liveQuotes[symbol]
    if (!live) return historical

    const latestHistorical = historical[historical.length - 1]
    const liveDate = new Date(live.timestamp * 1000).toISOString().slice(0, 10)

    if (latestHistorical?.date <= liveDate) {
      const liveCandle = {
        date: liveDate,
        open: live.open,
        high: live.high,
        low: live.low,
        close: live.close,
        adjusted_close: live.close,
        volume: live.volume ?? 0,
      }

      return [...historical, liveCandle]
    }

    return historical
  }

  const fetchFullHistory = async (
    symbol: string,
  ): Promise<HistoricalQuote[]> => {
    if (fullHistoricalQuotesCache.value[symbol])
      return fullHistoricalQuotesCache.value[symbol]

    const from = getFromDate('max') // fetch full history
    const url = `/api/eod?symbol=${symbol}&from=${from.toISOString().slice(0, 10)}`
    const { data, error } = await useFetch<HistoricalQuote[]>(url)

    if (error.value) throw error.value
    if (!data.value?.length) throw new Error(`No data for ${symbol}`)

    fullHistoricalQuotesCache.value[symbol] = data.value
    return data.value
  }

  function getFromDate(range: DataRange): Date {
    const from = new Date()
    const today = new Date()

    switch (range) {
      // case '1d':
      //   from.setDate(today.getDate() - 1)
      //   break
      case '1w':
        from.setDate(today.getDate() - 7)
        break
      case '1m':
        from.setMonth(today.getMonth() - 1)
        break
      case '3m':
        from.setMonth(today.getMonth() - 3)
        break
      case '6m':
        from.setMonth(today.getMonth() - 6)
        break
      case 'ytd':
        from.setMonth(0) // January
        from.setDate(1)
        break
      case '1y':
        from.setFullYear(today.getFullYear() - 1)
        break
      case '3y':
        from.setFullYear(today.getFullYear() - 3)
        break
      case 'max':
        from.setFullYear(today.getFullYear() - 20) // arbitrary start
        break
    }

    return from
  }

  return {
    fullHistoricalQuotesCache,
    fetchLiveQuotes,
    fetchHistorical,
    fetchCombinedQuotes,
    fetchFullHistory,
    getFromDate,
  }
}
