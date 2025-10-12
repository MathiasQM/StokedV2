import { z } from 'zod'
import { createPortfolioWithPositions } from '@@/server/database/queries/portfolios'
import { fetchFundamentals } from '@@/server/utils/eodhd'

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

  const enrichedPositions = await Promise.all(
    positions.map(async (pos) => {
      const fundamentals = await fetchFundamentals(pos.symbol)
      return {
        ...pos,
        website: fundamentals?.WebURL || null, // Add the website URL
      }
    }),
  )

  // Create a unique slug (e.g., 'my-first-portfolio-user_id_short')
  const uniqueSlug = slugify(`${name}-${user.id.substring(0, 8)}`)

  try {
    const portfolio = await createPortfolioWithPositions({
      portfolioData: {
        name,
        slug: uniqueSlug,
        ownerId: user.id,
      },
      positionsData: enrichedPositions,
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
