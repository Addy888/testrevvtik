import { NextResponse } from "next/server"
import { sendEmail } from "@/lib/integrations/email"

export async function POST(req: Request) {
  const body = await req.json()

  const res = await sendEmail(body)

  return NextResponse.json(res)
}