'use client'

import * as React from 'react'
import Link from 'next/link'
import { createBrowserClient } from '@/lib/supabase'
import { useAppUser } from '@/hooks/useAppUser'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Bot, FileAudio, Mic, Trophy, Sparkles } from 'lucide-react'

const supabase = createBrowserClient()

export default function RecordingsPage() {
  const { appUser, loading, error } = useAppUser()

  const [fileUrl, setFileUrl] = React.useState('')
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
      return appUser.role === 'salesperson' ? query.eq('user_id', appUser.id) : query
    },
    [appUser]
  )

  const load = React.useCallback(async () => {
    if (!appUser) return

    const companyId = appUser.company_id

    let recordingsQuery: any = supabase
      .from('recordings')
      .select('*')
      .order('created_at', { ascending: false })
    recordingsQuery = recordingsQuery.eq('company_id', companyId)
    recordingsQuery = applyRoleEq(recordingsQuery)

    const { data: recs, error: recErr } = await recordingsQuery
    if (recErr) throw recErr

    const recordingIds = (recs || []).map((r: any) => r.id)

    let transcriptsQuery: any = supabase
      .from('transcripts')
      .select('*')
    transcriptsQuery = transcriptsQuery.eq('company_id', companyId)
    transcriptsQuery = applyRoleEq(transcriptsQuery)
    if (recordingIds.length > 0) transcriptsQuery = transcriptsQuery.in('recording_id', recordingIds)

    const { data: trans, error: transErr } = await transcriptsQuery
    if (transErr) throw transErr

    const transcriptIds = (trans || []).map((t: any) => t.id)

    let analysisQuery: any = supabase
      .from('analysis')
      .select('*')
    analysisQuery = analysisQuery.eq('company_id', companyId)
    analysisQuery = applyRoleEq(analysisQuery)
    if (transcriptIds.length > 0) analysisQuery = analysisQuery.in('transcript_id', transcriptIds)

    const { data: an, error: anErr } = await analysisQuery
    if (anErr) throw anErr

    const analysisIds = (an || []).map((a: any) => a.id)

    let scoresQuery: any = supabase
      .from('scores')
      .select('*')
    scoresQuery = scoresQuery.eq('company_id', companyId)
    scoresQuery = applyRoleEq(scoresQuery)
    if (analysisIds.length > 0) scoresQuery = scoresQuery.in('analysis_id', analysisIds)

    const { data: sc, error: scErr } = await scoresQuery
    if (scErr) throw scErr

    setRecordings(recs || [])
    setTranscripts(trans || [])
    setAnalyses(an || [])
    setScores(sc || [])
  }, [appUser, applyRoleEq, refreshTick])

  React.useEffect(() => {
    if (!appUser || loading) return
    setErrorMsg(null)
    load().catch((e) => setErrorMsg(e instanceof Error ? e.message : 'Failed to load recordings'))
  }, [appUser, loading, load])

  const transcriptsByRecording = React.useMemo(() => {
    const map = new Map<string, any>()
    for (const t of transcripts) map.set(String(t.recording_id), t)
    return map
  }, [transcripts])

  const analysesByTranscript = React.useMemo(() => {
    const map = new Map<string, any>()
    for (const a of analyses) map.set(String(a.transcript_id), a)
    return map
  }, [analyses])

  const scoreByAnalysis = React.useMemo(() => {
    const map = new Map<string, any>()
    for (const s of scores) map.set(String(s.analysis_id), s)
    return map
  }, [scores])

  const scoreValue = (s: any) =>
    typeof s?.average_score === 'number'
      ? s.average_score
      : typeof s?.score === 'number'
        ? s.score
        : typeof s?.average === 'number'
          ? s.average
          : null

  const handleUpload = async () => {
    if (!appUser) return
    setErrorMsg(null)

    setBusyAction('upload')
    try {
      if (!fileInput) {
        setErrorMsg('Choose a file to upload')
        return
      }

      const fd = new FormData()
      fd.append('file', fileInput)
      console.log('Upload started', { name: fileInput.name, size: fileInput.size, type: fileInput.type })

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: fd,
      })

      const data = await res.json()
      console.log('API response', data)
      if (!res.ok) throw new Error(data?.error || 'Upload failed')

      // Auto-transcribe after successful upload (best default UX).
      const recordingId = data?.recordingId
      const uploadedUrl = String(data?.file_url || '')
      if (recordingId) {
        setBusyAction(`transcribe:${recordingId}`)
        const tRes = await fetch('/api/transcribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recording_id: String(recordingId), file_url: uploadedUrl || undefined }),
        })
        const tData = await tRes.json().catch(() => ({}))
        if (!tRes.ok) {
          // Keep recording saved even if transcription fails.
          setErrorMsg(tData?.error || 'Transcription failed. You can retry using the Transcribe button.')
        }
      }

      setFileUrl('')
      setFileInput(null)
      setRefreshTick((t) => t + 1)
    } catch (e: any) {
      setErrorMsg(e?.message || 'Upload failed')
    } finally {
      setBusyAction(null)
    }
  }

  const handleTranscribe = async (recordingId: string) => {
    if (!recordingId) return
    setErrorMsg(null)

    setBusyAction(`transcribe:${recordingId}`)
    try {
      const rec = recordings.find((r) => String(r.id) === String(recordingId))
      const url = rec ? String(rec.file_url || rec.url || rec.fileUrl || '') : ''
      const body = { recording_id: recordingId, file_url: url || undefined }

      const res = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Transcription failed')
      setRefreshTick((t) => t + 1)
    } catch (e: any) {
      setErrorMsg(e?.message || 'Transcription failed')
    } finally {
      setBusyAction(null)
    }
  }

  const handleAnalyze = async (transcriptId: string) => {
    if (!transcriptId) return
    setErrorMsg(null)

    setBusyAction(`analyze:${transcriptId}`)
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript_id: transcriptId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Analysis failed')
      setRefreshTick((t) => t + 1)
    } catch (e: any) {
      setErrorMsg(e?.message || 'Analysis failed')
    } finally {
      setBusyAction(null)
    }
  }

  const handleScore = async (analysisId: string) => {
    if (!analysisId) return
    setErrorMsg(null)

    setBusyAction(`score:${analysisId}`)
    try {
      const res = await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysis_id: analysisId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Scoring failed')
      setRefreshTick((t) => t + 1)
    } catch (e: any) {
      setErrorMsg(e?.message || 'Scoring failed')
    } finally {
      setBusyAction(null)
    }
  }

  if (loading) {
    return (
      <div className="text-muted-foreground">
        Loading...
      </div>
    )
  }

  if (error) {
    return <div className="text-sm text-destructive">{error}</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Recordings</h1>
          <p className="text-muted-foreground">
            Upload audio/video, transcribe with Deepgram, clean with Claude AI, and score.
          </p>
        </div>
        <Badge variant="secondary" className="self-start">
          Role: {role}
        </Badge>
      </div>

      <Card className="rounded-xl border-border/60 bg-card shadow-sm">
        <CardHeader>
          <CardTitle>Upload recording</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="rec-file">Audio/Video file</Label>
              <Input
                id="rec-file"
                type="file"
                accept=".mp3,.wav,.mp4"
                disabled={busyAction === 'upload'}
                onChange={(e) => setFileInput(e.target.files?.[0] ?? null)}
              />
              <p className="text-xs text-muted-foreground">
                Or use a hosted URL below (Supabase Storage uploads require a configured bucket).
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rec-url">File URL</Label>
              <Input
                id="rec-url"
                value={fileUrl}
                onChange={(e) => {
                  setFileUrl(e.target.value)
                  if (e.target.value.trim()) setFileInput(null)
                }}
                placeholder="https://example.com/audio.mp3"
                disabled={busyAction === 'upload'}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleUpload} disabled={busyAction === 'upload'}>
              {busyAction === 'upload' ? 'Uploading...' : 'Upload'}
            </Button>
          </div>

          {errorMsg ? (
            <div className="text-sm text-destructive">{errorMsg}</div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="rounded-xl border-border/60 bg-card shadow-sm">
        <CardHeader>
          <CardTitle>All recordings</CardTitle>
        </CardHeader>
        <CardContent>
          {recordings.length === 0 ? (
            <div className="text-muted-foreground text-sm">
              No recordings yet. Upload a file URL above.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Recording</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[280px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recordings.map((r) => {
                  const transcript = transcriptsByRecording.get(String(r.id))
                  const analysis = transcript
                    ? analysesByTranscript.get(String(transcript.id))
                    : null
                  const scoreRow = analysis
                    ? scoreByAnalysis.get(String(analysis.id))
                    : null

                  const score = scoreValue(scoreRow)
                  const url = String(r.file_url || r.url || r.fileUrl || '')
                  const isVideo = url.toLowerCase().includes('.mp4')
                  const isTranscribing = busyAction === `transcribe:${String(r.id)}`
                  const transcriptText = String(
                    transcript?.text ||
                      transcript?.content ||
                      transcript?.transcript ||
                      transcript?.transcript_text ||
                      ''
                  )

                  return (
                    <TableRow key={r.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <FileAudio className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {String(r.file_url || r.url || r.fileUrl || '').slice(0, 48) || 'Untitled'}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {r.created_at ? new Date(r.created_at).toLocaleDateString() : ''}
                          </div>
                        </div>

                        {url ? (
                          <div className="mt-3">
                            {isVideo ? (
                              <video
                                controls
                                src={url}
                                className="w-full max-w-[520px] rounded-lg border border-border/50 bg-black"
                              />
                            ) : (
                              <audio controls src={url} className="w-full max-w-[520px]" />
                            )}
                          </div>
                        ) : null}

                        <div className="mt-3">
                          <div className="text-sm font-medium">Transcript</div>
                          {isTranscribing ? (
                            <div className="text-sm text-muted-foreground">Transcribing…</div>
                          ) : transcriptText ? (
                            <pre className="whitespace-pre-wrap break-words text-sm leading-6 bg-muted/30 border border-border/50 rounded-lg p-3 mt-2">
                              {transcriptText}
                            </pre>
                          ) : (
                            <div className="text-sm text-muted-foreground mt-2">No transcript yet.</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          {isTranscribing ? (
                            <Badge variant="secondary">Transcribing…</Badge>
                          ) : transcript ? (
                            <Badge>Transcribed</Badge>
                          ) : (
                            <Badge variant="outline">Need transcription</Badge>
                          )}
                          {analysis ? <Badge>Analyzed</Badge> : <Badge variant="outline">Need analysis</Badge>}
                          {typeof score === 'number' ? (
                            <Badge variant="secondary">Score {score}%</Badge>
                          ) : (
                            <Badge variant="outline">Need scoring</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!!transcript || busyAction !== null}
                            onClick={() => handleTranscribe(String(r.id))}
                          >
                            <Mic className="h-4 w-4" />
                            Transcribe
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!transcript || !!analysis || busyAction !== null}
                            onClick={() => handleAnalyze(String(transcript.id))}
                          >
                            <Sparkles className="h-4 w-4" />
                            Analyze
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!analysis || !!scoreRow || busyAction !== null}
                            onClick={() => handleScore(String(analysis.id))}
                          >
                            <Trophy className="h-4 w-4" />
                            Score
                          </Button>

                          {transcript && analysis && scoreRow ? (
                            <Button size="sm" disabled={busyAction !== null} asChild>
                              <Link href={`/dashboard/analysis?recordingId=${r.id}`}>
                                <Bot className="h-4 w-4" />
                                View
                              </Link>
                            </Button>
                          ) : (
                            <Button size="sm" variant="ghost" disabled>
                              <Bot className="h-4 w-4" />
                              View
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

