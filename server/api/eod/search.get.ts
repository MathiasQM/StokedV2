import type { TickerMeta } from '@@/types/eodhd'

export default defineEventHandler(async (event) => {
  // Get the search query from the URL, e.g., /api/search?q=AAPL
  const query = getQuery(event)
  const searchQuery = query.q

  if (
    !searchQuery ||
    typeof searchQuery !== 'string' ||
    searchQuery.trim().length < 2
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Search query "q" must be at least 2 characters long.',
    })
  }

  // Get your secret API key from environment variables
  const { eodApiKey } = useRuntimeConfig()
  if (!eodApiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'API key is not configured.',
    })
  }

  // Construct the EODHD Search API URL
  const searchUrl = `https://eodhd.com/api/search/${searchQuery}?api_token=${eodApiKey}&fmt=json`

  try {
    // Fetch data from EODHD and return it directly to the client
    // The '$fetch' utility from Nuxt handles parsing and error handling
    const results = await $fetch<TickerMeta[]>(searchUrl)
    return results
  } catch (error) {
    console.error('EODHD API search failed:', error)
    throw createError({
      statusCode: 502, // Bad Gateway
      statusMessage: 'Failed to fetch search results from the data provider.',
    })
  }
})
