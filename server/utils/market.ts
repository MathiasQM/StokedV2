import type { LiveQuote } from '@@/types/eodhd'

/**
 * Fetches live quotes directly. This function is safe to use on the server
 * as it has no dependency on Pinia or other Vue-context utilities.
 * @param symbols - A single symbol or an array of symbols (e.g., 'AAPL.US').
 * @returns A record mapping the symbol to its live quote data.
 */
export async function fetchLiveQuotesFromServer(
  symbols: string | string[],
): Promise<Record<string, LiveQuote>> {
  const list = Array.isArray(symbols) ? symbols : [symbols]
  if (list.length === 0) {
    return {}
  }

  const urlSafe = encodeURIComponent(list.join(','))

  // $fetch is Nuxt's universal fetch utility. On the server, it can call
  // internal routes or external APIs directly.
  const data = await $fetch<LiveQuote | LiveQuote[]>(
    `/api/quote?symbols=${urlSafe}`,
  )

  const quotes: Record<string, LiveQuote> = {}
  const arr = Array.isArray(data) ? data : data ? [data] : []

  for (const q of arr) {
    if (q && q.code) {
      quotes[q.code] = q
    }
  }

  return quotes
}
