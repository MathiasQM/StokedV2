import type { Exchange, TickerMeta } from '@@/types/eodhd'

export const useExchanges = () => {
  const list = useState<Exchange[]>('exch-list', () => [])
  const symbol = useState<Record<string, TickerMeta[]>>('exch-sym', () => ({}))

  const fetchList = async () => {
    if (list.value.length) return list.value
    const { data, error } = await useFetch<Exchange[]>('/api/exchanges', {
      server: true,
      method: 'GET',
    })
    if (error.value) throw error.value
    list.value = data.value
    return list.value
  }

  const fetchSymbols = async (code: string) => {
    if (symbol.value[code]) return symbol.value[code]
    const { data, error } = await useFetch<TickerMeta[]>(
      `/api/exchanges/symbols?code=${code}`,
      { server: true, method: 'GET' },
    )
    if (error.value) throw error.value
    symbol.value[code] = data.value
    return symbol.value[code]
  }

  return { fetchList, fetchSymbols }
}
