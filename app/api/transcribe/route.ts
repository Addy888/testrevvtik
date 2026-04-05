import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"

export async function POST(req: Request) {
  try {
    console.log("Step 1: API hit");
    const { recording_id } = await req.json()

    console.log("Recording ID received:", recording_id)

    if (!recording_id || typeof recording_id !== "string" || recording_id.trim().length === 0) {
      return Response.json({ error: "Invalid recording_id" }, { status: 400 })
    }

    // 🔥 USE SERVICE ROLE TO BYPASS RLS FOR BACKEND UPDATES
    const supabaseServer = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // ✅ Get recording
    const { data: recording, error } = await supabaseServer
      .from("recordings")
      .select("*")
      .eq("id", recording_id)
      .single()

    if (error || !recording) {
      return Response.json({ error: "Recording not found" }, { status: 404 })
    }

    console.log("Step 2: File received");

    // 🔥 Deepgram API call
    console.log("Step 3: Sending to Deepgram");
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

    const result = dgData;
    console.log("Step 4: Deepgram response:", result);

    const transcript = result?.results?.channels?.[0]?.alternatives?.[0]?.transcript;
    
    if (!transcript || transcript.trim() === "") {
      return Response.json({ error: "Transcript could not be extracted or is empty" }, { status: 400 })
    }

    console.log("Step 5: Saving to DB");
    console.log("Saving transcript...");
    console.log("Transcript:", transcript);

    // ✅ Update DB with Service Role
    const { data, error: updateError } = await supabaseServer
      .from("transcripts")
      .insert([
        {
          recording_id: recording_id,
          company_id: recording.company_id,
          text: transcript,
        }
      ])

    console.log("DB insert result:", data, updateError)

    if (updateError) {
      console.error("DB Insert Error:", updateError);
      return Response.json({ error: "Database insert failed" }, { status: 500 });
    }

    // Ensure we update recordings transcript as well to maintain frontend fallback compat
    await supabaseServer
      .from("recordings")
      .update({ transcript: transcript })
      .eq("id", recording_id)

    return Response.json({ success: true, transcription: transcript })

  } catch (err) {
    console.error("TRANSCRIBE ERROR:", err)
    return Response.json({ error: "Server error" }, { status: 500 })
  }
}