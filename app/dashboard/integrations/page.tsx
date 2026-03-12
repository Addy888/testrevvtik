import { ConnectCalendar } from "@/components/integrations/connect-calendar"
import { ConnectCRM } from "@/components/integrations/connect-crm"
import { ConnectEmail } from "@/components/integrations/connect-email"
import { ConnectSlack } from "@/components/integrations/connect-slack"
import { ConnectLinkedin } from "@/components/integrations/connect-linkedin"

export default function IntegrationsPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">External Integrations</h1>

      <div className="grid grid-cols-3 gap-6">

        <div className="border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">Google Calendar</h2>
          <ConnectCalendar />
        </div>

        <div className="border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">CRM</h2>
          <ConnectCRM />
        </div>

        <div className="border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">Email</h2>
          <ConnectEmail />
        </div>

        <div className="border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">Slack</h2>
          <ConnectSlack />
        </div>

        <div className="border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">LinkedIn</h2>
          <ConnectLinkedin />
        </div>

      </div>
    </div>
  )
}