import {
  pgTable,
  text,
  varchar,
  boolean,
  timestamp,
  integer,
  uuid,
  jsonb,
} from 'drizzle-orm/pg-core'
import { OneTimePasswordTypes } from '../../../constants'
import { users } from './users'
import { relations, sql } from 'drizzle-orm'
import { type WebAuthnCredential } from '@simplewebauthn/server'
import { pgPolicy } from 'drizzle-orm/pg-core'
import { authenticatedRole } from 'drizzle-orm/supabase'

// --- Reusable SQL String Condition ---
const isSuperAdminCondition = `EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u."superAdmin" = true)`

export const oauthAccounts = pgTable(
  'oauth_accounts',
  {
    id: text('id').primaryKey().notNull().default(crypto.randomUUID()),
    provider: text('provider').notNull(),
    providerUserId: text('providerUserId').notNull(),
    userId: uuid('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => {
    const isOwnerCondition = `"userId" = auth.uid()`
    const ownerOrSuperAdmin = `(${isOwnerCondition}) OR (${isSuperAdminCondition})`
    return [
      pgPolicy('select_own_oauth_accounts', {
        for: 'select',
        to: authenticatedRole,
        using: sql.raw(ownerOrSuperAdmin),
      }),
      pgPolicy('insert_own_oauth_accounts', {
        for: 'insert',
        to: authenticatedRole,
        withCheck: sql.raw(ownerOrSuperAdmin),
      }),
      pgPolicy('delete_own_oauth_accounts', {
        for: 'delete',
        to: authenticatedRole,
        using: sql.raw(ownerOrSuperAdmin),
      }),
      pgPolicy('no_client_update_oauth_accounts', {
        for: 'update',
        to: authenticatedRole,
        using: sql.raw(isSuperAdminCondition),
        withCheck: sql.raw(isSuperAdminCondition),
      }),
    ]
  },
)

export const emailVerificationCodes = pgTable(
  'email_verification_codes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    code: varchar('code', { length: 32 }).notNull(),
    expiresAt: timestamp('expires_at').notNull(),
  },
  (table) => {
    const isOwnerCondition = `"userId" = auth.uid()`
    const ownerOrSuperAdmin = `(${isOwnerCondition}) OR (${isSuperAdminCondition})`
    return [
      pgPolicy('select_own_verification_codes', {
        for: 'select',
        to: authenticatedRole,
        using: sql.raw(ownerOrSuperAdmin),
      }),
      pgPolicy('insert_verification_codes_superadmin_only', {
        for: 'insert',
        to: authenticatedRole,
        withCheck: sql.raw(isSuperAdminCondition),
      }),
      pgPolicy('update_verification_codes_superadmin_only', {
        for: 'update',
        to: authenticatedRole,
        using: sql.raw(isSuperAdminCondition),
        withCheck: sql.raw(isSuperAdminCondition),
      }),
      pgPolicy('delete_verification_codes_superadmin_only', {
        for: 'delete',
        to: authenticatedRole,
        using: sql.raw(isSuperAdminCondition),
      }),
    ]
  },
)

export const passwordResetTokens = pgTable(
  'password_reset_tokens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    code: varchar('code', { length: 32 }).notNull(),
    expiresAt: timestamp('expires_at').notNull(),
  },
  (table) => {
    const isOwnerCondition = `"userId" = auth.uid()`
    const ownerOrSuperAdmin = `(${isOwnerCondition}) OR (${isSuperAdminCondition})`
    return [
      pgPolicy('select_own_password_tokens', {
        for: 'select',
        to: authenticatedRole,
        using: sql.raw(ownerOrSuperAdmin),
      }),
      pgPolicy('insert_password_tokens_superadmin_only', {
        for: 'insert',
        to: authenticatedRole,
        withCheck: sql.raw(isSuperAdminCondition),
      }),
      pgPolicy('update_password_tokens_superadmin_only', {
        for: 'update',
        to: authenticatedRole,
        using: sql.raw(isSuperAdminCondition),
        withCheck: sql.raw(isSuperAdminCondition),
      }),
      pgPolicy('delete_password_tokens_superadmin_only', {
        for: 'delete',
        to: authenticatedRole,
        using: sql.raw(isSuperAdminCondition),
      }),
    ]
  },
)

export const oneTimePasswords = pgTable(
  'one_time_passwords',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('userId').references(() => users.id, { onDelete: 'cascade' }),
    identifier: text('identifier').notNull(),
    code: varchar('code', { length: 6 }).notNull(),
    type: text('type').notNull().default(OneTimePasswordTypes.signup),
    expiresAt: timestamp('expires_at').notNull(),
  },
  (table) => {
    const isOwnerCondition = `"userId" = auth.uid()`
    const ownerOrSuperAdmin = `(${isOwnerCondition}) OR (${isSuperAdminCondition})`
    return [
      pgPolicy('select_own_otps', {
        for: 'select',
        to: authenticatedRole,
        using: sql.raw(ownerOrSuperAdmin),
      }),
      pgPolicy('insert_otps_superadmin_only', {
        for: 'insert',
        to: authenticatedRole,
        withCheck: sql.raw(isSuperAdminCondition),
      }),
      pgPolicy('update_otps_superadmin_only', {
        for: 'update',
        to: authenticatedRole,
        using: sql.raw(isSuperAdminCondition),
        withCheck: sql.raw(isSuperAdminCondition),
      }),
      pgPolicy('delete_otps_superadmin_only', {
        for: 'delete',
        to: authenticatedRole,
        using: sql.raw(isSuperAdminCondition),
      }),
    ]
  },
)

export const webAuthnCredentials = pgTable(
  'webauthn_credentials',
  {
    id: text('id').primaryKey().notNull(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    name: text('name').notNull(),
    publicKey: text('public_key').notNull(),
    counter: integer('counter').notNull(),
    backedUp: boolean('backed_up').notNull(),
    transports: text('transports')
      .notNull()
      .$type<WebAuthnCredential['transports']>(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
    revokedAt: timestamp('revoked_at'),
  },
  (table) => [
    pgPolicy('webauthn_credentials_superadmin_access', {
      for: 'all',
      to: authenticatedRole,
      using: sql.raw(isSuperAdminCondition),
      withCheck: sql.raw(isSuperAdminCondition),
    }),
  ],
)

export const webAuthnChallenges = pgTable(
  'webauthn_challenges',
  {
    id: text('id').primaryKey().notNull(),
    challenge: text('challenge').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
  },
  (table) => [
    pgPolicy('webauthn_challenges_superadmin_access', {
      for: 'all',
      to: authenticatedRole,
      using: sql.raw(isSuperAdminCondition),
      withCheck: sql.raw(isSuperAdminCondition),
    }),
  ],
)

export const oauthAccountsRelations = relations(oauthAccounts, ({ one }) => ({
  user: one(users, {
    fields: [oauthAccounts.userId],
    references: [users.id],
  }),
}))
