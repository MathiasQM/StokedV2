import { z } from 'zod'
import type { Portfolio } from '@@/types/database'
import type { TickerMeta } from '@@/types/eodhd'
import type { Position } from '~~/types/portfolios'

export interface NewPosition extends TickerMeta {}

export const usePortfolio = () => {
  const { user } = useUserSession()
  const toast = useToast()
  const portfolioSchema = z.object({
    name: z.string().min(1, 'Portfolio name is required'),
    logo: z.string().optional(),
    slug: z
      .string()
      .min(1, 'Portfolio slug is required')
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        'Only lowercase letters, numbers, and single hyphens between characters allowed',
      ),
  })

  const router = useRouter()
  const portfolioSlug = computed(
    () => router.currentRoute.value.params.portfolio as string,
  )

  const loading = ref(false)
  const portfolios = useState<Portfolio[]>('portfolios', () => [])
  const newPortfolioPositions = useState<NewPosition[]>(
    'new-portfolio-positions',
    () => [],
  )

  const addPosition = (stock: TickerMeta) => {
    const isAlreadyAdded = newPortfolioPositions.value.some(
      (p) => p.Code === stock.Code && p.Exchange === stock.Exchange,
    )

    if (isAlreadyAdded) {
      toast.add({
        title: 'Already Added',
        description: `${stock.Code} is already in your list.`,
        // Using 'foreground' for a neutral/warning style with shadcn-vue
        color: 'success',
      })
      return
    }

    newPortfolioPositions.value.unshift(stock as NewPosition)
  }

  const removePosition = (stockCode: string) => {
    const stockToRemove = newPortfolioPositions.value.find(
      (p) => p.Code === stockCode,
    )
    newPortfolioPositions.value = newPortfolioPositions.value.filter(
      (p) => p.Code !== stockCode,
    )
    if (stockToRemove) {
      toast.add({
        title: 'Removed',
        description: `${stockToRemove.Name} has been removed.`,
      })
    }
  }

  const clearNewPortfolio = () => {
    newPortfolioPositions.value = []
  }

  const currentPortfolio = computed(() => {
    if (!portfolioSlug.value || !portfolios.value.length) {
      return portfolios.value[0] || ({} as Portfolio)
    }

    const portfolio = portfolios.value?.find(
      (portfolio) => portfolio.slug === portfolioSlug.value,
    )
    if (!portfolio) {
      throw createError('Portfolio not found')
    }
    return portfolio
  })

  const isPortfolioOwner = ref(false)
  watch(
    currentPortfolio,
    (portfolio) => {
      isPortfolioOwner.value = portfolio.ownerId === user.value?.id
    },
    { immediate: true },
  )

  const getMemberships = async () => {
    loading.value = true
    try {
      if (!user.value?.id) throw new Error('User not logged in')
      const membershipsData = await $fetch<Portfolio[]>('/api/me/memberships')
      console.log('membershipsData', membershipsData)
      portfolios.value = membershipsData ?? []
      return membershipsData as Portfolio[]
    } finally {
      loading.value = false
    }
  }
  const getPositions = async (): Promise<Position[]> => {
    return [
      { symbol: 'AAPL.US', shares: 10, cost: 150 },
      { symbol: 'MSFT.US', shares: 5, cost: 300 },
      { symbol: 'TSLA.US', shares: 5, cost: 300 },
      { symbol: 'GOOGL.US', shares: 5, cost: 300 },
    ]
  }

  const createPortfolio = async (payload: {
    name: string
    positions: any[]
  }) => {
    const newPortfolio = await $fetch<Portfolio>('/api/portfolios', {
      method: 'POST',
      body: payload,
    })

    portfolios.value = [...portfolios.value, newPortfolio]

    return newPortfolio
  }

  const updatePortfolio = async (
    portfolioId: string,
    portfolioData: Partial<z.infer<typeof portfolioSchema>>,
  ) => {
    loading.value = true
    try {
      const updatedPortfolio = await $fetch<Portfolio>(
        `/api/portfolios/${portfolioId}`,
        {
          method: 'PATCH',
          body: portfolioData,
        },
      )
      portfolios.value = portfolios.value.map((portfolio) =>
        portfolio.id === portfolioId ? updatedPortfolio : portfolio,
      )
      toast.add({
        title: 'Portfolio updated successfully',
        color: 'success',
      })
      return updatedPortfolio
    } catch (error) {
      toast.add({
        title: 'Failed to update portfolio',
        description: (error as any).statusMessage,
        color: 'error',
      })
      throw error
    } finally {
      loading.value = false
    }
  }

  const deletePortfolio = async (portfolioId: string) => {
    loading.value = true
    try {
      await $fetch(`/api/portfolios/${portfolioId}`, { method: 'DELETE' })

      const remaining = portfolios.value.filter((p) => p.id !== portfolioId)

      toast.add({
        title: 'Portfolio deleted successfully',
        color: 'success',
      })

      if (remaining.length === 0) {
        await router.replace('/market')
      } else {
        await router.replace(`/dashboard/${remaining[0].slug}`)
      }

      portfolios.value = remaining
    } catch (error) {
      toast.add({
        title: 'Failed to delete portfolio',
        description: (error as any).statusMessage,
        color: 'error',
      })
      throw error
    } finally {
      loading.value = false
    }
  }

  const inviteMember = async (email: string, role: string = 'member') => {
    loading.value = true
    try {
      await $fetch(`/api/portfolios/${currentPortfolio?.value?.id}/members`, {
        method: 'POST',
        body: { email, role },
      })
    } catch (error) {
      toast.add({
        title: 'Failed to invite member',
        description: (error as any).statusMessage,
        color: 'error',
      })
      throw error
    } finally {
      loading.value = false
    }
  }

  const cancelInvite = async (inviteId: string) => {
    loading.value = true
    try {
      await $fetch(
        `/api/portfolios/${currentPortfolio?.value?.id}/invites/${inviteId}`,
        {
          method: 'DELETE',
        },
      )
      toast.add({
        title: 'Invite cancelled successfully',
        color: 'success',
      })
    } catch (error) {
      toast.add({
        title: 'Failed to cancel invite',
        description: (error as any).statusMessage,
        color: 'error',
      })
      throw error
    } finally {
      loading.value = false
    }
  }

  const resendInvite = async (inviteId: string) => {
    loading.value = true
    try {
      await $fetch(
        `/api/portfolios/${currentPortfolio?.value?.id}/invites/${inviteId}/resend`,
        {
          method: 'POST',
        },
      )
    } catch (error) {
      toast.add({
        title: 'Failed to resend invite',
        description: (error as any).statusMessage,
        color: 'error',
      })
    }
  }

  const removePortfolioMember = async (memberId: string) => {
    loading.value = true
    try {
      if (!currentPortfolio.value?.id) return

      await $fetch(
        `/api/portfolios/${currentPortfolio.value.id}/members/${memberId}`,
        {
          method: 'DELETE',
        },
      )
      toast.add({
        title: 'Portfolio member removed successfully',
        color: 'success',
      })
    } catch (error) {
      toast.add({
        title: 'Failed to remove portfolio member',
        description: (error as any).statusMessage,
        color: 'error',
      })
      throw error
    } finally {
      loading.value = false
    }
  }

  const separatedPortfolios = computed(() => {
    const owned = []
    const others = []

    for (const p of portfolios.value) {
      if (p.ownerId === user.value.id) {
        owned.push(p)
      } else {
        others.push(p)
      }
    }

    return [owned, others] as const
  })

  return {
    loading,
    getMemberships,
    getPositions,
    createPortfolio,
    updatePortfolio,
    deletePortfolio,
    inviteMember,
    cancelInvite,
    resendInvite,
    removePortfolioMember,
    addPosition,
    removePosition,
    clearNewPortfolio,
    isPortfolioOwner,
    portfolioSchema,
    currentPortfolio,
    portfolios,
    ownedPortfolios: separatedPortfolios.value[0],
    memberPortfolios: separatedPortfolios.value[1],
    newPortfolioPositions,
  }
}
