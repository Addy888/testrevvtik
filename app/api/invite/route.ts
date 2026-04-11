import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { getAppUserFromSupabase } from "@/lib/supabase/getAppUser"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const managerUser = await getAppUserFromSupabase(supabase)

    // Auth check: only MANAGER or SUPER_ADMIN
    if (managerUser.role !== "MANAGER" && managerUser.role !== "SUPER_ADMIN" && managerUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Only managers can invite employees" }, { status: 403 })
    }

    const body = await req.json()
    const email = String(body?.email || "").trim().toLowerCase()
    const name = String(body?.name || "").trim()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Check if user already exists in app_users
    const { data: existingAppUser } = await supabase
      .from("app_users")
      .select("id")
      .eq("email", email)
      .maybeSingle()

    if (existingAppUser) {
      return NextResponse.json({ error: "User with this email already exists in our system" }, { status: 400 })
    }

    // Call Supabase Admin API to invite user
    const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: {
        full_name: name || undefined,
      },
      redirectTo: `${origin}/auth/callback`,
    })

    if (inviteError) {
      console.error("Supabase Admin Invite Error:", inviteError)
      return NextResponse.json({ error: inviteError.message }, { status: 500 })
    }

    const invitedUser = inviteData.user
    if (!invitedUser) {
      return NextResponse.json({ error: "Failed to create user invitation" }, { status: 500 })
    }

    // Insert into app_users table
    const { error: insertError } = await supabaseAdmin
      .from("app_users")
      .insert({
        id: invitedUser.id,
        email: invitedUser.email,
        name: name || null,
        role: "EMPLOYEE",
        company_id: managerUser.company_id,
        manager_id: managerUser.id,
      })

    if (insertError) {
      console.error("Error inserting into app_users:", insertError)
      // Since the invite was already sent via Supabase Auth, we have an orphan auth user now.
      // But we can return success since the email was sent, and maybe handle syncing later.
      // For now, let's report it as a partial failure or success.
      return NextResponse.json({ 
        success: true, 
        message: "Invite email sent, but profile creation had an issue. Please contact support." 
      })
    }

    return NextResponse.json({ 
      success: true, 
      message: "Invitation sent successfully" 
    })
  } catch (error: any) {
    console.error("Invite API error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
