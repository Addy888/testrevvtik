import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getAppUserFromSupabase } from "@/lib/supabase/getAppUser"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const appUser = await getAppUserFromSupabase(supabase)

    if (appUser.role !== "MANAGER" && appUser.role !== "SUPER_ADMIN" && appUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }


    const body = await req.json()
    const employeeUserId = body?.employee_user_id as string | undefined
    if (!employeeUserId) {
      return NextResponse.json({ error: "Missing employee_user_id" }, { status: 400 })
    }

    const { data: employee, error: employeeError } = await supabase
      .from("app_users")
      .select("id, company_id, role, manager_id")
      .eq("id", employeeUserId)
      .eq("company_id", appUser.company_id)
      .is("manager_id", null)
      .neq("role", "MANAGER")
      .neq("role", "manager")
      .single()

    if (employeeError || !employee) {
      return NextResponse.json({ error: "Eligible employee not found" }, { status: 404 })
    }

    const { error: updateError } = await supabase
      .from("app_users")
      .update({
        role: "EMPLOYEE",
        manager_id: appUser.id,
      })
      .eq("id", employeeUserId)
      .eq("company_id", appUser.company_id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message || "Failed to assign employee" }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to assign employee" },
      { status: 500 }
    )
  }
}

