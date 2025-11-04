import { COUNTRY_TO_LOCALE } from '@@/server/utils/request-geo'

let cachedRates: Record<string, number> | null = null
let lastFetchTimestamp: number = 0
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

/**
 * Fetches rates from the API or returns cached rates if they are still valid.
 * @returns {Promise<Record<string, number>>} A promise that resolves to the rates object.
 */
export async function getExchangeRates(): Promise<Record<string, number>> {
  const now = Date.now()

  if (cachedRates && now - lastFetchTimestamp < CACHE_DURATION_MS) {
    console.log('Returning cached rates.')
    return cachedRates
  }
  const rates = await $fetch<Record<string, number>>(`/api/exchange-rates`, {
    method: 'GET',
  })

  cachedRates = rates
  lastFetchTimestamp = now

  return rates
}

/**
 * Fetches live (or cached) rates, converts an amount, and formats it.
 * @param {number} amount - The amount of money to convert.
 * @param {string} fromCurrency - The 3-letter currency code to convert FROM (e.g., "EUR").
 * @param {string} [toCurrency='USD'] - The 3-letter currency code to convert TO. Defaults to 'USD'.
 * @param {string} [country='US'] - The locale for number formatting (e.g., 'en-US', 'de-DE', 'ja-JP').
 * @param {number} [maxFractionDigits=2] - The maximum number of decimal places.
 * @returns {Promise<string | null>} A promise that resolves to the formatted currency
 */
export async function convertAndFormatCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency = 'USD',
  country = 'US',
  maxFractionDigits = 2,
) {
  try {
    const rates = await getExchangeRates()

    const from = fromCurrency.toUpperCase()
    const to = toCurrency.toUpperCase()

    const fromRate = rates[from]
    const toRate = rates[to]

    if (!fromRate || !toRate) {
      console.error(
        'Error: Invalid currency code. Not found in API rates map.',
        {
          from,
          to,
        },
      )
      return null
    }

    const amountInBase = amount / fromRate
    const convertedAmount = amountInBase * toRate

    const formatter = new Intl.NumberFormat(COUNTRY_TO_LOCALE[country], {
      style: 'currency',
      currency: to,
      maximumFractionDigits: maxFractionDigits,
    })

    return formatter.format(convertedAmount)
  } catch (error) {
    console.error('Currency conversion failed:', error)
    cachedRates = null
    lastFetchTimestamp = 0
    return null
  }
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
