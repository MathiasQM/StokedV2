import { readGeoFromHeaders } from '@@/server/utils/request-geo'

/**
 * Formats a numeric value as currency.
 *
 * @param value - The number to format.
 * @param options - Options for currency and locale customization.
 *
 * @example
 * formatCurrency(15213.45) // "15.213,45 kr."
 * formatCurrency(15213.45, { currency: 'USD', locale: 'en-US' }) // "$15,213.45"
 * formatCurrency(15213.45, { currency: 'EUR', locale: 'de-DE', compact: true }) // "15,2 Tsd. €"
 */
export function formatCurrency(
  value: number | null | undefined,
  options: {
    currency?: string
    locale?: string
    compact?: boolean
    minimumFractionDigits?: number
    maximumFractionDigits?: number
  } = {},
): string {
  if (typeof value !== 'number' || isNaN(value)) return '-'

  const {
    currency = 'DKK',
    locale = 'da-DK',
    compact = false,
    minimumFractionDigits = 0,
    maximumFractionDigits = 2,
  } = options

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    notation: compact ? 'compact' : 'standard',
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(value)
}

/**
 * Formats a number as a percentage with sign (+/-).
 *
 * @param value - The number to format.
 * @param decimals - Number of decimals to show (default: 2).
 * @param showSignForZero - Whether to show a sign for zero (default: false).
 *
 * @example
 * formatPercent(26.69) // "+26.69%"
 * formatPercent(-3.42) // "-3.42%"
 * formatPercent(0, 2, true) // "+0.00%"
 */
export function formatPercent(
  value: number | null | undefined,
  decimals = 2,
  showSignForZero = false,
): string {
  if (typeof value !== 'number' || isNaN(value)) return '-'
  const sign = value > 0 ? '+' : value < 0 ? '−' : showSignForZero ? '+' : ''
  return `${sign}${Math.abs(value).toFixed(decimals)}%`
}
