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

// 🌍 Extended map – add as many locales as you plan to support
export const COUNTRY_TO_LOCALE: Record<string, string> = {
  // Europe
  DK: 'da-DK',
  SE: 'sv-SE',
  NO: 'nb-NO',
  FI: 'fi-FI',
  DE: 'de-DE',
  NL: 'nl-NL',
  FR: 'fr-FR',
  ES: 'es-ES',
  IT: 'it-IT',
  PT: 'pt-PT',
  GB: 'en-GB',
  IE: 'en-IE',
  CH: 'de-CH',
  AT: 'de-AT',
  BE: 'nl-BE',
  LU: 'fr-LU',
  PL: 'pl-PL',
  CZ: 'cs-CZ',
  SK: 'sk-SK',
  HU: 'hu-HU',
  RO: 'ro-RO',
  BG: 'bg-BG',
  GR: 'el-GR',
  HR: 'hr-HR',
  SI: 'sl-SI',
  LT: 'lt-LT',
  LV: 'lv-LV',
  EE: 'et-EE',

  // North America
  US: 'en-US',
  CA: 'en-CA', // could also add 'fr-CA' if you handle French Canada
  MX: 'es-MX',

  // South America
  BR: 'pt-BR',
  AR: 'es-AR',
  CL: 'es-CL',
  CO: 'es-CO',
  PE: 'es-PE',

  // Asia-Pacific
  AU: 'en-AU',
  NZ: 'en-NZ',
  JP: 'ja-JP',
  CN: 'zh-CN',
  HK: 'zh-HK',
  TW: 'zh-TW',
  KR: 'ko-KR',
  SG: 'en-SG',
  IN: 'en-IN',
  TH: 'th-TH',
  VN: 'vi-VN',
  MY: 'ms-MY',
  PH: 'en-PH',
  ID: 'id-ID',

  // Middle East & Africa
  AE: 'ar-AE',
  SA: 'ar-SA',
  EG: 'ar-EG',
  ZA: 'en-ZA',
  IL: 'he-IL',
  TR: 'tr-TR',
  IR: 'fa-IR',

  // Others
  RU: 'ru-RU',
  UA: 'uk-UA',
}

// 💰 Extended currency map
export const COUNTRY_TO_CURRENCY: Record<string, string> = {
  DK: 'DKK',
  SE: 'SEK',
  NO: 'NOK',
  FI: 'EUR',
  DE: 'EUR',
  NL: 'EUR',
  FR: 'EUR',
  ES: 'EUR',
  IT: 'EUR',
  PT: 'EUR',
  GB: 'GBP',
  IE: 'EUR',
  CH: 'CHF',
  AT: 'EUR',
  BE: 'EUR',
  LU: 'EUR',
  PL: 'PLN',
  CZ: 'CZK',
  SK: 'EUR',
  HU: 'HUF',
  RO: 'RON',
  BG: 'BGN',
  GR: 'EUR',
  HR: 'EUR',
  SI: 'EUR',
  LT: 'EUR',
  LV: 'EUR',
  EE: 'EUR',

  US: 'USD',
  CA: 'CAD',
  MX: 'MXN',

  BR: 'BRL',
  AR: 'ARS',
  CL: 'CLP',
  CO: 'COP',
  PE: 'PEN',

  AU: 'AUD',
  NZ: 'NZD',
  JP: 'JPY',
  CN: 'CNY',
  HK: 'HKD',
  TW: 'TWD',
  KR: 'KRW',
  SG: 'SGD',
  IN: 'INR',
  TH: 'THB',
  VN: 'VND',
  MY: 'MYR',
  PH: 'PHP',
  ID: 'IDR',

  AE: 'AED',
  SA: 'SAR',
  EG: 'EGP',
  ZA: 'ZAR',
  IL: 'ILS',
  TR: 'TRY',
  IR: 'IRR',

  RU: 'RUB',
  UA: 'UAH',
}

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
