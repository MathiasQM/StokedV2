import { eq, and } from 'drizzle-orm'
import type {
  InsertSubscription,
  Subscription,
  Price,
  Product,
} from '@@/types/database'
import { createError } from 'h3'
import _ from 'lodash'
export type SubscriptionWithPrice = Subscription & {
  price: Price
}
export type SubscriptionWithProduct = Subscription & Product

export const upsertSubscription = async (
  subscription: InsertSubscription,
): Promise<Subscription> => {
  try {
    const [upsertedSubscription] = await useDB()
      .insert(tables.subscriptions)
      .values(subscription)
      .onConflictDoUpdate({
        target: [tables.subscriptions.id],
        set: subscription,
      })
      .returning()

    return upsertedSubscription
  } catch (error) {
    console.error(error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to upsert subscription',
    })
  }
}

export const updateSubscription = async (
  id: string,
  updates: Partial<InsertSubscription>,
  fieldsToUpdate: (keyof InsertSubscription)[],
): Promise<Subscription> => {
  const updateFields = _.pick(updates, fieldsToUpdate)

  const [updated] = await useDB()
    .update(tables.subscriptions)
    .set(updateFields)
    .where(eq(tables.subscriptions.id, id))
    .returning()

  return updated
}

export const getSubscriptionByUserId = async (
  userId: string,
): Promise<SubscriptionWithProduct> => {
  try {
    if (!userId) {
      console.error('User ID is required to get subscription')
      throw createError({
        statusCode: 400,
        statusMessage: 'User ID is required',
      })
    }

    const subscription = await useDB().query.subscriptions.findFirst({
      where: eq(tables.subscriptions.userId, userId),
      with: {
        price: { with: { product: true } },
      },
    })

    return subscription ?? null
  } catch (error) {
    console.error(error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to get subscription by user ID',
    })
  }
}
