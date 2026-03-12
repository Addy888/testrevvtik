// "use client"

// import Link from "next/link"
// import { usePathname, useRouter } from "next/navigation"
// import {
//   LayoutDashboard,
//   MessageSquare,
//   Mic,
//   Settings,
//   History,
//   LogOut,
//   Zap,
// } from "lucide-react"
// import { cn } from "@/lib/utils"
// import { createClient } from "@/lib/supabase/client"

// const navItems = [
//   { href: "/dashboard", icon: LayoutDashboard, label: "Overview" },
//   { href: "/dashboard/ai-agent", icon: MessageSquare, label: "AI Agent" },
//   { href: "/dashboard/voice", icon: Mic, label: "Voice Training" },
//   { href: "/dashboard/history", icon: History, label: "History" },
//   { href: "/dashboard/settings", icon: Settings, label: "Settings" },
// ]

// export function DashboardSidebar() {
//   const pathname = usePathname()
//   const router = useRouter()

//   const handleSignOut = async () => {
//     const supabase = createClient()
//     await supabase.auth.signOut()
//     router.push("/")
//   }

//   return (
//     <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-card">
//       <div className="flex h-full flex-col">
//         {/* Logo */}
//         <div className="flex h-16 items-center gap-2 border-b px-6">
//           <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/10">
//             <Zap className="h-5 w-5 text-primary" />
//           </div>
//           <span className="text-lg font-bold">RevvTik</span>
//         </div>

//         {/* Navigation */}
//         <nav className="flex-1 space-y-1 p-4">
//           {navItems.map((item) => {
//             const isActive = pathname === item.href
//             return (
//               <Link
//                 key={item.href}
//                 href={item.href}
//                 className={cn(
//                   "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
//                   isActive
//                     ? "bg-primary/10 text-primary"
//                     : "text-muted-foreground hover:bg-muted hover:text-foreground"
//                 )}
//               >
//                 <item.icon className="h-5 w-5" />
//                 {item.label}
//               </Link>
//             )
//           })}
//         </nav>

//         {/* Logout */}
//         <div className="border-t p-4">
//           <button
//             onClick={handleSignOut}
//             className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
//           >
//             <LogOut className="h-5 w-5" />
//             Sign Out
//           </button>
//         </div>
//       </div>
//     </aside>
//   )
// }



// "use client"

// import Link from "next/link"
// import { usePathname, useRouter } from "next/navigation"
// import {
//   LayoutDashboard,
//   MessageSquare,
//   Mic,
//   Settings,
//   History,
//   LogOut,
//   Zap,
// } from "lucide-react"
// import { cn } from "@/lib/utils"
// import { createClient } from "@/lib/supabase/client"

// const navItems = [
//   { href: "/dashboard", icon: LayoutDashboard, label: "Overview" },
//   { href: "/dashboard/ai-agent", icon: MessageSquare, label: "AI Agent" },
//   { href: "/dashboard/voice", icon: Mic, label: "Voice Training" },
//   { href: "/dashboard/history", icon: History, label: "History" },
//   { href: "/dashboard/settings", icon: Settings, label: "Settings" },
// ]

// export function DashboardSidebar() {
//   const pathname = usePathname()
//   const router = useRouter()

//   const handleSignOut = async () => {
//     const supabase = createClient()
//     await supabase.auth.signOut()
//     router.push("/")
//   }

//   return (
//     <aside className="h-screen w-64 border-r border-border bg-card">
//       <div className="flex h-full flex-col">

//         {/* Logo */}
//         <div className="flex h-16 items-center gap-2 border-b px-6">
//           <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/10">
//             <Zap className="h-5 w-5 text-primary" />
//           </div>
//           <span className="RivvTik.jpeg">RevvTik</span>
//         </div>

//         {/* Navigation */}
//         <nav className="flex-1 space-y-1 p-4">
//           {navItems.map((item) => {
//             const isActive = pathname === item.href

//             return (
//               <Link
//                 key={item.href}
//                 href={item.href}
//                 className={cn(
//                   "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
//                   isActive
//                     ? "bg-primary/10 text-primary"
//                     : "text-muted-foreground hover:bg-muted hover:text-foreground"
//                 )}
//               >
//                 <item.icon className="h-5 w-5" />
//                 {item.label}
//               </Link>
//             )
//           })}
//         </nav>

//         {/* Logout */}
//         <div className="border-t p-4">
//           <button
//             onClick={handleSignOut}
//             className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
//           >
//             <LogOut className="h-5 w-5" />
//             Sign Out
//           </button>
//         </div>

//       </div>
//     </aside>
//   )
// }


// "use client"

// import Link from "next/link"
// import { usePathname, useRouter } from "next/navigation"
// import {
//   LayoutDashboard,
//   MessageSquare,
//   Mic,
//   Settings,
//   History,
//   LogOut,
//   Zap,
// } from "lucide-react"
// import { cn } from "@/lib/utils"
// import { createClient } from "@/lib/supabase/client"

// const navItems = [
//   { href: "/dashboard", icon: LayoutDashboard, label: "Overview" },
//   { href: "/dashboard/ai-agent", icon: MessageSquare, label: "AI Agent" },
//   { href: "/dashboard/voice", icon: Mic, label: "Voice Training" },
//   { href: "/dashboard/history", icon: History, label: "History" },
//   { href: "/dashboard/settings", icon: Settings, label: "Settings" },
// ]

// export function DashboardSidebar() {
//   const pathname = usePathname()
//   const router = useRouter()

//   const handleSignOut = async () => {
//     const supabase = createClient()
//     await supabase.auth.signOut()
//     router.push("/")
//   }

//   return (
//     <aside className="h-screen w-64 border-r border-border bg-card">
//       <div className="flex h-full flex-col">

//         {/* Logo */}
//         <div className="flex h-16 items-center gap-2 border-b px-6">
//           <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/10">
//             <img
//               src="/RivvTik.jpeg"
//               alt="RevvTik Logo"
//               className="h-5 w-5 object-contain"
//             />
//           </div>
//           <span className="text-lg font-bold">RevvTik</span>
//         </div>

//         {/* Navigation */}
//         <nav className="flex-1 space-y-1 p-4">
//           {navItems.map((item) => {
//             const isActive = pathname === item.href

//             return (
//               <Link
//                 key={item.href}
//                 href={item.href}
//                 className={cn(
//                   "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
//                   isActive
//                     ? "bg-primary/10 text-primary"
//                     : "text-muted-foreground hover:bg-muted hover:text-foreground"
//                 )}
//               >
//                 <item.icon className="h-5 w-5" />
//                 {item.label}
//               </Link>
//             )
//           })}
//         </nav>

//         {/* Logout */}
//         <div className="border-t p-4">
//           <button
//             onClick={handleSignOut}
//             className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
//           >
//             <LogOut className="h-5 w-5" />
//             Sign Out
//           </button>
//         </div>

//       </div>
//     </aside>
//   )
// }


"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  MessageSquare,
  Mic,
  Settings,
  History,
  LogOut,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Overview" },
  { href: "/dashboard/ai-agent", icon: MessageSquare, label: "AI Agent" },
  { href: "/dashboard/voice", icon: Mic, label: "Voice Training" },
  { href: "/dashboard/history", icon: History, label: "History" },

  // ✅ NEW ADDED
  { href: "/dashboard/integrations", icon: Zap, label: "Integrations" },

  { href: "/dashboard/settings", icon: Settings, label: "Settings" },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  return (
    <aside className="h-screen w-64 border-r border-border bg-card">
      <div className="flex h-full flex-col">

        {/* Logo */}
        <div className="flex h-16 items-center gap-2 border-b px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/10">
            <img
              src="/RivvTik.jpeg"
              alt="RevvTik Logo"
              className="h-5 w-5 object-contain"
            />
          </div>
          <span className="text-lg font-bold">RevvTik</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="border-t p-4">
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>

      </div>
    </aside>
  )
}