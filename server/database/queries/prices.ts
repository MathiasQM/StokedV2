import { eq, and } from 'drizzle-orm'
import type { Price } from '@@/types/database'
import { createError } from 'h3'

export const createOrUpdateStripePrice = async (payload: InsertPrice) => {
  const [price] = await useDB()
    .insert(tables.prices)
    .values(payload)
    .onConflictDoUpdate({
      target: [tables.prices.id],
      set: payload,
    })
    .returning()
  return price
}

export const getPriceByPriceId = async (
  priceId: string,
): Promise<Price | null> => {
  try {
    const [subscription] = await useDB()
      .select()
      .from(tables.prices)
      .where(eq(tables.prices.id, priceId))
    return subscription ?? null
  } catch (error) {
    console.error(error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to get price by price ID',
    })
  }
}
