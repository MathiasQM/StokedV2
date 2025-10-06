import {
  pgTable,
  text,
  integer,
  timestamp,
  jsonb,
  boolean,
  uuid,
} from 'drizzle-orm/pg-core'
import { customers } from './customers'
import { relations, sql } from 'drizzle-orm'
import { prices } from './prices'
import { users } from './users'
import { pgPolicy } from 'drizzle-orm/pg-core'
import { authenticatedRole } from 'drizzle-orm/supabase'

// --- Reusable SQL Fragments ---
const isSuperAdmin = sql`EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u."superAdmin" = true)`
const isOwnerOrSuperAdmin = sql`"user_id" = auth.uid() OR ${isSuperAdmin}`

export const subscriptions = pgTable(
  'subscriptions',
  {
    id: text('id').primaryKey(), // Stripe Subscription ID
    customerId: text('customer_id').references(() => customers.id), // Stripe Customer ID
    priceId: text('price_id').references(() => prices.id), // Stripe Price ID
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
    status: text('status').notNull(),
    metadata: jsonb('metadata'),
    quantity: integer('quantity').notNull(),
    cancelAtPeriodEnd: boolean('cancel_at_period_end').notNull(),
    currentPeriodEnd: timestamp('current_period_end'),
    currentPeriodStart: timestamp('current_period_start'),
    endedAt: timestamp('ended_at'),
    cancelAt: timestamp('cancel_at'),
    trialStart: timestamp('trial_start'),
    trialEnd: timestamp('trial_end'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
    pendingSwitch: boolean('pending_switch').default(false).notNull(),
    pendingPriceId: text('pending_price_id').references(() => prices.id),
    switchScheduledAt: timestamp('switch_scheduled_at'),
    promptPortfolioModal: boolean('prompt_portfolio_modal')
      .default(false)
      .notNull(),
  },
  (table) => [
    pgPolicy('select_own_subscriptions', {
      for: 'select',
      to: authenticatedRole,
      using: isOwnerOrSuperAdmin,
    }),
    pgPolicy('insert_subscriptions_superadmin_only', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: isSuperAdmin,
    }),
    pgPolicy('update_subscriptions_superadmin_only', {
      for: 'update',
      to: authenticatedRole,
      using: isSuperAdmin,
      withCheck: isSuperAdmin,
    }),
    pgPolicy('delete_subscriptions_superadmin_only', {
      for: 'delete',
      to: authenticatedRole,
      using: isSuperAdmin,
    }),
  ],
)

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  customer: one(customers, {
    fields: [subscriptions.customerId],
    references: [customers.id],
  }),
  price: one(prices, {
    fields: [subscriptions.priceId],
    references: [prices.id],
  }),
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
}))
