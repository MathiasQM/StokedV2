import { defineStore } from 'pinia'
import { useNewsFeed } from '~/composables/useNewsFeed'
import type { NewsItem } from '@@/types/eodhd'

export const useNewsStore = defineStore('news', () => {
  const pool = ref<Record<string, NewsItem[]>>({})

  const loadNews = async (sym: string, n = 5) => {
    if (pool.value[sym]) return
    const { fetchNews } = useNewsFeed()
    pool.value[sym] = await fetchNews(sym, n)
  }

  return { pool, loadNews }
})
