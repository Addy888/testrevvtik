import { NextResponse } from "next/server"
import path from "node:path"
import os from "node:os"
import fs from "node:fs/promises"
import { createClient } from "@/lib/supabase/server"
import { getAppUserFromSupabase } from "@/lib/supabase/getAppUser"
import ffmpeg from "fluent-ffmpeg"
import ffmpegStatic from "ffmpeg-static"
import { whisperTranscribeFromBuffer } from "@/lib/ai/openai"

export const runtime = "nodejs"

const BUCKET = process.env.SUPABASE_RECORDINGS_BUCKET || "recordings"

function parseSupabasePublicStorageUrl(fileUrl: string): { objectPath: string } | null {
  // supabase storage public urls look like:
  // https://<project>.supabase.co/storage/v1/object/public/<bucket>/<objectPath>
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
    return { arrayBuffer, contentType: fileRes.headers.get("content-type") || "application/octet-stream" }
  }

  // If the URL isn't public, fall back to authenticated download from storage.
  const parsed = parseSupabasePublicStorageUrl(fileUrl)
  if (!parsed) {
    throw new Error("Failed to fetch recording file (URL not accessible and path could not be inferred)")
  }

  const { data, error } = await supabase.storage.from(BUCKET).download(parsed.objectPath)
  if (error || !data) throw new Error(error?.message || "Failed to download recording from storage")

  const arrayBuffer = await data.arrayBuffer()
  return { arrayBuffer, contentType: data.type || "application/octet-stream" }
}

async function convertMp4ToWav({
  mp4ArrayBuffer,
}: {
  mp4ArrayBuffer: ArrayBuffer
}): Promise<ArrayBuffer> {
  if (!ffmpegStatic) {
    throw new Error("ffmpeg-static not available. MP4 transcription requires ffmpeg.")
  }

  // Ensure ffmpeg binary is discoverable in serverless/CI.
  ffmpeg.setFfmpegPath(ffmpegStatic as unknown as string)

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "revvtik-transcribe-"))
  const inputPath = path.join(tmpDir, "input.mp4")
  const outputPath = path.join(tmpDir, "output.wav")

  try {
    await fs.writeFile(inputPath, Buffer.from(mp4ArrayBuffer))

    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .noVideo()
        .audioChannels(1)
        .audioFrequency(16000)
        .audioCodec("pcm_s16le")
        .format("wav")
        .on("end", () => resolve())
        .on("error", (err) => reject(err))
        .save(outputPath)
    })

    const wavBuffer = await fs.readFile(outputPath)
    return wavBuffer.buffer.slice(wavBuffer.byteOffset, wavBuffer.byteOffset + wavBuffer.byteLength)
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {})
  }
}

async function insertTranscriptWithFallback({
  supabase,
  base,
  transcriptText,
}: {
  supabase: any
  base: any
  transcriptText: string
}) {
  const candidates: Array<Record<string, string>> = [
    { content: transcriptText },
    { transcript: transcriptText },
    { text: transcriptText },
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

function inferFileExt(fileUrl: string): string {
  try {
    const u = new URL(fileUrl)
    const pathname = u.pathname || ""
    const ext = path.extname(pathname).toLowerCase()
    return ext
  } catch {
    return ""
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const appUser = await getAppUserFromSupabase(supabase)

    const body = (await req.json()) as { recording_id?: string }
    const recordingId = body?.recording_id

    if (!recordingId) {
      return NextResponse.json({ error: "Missing recording_id" }, { status: 400 })
    }

    // If transcript already exists, return it (idempotent).
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
      return NextResponse.json({ transcriptId: existingTranscript.id, alreadyTranscribed: true })
    }

    let recordingQuery: any = supabase
      .from("recordings")
      .select("id, user_id, company_id, file_url")
      .eq("id", recordingId)
      .eq("company_id", appUser.company_id)

    if (appUser.role === "salesperson") {
      recordingQuery = recordingQuery.eq("user_id", appUser.id)
    }

    const { data: recording, error: recordingError } = await recordingQuery.single()

    if (recordingError || !recording) {
      return NextResponse.json(
        { error: recordingError?.message || "Recording not found" },
        { status: 404 }
      )
    }

    const fileUrl: string | null = recording.file_url
    if (!fileUrl || typeof fileUrl !== "string") {
      return NextResponse.json({ error: "Recording file_url missing" }, { status: 400 })
    }

    const { arrayBuffer: rawBytes, contentType } = await downloadRecordingBytes({
      supabase,
      fileUrl,
    })

    const ext = inferFileExt(fileUrl)
    const mime = String(contentType || "").toLowerCase()

    const isMp4 = ext === ".mp4" || mime.includes("video/mp4")
    const isMp3 = ext === ".mp3" || mime.includes("audio/mpeg") || mime.includes("audio/mp3")
    const isWav = ext === ".wav" || mime.includes("audio/wav") || mime.includes("audio/x-wav")

    if (!isMp4 && !isMp3 && !isWav) {
      return NextResponse.json(
        { error: `Unsupported recording format. Supported: .mp3, .wav, .mp4 (got ${ext || mime || "unknown"})` },
        { status: 400 }
      )
    }

    let whisperAudio: ArrayBuffer = rawBytes
    let whisperMime: string = contentType || "application/octet-stream"
    let whisperFilename = "audio"

    if (isMp4) {
      whisperAudio = await convertMp4ToWav({ mp4ArrayBuffer: rawBytes })
      whisperMime = "audio/wav"
      whisperFilename = "audio.wav"
    } else {
      whisperFilename = isMp3 ? "audio.mp3" : "audio.wav"
      whisperMime = isMp3 ? "audio/mpeg" : "audio/wav"
    }

    const transcriptText = await whisperTranscribeFromBuffer({
      audioBuffer: whisperAudio,
      mimeType: whisperMime,
      filename: whisperFilename,
    })

    const base = {
      user_id: recording.user_id,
      company_id: appUser.company_id,
      recording_id: recordingId,
    }

    const transcriptRow: any = await insertTranscriptWithFallback({
      supabase,
      base,
      transcriptText,
    })

    return NextResponse.json({ transcriptId: transcriptRow?.id })
  } catch (err: any) {
    const status = err?.status || 500
    return NextResponse.json(
      { error: err?.message || "Transcription failed" },
      { status }
    )
  }
}

