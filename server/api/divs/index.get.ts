import type { CorporateAction } from '@@/types/eodhd'
import { getQuery } from 'h3'
import { eodUrl } from '../../utils/eodUrl'

export default defineCachedEventHandler(
  async (event) => {
    const { symbol } = getQuery(event)
    if (!symbol)
      throw createError({ statusCode: 400, statusMessage: 'symbol req.' })

    return await $fetch<CorporateAction[]>(eodUrl(`div/${symbol}`))
  },
  { maxAge: 60 * 60 },
)
