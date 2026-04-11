"use client"

import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import ScoreLineChart from "@/components/dashboard/score-line-chart"
import { useRouter } from "next/navigation"

const supabase = createClient()

function scoreFromRow(s: any): number | null {
  if (typeof s?.average_score === "number") return s.average_score
  if (typeof s?.score === "number") return s.score
  if (typeof s?.average === "number") return s.average
  return null
}

export default function CompanyDashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [appUser, setAppUser] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [recordingsCount, setRecordingsCount] = useState(0)
  const [scoreValues, setScoreValues] = useState<number[]>([])
  const [scoreChartData, setScoreChartData] = useState<{ label: string; value: number }[]>([])
  const [makingManagerId, setMakingManagerId] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: authData } = await supabase.auth.getUser()
      const authUser = authData.user
      if (!authUser) throw new Error("Unauthorized")

      const { data: profile, error: profileError } = await supabase
        .from("app_users")
        .select("id, role, company_id")
        .eq("id", authUser.id)
        .single()
      if (profileError || !profile) throw new Error("User profile not found")

      setAppUser(profile)

      const { data: usersRaw, error: usersError } = await supabase
        .from("app_users")
        .select("id, role, email, manager_id")
        .eq("company_id", profile.company_id)
        .order("role", { ascending: true })
      if (usersError) throw usersError
      setUsers((usersRaw || []) as any[])

      const { count: recordingsCountRaw } = await supabase
        .from("recordings")
        .select("*", { count: "exact", head: true })
        .eq("company_id", profile.company_id)
      setRecordingsCount(recordingsCountRaw || 0)

      const { data: scoresRaw } = await supabase
        .from("scores")
        .select("*")
        .eq("company_id", profile.company_id)
        .order("created_at", { ascending: true })
        .limit(300)

      const values = (scoresRaw || [])
        .map((s: any) => scoreFromRow(s))
        .filter((v: any) => typeof v === "number") as number[]
      setScoreValues(values)

      const chart = (scoresRaw || []).map((s: any, i: number) => {
        const v = scoreFromRow(s)
        const d = s.created_at ? new Date(s.created_at) : null
        return {
          label: d
            ? d.toLocaleDateString(undefined, { month: "short", day: "numeric" })
            : `#${i + 1}`,
          value: typeof v === "number" ? v : 0,
        }
      })
      setScoreChartData(chart)
    } catch (e: any) {
      setError(e?.message || "Failed to load company dashboard")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const avgScore = useMemo(() => {
    return scoreValues.length
      ? Math.round(scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length)
      : 0
  }, [scoreValues])

  const makeManager = async (userId: string) => {
    setMakingManagerId(userId)
    setError(null)
    try {
      const res = await fetch("/api/users/make-manager", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed to make manager")
      await load()
    } catch (e: any) {
      setError(e?.message || "Failed to make manager")
    } finally {
      setMakingManagerId(null)
    }
  }

  if (loading) return <div className="text-muted-foreground">Loading company dashboard...</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Company Dashboard</h1>
        <p className="text-muted-foreground">Company-level overview and users.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-xl border-border/60 bg-card shadow-sm">
          <CardHeader><CardTitle>Total Users</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{users.length}</div></CardContent>
        </Card>
        <Card className="rounded-xl border-border/60 bg-card shadow-sm">
          <CardHeader><CardTitle>Total Recordings</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{recordingsCount}</div></CardContent>
        </Card>
        <Card className="rounded-xl border-border/60 bg-card shadow-sm">
          <CardHeader><CardTitle>Average Score</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{avgScore}%</div></CardContent>
        </Card>
      </div>

      <Card className="rounded-xl border-border/60 bg-card shadow-sm">
        <CardHeader>
          <CardTitle>Team score trend</CardTitle>
        </CardHeader>
        <CardContent>
          {scoreChartData.length > 0 ? (
            <ScoreLineChart data={scoreChartData} />
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No scores yet across the company.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-xl border-border/60 bg-card shadow-sm">
        <CardHeader><CardTitle>Company Users</CardTitle></CardHeader>
        <CardContent>
          {error ? <div className="text-sm text-destructive mb-3">{error}</div> : null}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Manager ID</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>{u.email || u.id}</TableCell>
                  <TableCell className="capitalize">{u.role}</TableCell>
                  <TableCell>{u.manager_id || "-"}</TableCell>
                  <TableCell>
                    {(appUser?.role === "admin" || appUser?.role === "ADMIN" || appUser?.role === "SUPER_ADMIN") && u.role !== "manager" && u.role !== "MANAGER" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => makeManager(u.id)}
                        disabled={makingManagerId === u.id}
                      >
                        {makingManagerId === u.id ? "Updating..." : "Make Manager"}
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

