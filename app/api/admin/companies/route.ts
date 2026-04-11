import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAppUser } from "@/lib/supabase/getAppUser"

export async function GET() {
  try {
    const user = await requireAppUser()
    if (user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const supabase = await createClient()
    const { data: companies, error } = await supabase.from("companies").select("*").order("created_at", { ascending: false })

    if (error) throw error

    // Fetch user counts for each company
    const { data: usersCount } = await supabase.from("app_users").select("company_id")
    
    const companiesWithCount = companies.map(c => ({
      ...c,
      user_count: usersCount?.filter(u => u.company_id === c.id).length || 0
    }))

    return NextResponse.json({ companies: companiesWithCount })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAppUser()
    if (user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const body = await req.json()
    const { name } = body

    if (!name) return NextResponse.json({ error: "Company name is required" }, { status: 400 })

    const supabase = await createClient()
    const { data, error } = await supabase.from("companies").insert({ name }).select().single()

    if (error) throw error

    return NextResponse.json({ company: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
