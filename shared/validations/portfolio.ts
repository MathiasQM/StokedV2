import { z } from 'zod'
import {
  insertPortfolioSchema,
  insertPortfolioPositionSchema,
} from '@@/types/database'
import { UserRole } from '@@/constants'

export const createPortfolioSchema = insertPortfolioSchema.pick({
  name: true,
})

export const createPositionSchema = insertPortfolioPositionSchema.pick({
  name: true,
  symbol: true,
  website: true,
  shares: true,
  costPerShare: true,
})

// Bulk create uses the same schema but without slug (it is generated)
export const createPortfoliosSchema = z.array(createPortfolioSchema)
export const createPositionsSchema = z.array(createPositionSchema)

export const invitePortfolioMemberSchema = z.object({
  email: z.string().email(),
  role: z
    .enum([UserRole.MEMBER, UserRole.ADMIN, UserRole.OWNER])
    .default(UserRole.MEMBER),
})
