type ClaudeAnalysis = {
  confidence: number
  objection_handling: number
  communication: number
  closing_skill: number
  summary: string
}

function requireClaudeKey() {
  return (
    process.env.CLAUDE_API_KEY ||
    process.env.ANTHROPIC_API_KEY ||
    ""
  )
}

function clamp0to100(n: unknown) {
  const num = typeof n === "number" ? n : Number(n)
  if (!Number.isFinite(num)) return 0
  return Math.max(0, Math.min(100, Math.round(num)))
}

function safeParseJsonObject(text: string): any {
  try {
    return JSON.parse(text)
  } catch {
    // Try extracting the first JSON object from a larger response.
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) throw new Error("No JSON object found in Claude response")
    return JSON.parse(match[0])
  }
}

export async function analyzeTranscriptWithClaude(
  transcriptText: string
): Promise<ClaudeAnalysis> {
  const key = requireClaudeKey()
  if (!key) {
    throw new Error("Missing CLAUDE_API_KEY/ANTHROPIC_API_KEY")
  }

  const Anthropic = (await import("@anthropic-ai/sdk")).default

  const anthropic = new Anthropic({ apiKey: key })

  const prompt = [
    "Analyze this sales call transcript and return ONLY JSON:",
    "{",
    '"confidence": number,',
    '"objection_handling": number,',
    '"communication": number,',
    '"closing_skill": number,',
    '"summary": "short explanation"',
    "}",
    "",
    "Transcript:",
    transcriptText,
  ].join("\n")

  const res = await anthropic.messages.create({
    model: "claude-3-haiku-20240307",
    max_tokens: 500,
    messages: [{ role: "user", content: prompt }],
  })

  const content =
    res?.content?.[0] && typeof res.content[0] === "object"
      ? (res.content[0] as any).text
      : null

  if (!content) {
    throw new Error("Claude returned empty content")
  }

  const parsed = safeParseJsonObject(String(content))

  // Normalize + clamp metrics to 0-100 for consistent scoring.
  return {
    confidence: clamp0to100(parsed.confidence),
    objection_handling: clamp0to100(parsed.objection_handling),
    communication: clamp0to100(parsed.communication),
    closing_skill: clamp0to100(parsed.closing_skill),
    summary: typeof parsed.summary === "string" ? parsed.summary : "",
  }
}

