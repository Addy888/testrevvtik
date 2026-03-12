"use client"

export function ConnectCRM() {
  const fetchLeads = async () => {
    const res = await fetch("/api/integrations/crm")
    const data = await res.json()

    console.log(data)
    alert("CRM Connected")
  }

  return (
    <button onClick={fetchLeads}>
      Connect CRM
    </button>
  )
}