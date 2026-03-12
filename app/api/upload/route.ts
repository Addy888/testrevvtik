// import { NextResponse } from "next/server"

// export async function POST(req: Request) {

//   const formData = await req.formData()

//   const file = formData.get("file") as File

//   if (!file) {
//     return NextResponse.json(
//       { error: "No file" },
//       { status: 400 }
//     )
//   }

//   console.log("UPLOAD OK:", file.name)

//   return NextResponse.json({
//     text: `✅ File ${file.name} received`
//   })

// }




import { NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"

/* ✅ IMPORTANT for file upload in Next 15/16 */
export const runtime = "nodejs"

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get("file")

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { text: "❌ No file uploaded" },
        { status: 400 }
      )
    }

    /* ⭐ SAFE TEXT READ */
    const text = await file.text()

    if (!text || text.trim().length < 5) {
      return NextResponse.json({
        text: "⚠️ File content empty or unreadable",
      })
    }

    /* ⭐ CLAUDE CALL */
    const response = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 700,
      messages: [
        {
          role: "user",
          content: `Analyze this sales document and give coaching insights:\n${text}`,
        },
      ],
    })

    let aiText = "⚠️ AI could not generate response"

    if (response.content && response.content.length > 0) {
      const block = response.content[0]
      if (block.type === "text") {
        aiText = block.text
      }
    }

    return NextResponse.json({
      text: aiText,
    })
  } catch (err) {
    console.error("UPLOAD ERROR:", err)

    return NextResponse.json(
      {
        text: "❌ Server error during file analysis",
      },
      { status: 500 }
    )
  }
}