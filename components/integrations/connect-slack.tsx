"use client"

export function ConnectSlack() {
  const send = async () => {
    await fetch("/api/integrations/slack", {
      method: "POST",
      body: JSON.stringify({
        message: "Hello from RivvTik",
      }),
    })

    alert("Slack Message Sent")
  }

  return <button onClick={send}>Connect Slack</button>
}