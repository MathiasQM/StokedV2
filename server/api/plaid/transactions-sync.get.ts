import { syncTransactions } from '@@/services/plaid'

export default defineEventHandler(async (event) => {
  const { accessToken, cursor } = getQuery(event)
  return await syncTransactions(
    String(accessToken),
    cursor as string | undefined,
  )
})
