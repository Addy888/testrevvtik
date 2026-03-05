// "use client"

// import { useEffect, useRef, useState } from "react"

// type Props = {
//   onResultAction?: (text: string) => void
// }

// export default function WebSpeechFallback({ onResultAction }: Props) {
//   const recognitionRef = useRef<any>(null)
//   const [listening, setListening] = useState(false)

//   useEffect(() => {
//     if (typeof window === "undefined") return

//     const SpeechRecognition =
//       (window as any).SpeechRecognition ||
//       (window as any).webkitSpeechRecognition

//     if (!SpeechRecognition) {
//       console.warn("Web Speech API not supported")
//       return
//     }

//     const recognition = new SpeechRecognition()
//     recognition.lang = "en-US"
//     recognition.continuous = false
//     recognition.interimResults = false

//     recognition.onstart = () => setListening(true)

//     recognition.onresult = (event: any) => {
//       const transcript = event.results[0][0].transcript
//       onResultAction?.(transcript)
//     }

//     recognition.onerror = () => setListening(false)
//     recognition.onend = () => setListening(false)

//     recognitionRef.current = recognition
//   }, [onResultAction])

//   const startListening = () => {
//     if (listening) return
//     recognitionRef.current?.start()
//   }

//   return (
//     <button
//       onClick={startListening}
//       disabled={listening}
//       className="rounded bg-gray-200 px-4 py-2"
//     >
//       {listening ? "Listening..." : "🎙 Speak"}
//     </button>
//   )
// }






"use client"

import { useEffect, useRef, useState } from "react"

type Props = {
  onResultAction?: (text: string) => void
}

export default function WebSpeechFallback({ onResultAction }: Props) {
  const recognitionRef = useRef<any>(null)
  const [listening, setListening] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      console.warn("Web Speech API not supported")
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = "en-US"
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onstart = () => setListening(true)

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      onResultAction?.(transcript)
    }

    recognition.onerror = () => setListening(false)
    recognition.onend = () => setListening(false)

    recognitionRef.current = recognition
  }, [onResultAction])

  const startListening = () => {
    if (listening) return
    recognitionRef.current?.start()
  }

  return (
    <button
      onClick={startListening}
      disabled={listening}
      className="rounded bg-gray-200 px-4 py-2"
    >
      {listening ? "Listening..." : "🎙 Speak"}
    </button>
  )
}
