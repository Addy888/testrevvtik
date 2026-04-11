import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAppUser } from "@/lib/supabase/getAppUser"

export async function GET(req: Request) {
  try {
    const user = await requireAppUser()
    if (user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const roleFilter = searchParams.get("role")
    const search = searchParams.get("search")
    
    const supabase = await createClient()
    let query = supabase.from("app_users").select("*, companies(name)").order("created_at", { ascending: false })

    if (roleFilter) {
      query = query.eq("role", roleFilter)
    }

    if (search) {
      query = query.ilike("email", `%${search}%`)
    }

    const { data: users, error } = await query

    if (error) throw error

    return NextResponse.json({ users })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await requireAppUser()
    if (user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const { id } = body

    if (!id) return NextResponse.json({ error: "User ID is required" }, { status: 400 })

    const supabase = await createClient()
    const { error } = await supabase.from("app_users").delete().eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
