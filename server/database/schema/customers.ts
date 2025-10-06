import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { users } from './users'
import { sql } from 'drizzle-orm'
import { pgPolicy } from 'drizzle-orm/pg-core'
import { authenticatedRole } from 'drizzle-orm/supabase'

// --- Reusable SQL Fragments ---
const isSuperAdmin = sql`EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u."superAdmin" = true)`
const isOwnerOrSuperAdmin = sql`"user_id" = auth.uid() OR ${isSuperAdmin}`

export const customers = pgTable(
  'customers',
  {
    id: text('id').primaryKey(), // Stripe Customer ID
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [
    pgPolicy('select_own_customer', {
      for: 'select',
      to: authenticatedRole,
      using: isOwnerOrSuperAdmin,
    }),
    pgPolicy('insert_customers_superadmin_only', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: isSuperAdmin,
    }),
    pgPolicy('update_customers_superadmin_or_owner', {
      for: 'update',
      to: authenticatedRole,
      using: isOwnerOrSuperAdmin,
      withCheck: isOwnerOrSuperAdmin,
    }),
    pgPolicy('delete_customers_superadmin_only', {
      for: 'delete',
      to: authenticatedRole,
      using: isSuperAdmin,
    }),
  ],
)
