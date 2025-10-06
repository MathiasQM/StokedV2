import Stripe from 'stripe'
import { env } from '@@/env'
import {
  createOrUpdateStripeProduct,
  createOrUpdateStripePrice,
} from '@@/server/database/queries/stripe'
import { consola } from 'consola'

export default defineEventHandler(async (event) => {
  const stripe = new Stripe(env.NUXT_STRIPE_SECRET_KEY as string)
  consola.start('Syncing Stripe products and prices...')
  try {
    const products = await stripe.products.list({ active: true })
    consola.info(`Found ${products.data.length} active products`)
    for (const product of products.data) {
      await createOrUpdateStripeProduct({
        id: product.id,
        name: product.name,
        description: product.description,
        active: product.active,
        metadata: product.metadata,
        features: product.marketing_features,
      })
    }
    // Fetch all active prices
    consola.info('💰 Fetching prices...')
    const prices = await stripe.prices.list({ active: true })
    consola.info(`Found ${prices.data.length} active prices`)
    for (const price of prices.data) {
      const productId =
        typeof price.product === 'string' ? price.product : price.product.id

      const knownProductIds = new Set(products.data.map((p) => p.id))

      if (!knownProductIds.has(productId)) {
        consola.warn(
          `⛔ Skipping price ${price.id} because its product ${productId} is not active or missing`,
        )
        continue
      }

      await createOrUpdateStripePrice({
        id: price.id,
        type: price.type,
        currency: price.currency,
        unitAmount: price.unit_amount ?? 0,
        interval: price.recurring?.interval ?? 'month',
        intervalCount: price.recurring?.interval_count ?? 1,
        productId,
        description: price.nickname,
        active: price.active,
        metadata: price.metadata,
        trialPeriodDays: price.recurring?.trial_period_days,
      })
    }
  } catch (error) {
    consola.error('Error syncing products:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Error syncing products',
    })
  }
  return 'Stripe data synced successfully'
})
