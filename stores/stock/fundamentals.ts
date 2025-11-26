import { defineStore, skipHydrate } from 'pinia'

export type FundamentalsSection = {
  data: any
  timestamp: number
}

export type FundamentalsError = {
  message: string
  statusCode?: number | null
  statusMessage?: string | null
}

export const useFundamentalsStore = defineStore('fundamentals', () => {
  const stockFundamentals = ref<
    Record<string, Record<string, FundamentalsSection>>
  >({})
  const errors = ref<Record<string, FundamentalsError | null>>({})
  const pending = ref<Set<string>>(new Set())

  const REFRESH_INTERVAL_MS = 900000 // 15 minutes

  // Helper to generate a unique key for pending requests
  const getRequestKey = (ticker: string, section: string) =>
    `${ticker}:${section}`

  function getSection(ticker: string, section: string) {
    console.log(stockFundamentals.value)
    return stockFundamentals.value[ticker]?.[section]?.data
  }

  function isFresh(ticker: string, section: string) {
    const entry = stockFundamentals.value[ticker]?.[section]
    if (!entry) return false
    return Date.now() - entry.timestamp < REFRESH_INTERVAL_MS
  }

  async function fetchStockSection(
    ticker: string,
    section: string = 'General',
  ) {
    const requestKey = getRequestKey(ticker, section)
    console.log(`[Store] fetchStockSection called for ${ticker} - ${section}`)

    if (isFresh(ticker, section)) {
      console.log(`[Store] Data is fresh for ${ticker} - ${section}`)
      return stockFundamentals.value[ticker]?.[section]?.data
    }

    if (pending.value.has(requestKey)) {
      console.log(`[Store] Request pending for ${ticker} - ${section}`)
      return
    }

    pending.value.add(requestKey)
    errors.value[ticker] = null

    try {
      const res = await $fetch<{ key: string; data: any }[]>(
        '/api/eod/fundamentals',
        {
          method: 'POST',
          body: {
            symbols: [ticker],
            filter: section,
          },
        },
      )

      // 4. Update Cache
      if (res && res.length > 0) {
        const data = res[0].data

        if (!stockFundamentals.value[ticker]) {
          stockFundamentals.value[ticker] = {}
        }

        stockFundamentals.value[ticker][section] = {
          data,
          timestamp: Date.now(),
        }

        return data
      }
    } catch (e: any) {
      const serializableError: FundamentalsError = {
        message: e.message || 'An unknown error occurred',
        statusCode: e.statusCode || null,
        statusMessage: e.statusMessage || null,
      }
      errors.value[ticker] = serializableError
      console.error(`Failed to fetch ${section} for ${ticker}:`, e)
    } finally {
      pending.value.delete(requestKey)
    }
  }

  return {
    stockFundamentals,
    errors,
    pending: skipHydrate(pending),
    getSection,
    fetchStockSection,
    isFresh,
  }
})
