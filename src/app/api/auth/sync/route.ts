import { NextRequest, NextResponse } from "next/server";

import { verifyFirebaseBearer } from "@/lib/firebase-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  const firebaseUser = await verifyFirebaseBearer(request.headers);
  if (!firebaseUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const nowIso = new Date().toISOString();

  const { data: existingUser, error: existingUserError } = await supabase
    .from("users")
    .select("id, deleted_at, display_name, email, photo_url")
    .eq("firebase_uid", firebaseUser.uid)
    .maybeSingle();

  if (existingUserError) {
    return NextResponse.json({ error: "Sync failed." }, { status: 500 });
  }

  if (existingUser?.deleted_at) {
    return NextResponse.json(
      { error: "삭제된 계정입니다. 복구가 필요해요." },
      { status: 403 }
    );
  }

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("display_name, email, image_url, providers")
    .eq("id", firebaseUser.uid)
    .maybeSingle();

  const resolvedDisplayName =
    existingProfile?.display_name?.trim() ||
    existingUser?.display_name?.trim() ||
    firebaseUser.name ||
    null;
  const resolvedEmail =
    firebaseUser.email ?? existingUser?.email ?? existingProfile?.email ?? null;
  const resolvedPhoto =
    firebaseUser.picture ??
    existingUser?.photo_url ??
    existingProfile?.image_url ??
    null;
  const providers = Array.from(
    new Set([...(existingProfile?.providers ?? []), firebaseUser.provider])
  );

  const { data: user, error: userUpsertError } = await supabase
    .from("users")
    .upsert(
      {
        firebase_uid: firebaseUser.uid,
        provider: firebaseUser.provider,
        email: resolvedEmail,
        display_name: resolvedDisplayName,
        photo_url: resolvedPhoto,
        last_login_at: nowIso,
        deleted_at: null,
      },
      { onConflict: "firebase_uid" }
    )
    .select(
      "id, firebase_uid, provider, email, display_name, photo_url, role, status, created_at, last_login_at"
    )
    .single();

  if (userUpsertError || !user) {
    return NextResponse.json({ error: "Sync failed." }, { status: 500 });
  }

  await supabase
    .from("user_profiles")
    .upsert({ user_id: user.id }, { onConflict: "user_id" });

  // Backward compatibility for existing community reads/writes.
  await supabase
    .from("profiles")
    .upsert(
      {
        id: firebaseUser.uid,
        display_name: resolvedDisplayName,
        email: resolvedEmail,
        image_url: resolvedPhoto,
        providers,
        last_seen_at: nowIso,
        status: "active",
      },
      { onConflict: "id" }
    );

  return NextResponse.json({ ok: true, user });
}
