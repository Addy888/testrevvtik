import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAppUser, Role } from "@/lib/supabase/getAppUser"

export async function GET(req: Request) {
  try {
    const user = await requireAppUser()
    const supabase = await createClient()

    let query = supabase.from("app_users").select("*")

    // Role-based filtering
    if (user.role === "SUPER_ADMIN") {
      // No filter
    } else if (user.role === "MANAGER") {
      if (!user.company_id) {
        return NextResponse.json({ error: "Manager has no company" }, { status: 400 })
      }
      query = query.eq("company_id", user.company_id)
    } else if (user.role === "EMPLOYEE") {
      query = query.eq("id", user.id)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ users: data })
  } catch (error: any) {
    console.error("GET /api/users error:", error)
    return NextResponse.json({ error: error.message }, { status: error.status || 500 })
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAppUser()
    const supabase = await createClient()

    // Only MANAGER or SUPER_ADMIN can add
    if (user.role !== "MANAGER" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const { email, name, role } = body

    if (!email || !name) {
      return NextResponse.json({ error: "Email and name are required" }, { status: 400 })
    }

    let company_id = user.company_id
    if (user.role === "SUPER_ADMIN" && body.company_id) {
      company_id = body.company_id
    }

    // Usually, we would create a new user via Supabase Admin Auth (supabase.auth.admin.createUser)
    // But since the frontend doesn't have secure access to the service role, or if we are creating an invite:
    // We can insert into app_users. When the user logs in via OAuth/Magic Link, they will match this record by email and get their roles!
    
    // We simulate creating a user entry.
    const newUser = {
      email,
      name,
      role: role || "EMPLOYEE",
      company_id,
      manager_id: user.role === "MANAGER" ? user.id : null,
    }

    const { data, error } = await supabase.from("app_users").insert(newUser).select().single()

    if (error) throw error

    return NextResponse.json({ user: data }, { status: 201 })
  } catch (error: any) {
    console.error("POST /api/users error:", error)
    return NextResponse.json({ error: error.message }, { status: error.status || 500 })
  }
}
