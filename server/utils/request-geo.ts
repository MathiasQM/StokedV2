import type { H3Event } from 'h3'
import { getRequestHeader } from 'h3'

type HeaderGeo = {
  country?: string | null
  city?: string | null
  region?: string | null
}

export function readGeoFromHeaders(event: H3Event): HeaderGeo {
  // Known/possible headers across platforms (Cloud Run / LB / others).
  // Use lowercase because Node normalizes headers to lowercase.
  const hdr = (name: string) => (getRequestHeader(event, name) || '') as string

  // Country fallbacks (ISO-2 expected)
  const country =
    hdr('x-country-code') || // Firebase App Hosting (common)
    hdr('x-geo-country-code') || // Some Google LB setups
    hdr('x-appengine-country') || // App Engine standard
    hdr('cf-ipcountry') || // Cloudflare (if you move there later)
    '' ||
    null

  // City/region fallbacks
  const city =
    hdr('x-geo-city') || hdr('x-appengine-city') || hdr('x-city') || '' || null

  const region = hdr('x-geo-region') || hdr('x-appengine-region') || '' || null

  return {
    country: country || null,
    city: city || null,
    region: region || null,
  }
}

// // Very small map. Extend to your markets as needed.
// const COUNTRY_TO_LOCALE: Record<string, string> = {
//   DK: 'da-DK',
//   SE: 'sv-SE',
//   NO: 'nb-NO',
//   FI: 'fi-FI',
//   DE: 'de-DE',
//   NL: 'nl-NL',
//   FR: 'fr-FR',
//   ES: 'es-ES',
//   IT: 'it-IT',
//   PT: 'pt-PT',
//   GB: 'en-GB',
//   IE: 'en-IE',
//   US: 'en-US',
//   CA: 'en-CA',
//   AU: 'en-AU',
//   NZ: 'en-NZ',
//   CH: 'de-CH',
//   AT: 'de-AT',
//   BE: 'nl-BE',
//   JP: 'ja-JP',
// }

// const COUNTRY_TO_CURRENCY: Record<string, string> = {
//   DK: 'DKK',
//   SE: 'SEK',
//   NO: 'NOK',
//   FI: 'EUR',
//   DE: 'EUR',
//   NL: 'EUR',
//   FR: 'EUR',
//   ES: 'EUR',
//   IT: 'EUR',
//   PT: 'EUR',
//   GB: 'GBP',
//   IE: 'EUR',
//   CH: 'CHF',
//   AT: 'EUR',
//   BE: 'EUR',
//   US: 'USD',
//   CA: 'CAD',
//   AU: 'AUD',
//   NZ: 'NZD',
//   JP: 'JPY',
// }

// export function inferLocaleFrom(event: H3Event, iso2?: string | null): string {
//   if (iso2 && COUNTRY_TO_LOCALE[iso2]) return COUNTRY_TO_LOCALE[iso2]
//   // Fallback: Accept-Language (Nuxt/Nitro friendly)
//   const accept = (getRequestHeader(event, 'accept-language') || '') as string
//   // Basic parse: "da-DK,da;q=0.9,en-US;q=0.8"
//   const first = accept.split(',')[0]?.trim()
//   return first || 'en-US'
// }

// export function inferCurrencyFromCountry(
//   iso2?: string | null,
//   fallback = 'USD',
// ): string {
//   return (iso2 && COUNTRY_TO_CURRENCY[iso2]) || fallback
// }
