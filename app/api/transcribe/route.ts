import { NextResponse } from "next/server"
import path from "node:path"
import { createClient } from "@/lib/supabase/server"
import { getAppUserFromSupabase } from "@/lib/supabase/getAppUser"
import { Deepgram } from "@deepgram/sdk"

export const runtime = "nodejs"

const BUCKET = "recordings"

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function parseSupabasePublicStorageUrl(
  fileUrl: string
): { objectPath: string } | null {
  const marker = `/storage/v1/object/public/${BUCKET}/`
  const idx = fileUrl.indexOf(marker)
  if (idx === -1) return null
  return { objectPath: fileUrl.slice(idx + marker.length) }
}

async function downloadRecordingBytes({
  supabase,
  fileUrl,
}: {
  supabase: any
  fileUrl: string
}) {
  // Prefer direct fetch from the stored URL.
  const fileRes = await fetch(fileUrl)
  if (fileRes.ok) {
    const arrayBuffer = await fileRes.arrayBuffer()
    return {
      arrayBuffer,
      contentType:
        fileRes.headers.get("content-type") || "application/octet-stream",
    }
  }

  // Fall back to authenticated Supabase storage download.
  const parsed = parseSupabasePublicStorageUrl(fileUrl)
  if (!parsed) {
    throw new Error(
      "Failed to fetch recording file (URL not accessible and path could not be inferred)"
    )
  }

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .download(parsed.objectPath)
  if (error || !data)
    throw new Error(
      error?.message || "Failed to download recording from storage"
    )

  const arrayBuffer = await data.arrayBuffer()
  return { arrayBuffer, contentType: data.type || "application/octet-stream" }
}

function inferFileExt(fileUrl: string): string {
  try {
    const u = new URL(fileUrl)
    return path.extname(u.pathname).toLowerCase()
  } catch {
    return ""
  }
}

// ---------------------------------------------------------------------------
// Step 1 – Speech → Text  (Deepgram nova-2)
// ---------------------------------------------------------------------------

async function deepgramTranscribe(
  audioBuffer: ArrayBuffer,
  mimeType: string
): Promise<string> {
  const apiKey = process.env.DEEPGRAM_API_KEY
  if (!apiKey) throw new Error("Missing DEEPGRAM_API_KEY")

  const deepgram = new Deepgram(apiKey)
  const buffer = Buffer.from(audioBuffer)

  const { result, error } =
    await deepgram.listen.prerecorded.transcribeFile(buffer, {
      model: "nova-2",
      smart_format: true,
      punctuate: true,
      mimetype: mimeType,
    })

  if (error) throw new Error(`Deepgram error: ${error.message}`)

  const raw =
    result?.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? ""
  return raw
}

// ---------------------------------------------------------------------------
// Step 2 – Claude cleanup
// ---------------------------------------------------------------------------

async function claudeClean(rawText: string): Promise<string> {
  if (!rawText.trim()) return rawText

  const apiKey =
    process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY || ""
  if (!apiKey) {
    console.warn("No ANTHROPIC_API_KEY – skipping Claude cleanup")
    return rawText
  }

  const Anthropic = (await import("@anthropic-ai/sdk")).default
  const anthropic = new Anthropic({ apiKey })

  const res = await anthropic.messages.create({
    model: "claude-3-haiku-20240307",
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: `You are a transcript editor. Fix punctuation, capitalisation, and filler words. Return ONLY the cleaned transcript text with no commentary.\n\nTranscript:\n${rawText}`,
      },
    ],
  })

  const content = res.content[0]
  return content?.type === "text" ? content.text : rawText
}

// ---------------------------------------------------------------------------
// Supabase insert with column-name fallback
// ---------------------------------------------------------------------------

async function insertTranscriptWithFallback({
  supabase,
  base,
  transcriptText,
}: {
  supabase: any
  base: Record<string, unknown>
  transcriptText: string
}) {
  const candidates: Array<Record<string, string>> = [
    { text: transcriptText },
    { content: transcriptText },
    { transcript: transcriptText },
    { transcript_text: transcriptText },
  ]

  let lastError: any = null

  for (const candidate of candidates) {
    const { data, error } = await supabase
      .from("transcripts")
      .insert({ ...base, ...candidate })
      .select()
      .single()

    if (!error && data) return data
    lastError = error
  }

  throw lastError || new Error("Failed to insert transcript")
}

// ---------------------------------------------------------------------------
// POST /api/transcribe
// ---------------------------------------------------------------------------

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const appUser = await getAppUserFromSupabase(supabase)

    const body = (await req.json()) as {
      recording_id?: string
      file_url?: string
    }
    let recordingId = body?.recording_id

    // Allow resolution by file_url if recording_id not provided.
    if (!recordingId && body?.file_url) {
      let lookup: any = supabase
        .from("recordings")
        .select("id")
        .eq("company_id", appUser.company_id)
        .eq("file_url", String(body.file_url))
        .order("created_at", { ascending: false })
        .limit(1)
      if (appUser.role === "salesperson")
        lookup = lookup.eq("user_id", appUser.id)
      const { data } = await lookup.maybeSingle()
      recordingId = data?.id
    }

    if (!recordingId) {
      return NextResponse.json(
        { error: "Missing recording_id (or file_url)" },
        { status: 400 }
      )
    }

    // Idempotency – return early if transcript already exists.
    let existingQuery: any = supabase
      .from("transcripts")
      .select("id")
      .eq("recording_id", recordingId)
      .eq("company_id", appUser.company_id)
    if (appUser.role === "salesperson") {
      existingQuery = existingQuery.eq("user_id", appUser.id)
    }
    const { data: existingTranscript } = await existingQuery.maybeSingle()
    if (existingTranscript?.id) {
      return NextResponse.json({
        transcriptId: existingTranscript.id,
        alreadyTranscribed: true,
      })
    }

    // Fetch the recording row.
    let recordingQuery: any = supabase
      .from("recordings")
      .select("id, user_id, company_id, file_url")
      .eq("id", recordingId)
      .eq("company_id", appUser.company_id)
    if (appUser.role === "salesperson") {
      recordingQuery = recordingQuery.eq("user_id", appUser.id)
    }
    const { data: recording, error: recordingError } =
      await recordingQuery.single()

    if (recordingError || !recording) {
      return NextResponse.json(
        { error: recordingError?.message || "Recording not found" },
        { status: 404 }
      )
    }

    const fileUrl: string | null = recording.file_url
    if (!fileUrl || typeof fileUrl !== "string") {
      return NextResponse.json(
        { error: "Recording file_url missing" },
        { status: 400 }
      )
    }

    // Download audio bytes.
    const { arrayBuffer, contentType } = await downloadRecordingBytes({
      supabase,
      fileUrl,
    })

    const ext = inferFileExt(fileUrl)
    const mime = String(contentType || "").toLowerCase()

    const isMp4 = ext === ".mp4" || mime.includes("video/mp4")
    const isMp3 =
      ext === ".mp3" ||
      mime.includes("audio/mpeg") ||
      mime.includes("audio/mp3")
    const isWav =
      ext === ".wav" ||
      mime.includes("audio/wav") ||
      mime.includes("audio/x-wav")

    if (!isMp4 && !isMp3 && !isWav) {
      return NextResponse.json(
        {
          error: `Unsupported format. Supported: .mp3, .wav, .mp4 (got ${
            ext || mime || "unknown"
          })`,
        },
        { status: 400 }
      )
    }

    const deepgramMime = isMp4
      ? "video/mp4"
      : isMp3
        ? "audio/mpeg"
        : "audio/wav"

    // 🔥 Step 1: Deepgram speech → text
    const rawText = await deepgramTranscribe(arrayBuffer, deepgramMime)

    // 🔥 Step 2: Claude cleanup
    const finalText = await claudeClean(rawText)

    // 🔥 Step 3: Save to Supabase
    const base = {
      user_id: recording.user_id,
      company_id: appUser.company_id,
      recording_id: recordingId,
    }

    const transcriptRow: any = await insertTranscriptWithFallback({
      supabase,
      base,
      transcriptText: finalText,
    })

    return NextResponse.json({ transcriptId: transcriptRow?.id })
  } catch (err: any) {
    console.error("[transcribe] ERROR:", err)
    const status = err?.status || 500
    return NextResponse.json(
      { error: err?.message || "Transcription failed" },
      { status }
    )
  }
}
