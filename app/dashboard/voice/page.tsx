// "use client"

// import { useState } from "react"
// import { Button } from "@/components/ui/button"
// import { Card } from "@/components/ui/card"
// import { Mic, Volume2, Bot } from "lucide-react"
// import { cn } from "@/lib/utils"

// export default function VoiceTrainingPage() {
//   const [listening, setListening] = useState(false)
//   const [speaking, setSpeaking] = useState(false)
//   const [aiText, setAiText] = useState("")

//   const speak = () => {
//     const SpeechRecognition =
//       (window as any).SpeechRecognition ||
//       (window as any).webkitSpeechRecognition

//     if (!SpeechRecognition) {
//       alert("Speech Recognition not supported")
//       return
//     }

//     const recognition = new SpeechRecognition()
//     recognition.lang = "en-US"
//     recognition.start()
//     setListening(true)
//     setAiText("")

//     recognition.onresult = async (event: any) => {
//       const transcript = event.results[0][0].transcript
//       setListening(false)

//       const res = await fetch("/api/voice/chat", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ text: transcript }),
//       })

//       const data = await res.json()
//       setAiText(data.reply)

//       const utterance = new SpeechSynthesisUtterance(data.reply)
//       utterance.rate = 1.2
//       utterance.pitch = 1.05
//       utterance.onstart = () => setSpeaking(true)
//       utterance.onend = () => setSpeaking(false)

//       speechSynthesis.cancel()
//       speechSynthesis.speak(utterance)
//     }

//     recognition.onerror = () => {
//       setListening(false)
//     }
//   }

//   return (
//     <div className="mx-auto max-w-3xl space-y-6">
//       {/* Header */}
//       <div>
//         <h1 className="text-2xl font-semibold">Voice Training</h1>
//         <p className="text-sm text-muted-foreground">
//           Practice your sales pitch with voice-enabled AI coaching
//         </p>
//       </div>

//       {/* Main Card */}
//       <Card className="flex flex-col items-center justify-center gap-6 p-10 text-center">
//         {/* Mic Button */}
//         <Button
//           size="lg"
//           onClick={speak}
//           className={cn(
//             "h-20 w-20 rounded-full",
//             listening && "animate-pulse bg-red-500 hover:bg-red-500"
//           )}
//         >
//           <Mic className="h-8 w-8" />
//         </Button>

//         {/* Status */}
//         <div className="text-sm font-medium">
//           {listening && "Listening..."}
//           {!listening && !speaking && "Tap to speak"}
//           {speaking && (
//             <span className="flex items-center gap-2">
//               <Volume2 className="h-4 w-4 animate-pulse" />
//               AI is speaking
//             </span>
//           )}
//         </div>
//       </Card>

//       {/* AI Response */}
//       {aiText && (
//         <Card className="p-5">
//           <div className="flex gap-3">
//             <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
//               <Bot className="h-5 w-5 text-primary" />
//             </div>
//             <div className="text-sm leading-relaxed whitespace-pre-wrap">
//               {aiText}
//             </div>
//           </div>
//         </Card>
//       )}
//     </div>
//   )
// }




"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Mic, Volume2, Bot } from "lucide-react"
import { cn } from "@/lib/utils"

export default function VoiceTrainingPage() {
  const [listening, setListening] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [aiText, setAiText] = useState("")

  const speak = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      alert("Speech Recognition not supported")
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = "en-US"
    recognition.start()
    setListening(true)
    setAiText("")

    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript
      setListening(false)

      const res = await fetch("/api/voice/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: transcript }),
      })

      const data = await res.json()
      setAiText(data.reply)

      const utterance = new SpeechSynthesisUtterance(data.reply)
      utterance.rate = 1.2
      utterance.pitch = 1.05
      utterance.onstart = () => setSpeaking(true)
      utterance.onend = () => setSpeaking(false)

      speechSynthesis.cancel()
      speechSynthesis.speak(utterance)
    }

    recognition.onerror = () => {
      setListening(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Voice Training</h1>
        <p className="text-sm text-muted-foreground">
          Practice your sales pitch with voice-enabled AI coaching
        </p>
      </div>

      {/* Main Card */}
      <Card className="flex flex-col items-center justify-center gap-6 p-10 text-center">
        {/* Mic Button */}
        <Button
          size="lg"
          onClick={speak}
          className={cn(
            "h-20 w-20 rounded-full",
            listening && "animate-pulse bg-red-500 hover:bg-red-500"
          )}
        >
          <Mic className="h-8 w-8" />
        </Button>

        {/* Status */}
        <div className="text-sm font-medium">
          {listening && "Listening..."}
          {!listening && !speaking && "Tap to speak"}
          {speaking && (
            <span className="flex items-center gap-2">
              <Volume2 className="h-4 w-4 animate-pulse" />
              AI is speaking
            </span>
          )}
        </div>
      </Card>

      {/* AI Response */}
      {aiText && (
        <Card className="p-5">
          <div className="flex gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div className="text-sm leading-relaxed whitespace-pre-wrap">
              {aiText}
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
