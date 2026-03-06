// import type React from "react"
// import { redirect } from "next/navigation"
// import { createClient } from "@/lib/supabase/server"
// import { DashboardSidebar } from "@/components/dashboard/sidebar"

// export default async function DashboardLayout({
//   children,
// }: {
//   children: React.ReactNode
// }) {
//   const supabase = await createClient()
//   const { data, error } = await supabase.auth.getUser()

//   if (error || !data?.user) {
//     redirect("/auth/login")
//   }

//   return (
//     <div className="min-h-screen bg-background flex">

//       {/* Desktop Sidebar */}
//       <aside className="hidden md:block w-64 border-r bg-background">
//         <DashboardSidebar />
//       </aside>

//       {/* Main Content */}
//       <main className="flex-1 w-full overflow-x-hidden">
//         <div className="p-4 md:p-8">
//           {children}
//         </div>
//       </main>

//     </div>
//   )
// }

import type React from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import DashboardShell from "@/components/dashboard/dashboard-shell"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data?.user) {
    redirect("/auth/login")
  }

  return <DashboardShell>{children}</DashboardShell>
}