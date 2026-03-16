// "use client"

// import type React from "react"

// import { createClient } from "@/lib/supabase/client"
// import { Button } from "@/components/ui/button"
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import Link from "next/link"
// import { useRouter } from "next/navigation"
// import { useState } from "react"
// import { Zap } from "lucide-react"

// export default function LoginPage() {
//   const [email, setEmail] = useState("")
//   const [password, setPassword] = useState("")
//   const [error, setError] = useState<string | null>(null)
//   const [isLoading, setIsLoading] = useState(false)
//   const router = useRouter()

//   const handleLogin = async (e: React.FormEvent) => {
//     e.preventDefault()
//     const supabase = createClient()
//     setIsLoading(true)
//     setError(null)

//     try {
//       const { error } = await supabase.auth.signInWithPassword({
//         email,
//         password,
//       })
//       if (error) throw error
//       router.push("/dashboard")
//     } catch (error: unknown) {
//       setError(error instanceof Error ? error.message : "An error occurred")
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   return (
//     <div className="flex min-h-screen w-full items-center justify-center bg-background p-6">
//       <div className="w-full max-w-sm">
//         <div className="mb-8 text-center">
//           <Link href="/" className="inline-flex items-center gap-2">
//             <img
//               src="/RivvTik.jpeg"
//               alt="RevvTik Logo"
//               className="h-8 w-8 object-contain"
//             />
//             <span className="text-xl font-bold">RevvTik</span>
//           </Link>
//         </div>
//         <Card className="border-border/50 bg-card">
//           <CardHeader>
//             <CardTitle className="text-2xl">Welcome back</CardTitle>
//             <CardDescription>Enter your credentials to access your account</CardDescription>
//           </CardHeader>
//           <CardContent>
//             <form onSubmit={handleLogin}>
//               <div className="flex flex-col gap-4">
//                 <div className="space-y-2">
//                   <Label htmlFor="email">Email</Label>
//                   <Input
//                     id="email"
//                     type="email"
//                     placeholder="you@example.com"
//                     required
//                     value={email}
//                     onChange={(e) => setEmail(e.target.value)}
//                   />
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="password">Password</Label>
//                   <Input
//                     id="password"
//                     type="password"
//                     required
//                     value={password}
//                     onChange={(e) => setPassword(e.target.value)}
//                   />
//                 </div>
//                 {error && <p className="text-sm text-destructive">{error}</p>}
//                 <Button type="submit" className="w-full glow-cyan-sm" disabled={isLoading}>
//                   {isLoading ? "Signing in..." : "Sign In"}
//                 </Button>
//               </div>
//               <p className="mt-4 text-center text-sm text-muted-foreground">
//                 Don&apos;t have an account?{" "}
//                 <Link href="/auth/signup" className="text-primary underline underline-offset-4 hover:text-primary/80">
//                   Sign up
//                 </Link>
//               </p>
//             </form>
//           </CardContent>
//         </Card>
//       </div>
//     </div>
//   )
// }




"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Eye, EyeOff } from "lucide-react"   // ✅ ADDED

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)   // ✅ ADDED
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser()
      if (data.user) {
        router.replace("/dashboard")
      }
    }
    checkUser()
  }, [router, supabase])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      router.push("/dashboard")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <img
              src="/Revvtik pic.jpeg"
              alt="RevvTik Logo"
              className="h-8 w-8 object-contain"
            />
            <span className="text-xl font-bold">RevvTik</span>
          </Link>
        </div>

        <Card className="border-border/50 bg-card">
          <CardHeader>
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleLogin}>
              <div className="flex flex-col gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                {/* ✅ PASSWORD FIELD UPDATED */}
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>

                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-destructive">
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  className="w-full glow-cyan-sm"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </div>

              <p className="mt-4 text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link
                  href="/auth/signup"
                  className="text-primary underline underline-offset-4 hover:text-primary/80"
                >
                  Sign up
                </Link>
              </p>

              <p className="mt-2 text-center text-sm">
                <Link
                  href="/auth/forgot-password"
                  className="text-primary underline underline-offset-4"
                >
                  Forgot password?
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}