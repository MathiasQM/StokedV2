import { stripeService } from '@@/server/services/stripe'
import { validatePortfolioOwnership } from '@@/server/utils/portfolioValidation.ts'
import { getCustomerByUserId } from '@@/server/database/queries/customers'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<{ userId: string }>(event)

    if (!body.userId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'User ID is required',
      })
    }

    // await validatePortfolioOwnership(event, body.userId)

    const customer = await getCustomerByUserId(body.userId)
    if (!customer) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Customer not found',
      })
    }

    const session = await stripeService.createBillingPortalSession(customer.id)
    return session.url
  } catch (error) {
    if (error instanceof Error) throw error
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create billing portal session',
    })
  }
})
