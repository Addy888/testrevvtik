import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getAppUserFromSupabase } from "@/lib/supabase/getAppUser"
import { analyzeTranscriptWithClaude } from "@/lib/ai/claude"

export const runtime = "nodejs"

async function insertAnalysisWithFallback({
  supabase,
  base,
  analysis,
}: {
  supabase: any
  base: any
  analysis: any
}) {
  const candidates: Array<Record<string, any>> = [
    { analysis },
    { result: analysis },
    { data: analysis },
    { analysis_json: analysis },
  ]

  let lastError: any = null

  for (const candidate of candidates) {
    const { data, error } = await supabase
      .from("analysis")
      .insert({ ...base, ...candidate })
      .select()
      .single()

    if (!error && data) return data
    lastError = error
  }

  throw lastError || new Error("Failed to insert analysis")
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const appUser = await getAppUserFromSupabase(supabase)

    const body = await req.json()
    const { transcript_id } = body as { transcript_id?: string }

    if (!transcript_id) {
      return NextResponse.json(
        { error: "Missing transcript_id" },
        { status: 400 }
      )
    }

    let transcriptQuery: any = supabase
      .from("transcripts")
      .select("*")
      .eq("id", transcript_id)
      .eq("company_id", appUser.company_id)

    if (appUser.role === "salesperson") {
      transcriptQuery = transcriptQuery.eq("user_id", appUser.id)
    }

    const { data: transcript, error: transcriptError } = await transcriptQuery.single()

    if (transcriptError || !transcript) {
      return NextResponse.json(
        { error: transcriptError?.message || "Transcript not found" },
        { status: 404 }
      )
    }

    const transcriptText =
      (transcript as any).content ||
      (transcript as any).transcript ||
      (transcript as any).text ||
      (transcript as any).transcript_text

    if (!transcriptText || typeof transcriptText !== "string") {
      return NextResponse.json(
        { error: "Transcript text missing" },
        { status: 400 }
      )
    }

    const analysisResult = await analyzeTranscriptWithClaude(transcriptText)

    const base = {
      user_id: appUser.id,
      company_id: appUser.company_id,
      transcript_id,
    }

    const analysisRow: any = await insertAnalysisWithFallback({
      supabase,
      base,
      analysis: analysisResult,
    })

    return NextResponse.json({
      analysisId: analysisRow?.id,
      analysis: analysisResult,
    })
  } catch (err: any) {
    const status = err?.status || 500
    return NextResponse.json(
      { error: err?.message || "Analyze failed" },
      { status }
    )
  }
}

