import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getAppUserFromSupabase } from "@/lib/supabase/getAppUser"
import { supabaseAdmin } from "@/lib/supabase/admin"

export const runtime = "nodejs"

const BUCKET = "recordings"

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || "recording"
}

async function ensureBucketExists() {
  const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets()
  if (listError) {
    throw new Error(listError.message || "Failed to list storage buckets")
  }

  const exists = (buckets || []).some((b: any) => String(b?.name) === BUCKET)
  if (exists) return

  const { error: createError } = await supabaseAdmin.storage.createBucket(BUCKET, { public: true })
  if (createError) {
    const msg = String(createError.message || "")
    if (!msg.toLowerCase().includes("already exists")) {
      throw new Error(createError.message || `Failed to create bucket "${BUCKET}"`)
    }
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const appUser = await getAppUserFromSupabase(supabase)

    const formData = await req.formData()
    const file = formData.get("file")

    if (!file || !(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }

    await ensureBucketExists()

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const safeName = sanitizeFileName(file.name)
    const storagePath = `files/${appUser.company_id}/${appUser.id}/${Date.now()}_${safeName}`

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, buffer, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      })

    if (uploadError) {
      return NextResponse.json(
        { error: uploadError.message || "Failed to upload file to storage" },
        { status: 400 }
      )
    }

    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)
    const file_url = pub.publicUrl

    const { data: recording, error: insertError } = await supabase
      .from("recordings")
      .insert({
        user_id: appUser.id,
        company_id: appUser.company_id,
        file_url,
      })
      .select("id, file_url")
      .single()

    if (insertError || !recording) {
      return NextResponse.json(
        { error: insertError?.message || "Failed to save recording" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      recordingId: (recording as any).id,
      file_url: (recording as any).file_url,
    })
  } catch (err: any) {
    console.error("UPLOAD ERROR:", err)
    return NextResponse.json(
      { error: err?.message || "Server error during upload" },
      { status: err?.status || 500 }
    )
  }
}