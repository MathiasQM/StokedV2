import Fuse from 'fuse.js'
import { useExchanges } from './useExchanges'
import type { TickerMeta } from '@@/types/eodhd'

export const useSearch = () => {
  const { fetchSymbols } = useExchanges()
  const fuse = shallowRef<Fuse<TickerMeta>>()
  const ready = ref(false)

  const ensureIndex = async () => {
    if (ready.value) return
    // Pull US list by default (virtual “US” covers NYSE+NASDAQ)
    const us = await fetchSymbols('US')
    fuse.value = new Fuse(us, { keys: ['Code', 'Name'], threshold: 0.3 })
    ready.value = true
  }

  const search = async (q: string, limit = 10) => {
    await ensureIndex()
    return fuse
      .value!.search(q)
      .slice(0, limit)
      .map((r) => r.item)
  }

  return { search, ready }
}
