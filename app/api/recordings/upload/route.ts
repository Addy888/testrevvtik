import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getAppUserFromSupabase } from "@/lib/supabase/getAppUser"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"

const BUCKET = process.env.SUPABASE_RECORDINGS_BUCKET || "recordings"

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || "recording"
}

async function ensureBucketExists() {
  // 1) Check bucket via authenticated user client (works if policy allows).
  // 2) If missing and service role key is available, auto-create bucket (public).
  const adminKeyPresent = !!process.env.SUPABASE_SERVICE_ROLE_KEY

  try {
    const admin = createAdminClient()
    const { data, error } = await admin.storage.getBucket(BUCKET)
    if (!error && data?.name) return { ok: true as const }
  } catch {
    // ignore and fall back
  }

  if (!adminKeyPresent) {
    return {
      ok: false as const,
      error:
        `Supabase Storage bucket "${BUCKET}" not found. Create it in Supabase (public=true) or set SUPABASE_SERVICE_ROLE_KEY so the app can auto-create it.`,
    }
  }

  const admin = createAdminClient()
  const { error: createError } = await admin.storage.createBucket(BUCKET, { public: true })
  if (createError) {
    // If it already exists, treat as ok.
    const msg = String(createError.message || "")
    if (msg.toLowerCase().includes("already exists")) return { ok: true as const }
    return {
      ok: false as const,
      error: createError.message || `Failed to create bucket "${BUCKET}"`,
    }
  }

  return { ok: true as const }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const appUser = await getAppUserFromSupabase(supabase)

    const contentType = req.headers.get("content-type") || ""
    let file_url: string | null = null

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData()
      const file = formData.get("file")

      if (!file || !(file instanceof File) || file.size === 0) {
        return NextResponse.json(
          { error: "Missing or empty file in multipart upload" },
          { status: 400 }
        )
      }

      // Ensure the recordings bucket exists before upload.
      const bucketCheck = await ensureBucketExists()
      if (!bucketCheck.ok) {
        return NextResponse.json({ error: bucketCheck.error }, { status: 400 })
      }

      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const safeName = sanitizeFileName(file.name)
      const path = `files/${appUser.company_id}/${appUser.id}/${Date.now()}_${safeName}`

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, buffer, {
          contentType: file.type || "application/octet-stream",
          upsert: false,
        })

      if (uploadError) {
        const msg = String(uploadError.message || "")
        if (msg.toLowerCase().includes("bucket") && msg.toLowerCase().includes("not found")) {
          return NextResponse.json(
            {
              error: `Bucket "${BUCKET}" not found. Create a public bucket named "${BUCKET}" in Supabase Storage (or set SUPABASE_SERVICE_ROLE_KEY to auto-create).`,
            },
            { status: 400 }
          )
        }
        return NextResponse.json(
          {
            error:
              uploadError.message ||
              "Storage upload failed. Create a public bucket named \"recordings\" (or set SUPABASE_RECORDINGS_BUCKET) and allow authenticated uploads, or use file_url instead.",
          },
          { status: 400 }
        )
      }

      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path)
      file_url = pub.publicUrl
    } else {
      const body = await req.json()
      const parsed = body as { file_url?: string }
      if (!parsed.file_url || typeof parsed.file_url !== "string") {
        return NextResponse.json(
          { error: "Missing file_url (or send multipart/form-data with file)" },
          { status: 400 }
        )
      }
      file_url = parsed.file_url.trim()
    }

    if (!file_url) {
      return NextResponse.json({ error: "Missing file_url" }, { status: 400 })
    }

    const { data: recording, error } = await supabase
      .from("recordings")
      .insert({
        user_id: appUser.id,
        company_id: appUser.company_id,
        file_url,
      })
      .select()
      .single()

    if (error || !recording) {
      return NextResponse.json(
        { error: error?.message || "Failed to create recording" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      recordingId: (recording as any).id,
    })
  } catch (err: any) {
    const status = err?.status || 500
    return NextResponse.json(
      { error: err?.message || "Upload failed" },
      { status }
    )
  }
}

