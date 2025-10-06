import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { users } from './users'
import { pgPolicy } from 'drizzle-orm/pg-core'
import { authenticatedRole } from 'drizzle-orm/supabase'

const isSuperAdminCondition = `EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u."superAdmin" = true)`
const isOwnerCondition = `"user_id" = auth.uid()`
const ownerOrSuperAdmin = `(${isOwnerCondition}) OR (${isSuperAdminCondition})`

// --- Schema Definition ---
export const plaidItems = pgTable(
  'plaid_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    itemId: text('item_id').notNull().unique(),
    institutionId: text('institution_id').notNull(),
    institutionName: text('institution_name').notNull(),
    countryCode: text('country_code').notNull(),
    provider: text('provider').notNull(),
    accessToken: text('access_token').notNull(),
    cursor: text('cursor'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => sql`now()`),
  },
  (table) => [
    pgPolicy('plaid_select_own', {
      for: 'select',
      to: authenticatedRole,
      using: sql.raw(ownerOrSuperAdmin),
    }),
    pgPolicy('plaid_insert_own', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql.raw(ownerOrSuperAdmin),
    }),
    pgPolicy('plaid_update_own', {
      for: 'update',
      to: authenticatedRole,
      using: sql.raw(ownerOrSuperAdmin),
      withCheck: sql.raw(ownerOrSuperAdmin),
    }),
    pgPolicy('plaid_delete_own', {
      for: 'delete',
      to: authenticatedRole,
      using: sql.raw(ownerOrSuperAdmin),
    }),
  ],
)
