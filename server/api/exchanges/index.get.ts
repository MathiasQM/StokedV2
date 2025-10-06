import { eodUrl } from '../../utils/eodUrl'
import type { Exchange } from '@@/types/eodhd'

export default defineCachedEventHandler(
  () => $fetch<Exchange[]>(eodUrl('exchanges-list')),
  { maxAge: 24 * 60 * 60 /* 24 h */ },
)
