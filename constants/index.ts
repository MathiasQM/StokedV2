import type { DataRange } from '@@/stores/market/useMarketStore'

export enum UserRole {
  MEMBER = 'member',
  ADMIN = 'admin',
  OWNER = 'owner',
}

export enum OneTimePasswordTypes {
  signup = 'SIGNUP',
  login = 'LOGIN',
  forgotPassword = 'FORGOT_PASSWORD',
}

export const POSITIVE = {
  line: '#07b25f',
  lineOpacity: 'rgba(7,178,95,.4)',
  fill: 'rgba(7,178,95,.1)',
}
export const NEGATIVE = {
  line: '#ff5000',
  lineOpacity: 'rgba(255,106,10,.4)',
  fill: 'rgba(255,106,10,.1)',
}

export const ranges: DataRange[] = [
  // '1d',
  '1w',
  '1m',
  '3m',
  '6m',
  'ytd',
  '1y',
  '3y',
  'max',
] as const
