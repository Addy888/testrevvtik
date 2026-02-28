// import { createClient } from "@/lib/supabase/server"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Button } from "@/components/ui/button"
// import Link from "next/link"
// import { MessageSquare, Mic, Clock, Trophy, ArrowRight } from "lucide-react"

// export default async function DashboardPage() {
//   const supabase = await createClient()
//   const {
//     data: { user },
//   } = await supabase.auth.getUser()

//   // Get user's practice sessions
//   const { data: sessions } = await supabase
//     .from("practice_sessions")
//     .select("*")
//     .eq("user_id", user?.id)
//     .order("created_at", { ascending: false })
//     .limit(5)

//   const totalSessions = sessions?.length || 0
//   const avgScore = sessions?.length
//     ? Math.round(sessions.reduce((acc, s) => acc + (s.score || 0), 0) / sessions.length)
//     : 0

//   const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "there"

//   return (
//     <div>
//       <div className="mb-8">
//         <h1 className="text-3xl font-bold">Welcome back, {userName}</h1>
//         <p className="mt-1 text-muted-foreground">Ready to sharpen your sales skills today?</p>
//       </div>

//       {/* Quick Stats */}
//       <div className="grid gap-4 md:grid-cols-4 mb-8">
//         <Card className="border-border/50 bg-card">
//           <CardHeader className="flex flex-row items-center justify-between pb-2">
//             <CardTitle className="text-sm font-medium text-muted-foreground">Total Sessions</CardTitle>
//             <Clock className="h-4 w-4 text-muted-foreground" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold">{totalSessions}</div>
//           </CardContent>
//         </Card>
//         <Card className="border-border/50 bg-card">
//           <CardHeader className="flex flex-row items-center justify-between pb-2">
//             <CardTitle className="text-sm font-medium text-muted-foreground">Average Score</CardTitle>
//             <Trophy className="h-4 w-4 text-muted-foreground" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold">{avgScore}%</div>
//           </CardContent>
//         </Card>
//         <Card className="border-border/50 bg-card">
//           <CardHeader className="flex flex-row items-center justify-between pb-2">
//             <CardTitle className="text-sm font-medium text-muted-foreground">AI Chats</CardTitle>
//             <MessageSquare className="h-4 w-4 text-muted-foreground" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold">{totalSessions}</div>
//           </CardContent>
//         </Card>
//         <Card className="border-border/50 bg-card">
//           <CardHeader className="flex flex-row items-center justify-between pb-2">
//             <CardTitle className="text-sm font-medium text-muted-foreground">Voice Sessions</CardTitle>
//             <Mic className="h-4 w-4 text-muted-foreground" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold">0</div>
//           </CardContent>
//         </Card>
//       </div>

//       {/* Quick Actions */}
//       <div className="grid gap-6 md:grid-cols-2 mb-8">
//         <Card className="border-border/50 bg-card group hover:border-primary/50 transition-colors">
//           <CardHeader>
//             <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4 group-hover:glow-cyan-sm transition-all">
//               <MessageSquare className="h-6 w-6 text-primary" />
//             </div>
//             <CardTitle>AI Sales Coach</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <p className="text-muted-foreground mb-4">
//               Practice sales conversations with our intelligent AI coach. Get instant feedback and improve your pitch.
//             </p>
//             <Button asChild className="group/btn">
//               <Link href="/dashboard/ai-agent">
//                 Start Practice
//                 <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
//               </Link>
//             </Button>
//           </CardContent>
//         </Card>

//         <Card className="border-border/50 bg-card group hover:border-primary/50 transition-colors">
//           <CardHeader>
//             <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4 group-hover:glow-cyan-sm transition-all">
//               <Mic className="h-6 w-6 text-primary" />
//             </div>
//             <CardTitle>Voice Training</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <p className="text-muted-foreground mb-4">
//               Practice your pitch delivery with voice-enabled training. Speak naturally and get real-time feedback.
//             </p>
//             <Button asChild variant="outline" className="group/btn bg-transparent">
//               <Link href="/dashboard/voice">
//                 Try Voice Mode
//                 <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
//               </Link>
//             </Button>
//           </CardContent>
//         </Card>
//       </div>

//       {/* Recent Activity */}
//       <Card className="border-border/50 bg-card">
//         <CardHeader>
//           <CardTitle>Recent Activity</CardTitle>
//         </CardHeader>
//         <CardContent>
//           {sessions && sessions.length > 0 ? (
//             <div className="space-y-4">
//               {sessions.map((session) => (
//                 <div
//                   key={session.id}
//                   className="flex items-center justify-between border-b border-border/50 pb-4 last:border-0 last:pb-0"
//                 >
//                   <div className="flex items-center gap-3">
//                     <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
//                       <MessageSquare className="h-5 w-5 text-muted-foreground" />
//                     </div>
//                     <div>
//                       <p className="font-medium capitalize">{session.session_type} Practice</p>
//                       <p className="text-sm text-muted-foreground">
//                         {new Date(session.created_at).toLocaleDateString()}
//                       </p>
//                     </div>
//                   </div>
//                   {session.score && <div className="text-sm font-medium text-primary">{session.score}%</div>}
//                 </div>
//               ))}
//             </div>
//           ) : (
//             <div className="text-center py-8">
//               <p className="text-muted-foreground mb-4">No practice sessions yet. Start your first session!</p>
//               <Button asChild>
//                 <Link href="/dashboard/ai-agent">Start Learning</Link>
//               </Button>
//             </div>
//           )}
//         </CardContent>
//       </Card>
//     </div>
//   )
// }



import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { MessageSquare, Mic, Clock, Trophy, ArrowRight } from "lucide-react"

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  /* ===================================================== */
  /* 📊 COUNT AI CHAT SESSIONS */
  /* ===================================================== */

  const { count: chatCount } = await supabase
    .from("chat_sessions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)

  /* ===================================================== */
  /* 🎤 COUNT VOICE SESSIONS */
  /* ===================================================== */

  const { count: voiceCount } = await supabase
    .from("practice_sessions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("session_type", "voice")

  /* ===================================================== */
  /* 📈 GET RECENT PRACTICE SESSIONS (FOR ACTIVITY) */
  /* ===================================================== */

  const { data: recentSessions } = await supabase
    .from("practice_sessions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5)

  /* ===================================================== */
  /* 🧮 CALCULATIONS */
  /* ===================================================== */

  const totalSessions =
    (chatCount || 0) + (voiceCount || 0)

  const avgScore =
    recentSessions && recentSessions.length > 0
      ? Math.round(
          recentSessions.reduce(
            (acc, s) => acc + (s.score || 0),
            0
          ) / recentSessions.length
        )
      : 0

  const userName =
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    "there"

  return (
    <div>
      {/* ============================= */}
      {/* HEADER */}
      {/* ============================= */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          Welcome back, {userName}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Ready to sharpen your sales skills today?
        </p>
      </div>

      {/* ============================= */}
      {/* QUICK STATS */}
      {/* ============================= */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        {/* TOTAL */}
        <Card className="border-border/50 bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Sessions
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalSessions}
            </div>
          </CardContent>
        </Card>

        {/* AVERAGE SCORE */}
        <Card className="border-border/50 bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Score
            </CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {avgScore}%
            </div>
          </CardContent>
        </Card>

        {/* AI CHAT COUNT */}
        <Card className="border-border/50 bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              AI Chats
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {chatCount || 0}
            </div>
          </CardContent>
        </Card>

        {/* VOICE COUNT */}
        <Card className="border-border/50 bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Voice Sessions
            </CardTitle>
            <Mic className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {voiceCount || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ============================= */}
      {/* RECENT ACTIVITY */}
      {/* ============================= */}
      <Card className="border-border/50 bg-card">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {recentSessions && recentSessions.length > 0 ? (
            <div className="space-y-4">
              {recentSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between border-b border-border/50 pb-4 last:border-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      {session.session_type === "voice" ? (
                        <Mic className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <MessageSquare className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium capitalize">
                        {session.session_type} Practice
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(
                          session.created_at
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {session.score && (
                    <div className="text-sm font-medium text-primary">
                      {session.score}%
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                No sessions yet. Start your first session!
              </p>
              <Button asChild>
                <Link href="/dashboard/ai-agent">
                  Start Learning
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
