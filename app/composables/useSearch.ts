import type { TickerMeta } from '@@/types/eodhd'

export const useSearch = () => {
  const search = async (query: string): Promise<TickerMeta[]> => {
    if (query.trim().length < 2) {
      return []
    }

    try {
      const { data, error } = await useFetch<TickerMeta[]>(`/api/eod/search`, {
        method: 'GET',
        params: { q: query },
      })

      if (error.value) {
        console.error('Search request failed:', error.value)
        return []
      }

      return data.value || []
    } catch (e) {
      console.error('An unexpected error occurred during search:', e)
      return []
    }
  }

  return { search }
}
