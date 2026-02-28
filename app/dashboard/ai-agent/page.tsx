// import { ChatInterface } from "@/components/chat/chat-interface"

// export default function AIAgentPage() {
//   return (
//     <div>
//       <div className="mb-6">
//         <h1 className="text-2xl font-bold">AI Sales Coach</h1>
//         <p className="text-muted-foreground">Practice sales conversations and get instant feedback</p>
//       </div>
//       <ChatInterface />
//     </div>
//   )
// }


import { createClient } from "@/lib/supabase/server"
import { ChatInterface } from "@/components/chat/chat-interface"

export default async function AIAgentPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const searchParams = await props.searchParams

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: sessions } = await supabase
    .from("chat_sessions")
    .select("id, title")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })

  // ✅ Safe extraction (Next 16 style)
  const sessionParam = searchParams?.session
  const sessionId =
    typeof sessionParam === "string" ? sessionParam : null

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">AI Sales Coach</h1>
      </div>

      <ChatInterface
        initialSessions={sessions || []}
        initialSessionId={sessionId}
      />
    </div>
  )
}