import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name) => cookieStore.get(name)?.value,
          set: () => {},
          remove: () => {},
        },
      }
    )

    // ✅ Auth
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: appUser } = await supabase
      .from("users")
      .select("company_id")
      .eq("id", user.id)
      .single()

    // ✅ File
    const formData = await req.formData()
    const file = formData.get("file") as File

    if (!file) {
      return Response.json({ error: "No file uploaded" }, { status: 400 })
    }

    // ✅ Upload
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filePath = `recordings/${Date.now()}-${sanitizedName}`

    const { error: uploadError } = await supabase.storage
      .from("recordings")
      .upload(filePath, file)

    if (uploadError) {
      return Response.json({ error: uploadError.message }, { status: 400 })
    }

    const { data } = supabase.storage
      .from("recordings")
      .getPublicUrl(filePath)

    const fileUrl = data.publicUrl

    // ✅ Insert DB
    const { data: inserted, error: insertError } = await supabase
      .from("recordings")
      .insert({
        user_id: user.id,
        company_id: appUser?.company_id || null,
        file_url: fileUrl,
      })
      .select()
      .single()

    if (insertError || !inserted) {
      console.error("Insert Error:", insertError)
      return Response.json({ error: "Failed to insert recording" }, { status: 400 })
    }

    console.log("Inserted ID:", inserted.id)

    // 🔥 Call Transcribe API
    const origin = new URL(req.url).origin;
    
    // Call the transcribe API and wait for it to finish so the DB is updated before we return
    const transcribeRes = await fetch(`${origin}/api/transcribe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "cookie": req.headers.get("cookie") || "",
      },
      body: JSON.stringify({
        recording_id: inserted.id,
      }),
    })

    if (!transcribeRes.ok) {
      console.error("Transcribe API failed:", await transcribeRes.text());
      // We might choose to return success anyway if we are okay with manual retry later, 
      // but let's just log it.
    }

    return Response.json({ 
      success: true, 
      recordingId: inserted.id,
      file_url: fileUrl
    })

  } catch (err) {
    console.error("UPLOAD ERROR:", err)
    return Response.json({ error: "Server error" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name) => cookieStore.get(name)?.value,
          set: () => {},
          remove: () => {},
        },
      }
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ data: [] })
    }

    const { data, error } = await supabase
      .from("recordings")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      return Response.json({ error: error.message }, { status: 400 })
    }

    return Response.json({ data })

  } catch (err) {
    console.error("GET ERROR:", err)
    return Response.json({ error: "Server error" }, { status: 500 })
  }
}