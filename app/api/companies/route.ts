import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAppUser } from "@/lib/supabase/getAppUser"

export async function GET(req: Request) {
  try {
    const user = await requireAppUser()
    const supabase = await createClient()

    let query = supabase.from("companies").select("*")

    // Role-based filtering
    if (user.role === "SUPER_ADMIN") {
      // No filter
    } else if (user.role === "MANAGER" || user.role === "EMPLOYEE") {
      if (!user.company_id) {
        return NextResponse.json({ error: "User has no company" }, { status: 400 })
      }
      // Filter by company_id
      query = query.eq("id", user.company_id)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ companies: data })
  } catch (error: any) {
    console.error("GET /api/companies error:", error)
    return NextResponse.json({ error: error.message }, { status: error.status || 500 })
  }
}
