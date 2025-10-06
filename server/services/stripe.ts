import { env } from '@@/env'
import Stripe from 'stripe'
import { TIER_RANK, INT_RANK } from '@@/types/stripePlans'

const config = useRuntimeConfig()

const stripeEnv =
  config.public.enviroment === 'production'
    ? config.nuxtStripeSecretKey
    : config.nuxtStripeTestSecretKey

if (!stripeEnv) {
  throw new Error(
    `Stripe secret key (Enviroment: ${stripeEnv})! SecretKey: ${stripeEnv}, ${config.public.enviroment} is not set. ${config.nuxtStripeSecretKey} or ${config.nuxtStripeTestSecretKey} is required.`,
  )
}

export const stripe = new Stripe(stripeEnv)

export interface CreateCheckoutSessionParams {
  customerId: string
  priceId: string
}

export type Plan = 'pro' | 'unlimited'
export type Interval = 'month' | 'year'
export type SwitchDecision = 'immediate' | 'scheduled' | 'reject'

interface PlanMeta {
  plan: Plan
  interval: Interval
}

export const stripeService = {
  async createCustomer(portfolioId: string, email: string) {
    try {
      const customer = await stripe.customers.create({
        email,
        metadata: { portfolioId },
      })
      return customer.id
    } catch (error) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to create Stripe customer',
      })
    }
  },

  async createCheckoutSession({
    customerId,
    priceId,
  }: CreateCheckoutSessionParams) {
    try {
      return await stripe.checkout.sessions.create({
        customer: customerId,
        billing_address_collection: 'required',
        customer_update: {
          address: 'auto',
        },
        allow_promotion_codes: true,
        success_url: `${env.BASE_URL}/billing?success=true`,
        cancel_url: `${env.BASE_URL}/billing?cancel=true`,
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
      })
    } catch {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to create checkout session',
      })
    }
  },

  async getCheckoutSession(sessionId: string) {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId)
      return session
    } catch {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to get checkout session',
      })
    }
  },

  async getSubscription(subscriptionId: string) {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId)
      return subscription
    } catch {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to get subscription',
      })
    }
  },

  async createBillingPortalSession(customerId: string) {
    try {
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
      })
      return session
    } catch {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to create billing portal session',
      })
    }
  },
  async cancelSubscriptionNow(subscriptionId: string) {
    try {
      await stripe.subscriptions.cancel(subscriptionId, {
        invoice_now: true,
        prorate: true, // refund unused period
      })
    } catch (error) {
      throw createError({
        statusCode: 502,
        statusMessage: 'Failed to cancel Stripe subscription',
      })
    }
  },
  async deleteCustomer(customerId: string) {
    try {
      await stripe.customers.del(customerId)
    } catch (error) {
      throw createError({
        statusCode: 502,
        statusMessage: 'Failed to delete Stripe customer',
      })
    }
  },
  async upgradeSubscription(subscriptionId: string, newPriceId: string) {
    try {
      // 1) fetch to get the item-id we must mutate
      const sub = await stripe.subscriptions.retrieve(subscriptionId)
      const itemId = sub.items.data[0].id // single-item subs only

      // 2) update the price on that item
      const updated = await stripe.subscriptions.update(subscriptionId, {
        proration_behavior: 'create_prorations',
        items: [{ id: itemId, price: newPriceId }],
      })
      return updated
    } catch (error) {
      throw createError({
        statusCode: 502,
        statusMessage: 'Failed to upgrade Stripe subscription',
      })
    }
  },
  decideSwitch(current: PlanMeta, target: PlanMeta): SwitchDecision {
    const tierDelta = TIER_RANK[target.plan] - TIER_RANK[current.plan]
    const intDelta = INT_RANK[target.interval] - INT_RANK[current.interval]

    const isUpgrade = tierDelta > 0 || (tierDelta === 0 && intDelta > 0)
    const isDowngrade = tierDelta < 0 || (tierDelta === 0 && intDelta < 0)

    if (isUpgrade) return 'immediate' // ← upgrade NOW
    if (isDowngrade) return 'scheduled' // ← downgrade later
    return 'reject'
  },
  async upgradeNow(subscriptionId: string, newPriceId: string) {
    const sub = await stripe.subscriptions.retrieve(subscriptionId)
    const item = sub.items.data[0]

    // 2) swap the price **and** tell Stripe to invoice immediately
    //    –  proration_behavior: 'always_invoice'
    //    –  payment_behavior: 'error_if_incomplete'
    const updated = await stripe.subscriptions.update(subscriptionId, {
      items: [{ id: item.id, price: newPriceId }],
      proration_behavior: 'always_invoice',
      payment_behavior: 'error_if_incomplete',
      expand: ['latest_invoice.payment_intent'],
    })

    return updated
  },
}
