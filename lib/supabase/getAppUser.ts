import { createClient } from "@/lib/supabase/server"

export type AppUser = {
  id: string
  company_id: string
  role: "admin" | "manager" | "salesperson" | string
  company_type?: "personal" | "company" | string | null
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
    .select("id, company_id, role")
    .eq("id", user.id)
    .single()

  if (usersError || !appUser) {
    const err = new Error("User profile not found") as AppUserWithRoleError
    err.status = 404
    throw err
  }

  // Fetch company type to distinguish Personal vs Team onboarding.
  // Used for role-based routing (e.g. prevent Individuals from reaching manager features).
  let companyType: AppUser["company_type"] = null
  try {
    const { data: company } = await supabase
      .from("companies")
      .select("type")
      .eq("id", appUser.company_id)
      .single()
    companyType = (company?.type ?? null) as AppUser["company_type"]
  } catch {
    // If the column/table doesn't exist, fallback to null.
    companyType = null
  }

  return { ...(appUser as AppUser), company_type: companyType }
}

export async function requireAppUser(): Promise<AppUser> {
  const supabase = await createClient()
  return getAppUserFromSupabase(supabase)
}