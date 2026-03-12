import { NextResponse } from "next/server"
import { sendSlackMessage } from "@/lib/integrations/slack"

export async function POST(req: Request) {
  const { message } = await req.json()

  const res = await sendSlackMessage(message)

  return NextResponse.json(res)
}