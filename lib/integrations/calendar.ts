import { MeetingData } from "@/types/integrations"

export async function fetchGoogleMeetings(): Promise<MeetingData[]> {
  // MOCK DATA (later real google api)
  return [
    {
      id: "1",
      title: "Sales Call",
      start: new Date().toISOString(),
      end: new Date(Date.now() + 3600000).toISOString(),
    },
  ]
}