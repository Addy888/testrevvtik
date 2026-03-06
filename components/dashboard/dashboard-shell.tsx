"use client"

import { useState } from "react"
import { Menu } from "lucide-react"
import { DashboardSidebar } from "@/components/dashboard/sidebar"

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background flex">

      {/* Mobile sidebar overlay */}
      {open && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/30"
            onClick={() => setOpen(false)}
          />
          <div className="relative w-64 bg-card">
            <DashboardSidebar />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 border-r bg-background">
        <DashboardSidebar />
      </aside>

      <main className="flex-1 w-full overflow-x-hidden">

        {/* Mobile header */}
        <div className="flex items-center gap-3 border-b p-4 md:hidden">
          <button onClick={() => setOpen(true)}>
            <Menu className="h-6 w-6" />
          </button>
          <span className="font-bold">RevvTik</span>
        </div>

        <div className="p-4 md:p-8">{children}</div>
      </main>
    </div>
  )
}