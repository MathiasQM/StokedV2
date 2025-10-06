import { deleteStripeProduct } from '@@/server/database/queries/stripe'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const productId = getRouterParam(event, 'id')
  if (!productId) {
    throw createError({
      statusCode: 400,
      message: 'Product ID is required',
    })
  }

  try {
    await useDB()
      .delete(tables.prices)
      .where(eq(tables.prices.productId, productId))

    await deleteStripeProduct(productId)

    return { success: true }
  } catch (error) {
    console.error('Error deleting product:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to delete product',
    })
  }
})
