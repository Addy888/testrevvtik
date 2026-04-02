import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getAppUserFromSupabase } from "@/lib/supabase/getAppUser"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const appUser = await getAppUserFromSupabase(supabase)

    if (appUser.role !== "manager" && appUser.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (String(appUser.company_type ?? "").toLowerCase() === "personal") {
      return NextResponse.json({ error: "Personal plan does not support manager features" }, { status: 403 })
    }

    const body = await req.json()
    const employeeId = body?.employee_id as string | undefined

    if (!employeeId) {
      return NextResponse.json({ error: "Missing employee_id" }, { status: 400 })
    }

    // Ensure manager can only unlink employees in same company and currently assigned to them.
    const { data: employee, error: employeeError } = await supabase
      .from("users")
      .select("id, company_id, manager_id")
      .eq("id", employeeId)
      .eq("company_id", appUser.company_id)
      .eq("manager_id", appUser.id)
      .single()

    if (employeeError || !employee) {
      return NextResponse.json(
        { error: "Employee not found for this manager" },
        { status: 404 }
      )
    }

    const { error: updateError } = await supabase
      .from("users")
      .update({ manager_id: null })
      .eq("id", employeeId)
      .eq("company_id", appUser.company_id)
      .eq("manager_id", appUser.id)

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message || "Failed to remove employee" },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to remove employee" },
      { status: 500 }
    )
  }
}

