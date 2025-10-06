import type { NewsItem } from '@@/types/eodhd'
import { getQuery } from 'h3'
import { eodUrl } from '../../utils/eodUrl'

export default defineCachedEventHandler(
  async (event) => {
    const { symbols, limit = 5 } = getQuery(event)
    if (!symbols)
      throw createError({ statusCode: 400, statusMessage: 'symbols req.' })

    const url = eodUrl('news', { s: symbols, limit })
    return await $fetch<NewsItem[]>(url)
  },
  { maxAge: 300 },
)
