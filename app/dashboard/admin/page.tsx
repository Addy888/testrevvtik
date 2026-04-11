"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null)
  const [companies, setCompanies] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Search & Filter state
  const [userSearch, setUserSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("")
  
  // New Company state
  const [newCompanyName, setNewCompanyName] = useState("")
  const [creatingCompany, setCreatingCompany] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    setError("")
    try {
      const [statsRes, compRes, usersRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/companies"),
        fetch(`/api/admin/users?search=${userSearch}&role=${roleFilter}`)
      ])
      
      const statsData = await statsRes.json()
      const compData = await compRes.json()
      const usersData = await usersRes.json()

      if (!statsRes.ok) throw new Error(statsData.error)

      setStats(statsData)
      setCompanies(compData.companies || [])
      setUsers(usersData.users || [])
    } catch (err: any) {
      setError(err.message || "Failed to load admin data")
    } finally {
      setLoading(false)
    }
  }

  // Initial load and filter change
  useEffect(() => {
    fetchData()
  }, [userSearch, roleFilter])

  const handleCreateCompany = async () => {
    if (!newCompanyName) return
    setCreatingCompany(true)
    try {
      const res = await fetch("/api/admin/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCompanyName })
      })
      if (!res.ok) throw new Error("Failed to create company")
      
      setNewCompanyName("")
      fetchData() // Refresh
    } catch (err: any) {
      alert(err.message)
    } finally {
      setCreatingCompany(false)
    }
  }

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm("Are you sure you want to completely delete this user?")) return
    try {
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      })
      if (!res.ok) throw new Error("Failed to delete user")
      fetchData() // Refresh
    } catch (err: any) {
      alert(err.message)
    }
  }

  if (loading && !stats) {
    return <div className="p-10 text-center text-muted-foreground">Loading Platform Console...</div>
  }

  if (error) {
    return <div className="p-10 text-red-500 text-center">{error}</div>
  }

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Platform Owner Console</h1>
        <p className="text-muted-foreground">Monitor global metrics, tenants, and system-wide users.</p>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 md:w-[400px]">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="companies">Companies</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        {/* 1. DASHBOARD TAB */}
        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card className="rounded-xl border-border/60 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Companies</CardTitle></CardHeader>
              <CardContent><div className="text-3xl font-bold">{stats?.companies}</div></CardContent>
            </Card>
            <Card className="rounded-xl border-border/60 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Users</CardTitle></CardHeader>
              <CardContent><div className="text-3xl font-bold">{stats?.users}</div></CardContent>
            </Card>
            <Card className="rounded-xl border-border/60 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Managers</CardTitle></CardHeader>
              <CardContent><div className="text-3xl font-bold">{stats?.managers}</div></CardContent>
            </Card>
            <Card className="rounded-xl border-border/60 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Employees</CardTitle></CardHeader>
              <CardContent><div className="text-3xl font-bold">{stats?.employees}</div></CardContent>
            </Card>
            <Card className="rounded-xl border-border/60 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Calls</CardTitle></CardHeader>
              <CardContent><div className="text-3xl font-bold">{stats?.calls}</div></CardContent>
            </Card>
          </div>

          {/* Quick Glances */}
          <div className="grid gap-8 md:grid-cols-2">
            <Card className="rounded-xl border-border/60 shadow-sm">
              <CardHeader><CardTitle>Platform Growth</CardTitle></CardHeader>
              <CardContent className="h-48 flex items-center justify-center text-muted-foreground bg-secondary/20 rounded-md">
                [ Chart Placeholder ]
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 2. COMPANIES TAB */}
        <TabsContent value="companies" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Tenant Management</h2>
            <div className="flex items-center gap-2">
              <Input 
                placeholder="New Company Name" 
                value={newCompanyName} 
                onChange={(e) => setNewCompanyName(e.target.value)} 
                className="w-[200px]"
              />
              <Button onClick={handleCreateCompany} disabled={creatingCompany}>
                {creatingCompany ? "Creating..." : "Create Tenant"}
              </Button>
            </div>
          </div>
          
          <Card className="rounded-xl border-border/60 shadow-sm">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Company ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Created Date</TableHead>
                    <TableHead>Active Users</TableHead>
                    <TableHead className="text-right pr-6">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="pl-6 font-mono text-xs">{c.id.slice(0, 8)}</TableCell>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell>{new Date(c.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>{c.user_count} Users</TableCell>
                      <TableCell className="text-right pr-6">
                        <Button variant="outline" size="sm">View Details</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {companies.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center py-6">No tenants found.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. USERS TAB */}
        <TabsContent value="users" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Global Users Matrix</h2>
            <div className="flex items-center gap-3">
              <Input 
                placeholder="Search email..." 
                value={userSearch} 
                onChange={(e) => setUserSearch(e.target.value)} 
                className="w-[250px]"
              />
              <select 
                className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="">All Roles</option>
                <option value="MANAGER">Managers</option>
                <option value="EMPLOYEE">Employees</option>
                <option value="SUPER_ADMIN">Admins</option>
              </select>
            </div>
          </div>

          <Card className="rounded-xl border-border/60 shadow-sm">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead className="text-right pr-6">Management</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="pl-6 font-medium">{u.name || "N/A"}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs px-2 ${u.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-700' : u.role === 'MANAGER' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                          {u.role}
                        </span>
                      </TableCell>
                      <TableCell>{u.companies?.name || "Independent/No Company"}</TableCell>
                      <TableCell className="text-right pr-6">
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteUser(u.id)} disabled={u.role === 'SUPER_ADMIN'}>
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {users.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center py-6">No users found.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
