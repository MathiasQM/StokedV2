import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '../database/schema'

declare global {
  var _drizzle: ReturnType<typeof drizzle> | undefined
}

export function useDB() {
  if (global._drizzle) return global._drizzle

  const { postgresUrl } = useRuntimeConfig()

  if (!postgresUrl) throw new Error('POSTGRES_URL missing')

  const client = postgres(postgresUrl, {
    connect_timeout: 30,
    idle_timeout: 60,
  })

  global._drizzle = drizzle(client, { schema })
  return global._drizzle
}

export const tables = schema
