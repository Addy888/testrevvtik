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
    const email = String(body?.email || "").trim().toLowerCase()

    if (!email) {
      return NextResponse.json({ error: "Missing email" }, { status: 400 })
    }

    const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin
    const redirectTo = `${origin}/auth/callback`
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
      },
    })

    if (otpError) {
      return NextResponse.json(
        { error: otpError.message || "Failed to send magic link" },
        { status: 500 }
      )
    }

    const { data: existingUser, error: existingError } = await supabase
      .from("users")
      .select("id, email, company_id, role")
      .eq("email", email)
      .eq("company_id", appUser.company_id)
      .maybeSingle()

    if (existingError) {
      return NextResponse.json(
        { error: existingError.message || "Failed to lookup employee" },
        { status: 500 }
      )
    }

    if (existingUser) {
      const { error: updateError } = await supabase
        .from("users")
        .update({
          manager_id: appUser.id,
          role: existingUser.role === "manager" ? "salesperson" : existingUser.role || "salesperson",
        })
        .eq("id", existingUser.id)
        .eq("company_id", appUser.company_id)

      if (updateError) {
        return NextResponse.json(
          { error: updateError.message || "Failed to assign existing employee" },
          { status: 500 }
        )
      }

      return NextResponse.json({
        ok: true,
        created: false,
        message: "Invite sent successfully",
      })
    }

    const { error: insertError } = await supabase
      .from("users")
      .insert({
        email,
        company_id: appUser.company_id,
        role: "salesperson",
        manager_id: appUser.id,
      })

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message || "Failed to create employee" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      created: true,
      message: "Invite sent successfully",
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to add employee" },
      { status: 500 }
    )
  }
}

