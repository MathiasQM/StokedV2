import {
  pgTable,
  text,
  timestamp,
  uuid,
  jsonb,
  pgPolicy,
  numeric,
} from 'drizzle-orm/pg-core'
import { relations, sql } from 'drizzle-orm'
import { authenticatedRole } from 'drizzle-orm/supabase'
import { users } from './users'
import { portfolios, portfolioMembers } from './portfolios'

const isSuperAdminCondition = `EXISTS (
  SELECT 1
  FROM public.users u
  WHERE u.id = auth.uid() AND u."superAdmin" = true
)`

export const dailyBriefs = pgTable(
  'daily_briefs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    portfolioId: uuid('portfolioId')
      .notNull()
      .references(() => portfolios.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow(),
    summaryData: text('summary_data').notNull(),
    inlineWidgetData: jsonb('inline_widget_data').notNull(),
    thematicExposure: jsonb('thematic_exposure').notNull(),
    suggestions: text('suggestions').array().notNull().$type<string[]>(),
    uncertainties: text('uncertainties').array().notNull().$type<string[]>(),
    redFlags: text('red_flags').array().notNull().$type<string[]>(),
    riskLevel: jsonb('risk_level')
      .notNull()
      .$type<{ score: number; label: string }>(),
    confidenceScore: numeric('confidence_score').notNull(),
    riskSummary: text('risk_summary').notNull(),
    widgetData: text('widget_data').notNull(),
    podcastScript: text('podcast_script').notNull(),
    audioUrl: jsonb('audio_url').notNull(),
  },
  //   (table) => {
  //     // SELECT policy: super-admin or portfolio member
  //     pgPolicy('select_daily_briefs', {
  //       for: 'select',
  //       to: authenticatedRole,
  //       using: sql.raw(`
  //         ${isSuperAdminCondition}
  //         OR EXISTS (
  //           SELECT 1
  //           FROM public.portfolio_members pm
  //           WHERE pm."portfolioId" = ${table.portfolioId.name}
  //           AND pm."userId" = auth.uid()
  //         )
  //       `),
  //     })

  //     // INSERT policy: owner or super-admin
  //     pgPolicy('insert_daily_briefs', {
  //       for: 'insert',
  //       to: authenticatedRole,
  //       withCheck: sql.raw(`
  //         ${isSuperAdminCondition}
  //         OR (
  //           NEW."userId" = auth.uid()
  //           AND EXISTS (
  //             SELECT 1
  //             FROM public.portfolio_members pm
  //             WHERE pm."portfolioId" = NEW."portfolioId"
  //               AND pm."userId" = auth.uid()
  //           )
  //         )
  //       `),
  //     })

  //     // UPDATE policy: owner, super-admin, or portfolio member
  //     pgPolicy('update_daily_briefs', {
  //       for: 'update',
  //       to: authenticatedRole,
  //       using: sql.raw(`
  //         ${isSuperAdminCondition}
  //         OR ${table.userId.name} = auth.uid()
  //         OR EXISTS (
  //           SELECT 1
  //           FROM public.portfolio_members pm
  //           WHERE pm."portfolioId" = ${table.portfolioId.name}
  //             AND pm."userId" = auth.uid()
  //         )
  //       `),
  //       withCheck: sql.raw(`
  //         ${isSuperAdminCondition}
  //         OR ${table.userId.name} = auth.uid()
  //         OR EXISTS (
  //           SELECT 1
  //           FROM public.portfolio_members pm
  //           WHERE pm."portfolioId" = ${table.portfolioId.name}
  //             AND pm."userId" = auth.uid()
  //         )
  //       `),
  //     })

  //     // DELETE policy: owner or super-admin
  //     pgPolicy('delete_daily_briefs', {
  //       for: 'delete',
  //       to: authenticatedRole,
  //       using: sql.raw(`
  //         ${isSuperAdminCondition}
  //         OR ${table.userId.name} = auth.uid()
  //       `),
  //     })
  //   },
)

export const dailyBriefsRelations = relations(dailyBriefs, ({ one }) => ({
  portfolio: one(portfolios, {
    fields: [dailyBriefs.portfolioId],
    references: [portfolios.id],
  }),
}))
