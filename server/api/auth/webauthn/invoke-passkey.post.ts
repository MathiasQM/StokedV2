import { z } from 'zod'
import {
  findCredentialById,
  findCredentialByUserId,
  invokeCredential,
} from '@@/server/database/queries/passkeys'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  const bodySchema = z.object({ id: z.string().min(1) })
  const { id } = await readValidatedBody(event, bodySchema.parse)

  const credential = await findCredentialById(id)
  if (!credential || credential.userId !== user.id) {
    throw createError({ statusCode: 404, statusMessage: 'Passkey not found' })
  }

  await invokeCredential(user.id, id)

  return { ok: true, invokedAt: new Date().toISOString() }
})
