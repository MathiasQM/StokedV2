import { z } from 'zod'
import {
  findCredentialById,
  findCredentialByUserId,
  revokeCredential,
} from '@@/server/database/queries/passkeys'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  const userCredentials = await findCredentialByUserId(user.id)
  console.log(userCredentials)
  if (userCredentials.filter((p) => !p.revokedAt).length <= 1) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Cannot revoke the last remaining passkey',
    })
  }

  const bodySchema = z.object({ id: z.string().min(1) })
  const { id } = await readValidatedBody(event, bodySchema.parse)

  const credential = await findCredentialById(id)
  if (!credential || credential.userId !== user.id) {
    throw createError({ statusCode: 404, statusMessage: 'Passkey not found' })
  }

  await revokeCredential(user.id, id)

  return { ok: true, revokedAt: new Date().toISOString() }
})
