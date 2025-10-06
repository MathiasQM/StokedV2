import {
  pgTable,
  text,
  integer,
  timestamp,
  jsonb,
  boolean,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { pgPolicy } from 'drizzle-orm/pg-core'
import { authenticatedRole } from 'drizzle-orm/supabase'

// --- Reusable SQL Fragment ---
const isSuperAdmin = sql`EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u."superAdmin" = true)`

export const products = pgTable(
  'products',
  {
    id: text('id').primaryKey().notNull(), // Stripe Product ID
    name: text('name').notNull(),
    description: text('description'),
    active: boolean('active').notNull().default(true),
    image: text('image'),
    metadata: jsonb('metadata'),
    product_orders: integer('product_orders').notNull().default(0),
    features: jsonb('features'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [
    pgPolicy('products_select', {
      for: 'select',
      to: authenticatedRole,
      using: sql`true`,
    }),
    pgPolicy('products_insert_superadmin_only', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: isSuperAdmin,
    }),
    pgPolicy('products_update_superadmin_only', {
      for: 'update',
      to: authenticatedRole,
      using: isSuperAdmin,
      withCheck: isSuperAdmin,
    }),
    pgPolicy('products_delete_superadmin_only', {
      for: 'delete',
      to: authenticatedRole,
      using: isSuperAdmin,
    }),
  ],
)
