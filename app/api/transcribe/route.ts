import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    console.log("Step 1: API hit");
    let recording_id: string;
    let fileData: File | null = null;
    let fileType: string = "audio/mpeg";

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      console.log("Step 1.1: Parsing FormData");
      const formData = await req.formData();
      recording_id = formData.get("recording_id") as string;
      const file = formData.get("file") as File;
      if (file) {
         fileData = file;
         fileType = file.type || "audio/mpeg";
      }
    } else {
      console.log("Step 1.1: Parsing JSON");
      const jsonStr = await req.json();
      recording_id = jsonStr.recording_id;
    }

    console.log("Recording ID received:", recording_id)

    if (!recording_id || typeof recording_id !== "string" || recording_id.trim().length === 0) {
      return NextResponse.json({ error: "Invalid recording_id" }, { status: 400 })
    }

    // 🔥 USE SERVICE ROLE TO BYPASS RLS FOR BACKEND UPDATES
    const supabaseServer = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // ✅ Get recording to extract database file url IF buffer not provided
    const { data: recording, error } = await supabaseServer
      .from("recordings")
      .select("*")
      .eq("id", recording_id)
      .single()

    if (error || !recording) {
      return NextResponse.json({ error: "Recording not found" }, { status: 404 })
    }

    console.log("Step 2: File received");

    // 🔥 Deepgram API call
    console.log("Step 3: Sending to Deepgram");
    let dgRes = null;
    let dgData = null;
    let attempts = 0;
    
    // Deepgram URL parameters
    const dgParams = new URLSearchParams({
       model: "nova-2",
       smart_format: "true",
       punctuate: "true",
       diarize: "true",
       filler_words: "false",
       utterances: "true"
    });

    const dgUrl = `https://api.deepgram.com/v1/listen?${dgParams.toString()}`;

    while (attempts < 2) {
      if (fileData) {
        // Send file buffer directly
        dgRes = await fetch(dgUrl, {
          method: "POST",
          headers: {
            Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`,
            "Content-Type": fileType,
          },
          body: fileData,
        })
      } else {
        // Send URL to Deepgram
        dgRes = await fetch(dgUrl, {
          method: "POST",
          headers: {
            Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: recording.file_url,
          }),
        })
      }

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
      
      // Mark recording as failed
      await supabaseServer.from("recordings").update({ status: 'failed' }).eq("id", recording_id);

      return NextResponse.json({ error: "Deepgram API failed", details: errText }, { status: 502 })
    }

    const result = dgData;
    console.log("Step 4: Deepgram response:", result);

    const transcript = result?.results?.channels?.[0]?.alternatives?.[0]?.transcript;
    
    if (!transcript || transcript.trim() === "") {
      await supabaseServer.from("recordings").update({ status: 'failed' }).eq("id", recording_id);
      return NextResponse.json({ error: "Transcript could not be extracted or is empty" }, { status: 400 })
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
      await supabaseServer.from("recordings").update({ status: 'failed' }).eq("id", recording_id);
      return NextResponse.json({ error: "Database insert failed" }, { status: 500 });
    }

    // Ensure we update recordings transcript as well to maintain frontend fallback compat
    await supabaseServer
      .from("recordings")
      .update({ transcript: transcript, status: 'completed' })
      .eq("id", recording_id)

    return NextResponse.json({ success: true, transcription: transcript })

  } catch (err) {
    console.error("TRANSCRIBE ERROR:", err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}