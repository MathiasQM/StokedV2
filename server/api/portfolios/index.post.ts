import { z } from 'zod'
import { createPortfolioWithPositions } from '@@/server/database/queries/portfolios'
import { fetchFundamentals } from '@@/server/utils/eodhd'
import { count } from 'drizzle-orm'
import { Currency } from 'lucide-vue-next'

const slugify = (name: string) => name.toLowerCase().trim().replace(/\s+/g, '-')

// Define the expected structure of the incoming request body
const createPortfolioSchema = z.object({
  name: z.string().min(1, 'Portfolio name is required.'),
  positions: z
    .array(
      z.object({
        symbol: z.string(),
        name: z.string(),
        exchange: z.string(),
        ISIN: z.string().nullable(),
        type: z.string().nullable(),
        isPrimary: z.boolean().nullable(),
        country: z.string().nullable(),
        currency: z.string().nullable(),
        shares: z.number(),
        costPerShare: z.number(),
      }),
    )
    .min(1, 'At least one position is required.'),
})

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const body = await readBody(event)

  // Validate the request body
  const validation = createPortfolioSchema.safeParse(body)
  if (!validation.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid request body.',
      data: validation.error.issues,
    })
  }

  const { name, positions } = validation.data

  // Create a unique slug (e.g., 'my-first-portfolio-user_id_short')
  // TODO: Make sure users can't create portfolios with duplicate names - send error to frontend
  const uniqueSlug = slugify(`${name}-${user.id.substring(0, 8)}`)

  try {
    const portfolio = await createPortfolioWithPositions({
      portfolioData: {
        name,
        slug: uniqueSlug,
        ownerId: user.id,
      },
      positionsData: positions,
    })
    return portfolio
  } catch (error: any) {
    // Handle potential duplicate slug errors from the database
    if (
      error.message.includes('duplicate key value violates unique constraint')
    ) {
      throw createError({
        statusCode: 409, // Conflict
        statusMessage:
          'A portfolio with this name already exists. Please choose a different name.',
      })
    }
    console.error('Error creating portfolio:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Could not create portfolio.',
    })
  }
})
