import { NextResponse } from "next/server"
import { logger } from "./logger"

export function handleError(error: any) {

  logger.error("Server Error", error)

  return NextResponse.json(
    {
      success: false,
      message: "Internal Server Error"
    },
    { status: 500 }
  )
}