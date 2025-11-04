function fetchRatesFromServer(appId: string) {
  let ratesPromise = null
  console.log('Exchange Rate App ID:', appId)

  if (!appId) {
    return Promise.reject(new Error('Server configuration error.'))
  }

  if (!ratesPromise) {
    const apiUrl = `https://openexchangerates.org/api/latest.json?app_id=${appId}`

    ratesPromise = fetch(apiUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`)
        }
        return response.json()
      })
      .then((data) => {
        if (data.error) {
          throw new Error(`Open Exchange Rates API Error: ${data.description}`)
        }

        return data.rates
      })
      .catch((error) => {
        console.error('Error fetching rates from API:', error)
        ratesPromise = null
        throw error
      })
  }

  return ratesPromise
}

export default defineEventHandler(async (event) => {
  const cfg = useRuntimeConfig()
  try {
    const rates = await fetchRatesFromServer(cfg.exchangeRateAppId)

    return rates
  } catch (error) {
    console.error('Error fetching exchange rates:', error)
    return { error: 'Failed to fetch exchange rates.' }
  }
})
