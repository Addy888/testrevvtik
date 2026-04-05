import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function GET(req: Request) {
  try {
    console.log("Callback hit");
    const { searchParams } = new URL(req.url)
    const code = searchParams.get("code")
    const encodedState = searchParams.get("state")
    
    if (!code) {
      return NextResponse.json({ error: "Missing authorization code" }, { status: 400 })
    }

    let company_id = null;
    try {
       if (encodedState) {
          const stateRaw = Buffer.from(encodedState, 'base64').toString('utf-8');
          const stateObj = JSON.parse(stateRaw);
          company_id = stateObj.company_id;
       }
    } catch(e) {
       console.error("Invalid state", e);
    }

    if (!company_id) {
       return NextResponse.json({ error: "Missing company origin state" }, { status: 400 })
    }

    const ZOOM_CLIENT_ID = process.env.ZOOM_CLIENT_ID;
    const ZOOM_CLIENT_SECRET = process.env.ZOOM_CLIENT_SECRET;
    
    const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
    const ZOOM_REDIRECT_URI = `${origin}/api/integrations/zoom/callback`;

    // Exchange token
    const tokenUrl = new URL("https://zoom.us/oauth/token");
    tokenUrl.searchParams.append("grant_type", "authorization_code");
    tokenUrl.searchParams.append("code", code);
    tokenUrl.searchParams.append("redirect_uri", ZOOM_REDIRECT_URI);

    const tokenAuth = Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`).toString("base64");

    const tokenRes = await fetch(tokenUrl.toString(), {
      method: "POST",
      headers: {
        "Authorization": `Basic ${tokenAuth}`,
        "Content-Type": "application/x-www-form-urlencoded"
      }
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok) {
       console.error("Zoom Token Exchange Failed:", tokenData);
       return NextResponse.json({ error: "Token exchange failed", details: tokenData }, { status: 500 });
    }

    const access_token = tokenData.access_token;
    const refresh_token = tokenData.refresh_token;

    console.log("Token received:", access_token);

    // Fetch Zoom account info so we can match webhook events back to this company
    let zoom_account_id: string | null = null;
    try {
      const meRes = await fetch("https://api.zoom.us/v2/users/me", {
        headers: { Authorization: `Bearer ${access_token}` }
      });
      if (meRes.ok) {
        const meData = await meRes.json();
        zoom_account_id = meData.account_id || null;
        console.log("Zoom account_id:", zoom_account_id);
      }
    } catch (e) {
      console.warn("Could not fetch Zoom user info:", e);
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role for backend logic
      {
        cookies: {
          get: (name) => cookieStore.get(name)?.value,
          set: () => {},
          remove: () => {},
        },
      }
    )

    // Save (or update) token + account_id to database using Service Role
    const { error: insertError } = await supabase
       .from("integrations")
       .upsert(
         {
           company_id,
           provider: 'zoom',
           access_token,
           refresh_token,
           ...(zoom_account_id ? { account_id: zoom_account_id } : {}),
         },
         { onConflict: 'company_id,provider' }
       );

    if (insertError) {
       console.error("Integration DB Error:", insertError);
       return NextResponse.json({ error: "Failed to save integration" }, { status: 500 });
    }

    // Redirect to the integration dashboard successfully!
    return NextResponse.redirect(`${origin}/dashboard/integrations?success=true`);

  } catch (err: any) {
    console.error("ZOOM CALLBACK ERROR:", err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
