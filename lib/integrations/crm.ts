import { CRMLead } from "@/types/integrations"

export async function fetchCRMLeads(): Promise<CRMLead[]> {
  return [
    {
      id: "lead1",
      name: "Rahul Sharma",
      email: "rahul@gmail.com",
      company: "Tech Pvt Ltd",
    },
  ]
}