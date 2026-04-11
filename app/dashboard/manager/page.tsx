import { createClient } from "@/lib/supabase/server"
import { requireAppUser } from "@/lib/supabase/getAppUser"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { InviteEmployee } from "./invite-employee"
import { TeamMemberTable } from "./team-member-table"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default async function ManagerDashboard() {
  const user = await requireAppUser()
  if (user.role !== "MANAGER" && user.role !== "SUPER_ADMIN" && user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const supabase = await createClient()

  // For manager, fetch data for their company
  let companyData = null
  if (user.company_id) {
    const { data } = await supabase.from("companies").select("name").eq("id", user.company_id).single()
    companyData = data
  }

  // Count employees in app_users
  const { count: employeeCount } = await supabase
    .from("app_users")
    .select("*", { count: "exact", head: true })
    .eq("company_id", user.company_id)
    .eq("role", "EMPLOYEE")

  const { data: calls } = await supabase.from("calls").select("id, title, created_at").eq("company_id", user.company_id)

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Manager Dashboard</h1>
        <p className="text-muted-foreground">Manage your team and view performance at {companyData?.name || "your company"}.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-xl border-border/60 bg-card shadow-sm hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Team Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{employeeCount || 0}</div>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-border/60 bg-card shadow-sm hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Team Calls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{calls?.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_350px]">
        <div className="space-y-8">
          <Card className="rounded-xl border-border/60 bg-card shadow-sm overflow-hidden">
            <CardHeader className="border-b border-border/60 bg-muted/30">
              <CardTitle>Team Management</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <TeamMemberTable />
            </CardContent>
          </Card>

          <Card className="rounded-xl border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle>Recent Team Calls</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {calls?.slice(0, 5).map((c: any) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.title}</TableCell>
                      <TableCell>{new Date(c.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                  {calls?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center text-muted-foreground py-4">No calls found.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <InviteEmployee />
        </div>
      </div>
    </div>
  )
}
