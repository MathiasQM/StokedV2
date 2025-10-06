import { nanoid } from 'nanoid'
import { pgTable, text, timestamp, jsonb, uuid } from 'drizzle-orm/pg-core'
import { users } from './users'
import { relations } from 'drizzle-orm'

export const subscribers = pgTable('subscribers', {
  id: text('id')
    .primaryKey()
    .$default(() => nanoid()),
  email: text('email').notNull().unique(),
  referrer: text('referrer'),
  // Use jsonb for better performance and indexing with JSON in Postgres
  meta: jsonb('meta'),
  // Use the native timestamp type for Postgres
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .$onUpdate(() => new Date()),
})

export const feedback = pgTable('feedback', {
  id: text('id')
    .primaryKey()
    .$default(() => nanoid()),
  // Assuming users.id is a UUID. If it's text, change this back to text('user')
  user: uuid('user')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  message: text('message').notNull(),
  status: text('status').notNull().default('pending'),
  reply: text('reply'),
  meta: jsonb('meta'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
})

// The relations function works the same for all database drivers
export const feedbackRelations = relations(feedback, ({ one }) => ({
  user: one(users, {
    fields: [feedback.user],
    references: [users.id],
  }),
}))
