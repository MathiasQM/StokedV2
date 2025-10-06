import type { QuoteResponse } from '@@/types/eodhd'
import { getQuery } from 'h3'
import { eodUrl } from '../../utils/eodUrl'

export default defineCachedEventHandler(
  async (event) => {
    const { symbol, symbols } = getQuery(event)
    // Accept either ?symbol=AAPL.US or ?symbols=AAPL.US,MSFT.US
    const main = (symbol as string) || ''
    const extra = (symbols as string) || ''
    if (!main && !extra) {
      throw createError({
        statusCode: 400,
        statusMessage: 'symbol(s) required',
      })
    }

    const path = `real-time/${main || extra.split(',')[0]}`
    const url = eodUrl(path, extra ? { s: extra } : {})

    const data = await $fetch<QuoteResponse>(url).catch((err) => {
      console.error('EODHD quote error', err)
      throw createError({ statusCode: 502, statusMessage: 'EODHD error' })
    })

    return data
  },
  {
    // cache for 60s on the server
    maxAge: 60,
  },
)
