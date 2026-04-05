"use client"

import React, { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { ConnectCalendar } from "@/components/integrations/connect-calendar"
import { ConnectCRM } from "@/components/integrations/connect-crm"
import { ConnectEmail } from "@/components/integrations/connect-email"
import { ConnectSlack } from "@/components/integrations/connect-slack"
import { ConnectLinkedin } from "@/components/integrations/connect-linkedin"
import { useAppUser } from "@/hooks/useAppUser"
import { createBrowserClient } from "@/lib/supabase"

export default function IntegrationsPage() {
  const { appUser, loading } = useAppUser()
  const searchParams = useSearchParams()
  const successBadge = searchParams.get("success") === "true"
  
  const [hasZoom, setHasZoom] = useState<boolean>(false)
  const [checking, setChecking] = useState<boolean>(true)

  useEffect(() => {
    if (!appUser) return

    const checkIntegration = async () => {
      // Guard: company_id must exist before querying
      if (!appUser.company_id) {
        console.warn("No company_id on appUser — skipping Zoom check")
        setChecking(false)
        return
      }

      const supabase = createBrowserClient()
      const { data, error } = await supabase
        .from("integrations")
        .select("id")
        .eq("company_id", appUser.company_id)
        .eq("provider", "zoom")
        .limit(1)
        .maybeSingle()
      
      if (error) console.error("Zoom integration check error:", error)

      setHasZoom(!!data)
      setChecking(false)
    }

    checkIntegration()
  }, [appUser])

  const handleConnectZoom = () => {
    console.log("Zoom connect clicked");
    window.location.href = "/api/integrations/zoom/connect"
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">External Integrations</h1>
        <p className="text-muted-foreground">Connect third-party apps to auto-import and process your data.</p>
      </div>

      {successBadge && (
        <div className="p-4 bg-green-50 text-green-800 border border-green-200 rounded-md text-sm">
          Zoom integration successfully connected! Recordings will now flow automatically.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* --- ZOOM INTEGRATION --- */}
        <div className="border rounded-xl p-6 space-y-4 bg-card shadow-sm flex flex-col">
          <div>
            <h2 className="font-semibold text-lg flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4.585 13.607l-.27-.012H1.886l3.236-3.237-.013-.27a.815.815 0 01.796-.86h3.473l.014.286A5.814 5.814 0 0013.606 4.585l.012-.27V1.886l3.237 3.236.27-.013a.815.815 0 01.86.796v3.473l-.286.014a5.814 5.814 0 00-4.929 4.929l.27.012v2.428l-3.236-3.237-.27.013a.815.815 0 01-.796.86H5.265l-.014-.286a5.814 5.814 0 00-4.929-4.929z" opacity={0.6}/>
                <path d="M14.4 7.371A7.034 7.034 0 017.371 14.4a7.034 7.034 0 017.029-7.029z" />
              </svg>
              Zoom Integration
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              Connect Zoom to auto-import and transcribe meetings.
            </p>
          </div>

          <div className="pt-2 mt-auto">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium">Status:</span>
              {checking ? (
                <span className="text-sm text-gray-400">Checking...</span>
              ) : hasZoom ? (
                <span className="text-sm font-semibold text-green-600 bg-green-50 px-2 py-1 rounded">Connected ✅</span>
              ) : (
                <span className="text-sm text-gray-500">Not connected</span>
              )}
            </div>

            <button 
              onClick={handleConnectZoom}
              className={`w-full py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                hasZoom 
                  ? "bg-gray-100 text-gray-700 hover:bg-gray-200" 
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {hasZoom ? "Settings" : "Connect Zoom"}
            </button>
          </div>
        </div>
        {/* ------------------------ */}

        <div className="border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">Google Calendar</h2>
          <ConnectCalendar />
        </div>

        <div className="border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">CRM</h2>
          <ConnectCRM />
        </div>

        <div className="border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">Email</h2>
          <ConnectEmail />
        </div>

        <div className="border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">Slack</h2>
          <ConnectSlack />
        </div>

        <div className="border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">LinkedIn</h2>
          <ConnectLinkedin />
        </div>

      </div>
    </div>
  )
}