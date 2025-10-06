import type { TickerMeta } from '@@/types/eodhd'
import { getQuery } from 'h3'
import { eodUrl } from '../../utils/eodUrl'

export default defineCachedEventHandler(
  async (event) => {
    const { code } = getQuery(event)
    if (!code)
      throw createError({
        statusCode: 400,
        statusMessage: 'exchange code req.',
      })
    return await $fetch<TickerMeta[]>(eodUrl(`exchange-symbol-list/${code}`))
  },
  { maxAge: 24 * 60 * 60 },
)
