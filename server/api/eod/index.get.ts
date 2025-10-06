import type { Candle } from '@@/types/eodhd'
import { getQuery } from 'h3'
import { eodUrl } from '../../utils/eodUrl'

export default defineCachedEventHandler(
  async (event) => {
    const { symbol, from, to } = getQuery(event)
    if (!symbol) {
      throw createError({ statusCode: 400, statusMessage: 'symbol required' })
    }

    const url = eodUrl(`eod/${symbol}`, { from, to })
    return await $fetch<Candle[]>(url)
  },
  { maxAge: 60 * 60 },
) // 1 h cache
