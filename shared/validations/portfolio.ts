import { z } from 'zod'
import {
  insertPortfolioSchema,
  insertPortfolioPositionSchema,
} from '@@/types/database'
import { UserRole } from '@@/constants'

export const createPortfolioSchema = insertPortfolioSchema.pick({
  name: true,
})

// Bulk create uses the same schema but without slug (it is generated)
export const createPortfoliosSchema = z.array(createPortfolioSchema)

export const invitePortfolioMemberSchema = z.object({
  email: z.string().email(),
  role: z
    .enum([UserRole.MEMBER, UserRole.ADMIN, UserRole.OWNER])
    .default(UserRole.MEMBER),
})
