import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: Request) {
  try {
    const supabase = await createClient()

    // 1. Authenticate User
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 2. Fetch User Profile & Role from app_users
    const { data: appUser, error: usersError } = await supabase
      .from("app_users")
      .select("*")
      .eq("email", user.email)
      .single()

    if (usersError || !appUser) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    // 3. SECURE API ROUTING LOGIC based on AppUser role
    const role = appUser.role

    // Start building query
    let query = supabase.from("calls").select("*")

    if (role === "SUPER_ADMIN") {
      // Full Access
      // query = query
    } else if (role === "MANAGER") {
      // Only company data
      if (!appUser.company_id) {
        return NextResponse.json({ error: "Manager not linked to a company" }, { status: 403 })
      }
      query = query.eq("company_id", appUser.company_id)
    } else if (role === "EMPLOYEE") {
      // Only own data
      query = query.eq("user_id", appUser.id)
    } else {
      return NextResponse.json({ error: "Invalid role" }, { status: 403 })
    }

    const { data: callsData, error: dataError } = await query

    if (dataError) {
      return NextResponse.json({ error: dataError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, user: { email: appUser.email, role: appUser.role }, data: callsData })
    
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
