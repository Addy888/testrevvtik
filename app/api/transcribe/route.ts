import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  // 🔥 USE SERVICE ROLE TO BYPASS RLS FOR ALL BACKEND UPDATES
  const supabaseServer = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  let recording_id: string = ""

  try {
    console.log("=== TRANSCRIBE API HIT ===")
    let fileData: File | null = null
    let fileType: string = "audio/mpeg"

    const contentType = req.headers.get("content-type") || ""

    if (contentType.includes("multipart/form-data")) {
      console.log("Step 1: Parsing FormData")
      const formData = await req.formData()
      recording_id = (formData.get("recording_id") as string) || ""
      const file = formData.get("file") as File | null
      if (file) {
        fileData = file
        fileType = file.type || "audio/mpeg"
        console.log(`Step 1.1: File received — name: ${file.name}, size: ${file.size} bytes, type: ${fileType}`)
      }
    } else {
      console.log("Step 1: Parsing JSON body")
      const jsonBody = await req.json()
      recording_id = jsonBody.recording_id || ""
    }

    console.log("Recording ID:", recording_id)

    if (!recording_id || recording_id.trim().length === 0) {
      return NextResponse.json({ error: "Invalid recording_id" }, { status: 400 })
    }

    // ── Fetch the recording row ─────────────────────────────────────────────
    const { data: recording, error: recErr } = await supabaseServer
      .from("recordings")
      .select("*")
      .eq("id", recording_id)
      .single()

    if (recErr || !recording) {
      console.error("Recording not found:", recErr)
      return NextResponse.json({ error: "Recording not found" }, { status: 404 })
    }

    console.log("Step 2: Recording found — file_url:", recording.file_url)

    // ── Deepgram parameters ─────────────────────────────────────────────────
    const dgParams = new URLSearchParams({
      model: "nova-2",
      smart_format: "true",
      punctuate: "true",
      diarize: "true",
      filler_words: "false",
      utterances: "true",
    })
    const dgUrl = `https://api.deepgram.com/v1/listen?${dgParams.toString()}`

    // ── Send to Deepgram (up to 2 attempts) ─────────────────────────────────
    let dgRes: Response | null = null
    let dgData: any = null

    for (let attempt = 1; attempt <= 2; attempt++) {
      console.log(`Step 3: Deepgram attempt ${attempt}`)
      try {
        if (fileData) {
          dgRes = await fetch(dgUrl, {
            method: "POST",
            headers: {
              Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`,
              "Content-Type": fileType,
            },
            body: fileData,
          })
        } else {
          // No file buffer — send the file_url to Deepgram
          dgRes = await fetch(dgUrl, {
            method: "POST",
            headers: {
              Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ url: recording.file_url }),
          })
        }

        if (dgRes.ok) {
          dgData = await dgRes.json()
          console.log("Step 3: Deepgram responded OK")
          break // success — exit retry loop
        }

        const errBody = await dgRes.text()
        console.warn(`Step 3: Deepgram attempt ${attempt} failed — HTTP ${dgRes.status}: ${errBody}`)

      } catch (fetchErr) {
        console.error(`Step 3: Deepgram fetch threw on attempt ${attempt}:`, fetchErr)
      }
    }

    // ── Hard failure: Deepgram never responded OK ───────────────────────────
    if (!dgRes || !dgRes.ok || !dgData) {
      console.error("Deepgram: all attempts failed — marking recording as failed")
      await supabaseServer
        .from("recordings")
        .update({ status: "failed", transcript: "Error during transcription" })
        .eq("id", recording_id)
      return NextResponse.json({ error: "Deepgram API failed after retries" }, { status: 502 })
    }

    // ── Parse transcript ─────────────────────────────────────────────────────
    const rawTranscript: string =
      dgData?.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? ""

    const duration: number = dgData?.metadata?.duration ?? 0
    console.log("Audio duration (seconds):", duration)
    console.log("Raw transcript:", rawTranscript)

    // ── Decide final transcript text ─────────────────────────────────────────
    let finalTranscript: string

    if (duration > 0 && duration < 2) {
      // Very short audio — not worth transcribing
      console.log("Audio too short (< 2s) — marking as no meaningful audio")
      finalTranscript = "No meaningful audio detected (recording too short)"
    } else if (!rawTranscript || rawTranscript.trim() === "") {
      // Deepgram returned OK but found no speech — don't fail, just note it
      console.log("Deepgram returned empty transcript — treating as silent audio")
      finalTranscript = "No speech detected in audio"
    } else {
      finalTranscript = rawTranscript.trim()
      console.log(`Transcript extracted — length: ${finalTranscript.length} characters`)
    }

    // ── Save transcript to transcripts table ─────────────────────────────────
    console.log("Step 5: Saving transcript to DB")
    const { error: insertErr } = await supabaseServer
      .from("transcripts")
      .insert([
        {
          recording_id,
          company_id: recording.company_id,
          text: finalTranscript,
        },
      ])

    if (insertErr) {
      console.error("DB Insert Error (transcripts):", insertErr)
      await supabaseServer
        .from("recordings")
        .update({ status: "failed", transcript: "Error during transcription" })
        .eq("id", recording_id)
      return NextResponse.json({ error: "Database insert failed" }, { status: 500 })
    }

    // ── Update recordings row with final status ───────────────────────────────
    await supabaseServer
      .from("recordings")
      .update({ transcript: finalTranscript, status: "completed" })
      .eq("id", recording_id)

    console.log(`=== TRANSCRIPTION COMPLETE for recording ${recording_id} ===`)
    return NextResponse.json({ success: true, transcription: finalTranscript })

  } catch (err) {
    // ── Unexpected error — mark as failed with message ────────────────────────
    console.error("TRANSCRIBE UNHANDLED ERROR:", err)

    if (recording_id) {
      try {
        await supabaseServer
          .from("recordings")
          .update({ status: "failed", transcript: "Error during transcription" })
          .eq("id", recording_id)
      } catch (dbErr) {
        console.error("Failed to update recording status after error:", dbErr)
      }
    }

    return NextResponse.json({ error: "Server error during transcription" }, { status: 500 })
  }
}