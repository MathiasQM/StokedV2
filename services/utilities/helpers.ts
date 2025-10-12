import { usePlaidStore } from '~~/stores/plaid'
import type { Portfolio } from '@@/types/database'
import { get } from 'lodash'
import type { ProviderChoice } from '~~/stores/authModal'
import { usePortfolio } from '@/composables/usePortfolio'

interface PortfolioCreationFailure {
  name: string
  reason: string
}

type BulkCreateResponse = {
  successes: Portfolio[] // the ones we actually inserted
  failures: PortfolioCreationFailure[] // overflow or slug-duplicate
}

export async function syncViaPlaid(choice?: ProviderChoice) {
  const plaid = usePlaidStore()
  const { accounts } = storeToRefs(plaid)
  const toast = useToast()
  const portfolios = useState<Portfolio[]>('portfolios')
  const { getMemberships } = usePortfolio()
  const { setLastUsedPortfolio } = usePortfolioPreferences()

  try {
    await plaid.connectBank({
      institutionId: choice?.institutionId || undefined,
      country: choice?.country,
      provider: choice?.securityProvider,
    })

    const { successes, failures } = await $fetch<BulkCreateResponse>(
      '/api/portfolios',
      {
        method: 'POST',
        body: accounts.value,
      },
    )

    if (successes.length) {
      portfolios.value.push(...successes)
      setLastUsedPortfolio(successes[0]!.slug)
      onPortfolioCreated(successes[0]!.slug)
      toast.add({
        title: 'Portfolios created',
        description: `Created ${successes.length} portfolios.`,
        color: 'success',
      })
    }

    // 4) Report any that failed
    if (failures.length) {
      failures.forEach((f, i) => {
        toast.add({
          title: `Failed to create ${failures[i]!.name}`,
          description: failures[i]?.reason,
          color: 'error',
        })
      })
      if (!successes.length) {
        throw new Error('All portfolio creations failed')
      }
    }
  } catch (error) {
    console.error(error)
    toast.add({
      title: `Failed to create portfolio`,
      description:
        (error as any).message ||
        (error as any).statusMessage ||
        'Please try again',
      color: 'error',
    })
  } finally {
    await getMemberships()
  }
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
