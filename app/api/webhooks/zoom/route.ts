import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import crypto from "crypto"

export async function POST(req: Request) {
  try {
    const bodyText = await req.text();

    // ─────────────────────────────────────────────
    // 1. ZOOM SIGNATURE VERIFICATION
    // Zoom sends: zoom-signature header (v0=HASH)
    // Reference: https://developers.zoom.us/docs/api/rest/webhook-reference/#verify-webhook-events
    // ─────────────────────────────────────────────
    const zoomSignature = req.headers.get("x-zm-signature") || ""
    const zoomTimestamp  = req.headers.get("x-zm-request-timestamp") || ""
    const webhookSecret  = process.env.ZOOM_WEBHOOK_SECRET_TOKEN

    if (webhookSecret && zoomSignature && zoomTimestamp) {
      const message = `v0:${zoomTimestamp}:${bodyText}`
      const expectedHash = "v0=" + crypto.createHmac("sha256", webhookSecret).update(message).digest("hex")
      if (expectedHash !== zoomSignature) {
        console.warn("Zoom webhook: invalid signature — rejecting request")
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
      }
    }

    const eventBody = JSON.parse(bodyText);
    console.log("Zoom webhook event:", eventBody.event)

    // ─────────────────────────────────────────────
    // 2. URL VALIDATION (Zoom challenge-response)
    // ─────────────────────────────────────────────
    if (eventBody.event === "endpoint.url_validation") {
      const plainToken = eventBody.payload?.plainToken;
      if (plainToken && webhookSecret) {
        const hashForValidate = crypto
          .createHmac("sha256", webhookSecret)
          .update(plainToken)
          .digest("hex");
        console.log("Zoom webhook: URL validation challenge answered")
        return NextResponse.json({
          plainToken: plainToken,
          encryptedToken: hashForValidate,
        });
      }
      return NextResponse.json({ error: "Missing secret for validation" }, { status: 400 })
    }

    // ─────────────────────────────────────────────
    // 3. RECORDING COMPLETED EVENT
    // ─────────────────────────────────────────────
    if (eventBody.event === "recording.completed") {
      console.log("Zoom webhook: recording.completed received")

      const payload    = eventBody.payload;
      const meetingId  = payload?.object?.id?.toString();
      const topic      = payload?.object?.topic || "Zoom Meeting";
      const accountId  = payload?.account_id;
      const files      = payload?.object?.recording_files || [];

      console.log("Meeting ID:", meetingId, "| Account ID:", accountId, "| Files:", files.length)

      // Only process actual audio/video files (skip chat, timeline, thumbnails)
      const validFiles = files.filter((f: any) =>
        f.file_type === "MP4" || f.file_type === "M4A" || f.file_type === "AUDIO_ONLY"
      );

      if (validFiles.length === 0) {
        console.log("Zoom webhook: no valid audio/video files in recording — skipping")
        return NextResponse.json({ success: true, message: "No valid files to process" });
      }

      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      // ─── Find matching integration by account_id first ────────────────
      // When account_id is stored in the integrations table, we can match precisely.
      // Fallback: use the most-recently-connected integration (single-tenant apps).
      let integration: any = null;

      if (accountId) {
        const { data: byAccount } = await supabase
          .from("integrations")
          .select("*")
          .eq("provider", "zoom")
          .eq("account_id", accountId)
          .limit(1)
          .maybeSingle();
        
        if (byAccount) {
          console.log("Zoom webhook: matched integration by account_id")
          integration = byAccount;
        }
      }

      if (!integration) {
        // Fallback: latest zoom integration
        const { data: latest } = await supabase
          .from("integrations")
          .select("*")
          .eq("provider", "zoom")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (latest) {
          console.log("Zoom webhook: using fallback latest integration for company_id:", latest.company_id)
          integration = latest;
        }
      }

      if (!integration) {
        console.error("Zoom webhook: no Zoom integration found — cannot process recording")
        return NextResponse.json({ error: "No Zoom integration found" }, { status: 400 });
      }

      const company_id   = integration.company_id;
      const access_token = integration.access_token;

      // Process each valid file (in practice usually one)
      for (const fileToProcess of validFiles) {
        const downloadUrl = fileToProcess.download_url;
        const fileType    = fileToProcess.file_type;

        console.log(`Processing file: ${fileType} | URL: ${downloadUrl}`)

        // ─── Deduplicate: skip if already processing this file ────────
        const { data: existing } = await supabase
          .from("recordings")
          .select("id")
          .eq("external_id", meetingId)
          .eq("file_url", downloadUrl)
          .maybeSingle();

        if (existing) {
          console.log("Zoom webhook: already processed this file — skipping")
          continue;
        }

        // ─── Insert recording row as 'processing' ─────────────────────
        const { data: insertedRec, error: insertError } = await supabase
          .from("recordings")
          .insert({
            company_id,
            source: "zoom",
            external_id: meetingId,
            title: topic,
            file_url: downloadUrl,
            status: "processing",
          })
          .select()
          .single();

        if (insertError || !insertedRec) {
          console.error("Zoom webhook: failed to insert recording row:", insertError)
          continue;
        }

        console.log("Zoom webhook: recording row created:", insertedRec.id)

        // ─── Fire background processing (non-blocking) ────────────────
        // We must return 200 to Zoom quickly — processing happens async
        processZoomRecordingAsync(
          downloadUrl,
          access_token,
          insertedRec.id,
          company_id,
          supabase
        ).catch((err) => console.error("Zoom webhook background process error:", err));
      }

      return NextResponse.json({ success: true, message: "Processing started" });
    }

    // Acknowledge other event types
    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error("ZOOM WEBHOOK ERROR:", err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// BACKGROUND: Download file from Zoom → send to /api/transcribe
// ─────────────────────────────────────────────────────────────────────────────
async function processZoomRecordingAsync(
  downloadUrl: string,
  accessToken: string,
  recordingId: string,
  company_id: string,
  supabase: any
) {
  try {
    console.log(`[BG] Step 1: Downloading Zoom file for recording ${recordingId}`)

    // Step 1: Download the file from Zoom using the OAuth access token
    const fileRes = await fetch(downloadUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!fileRes.ok) {
      const errText = await fileRes.text();
      console.error(`[BG] Zoom file download failed (${fileRes.status}):`, errText);
      await supabase.from("recordings").update({ status: "failed" }).eq("id", recordingId);
      return;
    }

    const contentType = fileRes.headers.get("content-type") || "audio/mp4";
    const arrayBuffer = await fileRes.arrayBuffer();
    const buffer      = Buffer.from(arrayBuffer);
    const blob        = new Blob([buffer], { type: contentType });

    console.log(`[BG] Step 2: File downloaded — size: ${blob.size} bytes | type: ${contentType}`)

    // Step 2: Send to /api/transcribe as multipart/form-data
    const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const fd     = new FormData();
    fd.append("file", blob, "recording.mp4");
    fd.append("recording_id", recordingId);
    fd.append("company_id", company_id);

    console.log(`[BG] Step 3: Sending to /api/transcribe`)

    const transcribeRes = await fetch(`${origin}/api/transcribe`, {
      method: "POST",
      body: fd,
    });

    const transcribeData = await transcribeRes.json();

    if (!transcribeRes.ok || !transcribeData.success) {
      console.error("[BG] Transcription pipeline failed:", transcribeData);
      await supabase.from("recordings").update({ status: "failed" }).eq("id", recordingId);
      return;
    }

    console.log(`[BG] Step 4: Transcription completed for recording ${recordingId} ✅`)
    // Status is already set to 'completed' inside /api/transcribe

  } catch (err) {
    console.error("[BG] Fatal error in processZoomRecordingAsync:", err);
    await supabase.from("recordings").update({ status: "failed" }).eq("id", recordingId);
  }
}
