"use client"

export function ConnectEmail() {
  const send = async () => {
    await fetch("/api/integrations/email", {
      method: "POST",
      body: JSON.stringify({
        to: "test@gmail.com",
        subject: "Hello",
        body: "From RivvTik",
      }),
    })

    alert("Email Sent")
  }

  return <button onClick={send}>Send Email</button>
}