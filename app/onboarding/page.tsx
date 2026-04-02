"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAppUser } from "@/hooks/useAppUser"

type SetupMode = "individual" | "team"
const MODE_KEY = "mode"

export default function OnboardingPage() {
  const router = useRouter()
  const { appUser, loading: appUserLoading, error: appUserError } = useAppUser()
  const [loadingMode, setLoadingMode] = useState<SetupMode | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedMode, setSelectedMode] = useState<SetupMode | null>(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(MODE_KEY)
      if (saved === "individual" || saved === "team") setSelectedMode(saved)
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    if (appUserLoading) return
    if (appUserError && String(appUserError).toLowerCase().includes("unauthorized")) {
      router.replace("/auth/login")
      return
    }
    if (!appUser) return

    const role = String(appUser.role).toLowerCase()
    const companyType = String(appUser.company_type ?? "").toLowerCase()

    if (role === "manager") {
      router.replace(companyType === "personal" ? "/dashboard/personal" : "/dashboard/manager")
      return
    }
    if (role === "salesperson") {
      router.replace("/dashboard/personal")
      return
    }
    if (role === "admin") {
      router.replace(companyType === "personal" ? "/dashboard/personal" : "/dashboard/company")
      return
    }

    router.replace("/dashboard")
  }, [appUser, appUserLoading, router])

  const handleSelect = async (mode: SetupMode) => {
    setSelectedMode(mode)
    setLoadingMode(mode)
    setError(null)
    try {
      try {
        localStorage.setItem(MODE_KEY, mode)
      } catch {
        // ignore
      }

      const res = await fetch("/api/onboarding/setup", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: mode }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Onboarding failed")
      router.replace(data?.redirectTo || "/dashboard")
    } catch (e: any) {
      setError(e?.message || "Onboarding failed")
    } finally {
      setLoadingMode(null)
    }
  }

  // If user already picked Individual/Team on the auth page, auto-run onboarding setup.
  // This keeps the flow one-step: no need to re-select on /onboarding.
  useEffect(() => {
    if (appUserLoading) return
    if (appUser) return
    if (!selectedMode) return
    if (loadingMode !== null) return

    const err = String(appUserError ?? "").toLowerCase()
    if (err.includes("unauthorized")) return

    // Most common case: authenticated user exists, but their `users` row isn't created yet.
    handleSelect(selectedMode)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appUser, appUserLoading, appUserError, selectedMode, loadingMode])

  if (appUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <Card className="w-full max-w-xl border-border/50 bg-card">
        <CardHeader>
          <CardTitle>Welcome to RevvTik Sales Coach</CardTitle>
          <CardDescription>
            How are you using RevvTik?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Button
              onClick={() => handleSelect("individual")}
              disabled={loadingMode !== null}
              variant={selectedMode === "individual" ? "default" : "outline"}
            >
              {loadingMode === "individual" ? "Setting up..." : "Individual"}
            </Button>
            <Button
              variant="outline"
              onClick={() => handleSelect("team")}
              disabled={loadingMode !== null}
            >
              {loadingMode === "team" ? "Setting up..." : "Team / Company"}
            </Button>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </CardContent>
      </Card>
    </div>
  )
}

