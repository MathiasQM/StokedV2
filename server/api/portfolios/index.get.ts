import { findUserPortfolios } from '@@/server/database/queries/portfolios'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  return findUserPortfolios(user.id)
})
