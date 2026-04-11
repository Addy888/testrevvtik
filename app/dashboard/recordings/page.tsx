"use client"

import * as React from "react"
import Link from "next/link"
import { createBrowserClient } from "@/lib/supabase"
import { useAppUser } from "@/hooks/useAppUser"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Bot, FileAudio, Mic, Trophy, Sparkles } from "lucide-react"

const supabase = createBrowserClient()

export default function RecordingsPage() {
  const { appUser, loading, error } = useAppUser()

  const [fileUrl, setFileUrl] = React.useState("")
  const [fileInput, setFileInput] = React.useState<File | null>(null)
  const [busyAction, setBusyAction] = React.useState<string | null>(null)
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)

  const [recordings, setRecordings] = React.useState<any[]>([])
  const [transcripts, setTranscripts] = React.useState<any[]>([])
  const [analyses, setAnalyses] = React.useState<any[]>([])
  const [scores, setScores] = React.useState<any[]>([])
  const [refreshTick, setRefreshTick] = React.useState(0)

  const role = appUser?.role ?? null

  const applyRoleEq = React.useCallback(
    (query: any) => {
      if (!appUser) return query
      return appUser.role === "EMPLOYEE" ? query.eq("user_id", appUser.id) : query
    },
    [appUser]
  )

  const load = React.useCallback(async () => {
    if (!appUser) return

    try {
      const params = new URLSearchParams()
      if (appUser.company_id) params.append("companyId", appUser.company_id)
      if (appUser.id) params.append("userId", appUser.id)
      if (appUser.role) params.append("role", appUser.role)
      params.append("ts", Date.now().toString())

      const res = await fetch(`/api/recordings?${params.toString()}`)
      
      if (!res.ok) {
        throw new Error("Failed to fetch recordings")
      }

      const data = await res.json()
      console.log("FETCHED DATA:", data)

      setRecordings([...(data.recordings || [])])
      setTranscripts([...(data.transcripts || [])])
      setAnalyses([...(data.analyses || [])])
      setScores([...(data.scores || [])])
      
      console.log("FRONTEND RECORDINGS:", data.recordings || [])

    } catch (err: any) {
      console.error("LOAD ERROR:", err)
      setErrorMsg(err?.message || "Data failed to load safely.")
    }
  }, [appUser, refreshTick])

  React.useEffect(() => {
    if (!appUser || loading) return
    setErrorMsg(null)
    load().catch((e) => setErrorMsg(e instanceof Error ? e.message : "Failed to load recordings"))
  }, [appUser, loading, load])

  // 🔥 Auto-refresh UI (Polling) — stops when nothing is actively processing
  React.useEffect(() => {
    if (!appUser || loading) return

    const hasActiveJobs = recordings.some(
      (r) => r.status === "processing" || r.status === "pending" || !r.status
    )

    if (recordings.length > 0 && !hasActiveJobs) {
      return // All done — no need to poll
    }

    const interval = setInterval(() => {
      load()
    }, 3000)

    return () => clearInterval(interval)
  }, [appUser, loading, load, recordings])

  const analysesByRecording = React.useMemo(() => {
    const map = new Map<string, any>()
    for (const t of transcripts) {
      const analysisForTranscript = analyses.find((a) => String(a.transcript_id) === String(t.id))
      if (analysisForTranscript) {
        map.set(String(t.recording_id), analysisForTranscript)
      }
    }
    return map
  }, [analyses, transcripts])

  const scoreByAnalysis = React.useMemo(() => {
    const map = new Map<string, any>()
    for (const s of scores) map.set(String(s.analysis_id), s)
    return map
  }, [scores])

  const scoreValue = (s: any) =>
    typeof s?.average_score === "number"
      ? s.average_score
      : typeof s?.score === "number"
        ? s.score
        : typeof s?.average === "number"
          ? s.average
          : null

  const downloadTextFile = (text: string) => {
    if (!text) return
    const blob = new Blob([text], { type: "text/plain" })
    const url = window.URL.createObjectURL(blob)

    const a = document.createElement("a")
    a.href = url
    a.download = "transcription.txt"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    
    window.URL.revokeObjectURL(url)
  }

  const handleUpload = async () => {
    if (!appUser) return
    setErrorMsg(null)

    setBusyAction("upload")
    
    // Stop infinite loading: timeout fallback
    const timeoutFallback = setTimeout(() => {
      setBusyAction(null)
      setErrorMsg("Transcription timed out (10s)")
    }, 10000)

    try {
      if (!fileInput) {
        clearTimeout(timeoutFallback)
        setErrorMsg("Choose a file to upload")
        return
      }

      const fd = new FormData()
      fd.append("file", fileInput)

      const res = await fetch("/api/upload", {
        method: "POST",
        body: fd,
      })

      clearTimeout(timeoutFallback)
      const data = await res.json()
      
      // Add error handling constraint
      if (!res.ok || !data.success) {
        setBusyAction(null)
        setErrorMsg("Transcription failed")
        throw new Error(data?.error || "Upload failed")
      }

      setFileUrl("")
      setFileInput(null)
      
      // After API call:
      setRecordings((prev) => {
        const newRec = {
          id: data.recordingId,
          file_url: data.file_url,
          transcript: data.transcript || null,
          created_at: new Date().toISOString()
        }
        if (prev.some(p => p.id === newRec.id)) return prev
        return [newRec, ...prev]
      })
      setBusyAction(null) // Equivalent to setLoading(false)

      setRefreshTick((t) => t + 1)

      // 🔥 Force refresh after upload allows backend buffer time
      setTimeout(() => {
        load()
      }, 2000)
    } catch (e: any) {
      clearTimeout(timeoutFallback)
      setBusyAction(null)
      setErrorMsg(e?.message || "Upload failed")
    }
  }

  if (loading) return <div>Loading...</div>
  if (error) return <div>{error}</div>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Recordings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Upload</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <Input type="file" onChange={(e) => setFileInput(e.target.files?.[0] ?? null)} className="max-w-sm" />
            <Button onClick={handleUpload} disabled={busyAction === "upload"}>
              {busyAction === "upload" ? "Uploading & Transcribing..." : "Upload"}
            </Button>
          </div>
          {errorMsg && <p className="text-sm text-destructive font-medium">{errorMsg}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All recordings</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Audio</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Transcript</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recordings.map((r) => {
                const analysis = analysesByRecording.get(String(r.id))
                const scoreRow = analysis ? scoreByAnalysis.get(String(analysis.id)) : null
                const score = scoreValue(scoreRow)

                return (
                  <TableRow key={r.id}>
                    <TableCell>
                      <audio controls src={r.file_url} />
                    </TableCell>

                    <TableCell>
                      {r.source === "zoom" ? (
                        <Badge variant="outline" className="text-blue-500 border-blue-200 bg-blue-50">Zoom</Badge>
                      ) : (
                        <Badge variant="outline" className="text-gray-500 border-gray-200">Upload</Badge>
                      )}
                    </TableCell>

                    <TableCell>
                      {r.status === "completed" ? (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-none">Completed</Badge>
                      ) : r.status === "processing" ? (
                        <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-none">Processing</Badge>
                      ) : r.status === "failed" ? (
                        <Badge className="bg-red-100 text-red-700 hover:bg-red-200 border-none">Failed</Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-200 border-none">Pending</Badge>
                      )}
                    </TableCell>

                    <TableCell>
                      {r.status === "completed" ? (
                        r.transcript && [
                          "No speech detected",
                          "No meaningful audio",
                          "Audio too short",
                          "Error processing audio",
                          "Processed with minor issue",
                        ].some((msg) => r.transcript.startsWith(msg)) ? (
                          // Informational message — no real speech content
                          <span className="text-sm text-muted-foreground italic">
                            ℹ️ {r.transcript}
                          </span>
                        ) : (
                          // Real transcript
                          <div className="w-full">
                            <textarea
                              readOnly
                              className="w-full min-h-[100px] text-sm p-3 bg-muted/30 border border-border/50 rounded-lg focus:outline-none resize-y"
                              value={r.transcript || ""}
                            />
                          </div>
                        )
                      ) : r.status === "failed" ? (
                        <span className="text-sm text-muted-foreground italic">
                          ℹ️ {r.transcript || "Processed with minor issue"}
                        </span>
                      ) : r.status === "processing" ? (
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                          Transcribing...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2 text-muted-foreground">
                          Pending...
                        </span>
                      )}
                    </TableCell>

                    <TableCell>
                      {r.status === "completed" &&
                        r.transcript &&
                        ![
                          "No speech detected",
                          "No meaningful audio",
                          "Audio too short",
                          "Error processing audio",
                          "Processed with minor issue",
                        ].some((msg) => r.transcript.startsWith(msg)) && (
                          <Button variant="outline" size="sm" onClick={() => downloadTextFile(r.transcript)}>
                            Download .txt file
                          </Button>
                        )}
                    </TableCell>

                    <TableCell>
                      {score ? `${score}%` : "Pending"}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}