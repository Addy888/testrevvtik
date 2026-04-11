import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name) => cookieStore.get(name)?.value,
          set: () => {},
          remove: () => {},
        },
      }
    )

    // ✅ Auth check
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(new URL("/login", req.url))
    }

    // ✅ Get App User mapping to company
    const { data: appUser } = await supabase
      .from("app_users")
      .select("company_id")
      .eq("id", user.id)
      .single()

    // Fallback: if user has no company_id yet, use their own user.id as the company scoping key
    const company_id = appUser?.company_id ?? user.id;
    console.log("Zoom connect: using company_id =", company_id);

    const ZOOM_CLIENT_ID = process.env.ZOOM_CLIENT_ID;
    
    // Vercel / Next.js absolute URL handling
    const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
    const ZOOM_REDIRECT_URI = `${origin}/api/integrations/zoom/callback`;

    // Pass the company_id through the state parameter so we know who is integrating on the callback
    const state = JSON.stringify({ company_id });
    const encodedState = Buffer.from(state).toString('base64');

    const authUrl = `https://zoom.us/oauth/authorize?response_type=code&client_id=${ZOOM_CLIENT_ID}&redirect_uri=${encodeURIComponent(ZOOM_REDIRECT_URI)}&state=${encodeURIComponent(encodedState)}`;

    return NextResponse.redirect(authUrl);

  } catch (err: any) {
    console.error("ZOOM CONNECT ERROR:", err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
