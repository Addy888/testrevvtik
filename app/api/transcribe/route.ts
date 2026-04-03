import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function POST(req: Request) {
  try {
    const { recording_id } = await req.json()

    console.log("Recording ID received:", recording_id)

    if (!recording_id || typeof recording_id !== "string" || recording_id.trim().length === 0) {
      return Response.json({ error: "Invalid recording_id" }, { status: 400 })
    }

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

    // ✅ Get recording
    const { data: recording, error } = await supabase
      .from("recordings")
      .select("*")
      .eq("id", recording_id)
      .single()

    if (error || !recording) {
      return Response.json({ error: "Recording not found" }, { status: 404 })
    }

    // 🔥 Deepgram API call
    // 🔥 Deepgram API call with Retry Logic and Optimized Settings
    let dgRes = null;
    let dgData = null;
    let attempts = 0;
    
    while (attempts < 2) {
      dgRes = await fetch(
        "https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&punctuate=true&diarize=true&filler_words=false&utterances=true",
        {
          method: "POST",
          headers: {
            Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: recording.file_url,
          }),
        }
      )

      if (dgRes.ok) {
        dgData = await dgRes.json()
        if (dgData?.results?.channels?.[0]?.alternatives?.[0]?.transcript) {
          break; // success
        }
      }
      
      attempts++;
      console.warn(`Deepgram attempt ${attempts} failed or returned empty transcript. Retrying...`);
    }

    if (!dgRes || !dgRes.ok) {
      const errText = await dgRes?.text()
      console.error("Deepgram Final Error:", dgRes?.status, errText)
      return Response.json({ error: "Deepgram API failed", details: errText }, { status: 502 })
    }

    const utterances = dgData?.results?.utterances || []
    let rawTranscript = ""
    
    if (utterances.length > 0) {
      for (const u of utterances) {
        rawTranscript += `Speaker ${u.speaker || 0}: ${u.transcript}\n`
      }
    } else {
      // Fallback if utterances is missing for some reason
      rawTranscript = dgData?.results?.channels?.[0]?.alternatives?.[0]?.transcript || ""
    }

    if (!rawTranscript.trim()) {
      return Response.json({ error: "Transcript could not be extracted" }, { status: 400 })
    }

    console.log("Raw Transcript from Deepgram gathered. Cleaning up with AI...");
    
    // 🔥 AI CLEANUP using OpenAI (via ai SDK)
    let cleanedText = rawTranscript;
    try {
      const { text } = await generateText({
        model: openai('gpt-4o-mini'), // Excellent accuracy and fast
        system: "You are an expert transcription editor.",
        prompt: `Clean and correct this transcript:
- Fix grammar and spelling
- Remove filler words (um, uh, etc.)
- Remove repetition and stutters
- Make sentences read naturally while maintaining the exact original meaning
- Retain the Speaker labels (e.g., Speaker 0:, Speaker 1:) if present.

Transcript:
${rawTranscript}`
      });
      cleanedText = text;
      console.log("AI Cleanup Succesful.");
    } catch (aiErr: any) {
      console.error("AI Cleanup failed, falling back to raw transcript:", aiErr.message || aiErr);
      // fallback to raw if the AI call fails, applying strict regex cleaning
      cleanedText = rawTranscript
        .replace(/Speaker \d+:/g, "")   // remove speaker labels
        .replace(/\n/g, " ")            // convert new lines to space
        .replace(/\s+/g, " ")           // remove extra spaces
        .replace(/\s+\./g, ".")         // fix spacing before periods
        .replace(/,\s+/g, ", ")         // fix commas
        .trim();
    }

    console.log("FINAL TRANSCRIPT:", cleanedText)
    console.log("RECORDING ID:", recording_id)

    // ✅ Update DB
    const { error: updateError } = await supabase
      .from("recordings")
      .update({ transcript: cleanedText })
      .eq("id", recording_id)

    if (updateError) {
      console.error("DB UPDATE ERROR:", updateError)
    }

    return Response.json({ success: true, transcript: cleanedText })

  } catch (err) {
    console.error("TRANSCRIBE ERROR:", err)
    return Response.json({ error: "Server error" }, { status: 500 })
  }
}