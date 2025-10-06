import {
  createPortfolio,
  findUserPortfolios,
  createPortfoliosBulk,
} from '~~/server/database/queries/portfolios'
import { z } from 'zod'
import { getSubscriptionByUserId } from '~~/server/database/queries/subscriptions'
import { createPortfoliosSchema } from '@@/shared/validations/portfolio'
import { validateBody } from '@@/server/utils/bodyValidation'
import { checkPortfolioLimit } from '~~/services/utilities/helpers'

const portfolioItemSchema = z.object({ name: z.string().min(1).max(64) })
const bulkCreateSchema = z.array(portfolioItemSchema).nonempty()

const slugify = (name: string) => name.toLowerCase().trim().replace(/\s+/g, '-')

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const items = await validateBody(event, createPortfoliosSchema.nonempty())

  const current = (await findUserPortfolios(user.id)).length
  const sub = await getSubscriptionByUserId(user.id)
  const tierKey = sub?.price?.productId ?? 'free'
  const limitInfo = checkPortfolioLimit(tierKey, current)
  const remaining = limitInfo.limit - current

  if (remaining <= 0) {
    throw createError({
      statusCode: 403,
      statusMessage: `Maximum of ${limitInfo.limit} portfolios reached for the “${limitInfo.label}” plan.`,
    })
  }

  const toCreate = items.slice(0, remaining)
  const overflow = items.slice(remaining).map((p) => ({
    name: p.name,
    reason: `Plan limit exceeded (max ${limitInfo.limit})`,
  }))

  const rows = toCreate.map((p) => ({
    name: p.name,
    slug: slugify(`${p.name}-${user.id}`),
    ownerId: user.id,
  }))

  const inserted = await createPortfoliosBulk(rows)

  const successfulSlugs = new Set(inserted.map((r) => r.slug))
  const dupFailures = rows
    .filter((r) => !successfulSlugs.has(r.slug))
    .map((r) => ({
      name: r.name,
      reason: 'Slug already in use',
    }))

  return {
    successes: inserted.map(({ id, name, slug }) => ({ id, name, slug })),
    failures: [...overflow, ...dupFailures],
  }
})
