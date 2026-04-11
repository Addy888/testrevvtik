'use client'

import * as React from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase'
import { useAppUser } from '@/hooks/useAppUser'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { FileText, Sparkles, Trophy, Mic, ArrowLeft } from 'lucide-react'

const supabase = createBrowserClient()

export default function AnalysisPage() {
  const searchParams = useSearchParams()
  const recordingIdFromQuery = searchParams.get('recordingId')

  const { appUser, loading, error } = useAppUser()

  const [recordings, setRecordings] = React.useState<any[]>([])
  const [transcripts, setTranscripts] = React.useState<any[]>([])
  const [analyses, setAnalyses] = React.useState<any[]>([])
  const [scores, setScores] = React.useState<any[]>([])
  const [refreshTick, setRefreshTick] = React.useState(0)

  const applyRoleEq = React.useCallback(
    (query: any) => {
      if (!appUser) return query
      return appUser.role === 'EMPLOYEE' ? query.eq('user_id', appUser.id) : query
    },
    [appUser]
  )

  React.useEffect(() => {
    if (!appUser || loading) return

    const run = async () => {
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
    }

    run().catch(() => {
      // errors are surfaced via the `error` state from `useAppUser` for now
    })
  }, [appUser, loading, applyRoleEq, refreshTick])

  const transcriptByRecordingId = React.useMemo(() => {
    const map = new Map<string, any>()
    for (const t of transcripts) map.set(String(t.recording_id), t)
    return map
  }, [transcripts])

  const analysisByTranscriptId = React.useMemo(() => {
    const map = new Map<string, any>()
    for (const a of analyses) map.set(String(a.transcript_id), a)
    return map
  }, [analyses])

  const scoreByAnalysisId = React.useMemo(() => {
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

  const transcriptText = (t: any) =>
    String(t?.content || t?.transcript || t?.text || t?.transcript_text || '')

  const analysisJson = (a: any) =>
    a?.analysis || a?.result || a?.data || a?.analysis_json || null

  const computeAverage = (analysis: any) => {
    const confidence = Number(analysis?.confidence ?? 0)
    const objection_handling = Number(analysis?.objection_handling ?? 0)
    const communication = Number(analysis?.communication ?? 0)
    const closing_skill = Number(analysis?.closing_skill ?? 0)
    const avg = Math.round(
      (confidence + objection_handling + communication + closing_skill) / 4
    )
    return Math.max(0, Math.min(100, avg))
  }

  const selectedRecording = React.useMemo(() => {
    if (recordingIdFromQuery) {
      return recordings.find((r) => String(r.id) === recordingIdFromQuery) || null
    }
    return recordings.find((r) => transcriptByRecordingId.get(String(r.id))) || recordings[0] || null
  }, [recordingIdFromQuery, recordings, transcriptByRecordingId])

  const selectedTranscript = selectedRecording ? transcriptByRecordingId.get(String(selectedRecording.id)) : null
  const selectedAnalysis = selectedTranscript ? analysisByTranscriptId.get(String(selectedTranscript.id)) : null
  const selectedScore = selectedAnalysis ? scoreByAnalysisId.get(String(selectedAnalysis.id)) : null
  const selectedAnalysisJson = selectedAnalysis ? analysisJson(selectedAnalysis) : null
  const averageScore = selectedAnalysisJson ? computeAverage(selectedAnalysisJson) : scoreValue(selectedScore)

  if (loading) {
    return <div className="text-muted-foreground">Loading...</div>
  }

  if (error) {
    return <div className="text-sm text-destructive">{error}</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/recordings">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Analysis</h1>
            <p className="text-muted-foreground">Transcript, coach analysis, and score.</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {selectedTranscript ? <Badge>Transcribed</Badge> : <Badge variant="outline">No transcript</Badge>}
          {selectedAnalysis ? <Badge variant="secondary">Analyzed</Badge> : <Badge variant="outline">No analysis</Badge>}
          {typeof averageScore === 'number' ? (
            <Badge>
              Score {averageScore}%
            </Badge>
          ) : (
            <Badge variant="outline">No score</Badge>
          )}
        </div>
      </div>

      {selectedRecording ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-border/50 bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="h-4 w-4" />
                Transcript
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedTranscript ? (
                <div className="space-y-3">
                  <div className="text-xs text-muted-foreground">
                    Recording ID: {String(selectedRecording.id)}
                  </div>
                  <pre className="whitespace-pre-wrap break-words text-sm leading-6 bg-muted/30 border border-border/50 rounded-lg p-3">
                    {transcriptText(selectedTranscript)}
                  </pre>
                </div>
              ) : (
                <div className="text-muted-foreground text-sm">
                  This recording hasn’t been transcribed yet.
                  <div className="mt-2">
                    <Link href="/dashboard/recordings" className="text-primary underline">
                      Upload and transcribe
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-border/50 bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedAnalysisJson ? (
                  <div className="space-y-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Metric</TableHead>
                          <TableHead className="text-right">Score</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>Confidence</TableCell>
                          <TableCell className="text-right font-medium">{selectedAnalysisJson.confidence ?? 0}%</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Objection Handling</TableCell>
                          <TableCell className="text-right font-medium">{selectedAnalysisJson.objection_handling ?? 0}%</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Communication</TableCell>
                          <TableCell className="text-right font-medium">{selectedAnalysisJson.communication ?? 0}%</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Closing Skill</TableCell>
                          <TableCell className="text-right font-medium">{selectedAnalysisJson.closing_skill ?? 0}%</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>

                    {selectedAnalysisJson.summary ? (
                      <div className="space-y-1 pt-4">
                        <div className="text-sm font-medium">Summary</div>
                        <div className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
                          {selectedAnalysisJson.summary}
                        </div>
                      </div>
                    ) : null}

                    <div className="space-y-1 pt-2">
                      <div className="text-sm font-medium">Analysis JSON</div>
                      <pre className="whitespace-pre-wrap break-words text-sm leading-6 bg-muted/30 border border-border/50 rounded-lg p-3">
                        {JSON.stringify(selectedAnalysisJson, null, 2)}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="text-muted-foreground text-sm">
                    No analysis available for this recording.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  Overall Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                {typeof averageScore === 'number' ? (
                  <div className="space-y-2">
                    <div className="text-4xl font-bold">{averageScore}%</div>
                    <div className="text-sm text-muted-foreground">
                      Average of the 4 coaching metrics.
                    </div>
                  </div>
                ) : (
                  <div className="text-muted-foreground text-sm">
                    This recording hasn’t been scored yet.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <Card className="border-border/50 bg-card">
          <CardHeader>
            <CardTitle>No recordings found</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">
            Go to Recordings to upload your first file URL.
          </CardContent>
        </Card>
      )}
    </div>
  )
}

