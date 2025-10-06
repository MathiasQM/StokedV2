import { createClient } from '@supabase/supabase-js'

// This utility creates a Supabase client that uses the secret "service_role" key.
// This key should ONLY be used in a secure server environment and NEVER exposed to the browser.
// It bypasses all Row Level Security (RLS) policies, giving your server full admin access.

// 1. Get the environment variables from your project's .env file.
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

// 2. Throw an error if the required variables are not set.
if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    'Supabase URL or Service Key is not defined in your .env file.',
  )
}

// 3. Create and export the admin client.
// You will import this client in any server route that needs to write or delete data.
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    // It's good practice to disable auto-refreshing tokens for server-side clients.
    autoRefreshToken: false,
    persistSession: false,
  },
})
