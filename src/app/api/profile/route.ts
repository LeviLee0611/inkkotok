import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { validateUsername } from "@/lib/username";

export const runtime = "edge";

const SECURE_COOKIE = "__Secure-authjs.session-token";
const DEV_COOKIE = "authjs.session-token";

async function getUserId(request: NextRequest) {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret) return null;

  const token =
    (await getToken({
      req: request,
      secret,
      cookieName: SECURE_COOKIE,
    })) ??
    (await getToken({
      req: request,
      secret,
      cookieName: DEV_COOKIE,
    }));

  return token?.sub ?? null;
}

export async function GET(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, email, image_url, providers, created_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Profile fetch failed." }, { status: 500 });
  }

  return NextResponse.json({ profile: data });
}

export async function PATCH(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | { username?: string }
    | null;
  const username = body?.username?.trim() ?? "";

  const validation = validateUsername(username);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.reason }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const { data: existing, error: existingError } = await supabase
    .from("profiles")
    .select("id")
    .eq("display_name", username)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json({ error: "Validation failed." }, { status: 500 });
  }

  if (existing && existing.id !== userId) {
    return NextResponse.json(
      { error: "이미 사용 중인 닉네임이에요." },
      { status: 409 }
    );
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      display_name: username,
      last_seen_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (updateError) {
    return NextResponse.json({ error: "Update failed." }, { status: 500 });
  }

  return NextResponse.json({ username });
}
