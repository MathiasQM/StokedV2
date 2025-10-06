import {
  pgTable,
  text,
  integer,
  timestamp,
  jsonb,
  boolean,
} from 'drizzle-orm/pg-core'
import { products } from './products'
import { relations, sql } from 'drizzle-orm'
import { pgPolicy } from 'drizzle-orm/pg-core'
import { authenticatedRole, anonRole } from 'drizzle-orm/supabase'

// --- Reusable SQL Fragment ---
const isSuperAdmin = sql`EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u."superAdmin" = true)`

export const prices = pgTable(
  'prices',
  {
    id: text('id').primaryKey().notNull(), // Stripe Price ID
    description: text('description'),
    currency: text('currency').notNull(),
    unitAmount: integer('unit_amount').notNull(),
    type: text('type').notNull(),
    interval: text('interval').notNull(),
    intervalCount: integer('interval_count').notNull(),
    trialPeriodDays: integer('trial_period_days'),
    active: boolean('active').notNull().default(true),
    metadata: jsonb('metadata'),
    productId: text('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [
    pgPolicy('select_all_prices', {
      for: 'select',
      to: [authenticatedRole, anonRole], // Allows both logged-in and logged-out users
      using: sql`true`,
    }),
    pgPolicy('insert_prices_superadmin_only', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: isSuperAdmin,
    }),
    pgPolicy('update_prices_superadmin_only', {
      for: 'update',
      to: authenticatedRole,
      using: isSuperAdmin,
      withCheck: isSuperAdmin,
    }),
    pgPolicy('delete_prices_superadmin_only', {
      for: 'delete',
      to: authenticatedRole,
      using: isSuperAdmin,
    }),
  ],
)

export const pricesRelations = relations(prices, ({ one }) => ({
  product: one(products, {
    fields: [prices.productId],
    references: [products.id],
  }),
}))
