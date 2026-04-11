import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getAppUserFromSupabase } from "@/lib/supabase/getAppUser"
import { supabaseAdmin } from "@/lib/supabase/admin"

export const runtime = "nodejs"

export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const managerUser = await getAppUserFromSupabase(supabase)

    if (managerUser.role !== "MANAGER" && managerUser.role !== "SUPER_ADMIN" && managerUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { data: teamMembers, error: fetchError } = await supabase
      .from("app_users")
      .select("*")
      .eq("company_id", managerUser.company_id)
      .eq("role", "EMPLOYEE")

    if (fetchError) throw fetchError

    // Fetch auth users to determine status
    const { data: { users: authUsers }, error: authError } = await supabaseAdmin.auth.admin.listUsers()
    
    const enrichedMembers = (teamMembers || []).map(member => {
      const authUser = authUsers.find(u => u.id === member.id)
      return {
        ...member,
        status: authUser?.last_sign_in_at ? "Active" : "Invited",
      }
    })

    return NextResponse.json({ employees: enrichedMembers })
  } catch (error: any) {
    console.error("GET /api/manager/employees error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

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
      return NextResponse.json(
        { error: "Missing employee_user_id" },
        { status: 400 }
      )
    }

    const { data: employee, error: employeeError } = await supabase
      .from("app_users")
      .select("id, company_id")
      .eq("id", employeeUserId)
      .eq("company_id", appUser.company_id)
      .single()

    if (employeeError || !employee) {
      return NextResponse.json(
        { error: "Employee user not found in company" },
        { status: 404 }
      )
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
      return NextResponse.json(
        { error: updateError.message || "Failed to assign employee" },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Manager employee operation failed" },
      { status: 500 }
    )
  }
}

export async function DELETE(req: Request) {
  try {
    const supabase = await createClient()
    const managerUser = await getAppUserFromSupabase(supabase)

    if (managerUser.role !== "MANAGER" && managerUser.role !== "SUPER_ADMIN" && managerUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const employeeId = searchParams.get("id")

    if (!employeeId) {
      return NextResponse.json({ error: "Missing employee ID" }, { status: 400 })
    }

    // Verify employee belongs to manager's company
    const { data: employee, error: checkError } = await supabase
      .from("app_users")
      .select("company_id")
      .eq("id", employeeId)
      .single()

    if (checkError || employee?.company_id !== managerUser.company_id) {
      return NextResponse.json({ error: "Employee not found in your company" }, { status: 404 })
    }

    // Remove employee record from app_users
    const { error: deleteError } = await supabase
      .from("app_users")
      .delete()
      .eq("id", employeeId)

    if (deleteError) throw deleteError

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("DELETE /api/manager/employees error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

