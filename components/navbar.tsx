// "use client"

// import Link from "next/link"
// import { usePathname } from "next/navigation"
// import { Button } from "@/components/ui/button"
// import { Menu, X, Zap } from "lucide-react"
// import { useState } from "react"

// const navLinks = [
//   { href: "/", label: "Home" },
//   { href: "/about", label: "About" },
//   { href: "/dashboard/ai-agent", label: "AI Agent" },
//   { href: "/contact", label: "Contact" },
// ]

// export function Navbar() {
//   const pathname = usePathname()
//   const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

//   return (
//     <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
//       <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 lg:px-8">
//         <Link href="/" className="flex items-center gap-2">
//           <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 glow-cyan-sm">
//             <Zap className="h-5 w-5 text-primary" />
//           </div>
//           <span className="text-xl font-bold tracking-tight">RevvTik</span>
//         </Link>

//         {/* Desktop Navigation */}
//         <div className="hidden items-center gap-8 md:flex">
//           {navLinks.map((link) => (
//             <Link
//               key={link.href}
//               href={link.href}
//               className={`text-sm font-medium transition-colors hover:text-primary ${
//                 pathname === link.href ? "text-primary" : "text-muted-foreground"
//               }`}
//             >
//               {link.label}
//             </Link>
//           ))}
//         </div>

//         <div className="hidden items-center gap-3 md:flex">
//           <Button variant="ghost" asChild>
//             <Link href="/auth/login">Login</Link>
//           </Button>
//           <Button asChild className="glow-cyan-sm">
//             <Link href="/auth/signup">Try Free</Link>
//           </Button>
//         </div>

//         {/* Mobile Menu Button */}
//         <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle menu">
//           {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
//         </button>
//       </nav>

//       {/* Mobile Navigation */}
//       {mobileMenuOpen && (
//         <div className="border-t border-border/50 bg-background md:hidden">
//           <div className="flex flex-col gap-4 px-4 py-6">
//             {navLinks.map((link) => (
//               <Link
//                 key={link.href}
//                 href={link.href}
//                 className={`text-sm font-medium transition-colors hover:text-primary ${
//                   pathname === link.href ? "text-primary" : "text-muted-foreground"
//                 }`}
//                 onClick={() => setMobileMenuOpen(false)}
//               >
//                 {link.label}
//               </Link>
//             ))}
//             <div className="flex flex-col gap-2 pt-4">
//               <Button variant="ghost" asChild>
//                 <Link href="/auth/login">Login</Link>
//               </Button>
//               <Button asChild className="glow-cyan-sm">
//                 <Link href="/auth/signup">Try Free</Link>
//               </Button>
//             </div>
//           </div>
//         </div>
//       )}
//     </header>
//   )
// }


"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Menu, X, Zap } from "lucide-react"
import { useState } from "react"

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/dashboard/ai-agent", label: "AI Agent" },
  { href: "/contact", label: "Contact" },
]

export function Navbar() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 glow-cyan-sm">
            <img
              src="Revvtik pic.jpeg"
              alt="RevvTik Logo"
              className="h-5 w-5 object-contain"
            />
          </div>
          <span className="text-xl font-bold tracking-tight">RevvTik</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname === link.href ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Button variant="ghost" asChild>
            <Link href="/auth/login">Login</Link>
          </Button>
          <Button asChild className="glow-cyan-sm">
            <Link href="/auth/signup">Try Free</Link>
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle menu">
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="border-t border-border/50 bg-background md:hidden">
          <div className="flex flex-col gap-4 px-4 py-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  pathname === link.href ? "text-primary" : "text-muted-foreground"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="flex flex-col gap-2 pt-4">
              <Button variant="ghost" asChild>
                <Link href="/auth/login">Login</Link>
              </Button>
              <Button asChild className="glow-cyan-sm">
                <Link href="/auth/signup">Try Free</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}