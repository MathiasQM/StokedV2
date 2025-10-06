import { getAccessTokens } from '~~/server/database/queries/plaid'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const tokens = await getAccessTokens(user.id) // decrypts in helper
  return tokens
})
