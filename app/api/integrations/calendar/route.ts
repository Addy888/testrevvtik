import { NextResponse } from "next/server"
import { fetchGoogleMeetings } from "@/lib/integrations/calendar"

export async function GET() {
  const meetings = await fetchGoogleMeetings()

  return NextResponse.json(meetings)
}