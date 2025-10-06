export type Plan       = 'pro' | 'unlimited'
export type Interval   = 'month' | 'year'

export const PRODUCT_TO_TIER: Record<string, Plan> = {
  prod_S4gI59wZlL3Jko: 'pro',
  prod_SLsHmiaJFUxPZp: 'unlimited',
}

export const TIER_RANK: Record<Plan, number> = { pro: 1, unlimited: 2 }
export const INT_RANK : Record<Interval, number> = { month: 1, year: 2 }
