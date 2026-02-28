import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function PATCH(req: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { sessionId, title } = await req.json()

  if (!sessionId || !title) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 })
  }

  const { error } = await supabase
    .from("chat_sessions")
    .update({ title })
    .eq("id", sessionId)
    .eq("user_id", user.id)

  if (error) {
    return NextResponse.json({ error }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}