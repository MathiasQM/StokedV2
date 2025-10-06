export const usePortfolioPreferences = () => {
  const lastPortfolioSlug = useCookie('lastPortfolioSlug', {
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: '/',
  })

  const setLastUsedPortfolio = (slug: string) => {
    lastPortfolioSlug.value = slug
  }

  const getLastUsedPortfolio = () => {
    return lastPortfolioSlug.value
  }

  return {
    setLastUsedPortfolio,
    getLastUsedPortfolio,
  }
}
