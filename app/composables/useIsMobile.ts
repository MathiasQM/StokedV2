import { useRequestHeaders } from 'nuxt/app'
import { useBreakpoints, breakpointsTailwind } from '@vueuse/core'

export const useIsMobile = () => {
  if (import.meta.server) {
    const ua = useRequestHeaders()['user-agent'] || ''
    return /iphone|android|mobile|ipod|blackberry|phone/i.test(ua)
  }

  const bp = useBreakpoints(breakpointsTailwind)
  return bp.smaller('md')
}