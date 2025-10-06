import { eq, asc } from 'drizzle-orm'
import type { InsertProduct, InsertPrice } from '@@/types/database'

export const clearStripeData = async () => {
  await useDB().delete(tables.prices)
  await useDB().delete(tables.products)
}

export const createOrUpdateStripeProduct = async (payload: InsertProduct) => {
  const [product] = await useDB()
    .insert(tables.products)
    .values(payload)
    .onConflictDoUpdate({
      target: [tables.products.id],
      set: payload,
    })
    .returning()
  return product
}

export const createStripeProduct = async (payload: InsertProduct) => {
  const [product] = await useDB()
    .insert(tables.products)
    .values(payload)
    .returning()
  return product
}

export const createStripePrice = async (payload: InsertPrice) => {
  const [price] = await useDB()
    .insert(tables.prices)
    .values(payload)
    .returning()
  return price
}

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

export const getAllPlans = async () => {
  const plans = await useDB().query.prices.findMany({
    with: {
      product: true,
    },
    orderBy: (prices, { asc }) => [asc(prices.unitAmount)],
  })
  return plans
}

export const deleteStripeProduct = async (id: string) => {
  await useDB().delete(tables.products).where(eq(tables.products.id, id))
}

export const deleteStripePrice = async (id: string) => {
  await useDB().delete(tables.prices).where(eq(tables.prices.id, id))
}
