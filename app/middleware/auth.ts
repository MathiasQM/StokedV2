import type { Portfolio } from '@@/types/database'
import { getInvite } from '~~/server/database/queries/portfolios'
import { usePortfolio } from '@/composables/usePortfolio'

export default defineNuxtRouteMiddleware(async (to, _from) => {
  const paramSlug =
    (Array.isArray(to.params.portfolio)
      ? to.params.portfolio[0]
      : to.params.portfolio) || ''
  const { loggedIn } = useUserSession()
  const portfolios = useState<Portfolio[]>('portfolios', () => [])
  const portfolioSlug = useState<string>('portfolioSlug')

  function handlePortfolioRedirect() {
    const { getLastUsedPortfolio, setLastUsedPortfolio } =
      usePortfolioPreferences()
    // Redirect to onboarding if no portfolios
    const memberships = portfolios.value
    const firstPortfolio = memberships[0]
    if (!firstPortfolio) {
      return navigateTo('/market')
    }
    const lastPortfolioSlug = getLastUsedPortfolio()
    const targetPortfolio =
      memberships.find((portfolio) => portfolio.slug === lastPortfolioSlug) ||
      firstPortfolio

    // Update last used portfolio and redirect
    setLastUsedPortfolio(targetPortfolio.slug)
    return navigateTo(`/dashboard/${targetPortfolio.slug}`)
  }

  // Redirect to login if not logged in
  if (!loggedIn.value) {
    if (portfolioSlug.value) portfolioSlug.value = ''
    if (portfolios.value.length) portfolios.value = []
    return navigateTo('/market')
  }

  // Check for invite token, this means the user was not logged in or did not have an account when they clicked the verification link,
  // but now has successfully logged in or created an account and can verify the invite
  const inviteToken = useCookie('invite-token')
  if (inviteToken.value) {
    // Clear the cookies
    const inviteTokenStr = inviteToken.value
    inviteToken.value = null
    const inviteEmailCookie = useCookie('invite-email')
    if (inviteEmailCookie.value) inviteEmailCookie.value = null
    // Redirect if token still valid
    try {
      await getInvite(inviteTokenStr)
      return navigateTo(`/api/portfolios/verify-invite?token=${inviteTokenStr}`)
    } catch {
      // Invalid token means user already verified it upon submitting registration
    }
  }

  // If portfolios aren't loaded yet, fetch them
  if (!portfolios.value?.length && import.meta.client) {
    portfolios.value = await usePortfolio().getMemberships()

    const fromInvite = useCookie('from-invite')
    if (fromInvite.value === 'true' && portfolios.value.length) {
      fromInvite.value = null
      // User has portfolios from accepting invite, redirect to the portfolio page
      return handlePortfolioRedirect()
    }

    if ((paramSlug || portfolioSlug.value) && !portfolios.value.length) {
      return handlePortfolioRedirect()
    }
  }

  // Redirect to onboarding or first available portfolio
  if (
    to.fullPath === '/dashboard' ||
    to.fullPath === '/dashboard' ||
    (portfolios.value.length && to.fullPath === '/dashboard/onboard')
  ) {
    return handlePortfolioRedirect()
  }

  // Validate that the portfolio in the slug belongs to the user
  if (
    paramSlug &&
    !portfolios.value.find((portfolio) => portfolio.slug === paramSlug)
  ) {
    return handlePortfolioRedirect()
  } else if (paramSlug) {
    portfolioSlug.value = paramSlug
  }
})
