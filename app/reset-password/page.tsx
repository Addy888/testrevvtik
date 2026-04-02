"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function getTokensFromUrl() {
  const paramsFromQuery = new URLSearchParams(window.location.search)
  const accessFromQuery = paramsFromQuery.get("access_token")
  const refreshFromQuery = paramsFromQuery.get("refresh_token")

  const hash = window.location.hash?.startsWith("#") ? window.location.hash.slice(1) : ""
  const paramsFromHash = new URLSearchParams(hash)
  const accessFromHash = paramsFromHash.get("access_token")
  const refreshFromHash = paramsFromHash.get("refresh_token")

  return {
    access_token: accessFromQuery || accessFromHash,
    refresh_token: refreshFromQuery || refreshFromHash,
  }
}

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = createClient()

  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const [sessionReady, setSessionReady] = useState(false)
  const [sessionLoading, setSessionLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const run = async () => {
      setSessionLoading(true)
      setError(null)
      setMessage(null)

      try {
        const { access_token, refresh_token } = getTokensFromUrl()
        if (!access_token || !refresh_token) {
          setSessionReady(false)
          return
        }

        const { error: sessionError } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        })

        if (sessionError) throw sessionError
        setSessionReady(true)
      } catch (err: any) {
        setSessionReady(false)
        setError(err?.message || "Reset session failed")
      } finally {
        setSessionLoading(false)
      }
    }

    run()
  }, [])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (!sessionReady) {
      setError("Reset token is missing or expired. Please request a new reset link.")
      return
    }

    setIsSubmitting(true)
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (updateError) throw updateError

      setMessage("Password updated successfully. Redirecting to login...")
      setTimeout(() => router.replace("/auth/login"), 1500)
    } catch (err: any) {
      setError(err?.message || "Failed to update password")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 bg-background">
      <div className="w-full max-w-sm">
        <Card className="border-border/50 bg-card">
          <CardHeader>
            <CardTitle className="text-2xl">Reset password</CardTitle>
            <CardDescription>Choose a new password for your account.</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {sessionLoading ? (
              <div className="text-sm text-muted-foreground">Preparing reset session...</div>
            ) : sessionReady ? null : (
              <div className="text-sm text-destructive">
                Reset token not found. Use the reset link from your email.
              </div>
            )}

            <form onSubmit={handleUpdate} className="flex flex-col gap-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
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
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              {error ? <p className="text-sm text-destructive text-center">{error}</p> : null}
              {message ? <p className="text-sm text-emerald-600 text-center">{message}</p> : null}

              <Button type="submit" disabled={isSubmitting || !sessionReady}>
                {isSubmitting ? "Updating..." : "Update Password"}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                Back to{" "}
                <Link href="/auth/login" className="text-primary underline">
                  login
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

