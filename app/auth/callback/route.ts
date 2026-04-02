import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function GET(request: Request) {
  const reqUrl = new URL(request.url)
  const code = reqUrl.searchParams.get("code")

  if (!code) {
    return NextResponse.redirect(new URL("/auth/error", request.url))
  }

  // Important: we must attach Supabase's cookie changes to the redirect response
  // so the session is available immediately on the next request.
  const cookieStore = await cookies()
  const roleToPath = (role: string) => {
    if (role === "manager") return "/manager"
    if (role === "salesperson") return "/personal"
    return "/company"
  }
  const response = NextResponse.redirect(new URL("/company", request.url))

  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options)
        })
      },
    },
  })

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
  if (exchangeError) {
    response.headers.set("Location", new URL("/auth/error", request.url).toString())
    return response
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    response.headers.set("Location", new URL("/auth/login", request.url).toString())
    return response
  }

  const { data: appUser } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()

  const role = String(appUser?.role ?? "admin").toLowerCase()
  const redirectTo = roleToPath(role)
  response.headers.set("Location", new URL(redirectTo, request.url).toString())
  return response
}