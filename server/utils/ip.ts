import type { H3Event } from 'h3'

// This helper is still useful for getting any header.
import { getRequestHeader } from 'h3'

// Your original type, no changes needed.
type GeoLocation = {
  country?: string | null
  city?: string | null
  region?: string | null
  currency: string
  timezone: string
}

/**
 * Gets geolocation data by looking up the request's IP address.
 * This function is async because it makes a network request.
 * @param event The H3 event object from the server request.
 * @returns A promise that resolves to the geolocation data.
 */
export async function readGeoFromIp(event: H3Event): Promise<GeoLocation> {
  try {
    // 1. Get the user's IP address from the request headers.
    // 'x-forwarded-for' is the standard header for identifying the
    // originating IP address of a client connecting through a proxy or load balancer.
    const userIp =
      getRequestHeader(event, 'x-forwarded-for')?.split(',')[0].trim() || null

    // If no IP is found, or if it's a local IP for development, stop here.
    if (!userIp || userIp === '127.0.0.1' || userIp === '::1') {
      console.log('No valid public IP found, skipping geo lookup.')
      return {
        country: 'Unknown',
        city: 'Unknown',
        region: 'Unknown',
        currency: 'Unknown',
        timezone: 'Unknown',
      }
    }

    // 2. Call the external IP geolocation service.
    // We use ofetch here as it's common in the Nuxt/Nitro ecosystem,
    // but you can use standard `fetch`.
    const geo = await $fetch<{
      status: 'success' | 'fail'
      countryCode: string
      regionName: string
      city: string
      currency: string
      timezone: string
    }>(
      `http://ip-api.com/json/${userIp}?fields=status,countryCode,regionName,city,timezone,currency`,
    )

    // 3. Check for a successful response and return the data in your desired format.
    if (geo.status === 'success') {
      return {
        country: geo.countryCode || 'Unknown', // e.g., "DK"
        city: geo.city || 'Unknown', // e.g., "Aarhus"
        region: geo.regionName || 'Unknown', // e.g., "Central Denmark Region"
        currency: geo.currency || 'Unknown', // e.g., "DKK"
        timezone: geo.timezone || 'Unknown', // e.g., "Europe/Copenhagen"
      }
    }
  } catch (error) {
    // Log the error but don't crash the request.
    console.error('Failed to fetch IP geolocation:', error)
  }

  // Return a default null object on failure.
  return {
    country: 'Unknown',
    city: 'Unknown',
    region: 'Unknown',
    currency: 'Unknown',
    timezone: 'Unknown',
  }
}
