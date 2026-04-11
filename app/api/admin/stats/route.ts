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

    const { count: companiesCount } = await supabase.from("companies").select("*", { count: "exact", head: true })
    const { count: usersCount } = await supabase.from("app_users").select("*", { count: "exact", head: true })
    const { count: managersCount } = await supabase.from("app_users").select("*", { count: "exact", head: true }).eq("role", "MANAGER")
    const { count: employeesCount } = await supabase.from("app_users").select("*", { count: "exact", head: true }).eq("role", "EMPLOYEE")
    const { count: callsCount } = await supabase.from("calls").select("*", { count: "exact", head: true })

    return NextResponse.json({
      companies: companiesCount || 0,
      users: usersCount || 0,
      managers: managersCount || 0,
      employees: employeesCount || 0,
      calls: callsCount || 0,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
