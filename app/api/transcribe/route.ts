import { NextResponse } from "next/server"
import path from "node:path"
import { createClient } from "@/lib/supabase/server"
import { getAppUserFromSupabase } from "@/lib/supabase/getAppUser"

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
  const fileRes = await fetch(fileUrl)

  if (fileRes.ok) {
    const arrayBuffer = await fileRes.arrayBuffer()
    return {
      arrayBuffer,
      contentType:
        fileRes.headers.get("content-type") || "application/octet-stream",
    }
  }

  const parsed = parseSupabasePublicStorageUrl(fileUrl)
  if (!parsed) throw new Error("File fetch failed")

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .download(parsed.objectPath)

  if (error || !data)
    throw new Error(error?.message || "Download failed")

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
// 🔥 Deepgram via REST API (NO SDK)
// ---------------------------------------------------------------------------

async function deepgramTranscribe(
  audioBuffer: ArrayBuffer,
  mimeType: string
): Promise<string> {
  const apiKey = process.env.DEEPGRAM_API_KEY
  if (!apiKey) throw new Error("Missing DEEPGRAM_API_KEY")

  const res = await fetch(
    "https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&punctuate=true",
    {
      method: "POST",
      headers: {
        Authorization: `Token ${apiKey}`,
        "Content-Type": mimeType,
      },
      body: Buffer.from(audioBuffer),
    }
  )

  if (!res.ok) {
    const text = await res.text()
    throw new Error("Deepgram API error: " + text)
  }

  const data = await res.json()

  return (
    data?.results?.channels?.[0]?.alternatives?.[0]?.transcript || ""
  )
}

// ---------------------------------------------------------------------------
// Claude cleanup
// ---------------------------------------------------------------------------

async function claudeClean(rawText: string): Promise<string> {
  if (!rawText.trim()) return rawText

  const apiKey =
    process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY || ""

  if (!apiKey) return rawText

  const Anthropic = (await import("@anthropic-ai/sdk")).default
  const anthropic = new Anthropic({ apiKey })

  const res = await anthropic.messages.create({
    model: "claude-3-haiku-20240307",
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: `Fix grammar, punctuation. Return ONLY cleaned text.\n\n${rawText}`,
      },
    ],
  })

  const content = res.content[0]
  return content?.type === "text" ? content.text : rawText
}

// ---------------------------------------------------------------------------
// DB insert
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
  const fields = ["text", "content", "transcript", "transcript_text"]

  for (const key of fields) {
    const { data, error } = await supabase
      .from("transcripts")
      .insert({ ...base, [key]: transcriptText })
      .select()
      .single()

    if (!error && data) return data
  }

  throw new Error("Insert failed")
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const appUser = await getAppUserFromSupabase(supabase)

    const body = await req.json()
    let recordingId = body?.recording_id

    if (!recordingId && body?.file_url) {
      const { data } = await supabase
        .from("recordings")
        .select("id")
        .eq("file_url", body.file_url)
        .limit(1)
        .maybeSingle()

      recordingId = data?.id
    }

    if (!recordingId) {
      return NextResponse.json({ error: "Missing recording_id" }, { status: 400 })
    }

    const { data: recording } = await supabase
      .from("recordings")
      .select("*")
      .eq("id", recordingId)
      .single()

    if (!recording) {
      return NextResponse.json({ error: "Recording not found" }, { status: 404 })
    }

    const { arrayBuffer, contentType } = await downloadRecordingBytes({
      supabase,
      fileUrl: recording.file_url,
    })

    const ext = inferFileExt(recording.file_url)
    const mime = String(contentType || "").toLowerCase()

    const isValid =
      ext === ".mp3" ||
      ext === ".wav" ||
      ext === ".mp4" ||
      mime.includes("audio") ||
      mime.includes("video")

    if (!isValid) {
      return NextResponse.json({ error: "Unsupported file" }, { status: 400 })
    }

    const rawText = await deepgramTranscribe(arrayBuffer, mime)
    const finalText = await claudeClean(rawText)

    const transcript = await insertTranscriptWithFallback({
      supabase,
      base: {
        user_id: recording.user_id,
        company_id: appUser.company_id,
        recording_id: recordingId,
      },
      transcriptText: finalText,
    })

    return NextResponse.json({ transcriptId: transcript.id })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json(
      { error: err.message || "Failed" },
      { status: 500 }
    )
  }
}