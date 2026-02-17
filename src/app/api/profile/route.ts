import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, isAdminUser } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { validateUsername } from "@/lib/username";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = user.id;

  const supabase = getSupabaseAdmin();
  let { data: profileData, error } = await supabase
    .from("profiles")
    .select("id, display_name, email, image_url, providers, nickname_updated_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    ({ data: profileData, error } = await supabase
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

  const resolvedDisplayName = profileData?.display_name?.trim() || null;
  const resolvedEmail = profileData?.email ?? user.email ?? null;
  const resolvedImage = profileData?.image_url ?? user.picture ?? null;

  const admin = await isAdminUser(user);

  return NextResponse.json(
    {
      profile: profileData
        ? {
            ...profileData,
            display_name: resolvedDisplayName,
            email: resolvedEmail,
            image_url: resolvedImage,
          }
        : {
            id: userId,
            display_name: resolvedDisplayName,
            email: resolvedEmail,
            image_url: resolvedImage,
            providers: [user.provider],
            nickname_updated_at: null,
          },
      isAdmin: admin,
    },
    {
      headers: {
        "cache-control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}

export async function PATCH(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = user.id;

  try {
    const body = (await request.json().catch(() => null)) as
      | { username?: string }
      | null;
    const username = body?.username?.trim() ?? "";

    const validation = validateUsername(username);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.reason }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data: existingRows, error: existingError } = await supabase
      .from("profiles")
      .select("id")
      .ilike("display_name", username)
      .limit(10);

    if (existingError) {
      return NextResponse.json({ error: "Validation failed." }, { status: 500 });
    }

    const duplicate = (existingRows ?? []).find((row) => row.id !== userId);
    if (duplicate) {
      return NextResponse.json(
        { error: "이미 사용 중인 닉네임이에요." },
        { status: 409 }
      );
    }

    const nowIso = new Date().toISOString();

    let { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("id, display_name, nickname_updated_at")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) {
      ({ data: profileData } = await supabase
        .from("profiles")
        .select("id, display_name")
        .eq("id", userId)
        .maybeSingle());
      profileError = null;
    }

    if (profileData?.nickname_updated_at) {
      const currentDisplayName =
        typeof profileData.display_name === "string"
          ? profileData.display_name.trim()
          : "";
      if (currentDisplayName && currentDisplayName !== username) {
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
    }

    // If profile row doesn't exist yet, try minimal insert payloads first.
    if (!profileData) {
      const insertPayloads: Array<Record<string, string | null>> = [
        { id: userId, display_name: username },
        {
          id: userId,
          display_name: username,
          email: user.email ?? null,
          image_url: user.picture ?? null,
        },
        { id: userId, email: user.email ?? null, image_url: user.picture ?? null },
        { id: userId },
      ];

      let inserted = false;
      for (const payload of insertPayloads) {
        const result = await supabase.from("profiles").insert(payload);
        if (!result.error) {
          inserted = true;
          break;
        }
      }

      if (!inserted) {
        return NextResponse.json(
          { error: "프로필 초기화에 실패했어요. 잠시 후 다시 시도해주세요." },
          { status: 500 }
        );
      }
    }

    // Handle schema differences safely by progressively removing optional columns.
    const updatePayloads: Array<Record<string, string>> = [
      { display_name: username, nickname_updated_at: nowIso, last_seen_at: nowIso },
      { display_name: username, nickname_updated_at: nowIso },
      { display_name: username, last_seen_at: nowIso },
      { display_name: username },
    ];

    let updateError: { message?: string } | null = null;
    for (const payload of updatePayloads) {
      const result = await supabase.from("profiles").update(payload).eq("id", userId);
      if (!result.error) {
        updateError = null;
        break;
      }
      updateError = result.error;
    }

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message ?? "Update failed." },
        { status: 500 }
      );
    }

    return NextResponse.json({ username });
  } catch (error) {
    console.error("profile patch failed", error);
    return NextResponse.json(
      { error: "닉네임 저장 중 서버 오류가 발생했어요." },
      { status: 500 }
    );
  }
}
