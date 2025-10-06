import type { CorporateAction } from '@@/types/eodhd'

export const useCorporateActions = () => {
  const cache = useState<Record<string, CorporateAction[]>>(
    'corp-cache',
    () => ({}),
  )

  const fetchEvents = async (symbol: string) => {
    if (cache.value[symbol]) return cache.value[symbol]
    const { data, error } = await useFetch<CorporateAction[]>(
      `/api/divs?symbol=${symbol}`,
      { server: true },
    )
    if (error.value) throw error.value
    cache.value[symbol] = data.value
    return data.value
  }

  return { fetchEvents }
}
