export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  if (!user.superAdmin) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden',
    })
  }

  const userCount = await useDB().$count(tables.users)
  const portfolioCount = await useDB().$count(tables.portfolios)
  const feedbackCount = await useDB().$count(tables.feedback)
  const newsletterCount = await useDB().$count(tables.waitlist)
  return {
    users: userCount,
    portfolios: portfolioCount,
    feedback: feedbackCount,
    newsletter: newsletterCount,
  }
})
