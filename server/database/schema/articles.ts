import { pgTable, uuid, text, jsonb, timestamp } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { pgPolicy } from 'drizzle-orm/pg-core'
import { authenticatedRole } from 'drizzle-orm/supabase' // Make sure you have this helper or define it

const isSuperAdmin = sql`EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u."superAdmin" = true)`

export const articles = pgTable(
  'articles',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    ticker: text('ticker').notNull(),
    title: text('title'),
    introduction: text('introduction'),
    body: jsonb('body'), // Expecting array of strings
    conclusion: text('conclusion'),
    components: jsonb('components'),
  },
  (table) => [
    pgPolicy('Allow authenticated read access', {
      for: 'select',
      to: authenticatedRole,
      using: sql`true`, // Authenticated users can read any article
    }),

    pgPolicy('Allow superAdmin full access', {
      for: 'all',
      to: authenticatedRole,
      using: isSuperAdmin,
      withCheck: isSuperAdmin,
    }),
  ],
)
