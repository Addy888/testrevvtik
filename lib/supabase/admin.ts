import { createClient } from "@supabase/supabase-js"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceRoleKey) {
  // Keep this module server-only. If env is missing, throw when imported/used.
  const err = new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
  ;(err as any).status = 500
  throw err
}

// Server-only admin client. Never import this into client components.
export const supabaseAdmin = createClient(url, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
})

// Backwards-compatible helper for existing imports.
export function createAdminClient() {
  return supabaseAdmin
}

