import { NextResponse } from "next/server"
import { fetchCRMLeads } from "@/lib/integrations/crm"

export async function GET() {
  const leads = await fetchCRMLeads()

  return NextResponse.json(leads)
}