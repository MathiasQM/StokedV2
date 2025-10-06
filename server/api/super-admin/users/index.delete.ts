import { eq } from 'drizzle-orm'
import { getSubscriptionByUserId } from '~~/server/database/queries/subscriptions'
import { stripeService } from '@@/server/services/stripe'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  if (!user.superAdmin) {
    throw createError({
      statusCode: 403,
      statusMessage: 'You are not authorized to access this resource',
    })
  }
  const { userId } = await readBody(event)
  if (!userId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'User ID is required',
    })
  }

  const db = useDB()

  const subscription = await getSubscriptionByUserId(userId)

  const [customerRow] = await db
    .select()
    .from(tables.customers)
    .where(eq(tables.customers.userId, userId))
    .limit(1)

  if (subscription) await stripeService.cancelSubscriptionNow(subscription.id)

  if (customerRow) await stripeService.deleteCustomer(customerRow.id)

  // Cascade db effect handles all other deletions
  const userRecord = await useDB()
    .delete(tables.users)
    .where(eq(tables.users.id, userId))
    .returning()

  return userRecord[0]
})
