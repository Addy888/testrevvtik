"use client"

import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import TeamBarChart from "@/components/dashboard/team-bar-chart"
import { useRouter } from "next/navigation"

const supabase = createClient()

export default function ManagerDashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [manager, setManager] = useState<any>(null)
  const [employees, setEmployees] = useState<any[]>([])
  const [employeeStats, setEmployeeStats] = useState<Record<string, { recordings: number; avgScore: number }>>({})
  const [employeeEmail, setEmployeeEmail] = useState("")
  const [adding, setAdding] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Unauthorized")

      const { data: managerUser, error: managerErr } = await supabase
        .from("users")
        .select("id, company_id, role")
        .eq("id", user.id)
        .single()
      if (managerErr || !managerUser) throw new Error("Profile not found")
      if (managerUser.role !== "manager" && managerUser.role !== "admin") {
        throw new Error("Manager access required")
      }

      // Personal onboarding must never reach manager features.
      try {
        const { data: company } = await supabase
          .from("companies")
          .select("type")
          .eq("id", managerUser.company_id)
          .single()
        const isPersonal = String(company?.type ?? "").toLowerCase() === "personal"
        if (isPersonal) {
          router.replace("/dashboard/personal")
          return
        }
      } catch {
        // If company type can't be loaded, keep access as-is.
      }
      setManager(managerUser)

      const { data: employeeRows, error: employeeErr } = await supabase
        .from("users")
        .select("id, email, role, manager_id")
        .eq("company_id", managerUser.company_id)
        .eq("manager_id", managerUser.id)
      if (employeeErr) throw employeeErr

      const list = (employeeRows || []) as any[]
      setEmployees(list)

      const stats: Record<string, { recordings: number; avgScore: number }> = {}
      for (const emp of list) {
        const { count: recCount } = await supabase
          .from("recordings")
          .select("*", { count: "exact", head: true })
          .eq("company_id", managerUser.company_id)
          .eq("user_id", emp.id)

        const { data: trans } = await supabase
          .from("transcripts")
          .select("id")
          .eq("company_id", managerUser.company_id)
          .eq("user_id", emp.id)
        const transcriptIds = (trans || []).map((t: any) => t.id)

        let avgScore = 0
        if (transcriptIds.length > 0) {
          const { data: analyses } = await supabase
            .from("analysis")
            .select("id")
            .eq("company_id", managerUser.company_id)
            .eq("user_id", emp.id)
            .in("transcript_id", transcriptIds)

          const analysisIds = (analyses || []).map((a: any) => a.id)
          if (analysisIds.length > 0) {
            const { data: scores } = await supabase
              .from("scores")
              .select("*")
              .eq("company_id", managerUser.company_id)
              .eq("user_id", emp.id)
              .in("analysis_id", analysisIds)

            const values = (scores || [])
              .map((s: any) =>
                typeof s.average_score === "number"
                  ? s.average_score
                  : typeof s.score === "number"
                    ? s.score
                    : typeof s.average === "number"
                      ? s.average
                      : null
              )
              .filter((v: any) => typeof v === "number")
            avgScore = values.length
              ? Math.round(values.reduce((a: number, b: number) => a + b, 0) / values.length)
              : 0
          }
        }

        stats[emp.id] = { recordings: recCount || 0, avgScore }
      }
      setEmployeeStats(stats)
    } catch (e: any) {
      setError(e?.message || "Failed to load manager dashboard")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const totals = useMemo(() => {
    const rows = Object.values(employeeStats)
    const totalRecordings = rows.reduce((a, r) => a + r.recordings, 0)
    const avgScore = rows.length
      ? Math.round(rows.reduce((a, r) => a + r.avgScore, 0) / rows.length)
      : 0
    return { totalRecordings, avgScore }
  }, [employeeStats])

  const teamBarData = useMemo(() => {
    return employees.map((emp) => {
      const stat = employeeStats[emp.id] || { recordings: 0, avgScore: 0 }
      const label = (emp.email || emp.id || "?").slice(0, 18)
      return { name: label, score: stat.avgScore }
    })
  }, [employees, employeeStats])

  const addEmployeeByEmail = async () => {
    if (!employeeEmail.trim()) return
    setAdding(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch("/api/manager/add-employee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: employeeEmail.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed to add employee")
      setEmployeeEmail("")
      setSuccess(data?.message || "Invite sent successfully")
      await load()
    } catch (e: any) {
      setError(e?.message || "Failed to add employee")
    } finally {
      setAdding(false)
    }
  }

  const removeEmployee = async (employeeId: string) => {
    const confirmRemove = window.confirm("Are you sure you want to remove this employee?")
    if (!confirmRemove) return

    setRemovingId(employeeId)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch("/api/manager/remove-employee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employee_id: employeeId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed to remove employee")
      setSuccess("Employee removed successfully")
      await load()
    } catch (e: any) {
      setError(e?.message || "Failed to remove employee")
    } finally {
      setRemovingId(null)
    }
  }

  if (loading) return <div className="text-muted-foreground">Loading manager dashboard...</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Manager Dashboard</h1>
        <p className="text-muted-foreground">Track employee performance and progress.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-xl border-border/60 bg-card shadow-sm">
          <CardHeader><CardTitle>Total Employees</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{employees.length}</div></CardContent>
        </Card>
        <Card className="rounded-xl border-border/60 bg-card shadow-sm">
          <CardHeader><CardTitle>Total Recordings</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{totals.totalRecordings}</div></CardContent>
        </Card>
        <Card className="rounded-xl border-border/60 bg-card shadow-sm">
          <CardHeader><CardTitle>Average Team Score</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{totals.avgScore}%</div></CardContent>
        </Card>
      </div>

      <Card className="rounded-xl border-border/60 bg-card shadow-sm">
        <CardHeader>
          <CardTitle>Team performance</CardTitle>
        </CardHeader>
        <CardContent>
          <TeamBarChart data={teamBarData} />
        </CardContent>
      </Card>

      <Card className="rounded-xl border-border/60 bg-card shadow-sm">
        <CardHeader><CardTitle>Add Employee by Email</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={employeeEmail}
              onChange={(e) => setEmployeeEmail(e.target.value)}
              placeholder="Enter employee email"
              type="email"
            />
            <Button onClick={addEmployeeByEmail} disabled={adding}>
              {adding ? "Adding..." : "Add Employee"}
            </Button>
          </div>
          {success ? (
            <p className="text-sm text-emerald-600">{success}</p>
          ) : null}
        </CardContent>
      </Card>

      <Card className="rounded-xl border-border/60 bg-card shadow-sm">
        <CardHeader><CardTitle>Employee Performance</CardTitle></CardHeader>
        <CardContent>
          {error ? <div className="text-sm text-destructive mb-3">{error}</div> : null}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Recordings</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((emp) => {
                const stat = employeeStats[emp.id] || { recordings: 0, avgScore: 0 }
                return (
                  <TableRow key={emp.id}>
                    <TableCell>{emp.email || emp.id}</TableCell>
                    <TableCell>{stat.recordings}</TableCell>
                    <TableCell>{stat.avgScore}%</TableCell>
                    <TableCell className="w-[280px]">
                      <Progress value={stat.avgScore} />
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeEmployee(emp.id)}
                        disabled={removingId === emp.id}
                      >
                        {removingId === emp.id ? "Removing..." : "Remove"}
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

