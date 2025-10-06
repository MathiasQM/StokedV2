import { pgTable, text, boolean, timestamp, uuid } from 'drizzle-orm/pg-core'
import { relations, sql } from 'drizzle-orm'
import { oauthAccounts } from './auth'
import { portfolioMembers } from './portfolios'
import { subscriptions } from './subscriptions'
import { pgPolicy } from 'drizzle-orm/pg-core'
import { authenticatedRole } from 'drizzle-orm/supabase'

// --- Reusable SQL Fragment ---
const isSuperAdminCondition = `EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u."superAdmin" = true)`

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull().unique(),
    name: text('name').notNull(),
    country: text('country').default('Unknown'),
    avatarUrl: text('avatarUrl').default(''),
    hashedPassword: text('hashedPassword'),
    banned: boolean('banned').notNull().default(false),
    bannedReason: text('bannedReason'),
    emailVerified: boolean('emailVerified').notNull().default(false),
    superAdmin: boolean('superAdmin').notNull().default(false),
    phoneNumber: text('phoneNumber'),
    bannedUntil: timestamp('bannedUntil'),
    onboarded: boolean('onboarded').notNull().default(false),
    proAccount: boolean('proAccount').notNull().default(false),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
    lastActive: timestamp('last_active').defaultNow(),
  },
  (table) => {
    const isSelfCondition = `auth.uid() = id`
    const selfOrSuperAdmin = `(${isSelfCondition}) OR (${isSuperAdminCondition})`

    return [
      pgPolicy('select_users', {
        for: 'select',
        to: authenticatedRole,
        using: sql.raw(selfOrSuperAdmin),
      }),
      pgPolicy('update_users', {
        for: 'update',
        to: authenticatedRole,
        using: sql.raw(selfOrSuperAdmin),
        withCheck: sql.raw(selfOrSuperAdmin),
      }),
      pgPolicy('delete_users', {
        for: 'delete',
        to: authenticatedRole,
        using: sql.raw(isSuperAdminCondition),
      }),
      pgPolicy('no_client_insert_users', {
        for: 'insert',
        to: authenticatedRole,
        withCheck: sql`false`,
      }),
    ]
  },
)

export const usersRelations = relations(users, ({ many }) => ({
  oauthAccounts: many(oauthAccounts),
  portfolioMembers: many(portfolioMembers),
  subscriptions: many(subscriptions),
}))
