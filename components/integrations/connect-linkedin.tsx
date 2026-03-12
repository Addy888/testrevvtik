"use client"

export function ConnectLinkedin() {
  const fetchProfile = async () => {
    const res = await fetch("/api/integrations/linkedin")
    const data = await res.json()

    console.log(data)
    alert("LinkedIn Connected")
  }

  return <button onClick={fetchProfile}>Connect LinkedIn</button>
}