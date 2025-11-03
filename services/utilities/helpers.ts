import type { Portfolio } from '@@/types/database'
import { get } from 'lodash'
import { usePortfolio } from '@/composables/usePortfolio'

interface PortfolioCreationFailure {
  name: string
  reason: string
}

type BulkCreateResponse = {
  successes: Portfolio[] // the ones we actually inserted
  failures: PortfolioCreationFailure[] // overflow or slug-duplicate
}

// export async function syncViaTink({ provider, country }) {
//   const tink = useTinkStore()
//   try {
//     await tink.connect({ country, provider })
//     await createPortfoliosFromTink()
//   } catch (err) {
//     toast.add({
//       title: 'Tink error',
//       description: (err as Error).message,
//       color: 'error',
//     })
//   }
// }

const onPortfolioCreated = (portfolioSlug: string) => {
  navigateTo(`/dashboard/${portfolioSlug}`)
}

export interface LimitCheckResult {
  isAllowed: boolean
  limit: number
  currentCount: number
  exceededBy: number
  label: string
}

export const PORTFOLIO_LIMITS = {
  free: {
    max: 1,
    label: 'Free',
  },
  prod_S4gI59wZlL3Jko: {
    max: 2,
    label: 'Pro',
  },
  prod_SLsHmiaJFUxPZp: {
    max: 4,
    label: 'Unlimited',
  },
} as const

export function checkPortfolioLimit(
  productId: string | null | undefined,
  currentCount: number,
): LimitCheckResult {
  const key = productId && PORTFOLIO_LIMITS[productId] ? productId : 'free'
  const { max, label } = PORTFOLIO_LIMITS[key]
  const exceededBy = Math.max(0, currentCount - max)

  return {
    isAllowed: exceededBy === 0,
    limit: max,
    currentCount,
    exceededBy,
    label,
  }
}
