import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

type SetupMode = "individual" | "team"

async function createCompanyWithFallback(supabase: any, name: string, companyType: string) {
  const candidates = [
    { name, type: companyType },
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

async function upsertUserProfile(
  supabase: any,
  authUser: any,
  companyId: string,
  role: "admin" | "manager" | "salesperson" = "admin"
) {
  const payload = {
    id: authUser.id,
    company_id: companyId,
    role,
    manager_id: null,
    email: authUser.email ?? null,
  }

  const { data, error } = await supabase
    .from("users")
    .upsert(payload, { onConflict: "id" })
    .select("id, company_id, role")
    .single()

  if (error || !data) throw error || new Error("Failed to create user profile")
  return data
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    console.log("Onboarding setup user:", user?.id, "email:", user?.email, "authError:", authError)

    if (authError || !user) {
      console.log("Onboarding setup unauthorized (no user in session)")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const mode = (body?.mode ?? body?.type) as SetupMode | undefined
    if (mode !== "individual" && mode !== "team") {
      return NextResponse.json(
        { error: "Invalid mode. Use individual or team." },
        { status: 400 }
      )
    }

    const existing = await supabase
      .from("users")
      .select("id, company_id, role")
      .eq("id", user.id)
      .maybeSingle()

    if (existing.data?.id) {
      // Determine where to route based on both role and company type.
      // Individuals (personal) must not reach manager features.
      let companyType: string | null = null
      try {
        const { data: company } = await supabase
          .from("companies")
          .select("type")
          .eq("id", existing.data.company_id)
          .single()
        companyType = (company?.type ?? null) as string | null
      } catch {
        companyType = null
      }

      const role = String(existing.data.role).toLowerCase()
      const isPersonal = String(companyType ?? "").toLowerCase() === "personal"

      let redirectTo = "/dashboard/company"
      if (role === "manager") redirectTo = isPersonal ? "/dashboard/personal" : "/dashboard/manager"
      else if (role === "salesperson") redirectTo = "/dashboard/personal"
      else redirectTo = isPersonal ? "/dashboard/personal" : "/dashboard/company"

      return NextResponse.json({ ok: true, redirectTo })
    }

    const emailName = (user.email || "User").split("@")[0]
    const companyType = mode === "individual" ? "personal" : "company"
    const companyName = mode === "individual" ? `${emailName}'s Workspace` : `${emailName}'s Company`

    const companyId = await createCompanyWithFallback(supabase, companyName, companyType)
    await upsertUserProfile(supabase, user, companyId, "admin")

    return NextResponse.json({
      ok: true,
      redirectTo: mode === "individual" ? "/dashboard/personal" : "/dashboard/company",
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Onboarding setup failed" },
      { status: 500 }
    )
  }
}

