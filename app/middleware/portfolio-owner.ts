import type { Portfolio } from '@@/types/database'
import { usePortfolio } from '@/composables/usePortfolio'

export default defineNuxtRouteMiddleware(async (to, from) => {
  const toast = useToast()
  const { loggedIn } = useUserSession()
  const portfolios = useState<Portfolio[]>('portfolios', () => [])
  const portfolioSlug = useState<string>('portfolioSlug')
  const { isPortfolioOwner } = usePortfolio()

  // Is user logged in?
  if (!loggedIn.value) {
    if (portfolioSlug.value) portfolioSlug.value = ''
    if (portfolios.value.length) portfolios.value = []
    return navigateTo('/auth/login')
  }

  // Get portfolio slug from route parameter
  const currentPortfolio = portfolios.value?.find(
    (portfolio) => portfolio.slug === (to.params.portfolio as string),
  )

  if (!currentPortfolio) {
    toast.add({
      title: 'Portfolio not found',
      color: 'error',
    })
    return navigateTo('/dashboard')
  }

  if (!isPortfolioOwner.value) {
    toast.add({
      title: 'Unauthorized',
      description: 'Only portfolio owners can access settings.',
      color: 'error',
    })
    return navigateTo('/dashboard')
  }
})
