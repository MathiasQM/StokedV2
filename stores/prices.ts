import { defineStore } from 'pinia'
import { usePrices } from '~/composables/usePrices'
import type { Quote } from '@@/types/eodhd'
import { useMarketQuote } from '~/composables/market/useMarketQuote'

export const usePricesStore = defineStore('prices', () => {
  const quotes = ref<Record<string, Quote>>({})

  const loading = ref(false)
  const error = ref<Error | null>(null)

  const loadQuotes = async (symbols: string[], ttl = 60_000) => {
    loading.value = true
    error.value = null
    try {
      const { fetchLiveQuotes } = useMarketQuote()
      console.log(symbols)
      const data = await fetchLiveQuotes(symbols, ttl)
      console.log(data)
      Object.assign(quotes.value, data)
    } catch (e: any) {
      console.log(error)
      error.value = e
    } finally {
      loading.value = false
    }
  }

  const getQuote = (sym: string) => quotes.value[sym]

  return { quotes, loading, error, loadQuotes, getQuote }
})
