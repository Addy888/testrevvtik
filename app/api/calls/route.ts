import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAppUser } from "@/lib/supabase/getAppUser"

export async function GET(req: Request) {
  try {
    const user = await requireAppUser()
    const supabase = await createClient()

    let query = supabase.from("calls").select("*")

    // Role-based filtering
    if (user.role === "SUPER_ADMIN") {
      // No filter
    } else if (user.role === "MANAGER") {
      if (!user.company_id) {
        return NextResponse.json({ error: "Manager has no company" }, { status: 400 })
      }
      query = query.eq("company_id", user.company_id)
    } else if (user.role === "EMPLOYEE") {
      query = query.eq("user_id", user.id)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ calls: data })
  } catch (error: any) {
    console.error("GET /api/calls error:", error)
    return NextResponse.json({ error: error.message }, { status: error.status || 500 })
  }
}
