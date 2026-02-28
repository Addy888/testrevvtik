// import { createClient } from "@/lib/supabase/server"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { MessageSquare, Mic, Calendar } from "lucide-react"

// export default async function HistoryPage() {
//   const supabase = await createClient()
//   const {
//     data: { user },
//   } = await supabase.auth.getUser()

//   const { data: sessions } = await supabase
//     .from("practice_sessions")
//     .select("*")
//     .eq("user_id", user?.id)
//     .order("created_at", { ascending: false })

//   return (
//     <div>
//       <div className="mb-6">
//         <h1 className="text-2xl font-bold">Practice History</h1>
//         <p className="text-muted-foreground">Review your past practice sessions and progress</p>
//       </div>

//       {sessions && sessions.length > 0 ? (
//         <div className="space-y-4">
//           {sessions.map((session) => (
//             <Card key={session.id} className="border-border/50 bg-card">
//               <CardHeader className="pb-2">
//                 <div className="flex items-center justify-between">
//                   <div className="flex items-center gap-3">
//                     <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
//                       {session.session_type === "voice" ? (
//                         <Mic className="h-5 w-5 text-primary" />
//                       ) : (
//                         <MessageSquare className="h-5 w-5 text-primary" />
//                       )}
//                     </div>
//                     <div>
//                       <CardTitle className="text-base capitalize">{session.session_type} Practice</CardTitle>
//                       <div className="flex items-center gap-1 text-xs text-muted-foreground">
//                         <Calendar className="h-3 w-3" />
//                         {new Date(session.created_at).toLocaleDateString("en-US", {
//                           year: "numeric",
//                           month: "long",
//                           day: "numeric",
//                           hour: "2-digit",
//                           minute: "2-digit",
//                         })}
//                       </div>
//                     </div>
//                   </div>
//                   {session.score && (
//                     <div className="text-right">
//                       <div className="text-2xl font-bold text-primary">{session.score}%</div>
//                       <div className="text-xs text-muted-foreground">Score</div>
//                     </div>
//                   )}
//                 </div>
//               </CardHeader>
//               {session.feedback && (
//                 <CardContent>
//                   <p className="text-sm text-muted-foreground">{session.feedback}</p>
//                 </CardContent>
//               )}
//             </Card>
//           ))}
//         </div>
//       ) : (
//         <Card className="border-border/50 bg-card">
//           <CardContent className="py-12 text-center">
//             <MessageSquare className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
//             <h3 className="mb-2 font-semibold">No sessions yet</h3>
//             <p className="text-sm text-muted-foreground">Start practicing to see your history here</p>
//           </CardContent>
//         </Card>
//       )}
//     </div>
//   )
// }


import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare, Mic, Calendar, Bot } from "lucide-react"
import Link from "next/link"

export default async function HistoryPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  /* ========================= */
  /* PRACTICE SESSIONS */
  /* ========================= */

  const { data: practiceSessions } = await supabase
    .from("practice_sessions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  /* ========================= */
  /* AI CHAT SESSIONS */
  /* ========================= */

  const { data: chatSessions } = await supabase
    .from("chat_sessions")
    .select(`
      id,
      title,
      updated_at,
      chat_messages(count)
    `)
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">History</h1>
        <p className="text-muted-foreground">
          Review your practice sessions and AI chats
        </p>
      </div>

      {/* ========================= */}
      {/* AI CHAT HISTORY */}
      {/* ========================= */}

      <h2 className="text-lg font-semibold mb-4">AI Chat Sessions</h2>

      {chatSessions && chatSessions.length > 0 ? (
        <div className="space-y-4 mb-10">
          {chatSessions.map((session: any) => (
            <Link
              key={session.id}
              href={`/dashboard/ai-agent?session=${session.id}`}
            >
              <Card className="border-border/50 bg-card hover:bg-muted/50 cursor-pointer transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Bot className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">
                          {session.title || "Untitled Chat"}
                        </CardTitle>

                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(session.updated_at).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-sm text-muted-foreground">
                      {session.chat_messages?.[0]?.count || 0} messages
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="mb-10 border-border/50 bg-card">
          <CardContent className="py-8 text-center">
            <Bot className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No AI chats yet
            </p>
          </CardContent>
        </Card>
      )}

      {/* ========================= */}
      {/* PRACTICE HISTORY */}
      {/* ========================= */}

      <h2 className="text-lg font-semibold mb-4">Practice Sessions</h2>

      {practiceSessions && practiceSessions.length > 0 ? (
        <div className="space-y-4">
          {practiceSessions.map((session: any) => (
            <Card key={session.id} className="border-border/50 bg-card">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      {session.session_type === "voice" ? (
                        <Mic className="h-5 w-5 text-primary" />
                      ) : (
                        <MessageSquare className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-base capitalize">
                        {session.session_type} Practice
                      </CardTitle>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(session.created_at).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </div>
                    </div>
                  </div>

                  {session.score && (
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">
                        {session.score}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Score
                      </div>
                    </div>
                  )}
                </div>
              </CardHeader>

              {session.feedback && (
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {session.feedback}
                  </p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-border/50 bg-card">
          <CardContent className="py-8 text-center">
            <MessageSquare className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No practice sessions yet
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
