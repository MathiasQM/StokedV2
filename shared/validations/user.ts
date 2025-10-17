import { insertUserSchema } from '@@/types/database'
import { z } from 'zod'

export const updateUserSchema = insertUserSchema
  .pick({
    name: true,
    avatarUrl: true,
    currency: true,
    timezone: true,
  })
  .partial()
  .strict()
