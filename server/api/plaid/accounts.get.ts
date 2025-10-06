import { getAllAccounts } from '@@/services/plaid'
import { eq, sql } from 'drizzle-orm'
import { plaidItems } from '@@/server/database/schema/plaid'
const config = useRuntimeConfig()

const ENC_KEY = config.plaidEncKey!

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const decryptedAccessTokens = await useDB()
    .select({
      accessToken: sql<string>`
        pgp_sym_decrypt(
          ${plaidItems.accessToken}::bytea,
          ${ENC_KEY}
        )
      `,
    })
    .from(tables.plaidItems)
    .where(eq(tables.plaidItems.userId, user.id))

  const accessTokens: string[] = decryptedAccessTokens.map((r) => r.accessToken)
  const accounts = await getAllAccounts(accessTokens)

  return { accounts }
})
