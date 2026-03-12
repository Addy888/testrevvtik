// import { NextResponse } from "next/server"
// import { anthropic } from "@ai-sdk/anthropic"
// import { generateText } from "ai"

// export const runtime = "nodejs"

// export async function POST(req: Request) {
//   try {
//     const body = await req.json()
//     const messages = body.messages || []

//     const lastUserMessage =
//       messages[messages.length - 1]?.content || "Hello"

//     const result = await generateText({
//       model: anthropic("claude-3-haiku-20240307"),
//       system: `
// You are an AI Sales Coach.

// - Practice cold calls
// - Handle objections
// - Simulate discovery calls
// - Help with closing techniques

// Be realistic, practical, and conversational.
// `,
//       prompt: lastUserMessage,
//       maxOutputTokens: 800,
//     })

//     return NextResponse.json({
//       text: result.text,
//     })
//   } catch (error) {
//     console.error("CHAT API ERROR:", error)
//     return NextResponse.json(
//       { error: "Chat failed" },
//       { status: 500 }
//     )
//   }
// }



// import { NextResponse } from "next/server"
// import { anthropic } from "@ai-sdk/anthropic"
// import { generateText } from "ai"
// import { createClient } from "@/lib/supabase/server"

// export const runtime = "nodejs"

// export async function POST(req: Request) {
//   try {
//     const supabase = await createClient()

//     // 🔐 AUTH CHECK
//     const {
//       data: { user },
//       error: authError,
//     } = await supabase.auth.getUser()

//     if (!user || authError) {
//       return NextResponse.json(
//         { error: "Unauthorized" },
//         { status: 401 }
//       )
//     }

//     const body = await req.json()
//     const { messages, sessionId } = body

//     if (!Array.isArray(messages) || messages.length === 0) {
//       return NextResponse.json(
//         { error: "Invalid messages" },
//         { status: 400 }
//       )
//     }

//     const lastUserMessage =
//       messages[messages.length - 1]?.content?.trim()

//     if (!lastUserMessage) {
//       return NextResponse.json(
//         { error: "Empty message" },
//         { status: 400 }
//       )
//     }

//     let currentSessionId = sessionId

//     // ==========================================================
//     // CREATE SESSION IF NEEDED
//     // ==========================================================

//     if (!currentSessionId) {
//       let title = lastUserMessage.slice(0, 50)

//       try {
//         const titleResult = await generateText({
//           model: anthropic("claude-3-haiku-20240307"),
//           prompt: `Generate a short 4-6 word title for this conversation:\n\n${lastUserMessage}`,
//           maxOutputTokens: 20,
//         })

//         if (titleResult?.text) {
//           title = titleResult.text
//             .replace(/["']/g, "")
//             .trim()
//         }
//       } catch {
//         console.warn("Title generation failed — using fallback")
//       }

//       const { data: newSession, error } = await supabase
//         .from("chat_sessions")
//         .insert({
//           user_id: user.id,
//           title,
//         })
//         .select()
//         .single()

//       if (error || !newSession) {
//         return NextResponse.json(
//           { error: "Failed to create session" },
//           { status: 500 }
//         )
//       }

//       currentSessionId = newSession.id
//     }

//     // ==========================================================
//     // SAVE USER MESSAGE
//     // ==========================================================

//     const { error: userInsertError } = await supabase
//       .from("chat_messages")
//       .insert({
//         session_id: currentSessionId,
//         role: "user",
//         content: lastUserMessage,
//       })

//     if (userInsertError) {
//       return NextResponse.json(
//         { error: "Failed to save message" },
//         { status: 500 }
//       )
//     }

//     // ==========================================================
//     // GENERATE AI RESPONSE (FULL CONTEXT)
//     // ==========================================================

//     const conversationPrompt = messages
//       .map((m: any) => `${m.role}: ${m.content}`)
//       .join("\n")

//     const result = await generateText({
//       model: anthropic("claude-3-haiku-20240307"),
//       system: `
// You are an expert-level AI Sales Coach designed for professional sales training.

// Your scope is STRICTLY limited to:
// - Sales processes
// - Cold calling
// - Objection handling
// - Discovery calls
// - Closing techniques
// - Negotiation
// - Prospecting
// - B2B and B2C selling strategies
// - Communication and persuasion in sales

// You must NOT:
// - Answer questions outside of sales or communication skills
// - Provide general knowledge unrelated to sales
// - Provide coding help
// - Provide medical, legal, or financial advice
// - Use roleplay actions like "*smiles*" or "*clears throat*"
// - Use dramatic or theatrical expressions
// - Add unnecessary fluff

// If a user asks something outside your scope, respond with:
// "I'm designed specifically to help with sales training and sales strategy. Please ask a sales-related question."

// Response Guidelines:
// - Be clear and structured.
// - Be practical and actionable.
// - Use bullet points or numbered steps when helpful.
// - Keep explanations concise but insightful.
// - Give strong, confident guidance.
// - Avoid overly long generic explanations.

// If simulating a call, respond naturally as a real prospect would — without stage directions.

// Your tone:
// Professional, sharp, and direct — like a senior sales trainer at a high-performing company.
// `,
//       prompt: conversationPrompt,
//       maxOutputTokens: 800,
//     })

//     if (!result?.text) {
//       return NextResponse.json(
//         { error: "AI failed to respond" },
//         { status: 500 }
//       )
//     }

//     // ==========================================================
//     // SAVE ASSISTANT MESSAGE
//     // ==========================================================

//     const { error: aiInsertError } = await supabase
//       .from("chat_messages")
//       .insert({
//         session_id: currentSessionId,
//         role: "assistant",
//         content: result.text,
//       })

//     if (aiInsertError) {
//       return NextResponse.json(
//         { error: "Failed to save AI message" },
//         { status: 500 }
//       )
//     }

//     return NextResponse.json({
//       text: result.text,
//       sessionId: currentSessionId,
//     })
//   } catch (error) {
//     console.error("CHAT API ERROR:", error)
//     return NextResponse.json(
//       { error: "Chat failed" },
//       { status: 500 }
//     )
//   }
// }


import { NextResponse } from "next/server"
import { anthropic } from "@ai-sdk/anthropic"
import { generateText } from "ai"
import { createClient } from "@/lib/supabase/server"
import { rateLimit } from "@/lib/infra/rate-limit"   // ⭐ ADDED ONLY THIS

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {

    // ⭐ ADDED RATE LIMIT (ONLY ADD)
    const ip = req.headers.get("x-forwarded-for") || "unknown"

    if (!rateLimit(ip)) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429 }
      )
    }

    const supabase = await createClient()

    // 🔐 AUTH CHECK
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (!user || authError) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { messages, sessionId } = body

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Invalid messages" },
        { status: 400 }
      )
    }

    const lastUserMessage =
      messages[messages.length - 1]?.content?.trim()

    if (!lastUserMessage) {
      return NextResponse.json(
        { error: "Empty message" },
        { status: 400 }
      )
    }

    let currentSessionId = sessionId

    // ==========================================================
    // CREATE SESSION IF NEEDED
    // ==========================================================

    if (!currentSessionId) {
      let title = lastUserMessage.slice(0, 50)

      try {
        const titleResult = await generateText({
          model: anthropic("claude-3-haiku-20240307"),
          prompt: `Generate a short 4-6 word title for this conversation:\n\n${lastUserMessage}`,
          maxOutputTokens: 20,
        })

        if (titleResult?.text) {
          title = titleResult.text
            .replace(/["']/g, "")
            .trim()
        }
      } catch {
        console.warn("Title generation failed — using fallback")
      }

      const { data: newSession, error } = await supabase
        .from("chat_sessions")
        .insert({
          user_id: user.id,
          title,
        })
        .select()
        .single()

      if (error || !newSession) {
        return NextResponse.json(
          { error: "Failed to create session" },
          { status: 500 }
        )
      }

      currentSessionId = newSession.id
    }

    // ==========================================================
    // SAVE USER MESSAGE
    // ==========================================================

    const { error: userInsertError } = await supabase
      .from("chat_messages")
      .insert({
        session_id: currentSessionId,
        role: "user",
        content: lastUserMessage,
      })

    if (userInsertError) {
      return NextResponse.json(
        { error: "Failed to save message" },
        { status: 500 }
      )
    }

    // ==========================================================
    // GENERATE AI RESPONSE (FULL CONTEXT)
    // ==========================================================

    const conversationPrompt = messages
      .map((m: any) => `${m.role}: ${m.content}`)
      .join("\n")

    const result = await generateText({
      model: anthropic("claude-3-haiku-20240307"),
      system: `
You are an expert-level AI Sales Coach designed for professional sales training.

Your scope is STRICTLY limited to:
- Sales processes
- Cold calling
- Objection handling
- Discovery calls
- Closing techniques
- Negotiation
- Prospecting
- B2B and B2C selling strategies
- Communication and persuasion in sales

You must NOT:
- Answer questions outside of sales or communication skills
- Provide general knowledge unrelated to sales
- Provide coding help
- Provide medical, legal, or financial advice
- Use roleplay actions like "*smiles*" or "*clears throat*"
- Use dramatic or theatrical expressions
- Add unnecessary fluff

If a user asks something outside your scope, respond with:
"I'm designed specifically to help with sales training and sales strategy. Please ask a sales-related question."

Response Guidelines:
- Be clear and structured.
- Be practical and actionable.
- Use bullet points or numbered steps when helpful.
- Keep explanations concise but insightful.
- Give strong, confident guidance.
- Avoid overly long generic explanations.

If simulating a call, respond naturally as a real prospect would — without stage directions.

Your tone:
Professional, sharp, and direct — like a senior sales trainer at a high-performing company.
`,
      prompt: conversationPrompt,
      maxOutputTokens: 800,
    })

    if (!result?.text) {
      return NextResponse.json(
        { error: "AI failed to respond" },
        { status: 500 }
      )
    }

    // ==========================================================
    // SAVE ASSISTANT MESSAGE
    // ==========================================================

    const { error: aiInsertError } = await supabase
      .from("chat_messages")
      .insert({
        session_id: currentSessionId,
        role: "assistant",
        content: result.text,
      })

    if (aiInsertError) {
      return NextResponse.json(
        { error: "Failed to save AI message" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      text: result.text,
      sessionId: currentSessionId,
    })
  } catch (error) {
    console.error("CHAT API ERROR:", error)
    return NextResponse.json(
      { error: "Chat failed" },
      { status: 500 }
    )
  }
}