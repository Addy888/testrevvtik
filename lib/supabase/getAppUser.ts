import { createClient } from "@/lib/supabase/server"

export type AppUser = {
  id: string
  email: string | null
  role: "admin" | "manager" | "salesperson" | string
  company_id: string | null
}

type AppUserWithRoleError = Error & { status?: number }

export async function getAppUserFromSupabase(supabase: any): Promise<AppUser> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (!user || authError) {
    const err = new Error("Unauthorized") as AppUserWithRoleError
    err.status = 401
    throw err
  }

  const { data: appUser, error: usersError } = await supabase
    .from("users")
    .select("id, email, role, company_id")
    .eq("id", user.id)
    .maybeSingle()

  if (usersError) {
    console.error("Error fetching user profile:", usersError)
    const err = new Error("Failed to fetch user profile") as AppUserWithRoleError
    err.status = 500
    throw err
  }

  if (!appUser) {
    return {
      id: user.id,
      email: user.email ?? null,
      role: "admin",
      company_id: null,
    }
  }
  return appUser as AppUser
}

export async function requireAppUser(): Promise<AppUser> {
  const supabase = await createClient()
  return getAppUserFromSupabase(supabase)
}