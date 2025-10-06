import { updateSubscription } from '~~/server/database/queries/subscriptions'
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
      message: 'Subscription was updated successfully',
    }
  } catch (error) {
    if (error instanceof Error) throw error
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update subscriptions',
    })
  }
})
