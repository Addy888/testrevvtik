"use client"

export function ConnectCalendar() {
  const fetchMeetings = async () => {
    const res = await fetch("/api/integrations/calendar")
    const data = await res.json()

    console.log(data)
    alert("Meetings fetched")
  }

  return (
    <button onClick={fetchMeetings}>
      Connect Calendar
    </button>
  )
}