/**
 * Fetches fundamental data for a given stock symbol from EODHD.
 * This is used to get company details like the website URL.
 * NOTE: This requires the 'Fundamentals API' to be part of your EODHD subscription.
 * @param symbol - The stock symbol (e.g., 'AAPL.US').
 * @returns The 'General' section of the fundamental data, or null if not found.
 */
export async function fetchFundamentals(
  symbol: string,
): Promise<{ WebURL?: string } | null> {
  try {
    const config = useRuntimeConfig()
    const apiKey = config.eodApiKey

    if (!apiKey) {
      console.error('EODHD API key is not configured.')
      return null
    }

    // Use Nuxt's server-side $fetch for direct API calls
    const data = await $fetch<{ General: { WebURL: string } }>(
      `https://eodhd.com/api/fundamentals/${symbol}`,
      {
        query: {
          api_token: apiKey,
          fmt: 'json',
        },
      },
    )

    return data.General
  } catch (error) {
    console.error(`Failed to fetch fundamentals for ${symbol}:`, error)
    return null // Return null on error so one failed ticker doesn't stop the whole process
  }
}
