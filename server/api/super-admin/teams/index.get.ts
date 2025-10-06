export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  if (!user.superAdmin) {
    throw createError({
      statusCode: 403,
      statusMessage: 'You are not authorized to access this resource',
    })
  }
  const portfolios = await useDB().query.portfolios.findMany({
    with: {
      owner: true,
      subscription: {
        columns: {
          id: true,
          status: true,
        },
        with: {
          price: true,
        },
      },
      members: {
        with: {
          user: {
            columns: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
      },
    },
    orderBy: (portfolios, { desc }) => [desc(portfolios.createdAt)],
    limit: 20,
    offset: 0,
  })
  return portfolios
})
