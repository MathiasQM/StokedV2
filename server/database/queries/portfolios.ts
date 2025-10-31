import { eq, or, and, sql } from 'drizzle-orm'
import type {
  Portfolio,
  InsertPortfolio,
  InsertPortfolioInvite,
  PortfolioInvite,
  PortfolioPosition,
} from '@@/types/database'

// Define invite status types for better type safety
type InviteStatus = (typeof INVALID_STATUSES)[number]
const INVALID_STATUSES = ['accepted', 'rejected', 'cancelled'] as const
interface NewRow {
  name: string
  slug: string
  ownerId: string
}

export const findUserPortfolios = async (userId: string) => {
  try {
    const portfolios = await useDB()
      .select({
        id: tables.portfolios.id,
        name: tables.portfolios.name,
        ownerId: tables.portfolios.ownerId,
        logo: tables.portfolios.logo,
        createdAt: tables.portfolios.createdAt,
        updatedAt: tables.portfolios.updatedAt,
        role: sql`max(${tables.portfolioMembers.role})`,
        slug: tables.portfolios.slug,
      })
      .from(tables.portfolios)
      .leftJoin(
        tables.portfolioMembers,
        and(
          eq(tables.portfolios.id, tables.portfolioMembers.portfolioId),
          eq(tables.portfolioMembers.userId, userId),
        ),
      )
      .where(
        or(
          eq(tables.portfolios.ownerId, userId),
          eq(tables.portfolioMembers.userId, userId),
        ),
      )
      .groupBy(
        tables.portfolios.id,
        tables.portfolios.name,
        tables.portfolios.ownerId,
        tables.portfolios.logo,
        tables.portfolios.createdAt,
        tables.portfolios.updatedAt,
        tables.portfolios.slug,
      )
    return portfolios
  } catch (error) {
    console.error(error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to find user portfolios',
    })
  }
}

export const getPortfolio = async (portfolioId: string) => {
  const [portfolio] = await useDB()
    .select()
    .from(tables.portfolios)
    .where(eq(tables.portfolios.id, portfolioId))
  return portfolio
}

export const createPortfolio = async (payload: InsertPortfolio) => {
  try {
    const [portfolio] = await useDB()
      .insert(tables.portfolios)
      .values(payload)
      .returning()

    await useDB().insert(tables.portfolioMembers).values({
      portfolioId: portfolio.id,
      userId: payload.ownerId,
      role: 'owner',
    })

    return portfolio
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message)
    }
    throw new Error('Failed to create portfolio')
  }
}

export const createPortfolioWithPositions = async (payload: {
  portfolioData: InsertPortfolio
  positionsData: { symbol: string; name: string; exchange: string }[]
}) => {
  return await useDB().transaction(async (tx) => {
    // 1. Create the portfolio
    const [portfolio] = await tx
      .insert(tables.portfolios)
      .values(payload.portfolioData)
      .returning()

    // 2. Create the owner's membership link
    await tx.insert(tables.portfolioMembers).values({
      portfolioId: portfolio.id,
      userId: payload.portfolioData.ownerId,
      role: 'owner',
    })

    // 3. Prepare and insert the positions
    const positionsToInsert = payload.positionsData.map((pos) => ({
      portfolioId: portfolio.id,
      ...pos,
    }))

    await tx.insert(tables.portfolioPositions).values(positionsToInsert)

    return portfolio
  })
}

export const updatePortfolioPositions = async (
  portfolioId: string,
  payload: Partial<PortfolioPosition>,
) => {
  try {
    const [record] = await useDB()
      .update(tables.portfolioPositions)
      .set(payload)
      .where(eq(tables.portfolioPositions.portfolioId, portfolioId))
      .returning()
    return record
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update portfolio',
    })
  }
}

export async function createPortfoliosBulk(rows: NewRow[]) {
  if (rows.length === 0) return []

  return await useDB().transaction(async (tx) => {
    // 1️⃣ Bulk‐insert portfolios, skip slug conflicts
    const inserted = await tx
      .insert(tables.portfolios)
      .values(
        rows.map((r) => ({
          name: r.name,
          slug: r.slug,
          ownerId: r.ownerId,
        })),
      )
      .onConflictDoNothing({ target: tables.portfolios.slug })
      .returning({
        id: tables.portfolios.id,
        name: tables.portfolios.name,
        slug: tables.portfolios.slug,
      })

    if (inserted.length === 0) {
      // Nothing new to do
      return []
    }

    const memberRows = inserted.map((p) => {
      const ownerId = rows.find((r) => r.slug === p.slug)!.ownerId
      return {
        portfolioId: p.id,
        userId: ownerId,
        role: 'owner',
      }
    })

    await tx.insert(tables.portfolioMembers).values(memberRows)

    return inserted
  })
}

export const updatePortfolio = async (
  portfolioId: string,
  payload: Partial<Portfolio>,
) => {
  try {
    const [record] = await useDB()
      .update(tables.portfolios)
      .set(payload)
      .where(eq(tables.portfolios.id, portfolioId))
      .returning()
    return record
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update portfolio',
    })
  }
}

export const deletePortfolio = async (portfolioId: string) => {
  try {
    await useDB()
      .delete(tables.portfolios)
      .where(eq(tables.portfolios.id, portfolioId))
  } catch (error) {
    console.error('Error deleting portfolio:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete portfolio',
    })
  }
}

export const invitePortfolioMember = async (payload: InsertPortfolioInvite) => {
  try {
    const [invite] = await useDB()
      .insert(tables.portfolioInvites)
      .values(payload)
      .returning()
    return invite
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to invite portfolio member',
    })
  }
}

export const getActivePortfolioMembers = async (portfolioId: string) => {
  const members = await useDB()
    .select({
      id: tables.portfolioMembers.id,
      portfolioId: tables.portfolioMembers.portfolioId,
      userId: tables.portfolioMembers.userId,
      role: tables.portfolioMembers.role,
      email: tables.users.email,
      name: tables.users.name,
      avatarUrl: tables.users.avatarUrl,
      lastLoginAt: tables.users.lastActive,
      createdAt: tables.portfolioMembers.createdAt,
    })
    .from(tables.portfolioMembers)
    .leftJoin(tables.users, eq(tables.portfolioMembers.userId, tables.users.id))
    .where(eq(tables.portfolioMembers.portfolioId, portfolioId))
  return members
}

export const getPortfolioInvites = async (portfolioId: string) => {
  const invites = await useDB()
    .select()
    .from(tables.portfolioInvites)
    .where(eq(tables.portfolioInvites.portfolioId, portfolioId))
  return invites
}

export const cancelInvite = async (inviteId: string) => {
  await useDB()
    .delete(tables.portfolioInvites)
    .where(eq(tables.portfolioInvites.id, inviteId))
}

/**
 * @throws {H3Error}
 */
export const getInvite = async (token: string): Promise<PortfolioInvite> => {
  const [invite] = await useDB()
    .select()
    .from(tables.portfolioInvites)
    .where(eq(tables.portfolioInvites.token, token))
  return invite
}

export const updateInviteStatus = async (inviteId: string, status: string) => {
  await useDB()
    .update(tables.portfolioInvites)
    .set({ status })
    .where(eq(tables.portfolioInvites.id, inviteId))
}

export const acceptPortfolioInvite = async (
  invite: PortfolioInvite,
  userId: string,
) => {
  try {
    await useDB()
      .insert(tables.portfolioMembers)
      .values({ portfolioId: invite.portfolioId, userId, role: invite.role })
  } catch (error) {
    console.error(error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to add user to portfolio',
    })
  }
}

export const isPortfolioMember = async (
  portfolioId: string,
  userId: string,
) => {
  try {
    const [member] = await useDB()
      .select({ id: tables.portfolioMembers.id })
      .from(tables.portfolioMembers)
      .where(
        and(
          eq(tables.portfolioMembers.portfolioId, portfolioId),
          eq(tables.portfolioMembers.userId, userId),
        ),
      )

    return !!member
  } catch (error) {
    console.error(error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to check if user is already in portfolio',
    })
  }
}

export const findPortfolioInvite = async (inviteId: string) => {
  const [invite] = await useDB()
    .select()
    .from(tables.portfolioInvites)
    .where(eq(tables.portfolioInvites.id, inviteId))
  return invite
}

export const updatePortfolioInvite = async (
  inviteId: string,
  payload: Partial<PortfolioInvite>,
) => {
  await useDB()
    .update(tables.portfolioInvites)
    .set(payload)
    .where(eq(tables.portfolioInvites.id, inviteId))
}

export const deletePortfolioMember = async (
  portfolioId: string,
  memberId: string,
) => {
  try {
    await useDB()
      .delete(tables.portfolioMembers)
      .where(
        and(
          eq(tables.portfolioMembers.portfolioId, portfolioId),
          eq(tables.portfolioMembers.id, memberId),
        ),
      )
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete portfolio member',
    })
  }
}

export const checkSlugConflict = async (userId: string, slug: string) => {
  try {
    const [existingPortfolio] = await useDB()
      .select({
        id: tables.portfolios.id,
        name: tables.portfolios.name,
        slug: tables.portfolios.slug,
      })
      .from(tables.portfolios)
      .leftJoin(
        tables.portfolioMembers,
        and(
          eq(tables.portfolios.id, tables.portfolioMembers.portfolioId),
          eq(tables.portfolioMembers.userId, userId),
        ),
      )
      .where(
        and(
          eq(tables.portfolios.slug, slug),
          or(
            eq(tables.portfolios.ownerId, userId),
            eq(tables.portfolioMembers.userId, userId),
          ),
        ),
      )

    return existingPortfolio
  } catch (error) {
    console.error(error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to check slug conflict',
    })
  }
}
