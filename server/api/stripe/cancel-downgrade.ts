import { updateSubscription } from '~~/server/database/queries/subscriptions'
import { stripe } from '@@/server/services/stripe'

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireUserSession(event)
    if (!user) {
      throw createError({
        statusCode: 400,
        statusMessage: 'User session is required',
      })
    }

    const { subscriptionId } = await readBody<{ subscriptionId: string }>(event)

    if (!subscriptionId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Subscription ID is required',
      })
    }

    const sub = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['schedule'],
    })

    const scheduleId =
      sub.schedule && typeof sub.schedule === 'string'
        ? sub.schedule
        : sub.schedule?.id

    await stripe.subscriptionSchedules.release(scheduleId)

    await updateSubscription(
      subscriptionId,
      {
        pendingSwitch: false,
        pendingPriceId: null,
        switchScheduledAt: null,
        promptPortfolioModal: false,
      },
      [
        'pendingSwitch',
        'pendingPriceId',
        'promptPortfolioModal',
        'switchScheduledAt',
      ],
    )

    return {
      success: true,
      message: 'Subscription downgrade cancelled successfully',
    }
  } catch (error) {
    if (error instanceof Error) throw error
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to retrieve plans',
    })
  }
})
