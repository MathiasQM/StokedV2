import { pgTable, text, timestamp, uuid, real } from 'drizzle-orm/pg-core'
import { users } from './users'
import { relations, sql } from 'drizzle-orm'
import { pgPolicy } from 'drizzle-orm/pg-core'
import { authenticatedRole } from 'drizzle-orm/supabase'

// --- Reusable SQL String Conditions ---
const isSuperAdminCondition = `EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u."superAdmin" = true)`

// --- Schema Definitions with Policies ---

export const portfolios = pgTable(
  'portfolios',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    ownerId: uuid('ownerId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    logo: text('logo'),
    slug: text('slug').notNull().unique(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => {
    const isMemberCondition = `EXISTS (SELECT 1 FROM public.portfolio_members pm WHERE pm."portfolioId" = id AND pm."userId" = auth.uid())`
    const isAdminOrOwnerCondition = `EXISTS (SELECT 1 FROM public.portfolio_members pm WHERE pm."portfolioId" = id AND pm."userId" = auth.uid() AND pm.role IN ('owner','admin'))`
    const isOwnerCondition = `"ownerId" = auth.uid()`

    return [
      pgPolicy('portfolios_select', {
        for: 'select',
        to: authenticatedRole,
        using: sql.raw(`(${isMemberCondition}) OR (${isSuperAdminCondition})`),
      }),
      pgPolicy('portfolios_insert_owner', {
        for: 'insert',
        to: authenticatedRole,
        withCheck: sql.raw(
          `(${isOwnerCondition}) OR (${isSuperAdminCondition})`,
        ),
      }),
      pgPolicy('portfolios_update_admin_owner', {
        for: 'update',
        to: authenticatedRole,
        using: sql.raw(
          `(${isAdminOrOwnerCondition}) OR (${isSuperAdminCondition})`,
        ),
        withCheck: sql.raw(
          `(${isAdminOrOwnerCondition}) OR (${isSuperAdminCondition})`,
        ),
      }),
      pgPolicy('portfolios_delete_owner', {
        for: 'delete',
        to: authenticatedRole,
        using: sql.raw(`(${isOwnerCondition}) OR (${isSuperAdminCondition})`),
      }),
    ]
  },
)

export const portfolioPositions = pgTable(
  'portfolio_positions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    portfolioId: uuid('portfolioId')
      .notNull()
      .references(() => portfolios.id, { onDelete: 'cascade' }),
    symbol: text('symbol').notNull(), // e.g., 'AAPL.US'
    name: text('name'), // e.g., 'Apple Inc.'
    exchange: text('exchange'), // e.g., 'NASDAQ'
    shares: real('shares').notNull().default(0),
    website: text('website'),
    costPerShare: real('cost_per_share').notNull().default(0),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => {
    // Condition: Is the current user a member of the portfolio this position belongs to?
    const isMemberCondition = `EXISTS (SELECT 1 FROM public.portfolio_members pm WHERE pm."portfolioId" = "portfolioId" AND pm."userId" = auth.uid())`

    // Condition: Is the user an 'admin' or 'owner' of the portfolio?
    const isAdminOrOwnerCondition = `EXISTS (SELECT 1 FROM public.portfolio_members pm WHERE pm."portfolioId" = "portfolioId" AND pm."userId" = auth.uid() AND pm.role IN ('owner', 'admin'))`

    return [
      // SELECT Policy: Any member of the portfolio can view its positions.
      pgPolicy('pp_select_member', {
        for: 'select',
        to: authenticatedRole,
        using: sql.raw(isMemberCondition),
      }),
      // INSERT Policy: Only admins or owners can add new positions.
      pgPolicy('pp_insert_admin_owner', {
        for: 'insert',
        to: authenticatedRole,
        withCheck: sql.raw(isAdminOrOwnerCondition),
      }),
      // UPDATE Policy: Only admins or owners can modify existing positions.
      pgPolicy('pp_update_admin_owner', {
        for: 'update',
        to: authenticatedRole,
        using: sql.raw(isAdminOrOwnerCondition),
      }),
      // DELETE Policy: Only admins or owners can remove positions.
      pgPolicy('pp_delete_admin_owner', {
        for: 'delete',
        to: authenticatedRole,
        using: sql.raw(isAdminOrOwnerCondition),
      }),
    ]
  },
)

export const portfolioMembers = pgTable(
  'portfolio_members',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    portfolioId: uuid('portfolioId')
      .notNull()
      .references(() => portfolios.id, { onDelete: 'cascade' }),
    userId: uuid('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: text('role').notNull().default('member'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => {
    const isMemberCondition = `EXISTS (SELECT 1 FROM public.portfolio_members pm2 WHERE pm2."portfolioId" = "portfolioId" AND pm2."userId" = auth.uid())`
    const isAdminOrOwnerCondition = `EXISTS (SELECT 1 FROM public.portfolio_members pm2 WHERE pm2."portfolioId" = "portfolioId" AND pm2."userId" = auth.uid() AND pm2.role IN ('owner','admin'))`

    return [
      pgPolicy('pm_select', {
        for: 'select',
        to: authenticatedRole,
        using: sql.raw(`(${isMemberCondition}) OR (${isSuperAdminCondition})`),
      }),
      pgPolicy('pm_insert_admin_owner', {
        for: 'insert',
        to: authenticatedRole,
        withCheck: sql.raw(
          `(${isAdminOrOwnerCondition}) OR (${isSuperAdminCondition})`,
        ),
      }),
      pgPolicy('pm_update_admin_owner', {
        for: 'update',
        to: authenticatedRole,
        using: sql.raw(
          `(${isAdminOrOwnerCondition}) OR (${isSuperAdminCondition})`,
        ),
        withCheck: sql.raw(
          `(${isAdminOrOwnerCondition}) OR (${isSuperAdminCondition})`,
        ),
      }),
      pgPolicy('pm_delete_admin_owner', {
        for: 'delete',
        to: authenticatedRole,
        using: sql.raw(
          `(${isAdminOrOwnerCondition}) OR (${isSuperAdminCondition})`,
        ),
      }),
    ]
  },
)

export const portfolioInvites = pgTable(
  'portfolio_invites',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    portfolioId: uuid('portfolioId')
      .notNull()
      .references(() => portfolios.id, { onDelete: 'cascade' }),
    email: text('email').notNull(),
    role: text('role').notNull().default('member'),
    token: text('token').notNull(),
    status: text('status').notNull().default('pending'),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    acceptedAt: timestamp('accepted_at').defaultNow(),
  },
  (table) => {
    const isMemberCondition = `EXISTS (SELECT 1 FROM public.portfolio_members pm WHERE pm."portfolioId" = "portfolioId" AND pm."userId" = auth.uid())`
    const isAdminOrOwnerCondition = `EXISTS (SELECT 1 FROM public.portfolio_members pm WHERE pm."portfolioId" = "portfolioId" AND pm."userId" = auth.uid() AND pm.role IN ('owner','admin'))`
    const isInvitedUserCondition = `email = current_setting('jwt.claims.email')`

    return [
      pgPolicy('pi_select', {
        for: 'select',
        to: authenticatedRole,
        using: sql.raw(
          `(${isMemberCondition}) OR (${isInvitedUserCondition}) OR (${isSuperAdminCondition})`,
        ),
      }),
      pgPolicy('pi_insert_admin_owner', {
        for: 'insert',
        to: authenticatedRole,
        withCheck: sql.raw(
          `(${isAdminOrOwnerCondition}) OR (${isSuperAdminCondition})`,
        ),
      }),
      pgPolicy('pi_update_admin_owner', {
        for: 'update',
        to: authenticatedRole,
        using: sql.raw(
          `(${isAdminOrOwnerCondition}) OR (${isSuperAdminCondition})`,
        ),
        withCheck: sql.raw(
          `(${isAdminOrOwnerCondition}) OR (${isSuperAdminCondition})`,
        ),
      }),
      pgPolicy('pi_delete_admin_owner', {
        for: 'delete',
        to: authenticatedRole,
        using: sql.raw(
          `(${isAdminOrOwnerCondition}) OR (${isSuperAdminCondition})`,
        ),
      }),
    ]
  },
)

// --- Relations ---

export const portfoliosRelations = relations(portfolios, ({ many, one }) => ({
  members: many(portfolioMembers),
  owner: one(users, {
    fields: [portfolios.ownerId],
    references: [users.id],
  }),
}))

export const portfolioMembersRelations = relations(
  portfolioMembers,
  ({ one }) => ({
    portfolio: one(portfolios, {
      fields: [portfolioMembers.portfolioId],
      references: [portfolios.id],
    }),
    user: one(users, {
      fields: [portfolioMembers.userId],
      references: [users.id],
    }),
  }),
)

export const portfolioPositionsRelations = relations(
  portfolioPositions,
  ({ one }) => ({
    portfolio: one(portfolios, {
      fields: [portfolioPositions.portfolioId],
      references: [portfolios.id],
    }),
  }),
)
