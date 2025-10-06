import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { users } from './users'
import { relations, sql } from 'drizzle-orm'
import { pgPolicy } from 'drizzle-orm/pg-core'
import { authenticatedRole } from 'drizzle-orm/supabase'

// --- Reusable SQL Fragment ---
const isSuperAdmin = sql`EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u."superAdmin" = true)`

export const posts = pgTable(
  'posts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    image: text('image'),
    title: text('title').notNull(),
    content: text('content').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [
    pgPolicy('posts_select', {
      for: 'select',
      to: authenticatedRole,
      using: sql`true`,
    }),
    pgPolicy('posts_insert_superadmin_only', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: isSuperAdmin,
    }),
    pgPolicy('posts_update_superadmin_only', {
      for: 'update',
      to: authenticatedRole,
      using: isSuperAdmin,
      withCheck: isSuperAdmin,
    }),
    pgPolicy('posts_delete_superadmin_only', {
      for: 'delete',
      to: authenticatedRole,
      using: isSuperAdmin,
    }),
  ],
)

export const postsRelations = relations(posts, ({ one }) => ({
  userId: one(users, {
    fields: [posts.userId],
    references: [users.id],
  }),
}))
