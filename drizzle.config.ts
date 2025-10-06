import type { Config } from 'drizzle-kit'
import { config as loadEnv } from 'dotenv'
loadEnv()

export default {
  schema: './server/database/schema',
  out: './server/database/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.POSTGRES_URL!,
  },
  migrations: {
    schema: 'public',
    table: '__drizzle_migrations',
  },
} satisfies Config
