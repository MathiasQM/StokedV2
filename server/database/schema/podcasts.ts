import { pgTable, uuid, text, jsonb, timestamp } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { pgPolicy } from 'drizzle-orm/pg-core'
import { authenticatedRole } from 'drizzle-orm/supabase'

// --- Reusable SQL Fragment ---
const isSuperAdmin = sql`EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u."superAdmin" = true)`

export const podcasts = pgTable(
  'podcasts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    ticker: text('ticker').notNull(),
    title: text('title'),

    // 'processing', 'completed', 'failed'
    status: text('status').notNull(),

    // The full JSON from the article generation step
    articleJson: jsonb('article_json'),

    // The public URL from Supabase Storage
    audioUrl: text('audio_url'),

    // The array of [{text, start, end}] objects
    wordTimings: jsonb('word_timings'),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    // ✅ POLICY 1: Now for AUTHENTICATED users only
    pgPolicy('Allow authenticated users to read', {
      for: 'select',
      to: authenticatedRole, // <-- THIS IS THE ONLY CHANGE NEEDED
      using: sql`${table.status} = 'completed'`,
    }),

    // ✅ POLICY 2: Allows authenticated superAdmins to do anything
    pgPolicy('Allow superAdmin full access', {
      for: 'all',
      to: authenticatedRole,
      using: isSuperAdmin,
      withCheck: isSuperAdmin,
    }),
  ],
)
