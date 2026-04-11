import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getAppUserFromSupabase } from "@/lib/supabase/getAppUser"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const appUser = await getAppUserFromSupabase(supabase)

    if (appUser.role !== "SUPER_ADMIN" && appUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Only admin can make manager" }, { status: 403 })
    }


    const body = await req.json()
    const userId = body?.user_id as string | undefined

    if (!userId) {
      return NextResponse.json({ error: "Missing user_id" }, { status: 400 })
    }

    const { data: targetUser, error: targetError } = await supabase
      .from("app_users")
      .select("id, company_id, role")
      .eq("id", userId)
      .eq("company_id", appUser.company_id)
      .single()

    if (targetError || !targetUser) {
      return NextResponse.json({ error: "User not found in company" }, { status: 404 })
    }

    const { error: updateError } = await supabase
      .from("app_users")
      .update({
        role: "MANAGER",
        manager_id: null,
      })
      .eq("id", userId)
      .eq("company_id", appUser.company_id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message || "Failed to update role" }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to make manager" },
      { status: 500 }
    )
  }
}

