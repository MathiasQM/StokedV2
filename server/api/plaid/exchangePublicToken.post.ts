import { exchangePublicToken } from '@@/services/plaid'
import { saveOrUpdateItem } from '~~/server/database/queries/plaid'
export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const { publicToken, country, provider } = await readBody<{
    publicToken: string
    country?: string
    provider?: string
  }>(event)
  const { accessToken, itemId, institution } =
    await exchangePublicToken(publicToken)

  await saveOrUpdateItem(
    user.id,
    itemId,
    institution.id,
    institution.name,
    accessToken,
    country,
    provider,
  )
  return { ok: true }
})
