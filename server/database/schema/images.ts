import { pgTable, text, timestamp, integer, uuid } from 'drizzle-orm/pg-core'
import { users } from './users'
import { sql } from 'drizzle-orm'
import { pgPolicy } from 'drizzle-orm/pg-core'
import { authenticatedRole } from 'drizzle-orm/supabase'

// --- Reusable SQL Fragments ---
const isSuperAdmin = sql`EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u."superAdmin" = true)`
const isOwnerOrSuperAdmin = sql`"userId" = auth.uid() OR ${isSuperAdmin}`

export const images = pgTable(
  'images',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    contentType: text('contentType'),
    pathname: text('pathname').notNull(),
    size: integer('size'),
    uploadedAt: timestamp('uploaded_at'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [
    // This single policy allows users to perform all actions (select, insert, update, delete)
    // on their own images. Super admins can perform all actions on any image.
    pgPolicy('images_owner_or_superadmin_access', {
      for: 'all',
      to: authenticatedRole,
      using: isOwnerOrSuperAdmin,
      withCheck: isOwnerOrSuperAdmin,
    }),
  ],
)
