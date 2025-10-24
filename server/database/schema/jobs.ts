import { pgTable, uuid, text, jsonb, timestamp } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { pgPolicy } from 'drizzle-orm/pg-core'
import { authenticatedRole } from 'drizzle-orm/supabase' // Make sure you have this helper or define it

const isSuperAdmin = sql`EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u."superAdmin" = true)`

export const jobs = pgTable(
  'jobs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    jobType: text('job_type').notNull(),
    params: jsonb('params'),
    status: text('status').notNull().default('queued'), // 'queued', 'processing', 'completed', 'failed'
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    result: jsonb('result'),
  },
  (table) => [
    pgPolicy('Allow superAdmin full access', {
      for: 'all',
      to: authenticatedRole,
      using: isSuperAdmin,
      withCheck: isSuperAdmin,
    }),
  ],
)
