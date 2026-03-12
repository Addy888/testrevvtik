export type IntegrationProvider =
  | "crm"
  | "calendar"
  | "email"
  | "slack"
  | "linkedin"

export type IntegrationStatus = "connected" | "disconnected"

export interface CRMLead {
  id: string
  name: string
  email: string
  company?: string
}

export interface MeetingData {
  id: string
  title: string
  start: string
  end: string
}

export interface EmailPayload {
  to: string
  subject: string
  body: string
}