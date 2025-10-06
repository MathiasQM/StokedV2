import { getSubscriptionByUserId } from '@@/server/database/queries/subscriptions'
export default defineEventHandler(async (event) => {
  const { userId, includeProduct } = getQuery(event)
  const subscription = await getSubscriptionByUserId(userId as string, {
    includeProduct: includeProduct === 'true' || includeProduct === true,
  })
  return subscription
})
