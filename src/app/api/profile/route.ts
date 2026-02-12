import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { validateUsername } from "@/lib/username";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  let { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, email, image_url, providers, nickname_updated_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    ({ data, error } = await supabase
      .from("profiles")
      .select("id, display_name, email, image_url, providers")
      .eq("id", userId)
      .maybeSingle());
  }

  if (error) {
    console.error("profile fetch failed", error);
    return NextResponse.json(
      { error: "Profile fetch failed.", detail: error.message ?? String(error) },
      { status: 500 }
    );
  }

  return NextResponse.json({ profile: data });
}

export async function PATCH(request: NextRequest) {
  const userId = await getUserIdFromRequest(request);
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
    .ilike("display_name", username)
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

  const nowIso = new Date().toISOString();

  let { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("id, nickname_updated_at")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    ({ data: profileData } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle());
    profileError = null;
  }

  if (profileData?.nickname_updated_at) {
    const lastChange = new Date(profileData.nickname_updated_at);
    const diffMs = Date.now() - lastChange.getTime();
    const limitMs = 30 * 24 * 60 * 60 * 1000;
    if (diffMs < limitMs) {
      const nextDate = new Date(lastChange.getTime() + limitMs);
      return NextResponse.json(
        {
          error: `닉네임은 30일에 1회만 변경할 수 있어요. (${nextDate.toLocaleDateString("ko-KR")} 이후 가능)`,
        },
        { status: 429 }
      );
    }
  }

  let updateError = (
    await supabase
      .from("profiles")
      .update({
        display_name: username,
        nickname_updated_at: nowIso,
        last_seen_at: nowIso,
      })
      .eq("id", userId)
  ).error;

  if (updateError?.message?.includes("nickname_updated_at")) {
    updateError = (
      await supabase
        .from("profiles")
        .update({
          display_name: username,
          last_seen_at: nowIso,
        })
        .eq("id", userId)
    ).error;
  }

  if (updateError) {
    return NextResponse.json({ error: "Update failed." }, { status: 500 });
  }

  return NextResponse.json({ username });
}
