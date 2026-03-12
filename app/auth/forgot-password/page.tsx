// "use client"

// import { useState } from "react"
// import Link from "next/link"
// import { createClient } from "@/lib/supabase/client"
// import { useRouter } from "next/navigation"

// import { Button } from "@/components/ui/button"
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"

// export default function ForgotPasswordPage() {
//   const [email, setEmail] = useState("")
//   const [isLoading, setIsLoading] = useState(false)
//   const [message, setMessage] = useState<string | null>(null)
//   const [error, setError] = useState<string | null>(null)

//   const supabase = createClient()
//   const router = useRouter()

//   const handleReset = async (e: React.FormEvent) => {
//     e.preventDefault()
//     setIsLoading(true)
//     setError(null)
//     setMessage(null)

//     const { error } = await supabase.auth.resetPasswordForEmail(email, {
//       redirectTo: `${location.origin}/auth/callback`,
//     })

//     if (error) {
//       setError(error.message)
//     } else {
//       setMessage("Reset link sent to your email")
//     }

//     setIsLoading(false)
//   }

//   return (
//     <div className="flex min-h-screen w-full items-center justify-center bg-background p-6">
//       <div className="w-full max-w-sm">

//         {/* LOGO */}
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

//         {/* CARD */}
//         <Card>
//           <CardHeader>
//             <CardTitle className="text-2xl">Forgot Password</CardTitle>
//             <CardDescription>
//               Enter your email to receive reset link
//             </CardDescription>
//           </CardHeader>

//           <CardContent>
//             <form onSubmit={handleReset} className="flex flex-col gap-4">

//               <div className="space-y-2">
//                 <Label>Email</Label>
//                 <Input
//                   type="email"
//                   required
//                   value={email}
//                   onChange={(e) => setEmail(e.target.value)}
//                 />
//               </div>

//               {error && (
//                 <p className="text-sm text-red-500 text-center">
//                   {error}
//                 </p>
//               )}

//               {message && (
//                 <p className="text-sm text-green-500 text-center">
//                   {message}
//                 </p>
//               )}

//               <Button type="submit" disabled={isLoading}>
//                 {isLoading ? "Sending..." : "Send Reset Link"}
//               </Button>

//               <p className="text-center text-sm text-muted-foreground">
//                 Remember password?{" "}
//                 <Link href="/auth/login" className="text-primary underline">
//                   Login
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

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const supabase = createClient()
  const router = useRouter()

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.updateUser({
      password,
    })

    if (error) {
      setMessage(error.message)
    } else {
      setMessage("Password updated successfully")
      setTimeout(() => router.push("/auth/login"), 1500)
    }

    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm">

        <Card>
          <CardHeader>
            <CardTitle>Reset Password</CardTitle>
            <CardDescription>
              Enter your new password
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleReset} className="flex flex-col gap-4">

              <div className="space-y-2">
                <Label>New Password</Label>

                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                  </button>

                </div>
              </div>

              {message && (
                <p className="text-center text-sm">
                  {message}
                </p>
              )}

              <Button disabled={loading}>
                {loading ? "Updating..." : "Update Password"}
              </Button>

              <Link
                href="/auth/login"
                className="text-center text-sm underline"
              >
                Back to login
              </Link>

            </form>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}