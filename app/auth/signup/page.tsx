// "use client"

// import type React from "react"
// import { useState } from "react"
// import { useRouter } from "next/navigation"
// import Link from "next/link"
// import { Zap } from "lucide-react"

// import { createClient } from "@/lib/supabase/client"
// import { Button } from "@/components/ui/button"
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"

// export default function SignUpPage() {
//   const [fullName, setFullName] = useState("")
//   const [email, setEmail] = useState("")
//   const [password, setPassword] = useState("")
//   const [confirmPassword, setConfirmPassword] = useState("")
//   const [error, setError] = useState<string | null>(null)
//   const [isLoading, setIsLoading] = useState(false)

//   const router = useRouter()

//   const handleSignUp = async (e: React.FormEvent) => {
//     e.preventDefault()
//     setIsLoading(true)
//     setError(null)

//     if (password !== confirmPassword) {
//       setError("Passwords do not match")
//       setIsLoading(false)
//       return
//     }

//     if (password.length < 6) {
//       setError("Password must be at least 6 characters")
//       setIsLoading(false)
//       return
//     }

//     const supabase = createClient()

//     try {
//       const { error } = await supabase.auth.signUp({
//         email,
//         password,
//         options: {
//           data: {
//             full_name: fullName,
//           },
//         },
//       })

//       if (error) throw error

//       // success
//       router.push("/auth/signup-success")
//     } catch (err: unknown) {
//       setError(err instanceof Error ? err.message : "Signup failed")
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   return (
//     <div className="flex min-h-screen w-full items-center justify-center bg-background p-6">
//       <div className="w-full max-w-sm">
//         <div className="mb-8 text-center">
//           <Link href="/" className="inline-flex items-center gap-2">
//             <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
//               <Zap className="h-6 w-6 text-primary" />
//             </div>
//             <span className="text-2xl font-bold">RevvTik</span>
//           </Link>
//         </div>

//         <Card>
//           <CardHeader>
//             <CardTitle className="text-2xl">Create an account</CardTitle>
//             <CardDescription>
//               Start your AI sales training journey today
//             </CardDescription>
//           </CardHeader>

//           <CardContent>
//             <form onSubmit={handleSignUp} className="flex flex-col gap-4">
//               <div className="space-y-2">
//                 <Label htmlFor="fullName">Full Name</Label>
//                 <Input
//                   id="fullName"
//                   type="text"
//                   required
//                   value={fullName}
//                   onChange={(e) => setFullName(e.target.value)}
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="email">Email</Label>
//                 <Input
//                   id="email"
//                   type="email"
//                   required
//                   value={email}
//                   onChange={(e) => setEmail(e.target.value)}
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="password">Password</Label>
//                 <Input
//                   id="password"
//                   type="password"
//                   required
//                   value={password}
//                   onChange={(e) => setPassword(e.target.value)}
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="confirmPassword">Confirm Password</Label>
//                 <Input
//                   id="confirmPassword"
//                   type="password"
//                   required
//                   value={confirmPassword}
//                   onChange={(e) => setConfirmPassword(e.target.value)}
//                 />
//               </div>

//               {error && (
//                 <p className="text-sm text-red-500 text-center">
//                   {error}
//                 </p>
//               )}

//               <Button type="submit" disabled={isLoading}>
//                 {isLoading ? "Creating account..." : "Sign Up"}
//               </Button>

//               <p className="text-center text-sm text-muted-foreground">
//                 Already have an account?{" "}
//                 <Link href="/auth/login" className="text-primary underline">
//                   Sign in
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
import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"   // ✅ ADDED
import { Zap, Eye, EyeOff } from "lucide-react"
import { useRouter } from "next/navigation"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Mode = "individual" | "team"
const MODE_KEY = "mode"

export default function SignUpPage() {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [mode, setMode] = useState<Mode>("individual")
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setMessage(null)

    try {
      try {
        localStorage.setItem(MODE_KEY, mode)
      } catch {
        // ignore
      }

      const emailTrimmed = email.trim().toLowerCase()

      if (password.length < 6) {
        setError("Password must be at least 6 characters")
        return
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match")
        return
      }

      const supabase = createClient()
      const { error: signUpError } = await supabase.auth.signUp({
        email: emailTrimmed,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: fullName.trim() || undefined,
          },
        },
      })

      if (signUpError) throw signUpError

      setMessage("Account created. Redirecting to onboarding...")
      router.replace("/onboarding")
    } catch (err: any) {
      setError(err?.message || "Signup failed")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    try {
      const saved = localStorage.getItem(MODE_KEY)
      if (saved === "individual" || saved === "team") setMode(saved)
    } catch {
      // ignore
    }
  }, [])

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            
            {/* ✅ NEW LOGO ADDED */}
            <Image
              src="\Revvtik pic.jpeg"
              alt="RevvTik"
              width={40}
              height={40}
              className="rounded-lg"
            />

            <span className="text-2xl font-bold">RevvTik</span>
          </Link>
        </div>

        <Card className="shadow-sm rounded-xl">
          <CardHeader>
            <CardTitle className="text-2xl">Create an account</CardTitle>
            <CardDescription>
              Choose your setup, then create your account
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <Button
                type="button"
                variant={mode === "individual" ? "default" : "outline"}
                onClick={() => {
                  setMode("individual")
                  try {
                    localStorage.setItem(MODE_KEY, "individual")
                  } catch {
                    // ignore
                  }
                }}
                disabled={isLoading}
              >
                Continue as Individual
              </Button>
              <Button
                type="button"
                variant={mode === "team" ? "default" : "outline"}
                onClick={() => {
                  setMode("team")
                  try {
                    localStorage.setItem(MODE_KEY, "team")
                  } catch {
                    // ignore
                  }
                }}
                disabled={isLoading}
              >
                Continue as Team
              </Button>
            </div>

            <form onSubmit={handleSignUp} className="flex flex-col gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name (optional)</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  placeholder="Your name"
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    placeholder="Minimum 6 characters"
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  placeholder="Re-enter your password"
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              {error && (
                <p className="text-sm text-red-500 text-center">
                  {error}
                </p>
              )}
              {message && (
                <p className="text-sm text-emerald-600 text-center">{message}</p>
              )}

              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creating account..." : "Sign Up"}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/auth/login" className="text-primary underline">
                  Sign in
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}