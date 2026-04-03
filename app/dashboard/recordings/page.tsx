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
      return appUser.role === "salesperson" ? query.eq("user_id", appUser.id) : query
    },
    [appUser]
  )

  const load = React.useCallback(async () => {
    if (!appUser) return

    const companyId = appUser.company_id

    try {
      // 🔵 1. Fetch Recordings Safe (Allowing null company states to load data)
      let recordingsQuery: any = supabase
        .from("recordings")
        .select("*")
        .order("created_at", { ascending: false })

      if (companyId && typeof companyId === "string" && companyId !== "undefined") {
        recordingsQuery = recordingsQuery.eq("company_id", companyId)
      }
      recordingsQuery = applyRoleEq(recordingsQuery)

      const { data: recs, error: recErr } = await recordingsQuery
      if (recErr) throw recErr

      // 🛡️ 3. Safe ID Extraction
      const recordingIds = (recs || [])
        .map((r: any) => r.id)
        .filter((id: any) => typeof id === "string" && id.trim().length > 0 && id !== "undefined")

      console.log("recordingIds:", recordingIds)

      let transcriptsData: any[] = []
      let analysisData: any[] = []
      let scoresData: any[] = []

      // 🛡️ 4. Safe Transcripts Fetch
      if (recordingIds.length > 0) {
        let transcriptsQuery: any = supabase.from("transcripts").select("*")
        if (companyId && typeof companyId === "string" && companyId !== "undefined") {
          transcriptsQuery = transcriptsQuery.eq("company_id", companyId)
        }
        transcriptsQuery = applyRoleEq(transcriptsQuery)
        transcriptsQuery = transcriptsQuery.in("recording_id", recordingIds)

        const { data: trans, error: transErr } = await transcriptsQuery
        if (transErr) throw transErr

        transcriptsData = trans || []

        // 🛡️ 5. Next Safe Extraction Phase (Transcripts -> Analysis)
        const transcriptIds = transcriptsData
          .map((t: any) => t.id)
          .filter((id: any) => typeof id === "string" && id.trim().length > 0 && id !== "undefined")

        console.log("transcriptIds:", transcriptIds)

        if (transcriptIds.length > 0) {
          let analysisQuery: any = supabase.from("analysis").select("*")
          if (companyId && typeof companyId === "string" && companyId !== "undefined") {
            analysisQuery = analysisQuery.eq("company_id", companyId)
          }
          analysisQuery = applyRoleEq(analysisQuery)

          // Link analysis explicitly to transcript_id
          analysisQuery = analysisQuery.in("transcript_id", transcriptIds)

          const { data: an, error: anErr } = await analysisQuery
          if (anErr) throw anErr

          analysisData = an || []

          // 🛡️ 6. Next Safe Extraction Phase (Analysis -> Scores)
          const analysisIds = analysisData
            .map((a: any) => a.id)
            .filter((id: any) => typeof id === "string" && id.trim().length > 0 && id !== "undefined")

          console.log("analysisIds:", analysisIds)

          if (analysisIds.length > 0) {
            let scoresQuery: any = supabase.from("scores").select("*")
            if (companyId && typeof companyId === "string" && companyId !== "undefined") {
              scoresQuery = scoresQuery.eq("company_id", companyId)
            }
            scoresQuery = applyRoleEq(scoresQuery)

            // Execute safely
            scoresQuery = scoresQuery.in("analysis_id", analysisIds)

            const { data: sc, error: scErr } = await scoresQuery
            if (scErr) throw scErr

            scoresData = sc || []
          }
        }
      }

      setRecordings(recs || [])
      setTranscripts(transcriptsData)
      setAnalyses(analysisData)
      setScores(scoresData)

      console.log("UI RECORDINGS:", recs || [])

    } catch (err: any) {
      console.error("Load safe query error:", err)
      setErrorMsg(err?.message || "Data failed to load safely.")
    }
  }, [appUser, applyRoleEq, refreshTick])

  React.useEffect(() => {
    if (!appUser || loading) return
    setErrorMsg(null)
    load().catch((e) => setErrorMsg(e instanceof Error ? e.message : "Failed to load recordings"))
  }, [appUser, loading, load])

  // 🔥 Auto-refresh UI (Polling)
  React.useEffect(() => {
    if (!appUser || loading) return

    const interval = setInterval(() => {
      load()
    }, 3000)

    return () => clearInterval(interval)
  }, [appUser, loading, load])

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

  const downloadTranscript = (text: string) => {
    if (!text) return
    const blob = new Blob([text], { type: "text/plain" })
    const url = URL.createObjectURL(blob)

    const a = document.createElement("a")
    a.href = url
    a.download = "transcript.txt"
    a.click()

    URL.revokeObjectURL(url)
  }

  const handleUpload = async () => {
    if (!appUser) return
    setErrorMsg(null)

    setBusyAction("upload")
    try {
      if (!fileInput) {
        setErrorMsg("Choose a file to upload")
        return
      }

      const fd = new FormData()
      fd.append("file", fileInput)

      const res = await fetch("/api/upload", {
        method: "POST",
        body: fd,
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Upload failed")

      setFileUrl("")
      setFileInput(null)
      setRefreshTick((t) => t + 1)

      // 🔥 Force refresh after upload allows backend buffer time
      setTimeout(() => {
        load()
      }, 2000)
    } catch (e: any) {
      setErrorMsg(e?.message || "Upload failed")
    } finally {
      setBusyAction(null)
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
        <CardContent>
          <Input type="file" onChange={(e) => setFileInput(e.target.files?.[0] ?? null)} />
          <Button onClick={handleUpload} disabled={busyAction === "upload"}>
            Upload
          </Button>
          {errorMsg && <p>{errorMsg}</p>}
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
                      {r.transcript && r.transcript.length > 5 ? (
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{r.transcript}</p>
                      ) : (
                        <span className="flex items-center gap-2">
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                          Transcribing...
                        </span>
                      )}
                    </TableCell>

                    <TableCell>
                      {r.transcript && r.transcript.length > 5 && (
                        <Button variant="outline" size="sm" onClick={() => downloadTranscript(r.transcript)}>
                          Download
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