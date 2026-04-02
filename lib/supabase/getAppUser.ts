import { createClient } from "@/lib/supabase/server"

export type AppUser = {
  id: string
  company_id: string
  role: "admin" | "manager" | "salesperson" | string
  company_type?: "personal" | "company" | string | null
}

type AppUserWithRoleError = Error & { status?: number }

async function createCompanyWithFallback(supabase: any, name: string) {
  const candidates = [
    { name, type: "personal" },
    { name },
    { name, plan: "free" },
    { name, is_active: true },
  ]

  let lastError: any = null
  for (const payload of candidates) {
    const { data, error } = await supabase
      .from("companies")
      .insert(payload)
      .select("id")
      .single()
    if (!error && data?.id) return data.id as string
    lastError = error
  }
  throw lastError || new Error("Failed to create company")
}

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

  let { data: appUser, error: usersError } = await supabase
    .from("users")
    .select("id, company_id, role")
    .eq("id", user.id)
    .maybeSingle()

  if (usersError) {
    console.error("Error fetching user profile:", usersError)
  }

  if (!appUser) {
    // Graceful fallback: if auth user exists but app profile doesn't,
    // create a personal company + admin profile so the app can continue.
    try {
      const emailName = (user.email || "User").split("@")[0]
      const companyId = await createCompanyWithFallback(supabase, `${emailName}'s Workspace`)
      const payload = {
        id: user.id,
        company_id: companyId,
        role: "admin",
        manager_id: null,
        email: user.email ?? null,
      }
      const created = await supabase
        .from("users")
        .upsert(payload, { onConflict: "id" })
        .select("id, company_id, role")
        .single()

      if (!created.error && created.data) {
        appUser = created.data
      }
    } catch (createErr) {
      console.error("Error auto-creating missing user profile:", createErr)
    }
  }

  if (!appUser) {
    const err = new Error("User profile could not be loaded or created") as AppUserWithRoleError
    err.status = 500
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
      .maybeSingle()
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