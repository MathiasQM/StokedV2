import { createLinkToken } from '@@/services/plaid'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const body = await readBody(event)

  const linkToken = await createLinkToken(user.id, body.accessToken)
  return { linkToken }
})
