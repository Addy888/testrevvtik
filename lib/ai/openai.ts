type AnalysisResult = {
  confidence: number
  objection_handling: number
  clarity: number
  closing_ability: number
}

function requireOpenAIKey() {
  const key = process.env.OPENAI_API_KEY
  if (!key) {
    const err = new Error("Missing OPENAI_API_KEY")
    ;(err as any).status = 500
    throw err
  }
  return key
}

function clamp0to100(n: unknown) {
  const num = typeof n === "number" ? n : Number(n)
  if (!Number.isFinite(num)) return 0
  return Math.max(0, Math.min(100, Math.round(num)))
}

function parseFirstJsonObject(text: string) {
  // Extract the first {...} block to tolerate extra model commentary.
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error("Model did not return JSON")
  return JSON.parse(match[0])
}

export async function whisperTranscribeFromUrl(fileUrl: string) {
  const apiKey = requireOpenAIKey()

  const fileRes = await fetch(fileUrl)
  if (!fileRes.ok) {
    throw new Error(`Failed to fetch audio file (status ${fileRes.status})`)
  }

  const contentType = fileRes.headers.get("content-type") || "application/octet-stream"
  const arrayBuffer = await fileRes.arrayBuffer()

  // Node 18+ supports Blob in Next.js server routes.
  const blob = new Blob([arrayBuffer], { type: contentType })

  const form = new FormData()
  form.append("model", "whisper-1")
  form.append("file", blob, "audio")

  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: form,
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => "")
    throw new Error(`Whisper API failed: ${res.status} ${errText}`.trim())
  }

  const data = (await res.json()) as { text?: string }
  if (!data?.text) throw new Error("Whisper API returned empty transcript")
  return data.text
}

export async function whisperTranscribeFromBuffer({
  audioBuffer,
  mimeType,
  filename,
}: {
  audioBuffer: ArrayBuffer | Buffer
  mimeType: string
  filename: string
}) {
  const apiKey = requireOpenAIKey()

  // Next server routes provide a global FormData in modern Node runtimes.
  const form = new FormData()
  form.append("model", "whisper-1")

  const blob = audioBuffer instanceof Buffer ? new Blob([audioBuffer], { type: mimeType }) : new Blob([audioBuffer], { type: mimeType })
  form.append("file", blob, filename)

  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: form,
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => "")
    throw new Error(`Whisper API failed: ${res.status} ${errText}`.trim())
  }

  const data = (await res.json()) as { text?: string }
  if (!data?.text) throw new Error("Whisper API returned empty transcript")
  return data.text
}

export async function analyzeTranscriptWithGPT(transcriptText: string): Promise<AnalysisResult> {
  const apiKey = requireOpenAIKey()

  const system = [
    "You are a sales training analyst.",
    "Analyze the transcript for sales coaching.",
    "Output ONLY a single valid JSON object.",
    "No markdown, no extra keys, no commentary.",
    "JSON schema:",
    "{",
    '"confidence": number 0-100,',
    '"objection_handling": number 0-100,',
    '"clarity": number 0-100,',
    '"closing_ability": number 0-100',
    "}",
  ].join("\n")

  const user = `Transcript:\n${transcriptText}\n`

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => "")
    throw new Error(`GPT API failed: ${res.status} ${errText}`.trim())
  }

  const data = (await res.json()) as any
  const content = data?.choices?.[0]?.message?.content
  if (!content) throw new Error("GPT API returned empty content")

  const parsed = parseFirstJsonObject(String(content))

  return {
    confidence: clamp0to100(parsed.confidence),
    objection_handling: clamp0to100(parsed.objection_handling),
    clarity: clamp0to100(parsed.clarity),
    closing_ability: clamp0to100(parsed.closing_ability),
  }
}

