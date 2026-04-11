import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getAppUserFromSupabase } from "@/lib/supabase/getAppUser"

export const runtime = "nodejs"

function clamp0to100(n: unknown) {
  const num = typeof n === "number" ? n : Number(n)
  if (!Number.isFinite(num)) return 0
  return Math.max(0, Math.min(100, Math.round(num)))
}

async function insertScoreWithFallback({
  supabase,
  base,
  averageScore,
}: {
  supabase: any
  base: any
  averageScore: number
}) {
  const candidates: Array<Record<string, any>> = [
    { average_score: averageScore },
    { score: averageScore },
    { average: averageScore },
  ]

  let lastError: any = null

  for (const candidate of candidates) {
    const { data, error } = await supabase
      .from("scores")
      .insert({ ...base, ...candidate })
      .select()
      .single()

    if (!error && data) return data
    lastError = error
  }

  throw lastError || new Error("Failed to insert score")
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const appUser = await getAppUserFromSupabase(supabase)

    const body = await req.json()
    const { analysis_id } = body as { analysis_id?: string }

    if (!analysis_id) {
      return NextResponse.json(
        { error: "Missing analysis_id" },
        { status: 400 }
      )
    }

    let analysisQuery: any = supabase
      .from("analysis")
      .select("*")
      .eq("id", analysis_id)
      .eq("company_id", appUser.company_id)

    if (appUser.role === "EMPLOYEE") {
      analysisQuery = analysisQuery.eq("user_id", appUser.id)
    }

    const { data: analysisRow, error: analysisError } =
      await analysisQuery.single()

    if (analysisError || !analysisRow) {
      return NextResponse.json(
        { error: analysisError?.message || "Analysis not found" },
        { status: 404 }
      )
    }

    const analysis =
      (analysisRow as any).analysis ||
      (analysisRow as any).result ||
      (analysisRow as any).data ||
      (analysisRow as any).analysis_json

    if (!analysis || typeof analysis !== "object") {
      return NextResponse.json(
        { error: "Analysis JSON missing" },
        { status: 400 }
      )
    }

    const confidence = clamp0to100((analysis as any).confidence)
    const objection_handling = clamp0to100((analysis as any).objection_handling)
    const communication = clamp0to100((analysis as any).communication)
    const closing_skill = clamp0to100((analysis as any).closing_skill)

    const averageScore = Math.round(
      (confidence + objection_handling + communication + closing_skill) / 4
    )

    const base = {
      user_id: appUser.id,
      company_id: appUser.company_id,
      analysis_id,
    }

    const scoreRow: any = await insertScoreWithFallback({
      supabase,
      base,
      averageScore,
    })

    return NextResponse.json({
      scoreId: scoreRow?.id,
      averageScore,
      breakdown: { confidence, objection_handling, communication, closing_skill },
    })
  } catch (err: any) {
    const status = err?.status || 500
    return NextResponse.json(
      { error: err?.message || "Scoring failed" },
      { status }
    )
  }
}

