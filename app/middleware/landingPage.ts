export default defineNuxtRouteMiddleware(async (to, _from) => {
  const { loggedIn } = useUserSession()
  const { getLastUsedPortfolio, setLastUsedPortfolio } =
    usePortfolioPreferences()

  if (loggedIn.value) {
    const lastPortfolioSlug = getLastUsedPortfolio()
    const url = lastPortfolioSlug
      ? `/dashboard/${lastPortfolioSlug}`
      : '/market'
    return navigateTo(url)
  }
})
