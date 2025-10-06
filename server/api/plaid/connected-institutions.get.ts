import { eq } from 'drizzle-orm'
import { plaidItems } from '@@/server/database/schema/plaid'
import type { InferSelectModel } from 'drizzle-orm'
type ConnectedInstitution = Pick<
  InferSelectModel<typeof plaidItems>,
  'countryCode' | 'provider' | 'institutionName' | 'institutionId'
>

const config = useRuntimeConfig()

const ENC_KEY = config.plaidEncKey!

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const institutions: ConnectedInstitution[] = await useDB()
    .select({
      institutionName: plaidItems.institutionName,
      institutionId: plaidItems.institutionId,
      countryCode: plaidItems.countryCode,
      provider: plaidItems.provider,
    })
    .from(plaidItems)
    .where(eq(plaidItems.userId, user.id))

  return { institutions }
})
