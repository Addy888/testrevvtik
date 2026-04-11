"use client"

import * as React from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Trash2, Search, Loader2, UserPlus } from "lucide-react"

export function TeamMemberTable() {
  const [employees, setEmployees] = React.useState<any[]>([])
  const [search, setSearch] = React.useState("")
  const [loading, setLoading] = React.useState(true)
  const [deletingId, setDeletingId] = React.useState<string | null>(null)

  const fetchEmployees = React.useCallback(async () => {
    try {
      const res = await fetch("/api/manager/employees")
      const data = await res.json()
      if (data.employees) {
        setEmployees(data.employees)
      }
    } catch (err) {
      console.error("Failed to fetch employees", err)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchEmployees()
    
    // Listen for refresh events from other components
    const handleRefresh = () => fetchEmployees()
    window.addEventListener("refresh-team", handleRefresh)
    return () => window.removeEventListener("refresh-team", handleRefresh)
  }, [fetchEmployees])

  const filteredEmployees = React.useMemo(() => {
    return employees.filter(e => 
      (e.name || "").toLowerCase().includes(search.toLowerCase()) || 
      (e.email || "").toLowerCase().includes(search.toLowerCase())
    )
  }, [employees, search])

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this employee from your team?")) return
    
    setDeletingId(id)
    try {
      const res = await fetch(`/api/manager/employees?id=${id}`, { method: "DELETE" })
      if (res.ok) {
        setEmployees(prev => prev.filter(e => e.id !== id))
      }
    } catch (err) {
      console.error("Failed to delete employee", err)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Search employees by name or email..." 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
          className="pl-9 h-10 border-border/60 focus-visible:ring-primary shadow-sm"
        />
      </div>

      <div className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="font-semibold px-6">Employee</TableHead>
              <TableHead className="font-semibold">Email</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="text-right px-6 font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-48 text-center px-6">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground font-medium">Loading team members...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredEmployees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-48 text-center px-6">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="p-3 rounded-full bg-muted/50 mb-2">
                      <UserPlus className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground font-medium">
                      {search ? "No team members match your search." : "No employees added to your team yet."}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredEmployees.map((e) => (
                <TableRow key={e.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="px-6">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                        {(e.name || e.email || "?")[0].toUpperCase()}
                      </div>
                      <span className="font-semibold text-foreground">{e.name || "Unnamed User"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{e.email}</TableCell>
                  <TableCell>
                    <Badge variant={e.status === "Active" ? "default" : "secondary"} className={`
                      px-2 py-0.5 font-medium text-[11px] uppercase tracking-wider
                      ${e.status === "Active" ? "bg-green-100/80 text-green-700 hover:bg-green-100/100 border-green-200" : "bg-blue-50 text-blue-600 border-blue-100"}
                    `}>
                      {e.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right px-6">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDelete(e.id)}
                      disabled={deletingId === e.id}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all"
                    >
                      {deletingId === e.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
