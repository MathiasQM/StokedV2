import type { NewsItem } from '@@/types/eodhd'

export const useNewsFeed = () => {
  const cache = useState<Record<string, NewsItem[]>>('news-cache', () => ({}))

  const fetchNews = async (
    symbols: string | string[],
    limit = 5,
  ): Promise<NewsItem[]> => {
    const key =
      (Array.isArray(symbols) ? symbols.join(',') : symbols) + ':' + limit
    if (cache.value[key]) return cache.value[key]

    const { data, error } = await useFetch<NewsItem[]>(
      `/api/news?symbols=${encodeURIComponent(key.split(':')[0])}&limit=${limit}`,
      { server: true },
    )
    if (error.value) throw error.value
    cache.value[key] = data.value
    return data.value
  }

  return { fetchNews }
}
