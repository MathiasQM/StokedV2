import { plaidItems } from '@@/server/database/schema/plaid'
import { eq } from 'drizzle-orm'
import { sql } from 'drizzle-orm'

const ENC_KEY = process.env.PLAID_ENC_KEY!

export async function getAccessTokens(userId: string) {
  const rows = await useDB()
    .select({
      token: sql<string>`pgp_sym_decrypt(
          ${plaidItems.accessToken}::bytea,
          ${ENC_KEY}
        )::text`,
      institutionId: plaidItems.institutionId,
    })
    .from(plaidItems)
    .where(eq(plaidItems.userId, userId))

  return rows ?? null
}

export async function saveOrUpdateItem(
  userId: string,
  itemId: string,
  institutionId: string,
  institutionName: string,
  accessToken: string,
  country?: string,
  provider?: string,
) {
  await useDB()
    .insert(plaidItems)
    .values({
      userId,
      itemId,
      institutionId,
      institutionName,
      accessToken: sql`pgp_sym_encrypt(${accessToken}, ${ENC_KEY})`,
      countryCode: country,
      provider,
    })
    .onConflictDoUpdate({
      target: plaidItems.itemId,
      set: {
        accessToken: sql`pgp_sym_encrypt(${accessToken}, ${ENC_KEY})`,
        updatedAt: sql`now()`,
      },
    })
}
