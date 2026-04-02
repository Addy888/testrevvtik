import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getAppUserFromSupabase } from "@/lib/supabase/getAppUser"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import ScoreLineChart from "@/components/dashboard/score-line-chart"

function scoreFromRow(s: any): number | null {
  if (typeof s?.average_score === "number") return s.average_score
  if (typeof s?.score === "number") return s.score
  if (typeof s?.average === "number") return s.average
  return null
}

function analysisPayload(row: any) {
  return row?.analysis ?? row?.result ?? row?.data ?? row?.analysis_json
}

export default async function PersonalDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")

  let appUser: any
  try {
    appUser = await getAppUserFromSupabase(supabase)
  } catch (error: any) {
    if (error?.status === 404) redirect("/onboarding")
    throw error
  }

  let recordingsQuery: any = supabase
    .from("recordings")
    .select("*")
    .eq("company_id", appUser.company_id)
    .eq("user_id", appUser.id)
    .order("created_at", { ascending: false })
    .limit(20)

  const { data: recordingsRaw } = await recordingsQuery
  const recordings = (recordingsRaw || []) as any[]

  const recordingIds = recordings.map((r) => r.id)

  let transcriptIds: any[] = []
  if (recordingIds.length > 0) {
    const { data: trans } = await supabase
      .from("transcripts")
      .select("id, recording_id")
      .eq("company_id", appUser.company_id)
      .eq("user_id", appUser.id)
      .in("recording_id", recordingIds)
    transcriptIds = (trans || []).map((t: any) => t.id)
  }

  let avgScore = 0
  let scoreTrend: { label: string; value: number }[] = []
  if (transcriptIds.length > 0) {
    const { data: analyses } = await supabase
      .from("analysis")
      .select("id")
      .eq("company_id", appUser.company_id)
      .eq("user_id", appUser.id)
      .in("transcript_id", transcriptIds)

    const analysisIds = (analyses || []).map((a: any) => a.id)
    if (analysisIds.length > 0) {
      const { data: scores } = await supabase
        .from("scores")
        .select("*")
        .eq("company_id", appUser.company_id)
        .eq("user_id", appUser.id)
        .in("analysis_id", analysisIds)
        .order("created_at", { ascending: true })

      const values = (scores || [])
        .map((s: any) => scoreFromRow(s))
        .filter((v: any) => typeof v === "number") as number[]

      avgScore = values.length
        ? Math.round(values.reduce((a: number, b: number) => a + b, 0) / values.length)
        : 0

      scoreTrend = (scores || []).map((s: any, i: number) => {
        const v = scoreFromRow(s)
        const d = s.created_at ? new Date(s.created_at) : null
        return {
          label: d
            ? d.toLocaleDateString(undefined, { month: "short", day: "numeric" })
            : `#${i + 1}`,
          value: typeof v === "number" ? v : 0,
        }
      })
    }
  }

  const { data: recentAnalysesRaw } = await supabase
    .from("analysis")
    .select("*")
    .eq("company_id", appUser.company_id)
    .eq("user_id", appUser.id)
    .order("created_at", { ascending: false })
    .limit(5)

  const recentAnalyses = (recentAnalysesRaw || []) as any[]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Personal Dashboard</h1>
        <p className="text-muted-foreground">Your own recordings and performance.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-xl border-border/60 bg-card shadow-sm">
          <CardHeader><CardTitle>Total Recordings</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{recordings.length}</div></CardContent>
        </Card>
        <Card className="rounded-xl border-border/60 bg-card shadow-sm">
          <CardHeader><CardTitle>Average Score</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{avgScore}%</div></CardContent>
        </Card>
        <Card className="rounded-xl border-border/60 bg-card shadow-sm">
          <CardHeader><CardTitle>Role</CardTitle></CardHeader>
          <CardContent><div className="text-lg font-medium capitalize">{appUser.role}</div></CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-xl border-border/60 bg-card shadow-sm">
          <CardHeader>
            <CardTitle>Score trend</CardTitle>
          </CardHeader>
          <CardContent>
            {scoreTrend.length > 0 ? (
              <ScoreLineChart data={scoreTrend} />
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">
                Complete a recording pipeline to see your score trend.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-xl border-border/60 bg-card shadow-sm">
          <CardHeader>
            <CardTitle>Recent analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentAnalyses.length === 0 ? (
              <p className="text-sm text-muted-foreground">No analyses yet.</p>
            ) : (
              recentAnalyses.map((row) => {
                const payload = analysisPayload(row)
                const summary =
                  payload && typeof payload === "object" && typeof payload.summary === "string"
                    ? payload.summary
                    : "—"
                return (
                  <div
                    key={row.id}
                    className="rounded-lg border border-border/50 bg-muted/30 px-3 py-2 text-sm"
                  >
                    <div className="text-xs text-muted-foreground mb-1">
                      {row.created_at
                        ? new Date(row.created_at).toLocaleString()
                        : ""}
                    </div>
                    <p className="leading-snug">{summary}</p>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-xl border-border/60 bg-card shadow-sm">
        <CardHeader><CardTitle>My Recordings</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File URL</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recordings.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="max-w-[420px] truncate">{r.file_url || r.url || "-"}</TableCell>
                  <TableCell>{r.created_at ? new Date(r.created_at).toLocaleDateString() : "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

