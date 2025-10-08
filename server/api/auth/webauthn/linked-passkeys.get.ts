import { findCredentialByUserId } from '@@/server/database/queries/passkeys'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const passkeys = await findCredentialByUserId(user.id)

  return passkeys.map(({ id, name, createdAt, updatedAt, revokedAt }) => ({
    id,
    name,
    createdAt,
    updatedAt,
    revokedAt,
  }))
})
