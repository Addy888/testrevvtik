import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Optionally get user details from headers if needed, but for now we fetch all or based on query params.
    const { searchParams } = new URL(req.url)
    const companyId = searchParams.get("companyId")
    const userId = searchParams.get("userId")
    const role = searchParams.get("role")

    const applyRoleEq = (query: any) => {
      if (role === "salesperson" && userId) {
        return query.eq("user_id", userId)
      }
      return query
    }

    let recordingsQuery = supabase
      .from("recordings")
      .select("id, file_url, transcript, created_at, company_id, user_id")
      .order("created_at", { ascending: false })

    if (companyId) {
      recordingsQuery = recordingsQuery.eq("company_id", companyId)
    }
    recordingsQuery = applyRoleEq(recordingsQuery)

    const { data: recs, error: recErr } = await recordingsQuery
    if (recErr) throw new Error(recErr.message)

    const recordingIds = (recs || [])
      .map((r: any) => r.id)
      .filter((id) => typeof id === "string" && id.trim().length > 0)

    let transcriptsData: any[] = []
    let analysisData: any[] = []
    let scoresData: any[] = []

    if (recordingIds.length > 0) {
      // Fetch Transcripts
      let transQuery = supabase.from("transcripts").select("*")
      if (companyId) transQuery = transQuery.eq("company_id", companyId)
      transQuery = applyRoleEq(transQuery)
      transQuery = transQuery.in("recording_id", recordingIds)

      const { data: trans, error: transErr } = await transQuery
      if (transErr) throw new Error(transErr.message)
      transcriptsData = trans || []

      const transcriptIds = transcriptsData
        .map((t: any) => t.id)
        .filter((id) => typeof id === "string" && id.trim().length > 0)

      if (transcriptIds.length > 0) {
        // Fetch Analysis
        let anQuery = supabase.from("analysis").select("*")
        if (companyId) anQuery = anQuery.eq("company_id", companyId)
        anQuery = applyRoleEq(anQuery)
        anQuery = anQuery.in("transcript_id", transcriptIds)

        const { data: an, error: anErr } = await anQuery
        if (anErr) throw new Error(anErr.message)
        analysisData = an || []

        const analysisIds = analysisData
          .map((a: any) => a.id)
          .filter((id) => typeof id === "string" && id.trim().length > 0)

        if (analysisIds.length > 0) {
          // Fetch Scores
          let scQuery = supabase.from("scores").select("*")
          if (companyId) scQuery = scQuery.eq("company_id", companyId)
          scQuery = applyRoleEq(scQuery)
          scQuery = scQuery.in("analysis_id", analysisIds)

          const { data: sc, error: scErr } = await scQuery
          if (scErr) throw new Error(scErr.message)
          scoresData = sc || []
        }
      }
    }

    return NextResponse.json({
        recordings: recs || [],
        transcripts: transcriptsData,
        analyses: analysisData,
        scores: scoresData
    })
  } catch (err: any) {
    console.error("API /recordings Error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
