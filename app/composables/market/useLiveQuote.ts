import { ref, computed, watchEffect, onBeforeUnmount } from 'vue'
import type { LiveQuote, HistoricalQuote } from '~~/types/eodhd'
import type { DataRange } from '~~/stores/market/useMarketStore'

const liveQuotes = ref<Record<string, LiveQuote>>({})
const watchedSymbols = ref<Set<string>>(new Set())
const historicalCache = ref<
  Record<string, Record<DataRange, HistoricalQuote[]>>
>({})

const isLoadingLive = ref(false)

let pollingInterval: ReturnType<typeof setInterval> | null = null
const pollMs = 15 * 60 * 1000 // 15 minutes

const consumerCount = ref(0)

async function fetchAllWatchedQuotes() {
  if (watchedSymbols.value.size === 0) return

  isLoadingLive.value = true
  try {
    const symbolsParam = Array.from(watchedSymbols.value).join(',')

    const data = await $fetch<LiveQuote[]>(`/api/quote?symbols=${symbolsParam}`)
    const quoteData: LiveQuote[] = Array.isArray(data) ? data : [data]
    for (const quote of quoteData) {
      liveQuotes.value[quote.code] = quote
    }
  } catch (err) {
    console.error('Failed to fetch live quotes:', err)
  } finally {
    isLoadingLive.value = false
  }
}

function ensurePolling() {
  if (!import.meta.client) return
  if (pollingInterval) return
  fetchAllWatchedQuotes()

  pollingInterval = setInterval(fetchAllWatchedQuotes, pollMs)
}

function maybeStopPolling() {
  if (!import.meta.client) return
  if (consumerCount.value > 0) return

  if (pollingInterval) {
    clearInterval(pollingInterval)
    pollingInterval = null
  }
}

function watchSymbols(symbols: string | string[]) {
  const list = Array.isArray(symbols) ? symbols : [symbols]

  const next = new Set(watchedSymbols.value)
  let changed = false

  for (const sym of list) {
    if (!sym) continue
    if (!next.has(sym)) {
      next.add(sym)
      changed = true
    }
  }

  if (changed) {
    watchedSymbols.value = next
    ensurePolling()
    fetchAllWatchedQuotes()
  }
}

function unwatchSymbols(symbols: string | string[]) {
  const list = Array.isArray(symbols) ? symbols : [symbols]

  const next = new Set(watchedSymbols.value)
  let changed = false

  for (const sym of list) {
    if (!sym) continue
    if (next.has(sym)) {
      next.delete(sym)
      changed = true
    }
  }

  if (changed) {
    watchedSymbols.value = next
  }
}

async function getHistoricalData(
  symbol: string,
  range: DataRange,
): Promise<HistoricalQuote[]> {
  const cachedForSymbol = historicalCache.value[symbol]
  if (cachedForSymbol?.[range]) {
    return cachedForSymbol[range]
  }

  const from = makeFromDate(range)
  const fromStr = from.toISOString().slice(0, 10)

  const data = await $fetch<HistoricalQuote[]>(
    `/api/eod?symbol=${symbol}&from=${fromStr}`,
  )

  if (!historicalCache.value[symbol]) {
    historicalCache.value[symbol] = {} as Record<DataRange, HistoricalQuote[]>
  }

  historicalCache.value[symbol][range] = data
  return data
}

function makeFromDate(range: DataRange): Date {
  const d = new Date()

  switch (range) {
    case '1w':
      d.setDate(d.getDate() - 7)
      break
    case '1m':
      d.setMonth(d.getMonth() - 1)
      break
    case '3m':
      d.setMonth(d.getMonth() - 3)
      break
    case '6m':
      d.setMonth(d.getMonth() - 6)
      break
    case 'ytd':
      d.setMonth(0) // Jan
      d.setDate(1)
      break
    case '1y':
      d.setFullYear(d.getFullYear() - 1)
      break
    case '3y':
      d.setFullYear(d.getFullYear() - 3)
      break
    case 'max':
      d.setFullYear(d.getFullYear() - 20)
      break
  }

  return d
}

function useQuote(symbol: string) {
  return computed(() => liveQuotes.value[symbol])
}

const allQuotes = computed(() => liveQuotes.value)
const loadingLiveQuotes = computed(() => isLoadingLive.value)

export function useLiveQuote() {
  if (import.meta.client) {
    consumerCount.value++
  }

  onBeforeUnmount(() => {
    if (import.meta.client) {
      consumerCount.value--
      maybeStopPolling()
    }
  })

  if (import.meta.client && watchedSymbols.value.size > 0) {
    ensurePolling()
  }
  console.log(allQuotes.value)

  return {
    liveQuotes: allQuotes,
    isLoading: loadingLiveQuotes,

    useQuote,
    getHistoricalData,
    watchSymbols,
    unwatchSymbols,
  }
}
