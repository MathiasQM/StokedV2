import { findUserPortfolios } from '~~/server/database/queries/portfolios'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  console.log('user id in memberships get', user)
  const portfolios = await findUserPortfolios(user.id)
  console.log('portfolios', portfolios)
  return portfolios
})
