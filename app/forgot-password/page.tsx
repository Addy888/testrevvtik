"use client"

import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const supabase = createClient()

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setMessage(null)

    try {
      const emailTrimmed = email.trim().toLowerCase()
      if (!emailTrimmed) throw new Error("Please enter your email")

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(emailTrimmed, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (resetError) throw resetError

      setMessage("If an account exists, you’ll receive a reset link shortly.")
    } catch (err: any) {
      setError(err?.message || "Failed to send reset link")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm">
        <Card className="border-border/50 bg-card">
          <CardHeader>
            <CardTitle className="text-2xl">Forgot password</CardTitle>
            <CardDescription>Enter your email and we’ll send a reset link.</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <form onSubmit={handleSend} className="flex flex-col gap-4">
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

              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              {message ? <p className="text-sm text-emerald-600">{message}</p> : null}

              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>

            <div className="text-center text-sm text-muted-foreground">
              Remember password?{" "}
              <Link href="/auth/login" className="text-primary underline underline-offset-4 hover:text-primary/80">
                Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

