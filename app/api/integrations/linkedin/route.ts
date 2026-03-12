import { NextResponse } from "next/server"
import { fetchLinkedinProfile } from "@/lib/integrations/linkedin"

export async function GET() {
  const profile = await fetchLinkedinProfile()

  return NextResponse.json(profile)
}