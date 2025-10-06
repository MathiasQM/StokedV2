/**
 * 1.  Constants & helpers
 * ------------------------------------------------------------------ */
export const PLAN_IDS = {
  FREE: 'free',
  PRO: 'prod_S4gI59wZlL3Jko',
  UNLIMITED: 'prod_SLsHmiaJFUxPZp',
} as const

export type PlanId = (typeof PLAN_IDS)[keyof typeof PLAN_IDS]

export type Feature =
  | 'ownedPortfolios'
  | 'portfolioMemberships'
  | 'portfolioMembers'
  | 'aiCredits'

export interface LimitCheckResult {
  isAllowed: boolean
  limit: number
  currentCount: number
  exceededBy: number
  label: string
}

/**
 * 2.  Limit table (one place = single source of truth)
 * ------------------------------------------------------------------ */
const LIMITS = {
  [PLAN_IDS.FREE]: {
    ownedPortfolios: { max: 1, label: 'Personal portfolios' },
    portfolioMemberships: { max: 0, label: 'Portfolio memberships' },
    portfolioMembers: { max: 0, label: 'Members per portfolio' },
    aiCredits: { max: 100, label: 'AI credits (monthly)' },
  },
  [PLAN_IDS.PRO]: {
    ownedPortfolios: { max: 2, label: 'Personal portfolios' },
    portfolioMemberships: { max: 2, label: 'Portfolio memberships' },
    portfolioMembers: { max: 2, label: 'Members per portfolio' },
    aiCredits: { max: 1000, label: 'AI credits (monthly)' },
  },
  [PLAN_IDS.UNLIMITED]: {
    ownedPortfolios: { max: 4, label: 'Personal portfolios' },
    portfolioMemberships: { max: 10, label: 'Portfolio memberships' },
    portfolioMembers: { max: 10, label: 'Members per portfolio' },
    aiCredits: { max: 2000, label: 'AI credits (monthly)' },
  },
} as const

export function checkLimit(
  planId: PlanId | undefined | null, // user’s price / plan ID
  feature: Feature, // which metered feature?
  currentCount: number, // how many they already use
  extra = 0, // optional extra allowance
  fallbackPlan: PlanId = PLAN_IDS.FREE,
): LimitCheckResult {
  const planKey = planId && planId in LIMITS ? planId : fallbackPlan

  const rule = LIMITS[planKey][feature]

  const limit = rule.max
  const effectiveUse = currentCount - extra

  const exceededBy = Math.max(0, effectiveUse - limit)

  return {
    isAllowed: exceededBy <= 0,
    limit,
    currentCount: effectiveUse,
    exceededBy,
    label: rule.label,
  }
}
