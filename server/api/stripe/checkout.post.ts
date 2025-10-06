import {
  Interval,
  Plan,
  stripeService,
  stripe,
} from '@@/server/services/stripe'
import { validatePortfolioOwnership } from '@@/server/utils/portfolioValidation.ts'
import { upsertSubscription } from '@@/server/database/queries/subscriptions'

import {
  getCustomerByUserId,
  createCustomer,
} from '@@/server/database/queries/customers'
import { getSubscriptionByUserId } from '~~/server/database/queries/subscriptions'
import { getPriceByPriceId } from '~~/server/database/queries/prices'
import type Stripe from 'stripe'
import { PRODUCT_TO_TIER } from '~~/types/stripePlans'

interface CheckoutBody {
  priceId: string
  userId: string
}

type CheckoutSuccess =
  | { success: true; url: string }
  | { success: true; decision: 'reject' | 'scheduled' | 'immediate' }

async function getOrCreateCustomer(user: { id: string; email: string }) {
  try {
    const customerRecord = await getCustomerByUserId(user.id)
    if (customerRecord) {
      return customerRecord.id
    }

    const newCustomerId = await stripeService.createCustomer(
      user.id,
      user.email,
    )
    await createCustomer({
      id: newCustomerId,
      userId: user.id,
    })
    return newCustomerId
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to get or create customer',
    })
  }
}

export default defineEventHandler<CheckoutSuccess>(
  async (event): Promise<CheckoutSuccess> => {
    try {
      const { user } = await requireUserSession(event)
      const body = await readBody<CheckoutBody>(event)

      if (!body.priceId || !body.userId) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Price ID and user ID slug are required',
        })
      }

      const customerId = await getOrCreateCustomer(user)

      const existingSub = await getSubscriptionByUserId(user.id)
      if (existingSub) {
        if (existingSub.priceId === body.priceId) {
          // already on that plan -> nothing to do
          throw createError({
            statusCode: 400,
            statusMessage: 'Already on that plan',
          })
        }

        const targetPrice = await getPriceByPriceId(body.priceId)

        if (!targetPrice) {
          throw createError({
            statusCode: 400,
            statusMessage: 'Unable to find target price by price ID',
          })
        }

        const decision = stripeService.decideSwitch(
          {
            plan: PRODUCT_TO_TIER[existingSub.price.productId], // 'pro'
            interval: existingSub.price.interval as Interval, // 'month'
          },
          {
            plan: PRODUCT_TO_TIER[targetPrice.productId], // 'pro'
            interval: targetPrice.interval as Interval, // 'year'
          },
        )

        switch (decision) {
          case 'reject':
            throw createError({
              statusCode: 400,
              statusMessage: 'Already on that plan',
            })

          case 'immediate': {
            const sub = await stripe.subscriptions.retrieve(existingSub.id)
            const item = sub.items.data[0]

            const upd = await stripe.subscriptions.update(existingSub.id, {
              items: [{ id: item.id, price: targetPrice.id }],
              proration_behavior: 'always_invoice', // bill the prorated diff now :contentReference[oaicite:0]{index=0}
              payment_behavior: 'error_if_incomplete', // fail if card can’t be charged :contentReference[oaicite:1]{index=1}
              expand: ['latest_invoice.payment_intent'],
            })

            const pi = upd.latest_invoice
              ?.payment_intent as Stripe.PaymentIntent | null

            return {
              success: true,
              decision: 'immediate',
              clientSecret:
                pi?.status === 'requires_action' ? pi.client_secret : undefined,
            }
          }

          case 'scheduled':
            const sched = await stripe.subscriptionSchedules.create({
              from_subscription: existingSub.id,
            })

            const toPriceId = (p: string | Stripe.Price): string =>
              typeof p === 'string' ? p : p.id

            const mirrored = sched.phases.map((p) => ({
              start_date: p.start_date,
              items: p.items.map((it) => ({
                price: toPriceId(it.price),
                quantity: it.quantity ?? 1,
              })),
              iterations: 1,
            }))

            // 2. Your switch phase (starts right after previous phase ends)
            const switchPhase = {
              items: [{ price: targetPrice.id, quantity: 1 }],
              // no start_date → Stripe uses last phase’s end_date
            }

            // 3. Update the schedule
            await stripe.subscriptionSchedules.update(sched.id, {
              end_behavior: 'release',
              phases: [...mirrored, switchPhase],
            })

            const subscription = await upsertSubscription({
              id: existingSub.id,
              customerId: existingSub.customerId,
              priceId: existingSub.priceId,
              userId: existingSub.userId,
              status: existingSub.status,
              metadata: existingSub.metadata,
              quantity: existingSub.quantity ?? 1,
              cancelAtPeriodEnd: existingSub.cancelAtPeriodEnd,
              currentPeriodEnd: existingSub.currentPeriodEnd,
              currentPeriodStart: existingSub.currentPeriodStart,
              endedAt: existingSub.endedAt,
              cancelAt: existingSub.cancelAt,
              trialStart: existingSub.trialStart,
              trialEnd: existingSub.trialEnd,
              pendingSwitch: true,
              pendingPriceId: targetPrice.id,
              promptPortfolioModal: true,
              switchScheduledAt: existingSub.currentPeriodEnd,
            })
        }
        return { success: true, decision }
      } else {
        // Subscription created in webhook handler
        const session = await stripeService.createCheckoutSession({
          customerId,
          priceId: body.priceId,
        })

        return { success: true, url: session.url }
      }
    } catch (error) {
      // If it's already a handled error, rethrow it
      if (error instanceof Error) throw error

      // Otherwise, create a generic error
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to create checkout session',
      })
    }
  },
)
