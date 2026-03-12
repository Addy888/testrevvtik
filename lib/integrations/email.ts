import { EmailPayload } from "@/types/integrations"

export async function sendEmail(payload: EmailPayload) {
  console.log("Sending email", payload)

  return {
    success: true,
  }
}