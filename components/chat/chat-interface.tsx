// "use client"

// import { useState, useRef, useEffect } from "react"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Card } from "@/components/ui/card"
// import { ScrollArea } from "@/components/ui/scroll-area"
// import { Send, Bot, User, Loader2 } from "lucide-react"
// import { cn } from "@/lib/utils"

// type Message = {
//   id: string
//   role: "user" | "assistant"
//   text: string
// }

// const QUICK_PROMPTS = [
//   "Let's practice a cold call opening",
//   "Help me handle the 'too expensive' objection",
//   "Simulate a discovery call with a prospect",
//   "Practice closing techniques with me",
// ]

// export function ChatInterface() {
//   const [input, setInput] = useState("")
//   const [messages, setMessages] = useState<Message[]>([])
//   const [loading, setLoading] = useState(false)
//   const scrollRef = useRef<HTMLDivElement>(null)

//   useEffect(() => {
//     scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight)
//   }, [messages])

//   const sendMessage = async (text: string) => {
//     if (!text.trim() || loading) return

//     const userMsg: Message = {
//       id: crypto.randomUUID(),
//       role: "user",
//       text,
//     }

//     setMessages((prev) => [...prev, userMsg])
//     setInput("")
//     setLoading(true)

//     try {
//       const res = await fetch("/api/chat", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           messages: [{ role: "user", content: text }],
//         }),
//       })

//       const data = await res.json()

//       const aiMsg: Message = {
//         id: crypto.randomUUID(),
//         role: "assistant",
//         text: data.text, // ✅ YAHI FIX HAI
//       }

//       setMessages((prev) => [...prev, aiMsg])
//     } catch (err) {
//       console.error(err)
//     } finally {
//       setLoading(false)
//     }
//   }

//   return (
//     <Card className="flex h-[calc(100vh-12rem)] flex-col">
//       {/* Header */}
//       <div className="flex items-center gap-3 border-b p-4">
//         <Bot />
//         <div>
//           <h3 className="font-semibold">AI Sales Coach</h3>
//           <p className="text-xs text-muted-foreground">
//             {loading ? "Thinking..." : "Ready to help"}
//           </p>
//         </div>
//       </div>

//       {/* Messages */}
//       <ScrollArea className="flex-1 p-4" ref={scrollRef}>
//         {messages.length === 0 ? (
//           <div className="grid gap-2">
//             {QUICK_PROMPTS.map((p) => (
//               <Button key={p} variant="outline" onClick={() => sendMessage(p)}>
//                 {p}
//               </Button>
//             ))}
//           </div>
//         ) : (
//           <div className="space-y-4">
//             {messages.map((m) => (
//               <div
//                 key={m.id}
//                 className={cn(
//                   "flex gap-2",
//                   m.role === "user" ? "justify-end" : "justify-start"
//                 )}
//               >
//                 {m.role === "assistant" && <Bot />}
//                 <div className="max-w-[75%] rounded-lg bg-muted px-4 py-2">
//                   <p className="whitespace-pre-wrap text-sm">{m.text}</p>
//                 </div>
//                 {m.role === "user" && <User />}
//               </div>
//             ))}

//             {loading && (
//               <div className="flex gap-2">
//                 <Bot />
//                 <Loader2 className="animate-spin" />
//               </div>
//             )}
//           </div>
//         )}
//       </ScrollArea>

//       {/* Input */}
//       <form
//         onSubmit={(e) => {
//           e.preventDefault()
//           sendMessage(input)
//         }}
//         className="flex gap-2 border-t p-4"
//       >
//         <Input
//           value={input}
//           onChange={(e) => setInput(e.target.value)}
//           placeholder="Type your message..."
//         />
//         <Button type="submit" disabled={loading}>
//           <Send />
//         </Button>
//       </form>
//     </Card>
//   )
// }



// "use client"

// import { useState, useRef, useEffect } from "react"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Card } from "@/components/ui/card"
// import { ScrollArea } from "@/components/ui/scroll-area"
// import { Send, Bot, User, Loader2, MoreHorizontal } from "lucide-react"
// import { cn } from "@/lib/utils"

// type Message = {
//   id: string
//   role: "user" | "assistant"
//   text: string
// }

// type Session = {
//   id: string
//   title: string
// }

// export function ChatInterface({
//   initialSessions,
// }: {
//   initialSessions: Session[]
// }) {
//   const [input, setInput] = useState("")
//   const [messages, setMessages] = useState<Message[]>([])
//   const [loading, setLoading] = useState(false)
//   const [sessionId, setSessionId] = useState<string | null>(null)
//   const [sessions, setSessions] = useState<Session[]>(initialSessions)

//   const scrollRef = useRef<HTMLDivElement>(null)

//   /* ============================= */
//   /* AUTO SCROLL */
//   /* ============================= */
//   useEffect(() => {
//     scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight)
//   }, [messages])

//   /* ============================= */
//   /* RESTORE ACTIVE SESSION */
//   /* ============================= */
//   useEffect(() => {
//     const savedSession = localStorage.getItem("activeSession")
//     if (savedSession) {
//       loadSession(savedSession)
//     }
//   }, [])

//   const loadSession = async (id: string) => {
//     setSessionId(id)
//     localStorage.setItem("activeSession", id)

//     const res = await fetch(`/api/chat/history?sessionId=${id}`)
//     const data = await res.json()

//     setMessages(
//       data.map((m: any) => ({
//         id: m.id,
//         role: m.role,
//         text: m.content,
//       }))
//     )
//   }

//   /* ============================= */
//   /* SEND MESSAGE */
//   /* ============================= */
//   const sendMessage = async (text: string) => {
//     if (!text.trim() || loading) return

//     const userMsg: Message = {
//       id: crypto.randomUUID(),
//       role: "user",
//       text,
//     }

//     const updatedMessages = [...messages, userMsg]
//     setMessages(updatedMessages)
//     setInput("")
//     setLoading(true)

//     try {
//       const res = await fetch("/api/chat", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           messages: updatedMessages.map((m) => ({
//             role: m.role,
//             content: m.text,
//           })),
//           sessionId,
//         }),
//       })

//       const data = await res.json()
//       if (!res.ok) throw new Error(data.error)

//       // Create new session
//       if (!sessionId && data.sessionId) {
//         setSessionId(data.sessionId)
//         localStorage.setItem("activeSession", data.sessionId)

//         setSessions((prev) => [
//           { id: data.sessionId, title: text.slice(0, 40) },
//           ...prev,
//         ])
//       }

//       const aiMsg: Message = {
//         id: crypto.randomUUID(),
//         role: "assistant",
//         text: data.text,
//       }

//       setMessages((prev) => [...prev, aiMsg])
//     } catch (err) {
//       console.error(err)
//     } finally {
//       setLoading(false)
//     }
//   }

//   /* ============================= */
//   /* DELETE SESSION */
//   /* ============================= */
//   const deleteSession = async (id: string) => {
//     await fetch(`/api/chat/delete?sessionId=${id}`, {
//       method: "DELETE",
//     })

//     setSessions((prev) => prev.filter((s) => s.id !== id))

//     if (id === sessionId) {
//       setMessages([])
//       setSessionId(null)
//       localStorage.removeItem("activeSession")
//     }
//   }

//   /* ============================= */
//   /* RENAME SESSION (NO PROMPT) */
//   /* ============================= */
//   const renameSession = async (id: string, newTitle: string) => {
//     if (!newTitle.trim()) return

//     await fetch("/api/chat/rename", {
//       method: "PATCH",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         sessionId: id,
//         title: newTitle,
//       }),
//     })

//     setSessions((prev) =>
//       prev.map((s) =>
//         s.id === id ? { ...s, title: newTitle } : s
//       )
//     )
//   }

//   const startNewChat = () => {
//     setSessionId(null)
//     setMessages([])
//     localStorage.removeItem("activeSession")
//   }

//   return (
//     <div className="flex h-[calc(100vh-12rem)] gap-4">
//       {/* ============================= */}
//       {/* SIDEBAR */}
//       {/* ============================= */}
//       <div className="w-64 border rounded-lg p-3 space-y-2">
//         <Button className="w-full" onClick={startNewChat}>
//           + New Chat
//         </Button>

//         <div className="mt-4 space-y-1">
//           {sessions.map((s) => (
//             <SessionRow
//               key={s.id}
//               session={s}
//               isActive={s.id === sessionId}
//               onSelect={() => loadSession(s.id)}
//               onRename={(newTitle) =>
//                 renameSession(s.id, newTitle)
//               }
//               onDelete={() => deleteSession(s.id)}
//             />
//           ))}
//         </div>
//       </div>

//       {/* ============================= */}
//       {/* CHAT AREA */}
//       {/* ============================= */}
//       <Card className="flex flex-1 flex-col">
//         <ScrollArea className="flex-1 p-4" ref={scrollRef}>
//           <div className="space-y-4">
//             {messages.map((m) => (
//               <div
//                 key={m.id}
//                 className={cn(
//                   "flex gap-2",
//                   m.role === "user"
//                     ? "justify-end"
//                     : "justify-start"
//                 )}
//               >
//                 {m.role === "assistant" && <Bot />}
//                 <div className="max-w-[75%] rounded-lg bg-muted px-4 py-2">
//                   <p className="whitespace-pre-wrap text-sm">
//                     {m.text}
//                   </p>
//                 </div>
//                 {m.role === "user" && <User />}
//               </div>
//             ))}

//             {loading && (
//               <div className="flex gap-2">
//                 <Bot />
//                 <Loader2 className="animate-spin" />
//               </div>
//             )}
//           </div>
//         </ScrollArea>

//         <form
//           onSubmit={(e) => {
//             e.preventDefault()
//             sendMessage(input)
//           }}
//           className="flex gap-2 border-t p-4"
//         >
//           <Input
//             value={input}
//             onChange={(e) => setInput(e.target.value)}
//             placeholder="Type your message..."
//           />
//           <Button type="submit" disabled={loading}>
//             <Send />
//           </Button>
//         </form>
//       </Card>
//     </div>
//   )
// }

// /* ===================================================== */
// /* SESSION ROW WITH INLINE RENAME (CHATGPT STYLE) */
// /* ===================================================== */

// function SessionRow({
//   session,
//   isActive,
//   onSelect,
//   onRename,
//   onDelete,
// }: {
//   session: Session
//   isActive: boolean
//   onSelect: () => void
//   onRename: (newTitle: string) => void
//   onDelete: () => void
// }) {
//   const [open, setOpen] = useState(false)
//   const [isEditing, setIsEditing] = useState(false)
//   const [title, setTitle] = useState(session.title)

//   const wrapperRef = useRef<HTMLDivElement>(null)
//   const inputRef = useRef<HTMLInputElement>(null)

//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (
//         wrapperRef.current &&
//         !wrapperRef.current.contains(event.target as Node)
//       ) {
//         setOpen(false)
//       }
//     }

//     document.addEventListener("mousedown", handleClickOutside)
//     return () =>
//       document.removeEventListener(
//         "mousedown",
//         handleClickOutside
//       )
//   }, [])

//   useEffect(() => {
//     if (isEditing) {
//       inputRef.current?.focus()
//       inputRef.current?.select()
//     }
//   }, [isEditing])

//   const handleSave = () => {
//     if (title.trim() && title !== session.title) {
//       onRename(title)
//     }
//     setIsEditing(false)
//   }

//   return (
//     <div
//       ref={wrapperRef}
//       className={cn(
//         "group relative flex items-center justify-between px-2 py-1 rounded-md",
//         isActive ? "bg-muted" : "hover:bg-muted/50"
//       )}
//     >
//       {isEditing ? (
//         <Input
//           ref={inputRef}
//           value={title}
//           onChange={(e) => setTitle(e.target.value)}
//           onBlur={handleSave}
//           onKeyDown={(e) => {
//             if (e.key === "Enter") handleSave()
//             if (e.key === "Escape") {
//               setTitle(session.title)
//               setIsEditing(false)
//             }
//           }}
//           className="h-7 text-sm"
//         />
//       ) : (
//         <button
//           className="flex-1 text-left truncate text-sm"
//           onClick={onSelect}
//         >
//           {session.title || "Untitled Chat"}
//         </button>
//       )}

//       {!isEditing && (
//         <button
//           onClick={(e) => {
//             e.stopPropagation()
//             setOpen((prev) => !prev)
//           }}
//           className="opacity-0 group-hover:opacity-100 transition-opacity p-1"
//         >
//           <MoreHorizontal size={16} />
//         </button>
//       )}

//       {open && !isEditing && (
//         <div
//           onClick={(e) => e.stopPropagation()}
//           className="absolute right-2 top-8 w-28 rounded-md border bg-background shadow-md z-50"
//         >
//           <button
//             onClick={() => {
//               setOpen(false)
//               setIsEditing(true)
//             }}
//             className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
//           >
//             Rename
//           </button>

//           <button
//             onClick={() => {
//               setOpen(false)
//               onDelete()
//             }}
//             className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-muted"
//           >
//             Delete
//           </button>
//         </div>
//       )}
//     </div>
//   )
// }


// "use client"

// import { useState, useRef, useEffect } from "react"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Card } from "@/components/ui/card"
// import { ScrollArea } from "@/components/ui/scroll-area"
// import { Send, Bot, User, Loader2, MoreHorizontal } from "lucide-react"
// import { cn } from "@/lib/utils"

// type Message = {
//   id: string
//   role: "user" | "assistant"
//   text: string
// }

// type Session = {
//   id: string
//   title: string
// }

// const QUICK_PROMPTS = [
//   "Let's practice a cold call opening",
//   "Help me handle the 'too expensive' objection",
//   "Simulate a discovery call with a prospect",
//   "Practice closing techniques with me",
// ]

// export function ChatInterface({
//   initialSessions,
//   initialSessionId,
// }: {
//   initialSessions: Session[]
//   initialSessionId?: string | null
// }) {
//   const [input, setInput] = useState("")
//   const [messages, setMessages] = useState<Message[]>([])
//   const [loading, setLoading] = useState(false)
//   const [sessionId, setSessionId] = useState<string | null>(null)
//   const [sessions, setSessions] = useState<Session[]>(initialSessions)

//   const scrollRef = useRef<HTMLDivElement>(null)

//   /* ============================= */
//   /* AUTO SCROLL */
//   /* ============================= */
//   useEffect(() => {
//     scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight)
//   }, [messages])

//   /* ============================= */
//   /* RESTORE SESSION (URL > localStorage) */
//   /* ============================= */
//   useEffect(() => {
//     const restoreSession = async () => {
//       // If redirected from History page
//       if (initialSessionId) {
//         await loadSession(initialSessionId)
//         return
//       }

//       // Otherwise restore from localStorage
//       const savedSession = localStorage.getItem("activeSession")
//       if (!savedSession) return

//       const exists = initialSessions.find((s) => s.id === savedSession)

//       if (exists) {
//         await loadSession(savedSession)
//       } else {
//         localStorage.removeItem("activeSession")
//       }
//     }

//     restoreSession()
//   }, [initialSessionId])

//   /* ============================= */
//   /* LOAD SESSION */
//   /* ============================= */
//   const loadSession = async (id: string) => {
//     try {
//       setSessionId(id)
//       localStorage.setItem("activeSession", id)
//       setMessages([])

//       const res = await fetch(`/api/chat/history?sessionId=${id}`)
//       if (!res.ok) throw new Error("Failed to load session")

//       const data = await res.json()

//       setMessages(
//         data.map((m: any) => ({
//           id: m.id,
//           role: m.role,
//           text: m.content,
//         }))
//       )
//     } catch (error) {
//       console.error("Session load failed:", error)
//     }
//   }

//   /* ============================= */
//   /* SEND MESSAGE */
//   /* ============================= */
//   const sendMessage = async (text: string) => {
//     if (!text.trim() || loading) return

//     const userMsg: Message = {
//       id: crypto.randomUUID(),
//       role: "user",
//       text,
//     }

//     const updatedMessages = [...messages, userMsg]
//     setMessages(updatedMessages)
//     setInput("")
//     setLoading(true)

//     try {
//       const res = await fetch("/api/chat", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           messages: updatedMessages.map((m) => ({
//             role: m.role,
//             content: m.text,
//           })),
//           sessionId,
//         }),
//       })

//       const data = await res.json()
//       if (!res.ok) throw new Error(data.error)

//       // If new session created
//       if (!sessionId && data.sessionId) {
//         setSessionId(data.sessionId)
//         localStorage.setItem("activeSession", data.sessionId)

//         setSessions((prev) => [
//           { id: data.sessionId, title: text.slice(0, 40) },
//           ...prev,
//         ])
//       }

//       const aiMsg: Message = {
//         id: crypto.randomUUID(),
//         role: "assistant",
//         text: data.text,
//       }

//       setMessages((prev) => [...prev, aiMsg])
//     } catch (error) {
//       console.error("Chat error:", error)
//     } finally {
//       setLoading(false)
//     }
//   }

//   /* ============================= */
//   /* DELETE SESSION */
//   /* ============================= */
//   const deleteSession = async (id: string) => {
//     try {
//       await fetch(`/api/chat/delete?sessionId=${id}`, {
//         method: "DELETE",
//       })

//       setSessions((prev) => prev.filter((s) => s.id !== id))

//       if (id === sessionId) {
//         setMessages([])
//         setSessionId(null)
//         localStorage.removeItem("activeSession")
//       }
//     } catch (error) {
//       console.error("Delete failed:", error)
//     }
//   }

//   /* ============================= */
//   /* RENAME SESSION */
//   /* ============================= */
//   const renameSession = async (id: string, newTitle: string) => {
//     if (!newTitle.trim()) return

//     try {
//       const res = await fetch("/api/chat/rename", {
//         method: "PATCH",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           sessionId: id,
//           title: newTitle,
//         }),
//       })

//       if (!res.ok) throw new Error("Rename failed")

//       setSessions((prev) =>
//         prev.map((s) =>
//           s.id === id ? { ...s, title: newTitle } : s
//         )
//       )
//     } catch (error) {
//       console.error("Rename failed:", error)
//     }
//   }

//   const startNewChat = () => {
//     setSessionId(null)
//     setMessages([])
//     localStorage.removeItem("activeSession")
//   }

//   return (
//     <div className="flex h-[calc(100vh-12rem)] gap-4">
//       {/* SIDEBAR */}
//       <div className="w-64 border rounded-lg p-3 space-y-2">
//         <Button className="w-full" onClick={startNewChat}>
//           + New Chat
//         </Button>

//         <div className="mt-4 space-y-1">
//           {sessions.map((s) => (
//             <SessionRow
//               key={s.id}
//               session={s}
//               isActive={s.id === sessionId}
//               onSelect={() => loadSession(s.id)}
//               onRename={(newTitle) =>
//                 renameSession(s.id, newTitle)
//               }
//               onDelete={() => deleteSession(s.id)}
//             />
//           ))}
//         </div>
//       </div>

//       {/* CHAT AREA */}
//       <Card className="flex flex-1 flex-col">
//         <ScrollArea className="flex-1 p-4" ref={scrollRef}>
//           {messages.length === 0 ? (
//             <div className="grid gap-2">
//               {QUICK_PROMPTS.map((p) => (
//                 <Button
//                   key={p}
//                   variant="outline"
//                   onClick={() => sendMessage(p)}
//                 >
//                   {p}
//                 </Button>
//               ))}
//             </div>
//           ) : (
//             <div className="space-y-4">
//               {messages.map((m) => (
//                 <div
//                   key={m.id}
//                   className={cn(
//                     "flex gap-2",
//                     m.role === "user"
//                       ? "justify-end"
//                       : "justify-start"
//                   )}
//                 >
//                   {m.role === "assistant" && <Bot />}
//                   <div className="max-w-[75%] rounded-lg bg-muted px-4 py-2">
//                     <p className="whitespace-pre-wrap text-sm">
//                       {m.text}
//                     </p>
//                   </div>
//                   {m.role === "user" && <User />}
//                 </div>
//               ))}

//               {loading && (
//                 <div className="flex gap-2">
//                   <Bot />
//                   <Loader2 className="animate-spin" />
//                 </div>
//               )}
//             </div>
//           )}
//         </ScrollArea>

//         <form
//           onSubmit={(e) => {
//             e.preventDefault()
//             sendMessage(input)
//           }}
//           className="flex gap-2 border-t p-4"
//         >
//           <Input
//             value={input}
//             onChange={(e) => setInput(e.target.value)}
//             placeholder="Type your message..."
//           />
//           <Button type="submit" disabled={loading}>
//             <Send />
//           </Button>
//         </form>
//       </Card>
//     </div>
//   )
// }

// /* ===================================================== */
// /* SESSION ROW COMPONENT */
// /* ===================================================== */

// function SessionRow({
//   session,
//   isActive,
//   onSelect,
//   onRename,
//   onDelete,
// }: {
//   session: Session
//   isActive: boolean
//   onSelect: () => void
//   onRename: (newTitle: string) => void
//   onDelete: () => void
// }) {
//   const [open, setOpen] = useState(false)
//   const [isEditing, setIsEditing] = useState(false)
//   const [title, setTitle] = useState(session.title)

//   const wrapperRef = useRef<HTMLDivElement>(null)
//   const inputRef = useRef<HTMLInputElement>(null)

//   // 🔥 Sync title when parent updates
//   useEffect(() => {
//     setTitle(session.title)
//   }, [session.title])

//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (
//         wrapperRef.current &&
//         !wrapperRef.current.contains(event.target as Node)
//       ) {
//         setOpen(false)
//       }
//     }

//     document.addEventListener("mousedown", handleClickOutside)
//     return () =>
//       document.removeEventListener(
//         "mousedown",
//         handleClickOutside
//       )
//   }, [])

//   useEffect(() => {
//     if (isEditing) {
//       inputRef.current?.focus()
//       inputRef.current?.select()
//     }
//   }, [isEditing])

//   const handleSave = () => {
//     if (title.trim() && title !== session.title) {
//       onRename(title)
//     }
//     setIsEditing(false)
//   }

//   return (
//     <div
//       ref={wrapperRef}
//       className={cn(
//         "group relative flex items-center justify-between px-2 py-1 rounded-md",
//         isActive ? "bg-muted" : "hover:bg-muted/50"
//       )}
//     >
//       {isEditing ? (
//         <Input
//           ref={inputRef}
//           value={title}
//           onChange={(e) => setTitle(e.target.value)}
//           onBlur={handleSave}
//           onKeyDown={(e) => {
//             if (e.key === "Enter") handleSave()
//             if (e.key === "Escape") {
//               setTitle(session.title)
//               setIsEditing(false)
//             }
//           }}
//           className="h-7 text-sm"
//         />
//       ) : (
//         <button
//           className="flex-1 text-left truncate text-sm"
//           onClick={onSelect}
//         >
//           {session.title || "Untitled Chat"}
//         </button>
//       )}

//       {!isEditing && (
//         <button
//           onClick={(e) => {
//             e.stopPropagation()
//             setOpen((prev) => !prev)
//           }}
//           className="opacity-0 group-hover:opacity-100 transition-opacity p-1"
//         >
//           <MoreHorizontal size={16} />
//         </button>
//       )}

//       {open && !isEditing && (
//         <div
//           onClick={(e) => e.stopPropagation()}
//           className="absolute right-2 top-8 w-28 rounded-md border bg-background shadow-md z-50"
//         >
//           <button
//             onClick={() => {
//               setOpen(false)
//               setIsEditing(true)
//             }}
//             className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
//           >
//             Rename
//           </button>

//           <button
//             onClick={() => {
//               setOpen(false)
//               onDelete()
//             }}
//             className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-muted"
//           >
//             Delete
//           </button>
//         </div>
//       )}
//     </div>
//   )
// }




// "use client"

// import { useState, useRef, useEffect } from "react"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Card } from "@/components/ui/card"
// import { ScrollArea } from "@/components/ui/scroll-area"
// import { Send, Bot, User, Loader2, MoreHorizontal } from "lucide-react"
// import { cn } from "@/lib/utils"

// type Message = {
//   id: string
//   role: "user" | "assistant"
//   text: string
// }

// type Session = {
//   id: string
//   title: string
// }

// const QUICK_PROMPTS = [
//   "Let's practice a cold call opening",
//   "Help me handle the 'too expensive' objection",
//   "Simulate a discovery call with a prospect",
//   "Practice closing techniques with me",
// ]

// export function ChatInterface({
//   initialSessions,
//   initialSessionId,
// }: {
//   initialSessions: Session[]
//   initialSessionId?: string | null
// }) {
//   const [input, setInput] = useState("")
//   const [messages, setMessages] = useState<Message[]>([])
//   const [loading, setLoading] = useState(false)
//   const [sessionId, setSessionId] = useState<string | null>(null)
//   const [sessions, setSessions] = useState<Session[]>(initialSessions)

//   const scrollRef = useRef<HTMLDivElement>(null)

//   /* ============================= */
//   /* AUTO SCROLL */
//   /* ============================= */
//   useEffect(() => {
//     scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight)
//   }, [messages])

//   /* ============================= */
//   /* RESTORE SESSION */
//   /* ============================= */
//   useEffect(() => {
//     const restoreSession = async () => {
//       if (initialSessionId) {
//         await loadSession(initialSessionId)
//         return
//       }

//       const savedSession = localStorage.getItem("activeSession")
//       if (!savedSession) return

//       const exists = initialSessions.find((s) => s.id === savedSession)

//       if (exists) {
//         await loadSession(savedSession)
//       } else {
//         localStorage.removeItem("activeSession")
//       }
//     }

//     restoreSession()
//   }, [initialSessionId])

//   /* ============================= */
//   /* LOAD SESSION */
//   /* ============================= */
//   const loadSession = async (id: string) => {
//     try {
//       setSessionId(id)
//       localStorage.setItem("activeSession", id)
//       setMessages([])

//       const res = await fetch(`/api/chat/history?sessionId=${id}`)
//       if (!res.ok) throw new Error("Failed to load session")

//       const data = await res.json()

//       setMessages(
//         data.map((m: any) => ({
//           id: m.id,
//           role: m.role,
//           text: m.content,
//         }))
//       )
//     } catch (error) {
//       console.error("Session load failed:", error)
//     }
//   }

//   /* ============================= */
//   /* SEND MESSAGE */
//   /* ============================= */
//   const sendMessage = async (text: string) => {
//     if (!text.trim() || loading) return

//     const userMsg: Message = {
//       id: crypto.randomUUID(),
//       role: "user",
//       text,
//     }

//     const updatedMessages = [...messages, userMsg]
//     setMessages(updatedMessages)
//     setInput("")
//     setLoading(true)

//     try {
//       const res = await fetch("/api/chat", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           messages: updatedMessages.map((m) => ({
//             role: m.role,
//             content: m.text,
//           })),
//           sessionId,
//         }),
//       })

//       const data = await res.json()
//       if (!res.ok) throw new Error(data.error)

//       if (!sessionId && data.sessionId) {
//         setSessionId(data.sessionId)
//         localStorage.setItem("activeSession", data.sessionId)

//         setSessions((prev) => [
//           { id: data.sessionId, title: text.slice(0, 40) },
//           ...prev,
//         ])
//       }

//       const aiMsg: Message = {
//         id: crypto.randomUUID(),
//         role: "assistant",
//         text: data.text,
//       }

//       setMessages((prev) => [...prev, aiMsg])
//     } catch (error) {
//       console.error("Chat error:", error)
//     } finally {
//       setLoading(false)
//     }
//   }

//   const deleteSession = async (id: string) => {
//     try {
//       await fetch(`/api/chat/delete?sessionId=${id}`, {
//         method: "DELETE",
//       })

//       setSessions((prev) => prev.filter((s) => s.id !== id))

//       if (id === sessionId) {
//         setMessages([])
//         setSessionId(null)
//         localStorage.removeItem("activeSession")
//       }
//     } catch (error) {
//       console.error("Delete failed:", error)
//     }
//   }

//   const renameSession = async (id: string, newTitle: string) => {
//     if (!newTitle.trim()) return

//     try {
//       const res = await fetch("/api/chat/rename", {
//         method: "PATCH",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           sessionId: id,
//           title: newTitle,
//         }),
//       })

//       if (!res.ok) throw new Error("Rename failed")

//       setSessions((prev) =>
//         prev.map((s) =>
//           s.id === id ? { ...s, title: newTitle } : s
//         )
//       )
//     } catch (error) {
//       console.error("Rename failed:", error)
//     }
//   }

//   const startNewChat = () => {
//     setSessionId(null)
//     setMessages([])
//     localStorage.removeItem("activeSession")
//   }

//   return (
//     <div className="flex h-[calc(100vh-12rem)] gap-4">

//       {/* SIDEBAR */}
//       <div className="w-64 border rounded-lg p-3 space-y-2">
//         <Button className="w-full" onClick={startNewChat}>
//           + New Chat
//         </Button>

//         <div className="mt-4 space-y-1">
//           {sessions.map((s) => (
//             <SessionRow
//               key={s.id}
//               session={s}
//               isActive={s.id === sessionId}
//               onSelect={() => loadSession(s.id)}
//               onRename={(newTitle: string) =>
//                 renameSession(s.id, newTitle)
//               }
//               onDelete={() => deleteSession(s.id)}
//             />
//           ))}
//         </div>
//       </div>

//       {/* CHAT AREA */}
//       <Card className="flex flex-1 flex-col overflow-hidden">

//         <ScrollArea className="flex-1 overflow-y-auto p-4" ref={scrollRef}>
//           {messages.length === 0 ? (
//             <div className="grid gap-2">
//               {QUICK_PROMPTS.map((p) => (
//                 <Button
//                   key={p}
//                   variant="outline"
//                   onClick={() => sendMessage(p)}
//                 >
//                   {p}
//                 </Button>
//               ))}
//             </div>
//           ) : (
//             <div className="space-y-4">
//               {messages.map((m) => (
//                 <div
//                   key={m.id}
//                   className={cn(
//                     "flex gap-2 w-full",
//                     m.role === "user"
//                       ? "justify-end"
//                       : "justify-start"
//                   )}
//                 >
//                   {m.role === "assistant" && <Bot />}

//                   <div className="max-w-[70%] rounded-2xl bg-muted px-4 py-3 break-words overflow-hidden">
//                     <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
//                       {m.text}
//                     </p>
//                   </div>

//                   {m.role === "user" && <User />}
//                 </div>
//               ))}

//               {loading && (
//                 <div className="flex gap-2">
//                   <Bot />
//                   <Loader2 className="animate-spin" />
//                 </div>
//               )}
//             </div>
//           )}
//         </ScrollArea>

//         <form
//           onSubmit={(e) => {
//             e.preventDefault()
//             sendMessage(input)
//           }}
//           className="flex gap-2 border-t p-4"
//         >
//           <Input
//             value={input}
//             onChange={(e) => setInput(e.target.value)}
//             placeholder="Type your message..."
//           />
//           <Button type="submit" disabled={loading}>
//             <Send />
//           </Button>
//         </form>
//       </Card>
//     </div>
//   )
// }

// /* ============================= */
// /* SESSION ROW COMPONENT */
// /* ============================= */

// function SessionRow({
//   session,
//   isActive,
//   onSelect,
//   onRename,
//   onDelete,
// }: {
//   session: Session
//   isActive: boolean
//   onSelect: () => void
//   onRename: (newTitle: string) => void
//   onDelete: () => void
// }) {
//   const [open, setOpen] = useState(false)
//   const [isEditing, setIsEditing] = useState(false)
//   const [title, setTitle] = useState(session.title)

//   const wrapperRef = useRef<HTMLDivElement>(null)
//   const inputRef = useRef<HTMLInputElement>(null)

//   useEffect(() => {
//     setTitle(session.title)
//   }, [session.title])

//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (
//         wrapperRef.current &&
//         !wrapperRef.current.contains(event.target as Node)
//       ) {
//         setOpen(false)
//       }
//     }

//     document.addEventListener("mousedown", handleClickOutside)
//     return () =>
//       document.removeEventListener("mousedown", handleClickOutside)
//   }, [])

//   useEffect(() => {
//     if (isEditing) {
//       inputRef.current?.focus()
//       inputRef.current?.select()
//     }
//   }, [isEditing])

//   const handleSave = () => {
//     if (title.trim() && title !== session.title) {
//       onRename(title)
//     }
//     setIsEditing(false)
//   }

//   return (
//     <div
//       ref={wrapperRef}
//       className={cn(
//         "group relative flex items-center justify-between px-2 py-1 rounded-md",
//         isActive ? "bg-muted" : "hover:bg-muted/50"
//       )}
//     >
//       {isEditing ? (
//         <Input
//           ref={inputRef}
//           value={title}
//           onChange={(e) => setTitle(e.target.value)}
//           onBlur={handleSave}
//           onKeyDown={(e) => {
//             if (e.key === "Enter") handleSave()
//             if (e.key === "Escape") {
//               setTitle(session.title)
//               setIsEditing(false)
//             }
//           }}
//           className="h-7 text-sm"
//         />
//       ) : (
//         <button
//           className="flex-1 text-left truncate text-sm"
//           onClick={onSelect}
//         >
//           {session.title || "Untitled Chat"}
//         </button>
//       )}

//       {!isEditing && (
//         <button
//           onClick={(e) => {
//             e.stopPropagation()
//             setOpen((prev) => !prev)
//           }}
//           className="opacity-0 group-hover:opacity-100 transition-opacity p-1"
//         >
//           <MoreHorizontal size={16} />
//         </button>
//       )}

//       {open && !isEditing && (
//         <div className="absolute right-2 top-8 w-28 rounded-md border bg-background shadow-md z-50">
//           <button
//             onClick={() => {
//               setOpen(false)
//               setIsEditing(true)
//             }}
//             className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
//           >
//             Rename
//           </button>

//           <button
//             onClick={() => {
//               setOpen(false)
//               onDelete()
//             }}
//             className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-muted"
//           >
//             Delete
//           </button>
//         </div>
//       )}
//     </div>
//   )
// }






"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Bot, User, Loader2, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"

type Message = {
  id: string
  role: "user" | "assistant"
  text: string
}

type Session = {
  id: string
  title: string
}

const QUICK_PROMPTS = [
  "Let's practice a cold call opening",
  "Help me handle the 'too expensive' objection",
  "Simulate a discovery call with a prospect",
  "Practice closing techniques with me",
]

export function ChatInterface({
  initialSessions,
  initialSessionId,
}: {
  initialSessions: Session[]
  initialSessionId?: string | null
}) {
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sessions, setSessions] = useState<Session[]>(initialSessions)

  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight)
  }, [messages])

  useEffect(() => {
    const restoreSession = async () => {
      if (initialSessionId) {
        await loadSession(initialSessionId)
        return
      }

      const savedSession = localStorage.getItem("activeSession")
      if (!savedSession) return

      const exists = initialSessions.find((s) => s.id === savedSession)

      if (exists) {
        await loadSession(savedSession)
      } else {
        localStorage.removeItem("activeSession")
      }
    }

    restoreSession()
  }, [initialSessionId])

  const loadSession = async (id: string) => {
    try {
      setSessionId(id)
      localStorage.setItem("activeSession", id)
      setMessages([])

      const res = await fetch(`/api/chat/history?sessionId=${id}`)
      if (!res.ok) throw new Error("Failed to load session")

      const data = await res.json()

      setMessages(
        data.map((m: any) => ({
          id: m.id,
          role: m.role,
          text: m.content,
        }))
      )
    } catch (error) {
      console.error("Session load failed:", error)
    }
  }

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      text,
    }

    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setInput("")
    setLoading(true)

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.text,
          })),
          sessionId,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      if (!sessionId && data.sessionId) {
        setSessionId(data.sessionId)
        localStorage.setItem("activeSession", data.sessionId)

        setSessions((prev) => [
          { id: data.sessionId, title: text.slice(0, 40) },
          ...prev,
        ])
      }

      const aiMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        text: data.text,
      }

      setMessages((prev) => [...prev, aiMsg])
    } catch (error) {
      console.error("Chat error:", error)
    } finally {
      setLoading(false)
    }
  }

  const deleteSession = async (id: string) => {
    try {
      await fetch(`/api/chat/delete?sessionId=${id}`, {
        method: "DELETE",
      })

      setSessions((prev) => prev.filter((s) => s.id !== id))

      if (id === sessionId) {
        setMessages([])
        setSessionId(null)
        localStorage.removeItem("activeSession")
      }
    } catch (error) {
      console.error("Delete failed:", error)
    }
  }

  const renameSession = async (id: string, newTitle: string) => {
    if (!newTitle.trim()) return

    try {
      const res = await fetch("/api/chat/rename", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: id,
          title: newTitle,
        }),
      })

      if (!res.ok) throw new Error("Rename failed")

      setSessions((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, title: newTitle } : s
        )
      )
    } catch (error) {
      console.error("Rename failed:", error)
    }
  }

  const startNewChat = () => {
    setSessionId(null)
    setMessages([])
    localStorage.removeItem("activeSession")
  }

  return (

    /* 🔥 FIXED RESPONSIVE CONTAINER */
    <div className="flex flex-col md:flex-row h-[calc(100vh-12rem)] gap-4">

      {/* SIDEBAR */}
      <div className="w-full md:w-64 border rounded-lg p-3 space-y-2">

        <Button className="w-full" onClick={startNewChat}>
          + New Chat
        </Button>

        <div className="mt-4 space-y-1">
          {sessions.map((s) => (
            <SessionRow
              key={s.id}
              session={s}
              isActive={s.id === sessionId}
              onSelect={() => loadSession(s.id)}
              onRename={(newTitle: string) =>
                renameSession(s.id, newTitle)
              }
              onDelete={() => deleteSession(s.id)}
            />
          ))}
        </div>
      </div>

      {/* CHAT AREA */}
      <Card className="flex flex-1 flex-col overflow-hidden">

        <ScrollArea className="flex-1 overflow-y-auto p-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="grid gap-2">
              {QUICK_PROMPTS.map((p) => (
                <Button
                  key={p}
                  variant="outline"
                  onClick={() => sendMessage(p)}
                >
                  {p}
                </Button>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={cn(
                    "flex gap-2 w-full",
                    m.role === "user"
                      ? "justify-end"
                      : "justify-start"
                  )}
                >
                  {m.role === "assistant" && <Bot />}

                  <div className="max-w-[70%] rounded-2xl bg-muted px-4 py-3 break-words overflow-hidden">
                    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                      {m.text}
                    </p>
                  </div>

                  {m.role === "user" && <User />}
                </div>
              ))}

              {loading && (
                <div className="flex gap-2">
                  <Bot />
                  <Loader2 className="animate-spin" />
                </div>
              )}
            </div>
          )}
        </ScrollArea>

          {/* 🔥 INPUT FIX */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            sendMessage(input)
          }}
          className="flex w-full gap-2 border-t p-4"
        >
          <Input
            className="flex-1"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
          />

          <Button type="submit" disabled={loading}>
            <Send />
          </Button>
        </form>
      </Card>
    </div>
  )
}
/* ============================= */
/* SESSION ROW COMPONENT */
/* ============================= */

function SessionRow({
  session,
  isActive,
  onSelect,
  onRename,
  onDelete,
}: {
  session: Session
  isActive: boolean
  onSelect: () => void
  onRename: (newTitle: string) => void
  onDelete: () => void
}) {
  const [open, setOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(session.title)

  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setTitle(session.title)
  }, [session.title])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () =>
      document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [isEditing])

  const handleSave = () => {
    if (title.trim() && title !== session.title) {
      onRename(title)
    }
    setIsEditing(false)
  }

  return (
    <div
      ref={wrapperRef}
      className={cn(
        "group relative flex items-center justify-between px-2 py-1 rounded-md",
        isActive ? "bg-muted" : "hover:bg-muted/50"
      )}
    >
      {isEditing ? (
        <Input
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave()
            if (e.key === "Escape") {
              setTitle(session.title)
              setIsEditing(false)
            }
          }}
          className="h-7 text-sm"
        />
      ) : (
        <button
          className="flex-1 text-left truncate text-sm"
          onClick={onSelect}
        >
          {session.title || "Untitled Chat"}
        </button>
      )}

      {!isEditing && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            setOpen((prev) => !prev)
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1"
        >
          <MoreHorizontal size={16} />
        </button>
      )}

      {open && !isEditing && (
        <div className="absolute right-2 top-8 w-28 rounded-md border bg-background shadow-md z-50">
          <button
            onClick={() => {
              setOpen(false)
              setIsEditing(true)
            }}
            className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
          >
            Rename
          </button>

          <button
            onClick={() => {
              setOpen(false)
              onDelete()
            }}
            className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-muted"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  )
}