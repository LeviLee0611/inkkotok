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

  const { data: existing, error: existingError } = await supabase
    .from("users")
    .select("id, deleted_at")
    .eq("firebase_uid", firebaseUser.uid)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json({ error: "Sync failed." }, { status: 500 });
  }

  if (existing?.deleted_at) {
    return NextResponse.json(
      { error: "삭제된 계정입니다. 복구가 필요해요." },
      { status: 403 }
    );
  }

  const { data: user, error: userUpsertError } = await supabase
    .from("users")
    .upsert(
      {
        firebase_uid: firebaseUser.uid,
        provider: firebaseUser.provider,
        email: firebaseUser.email,
        display_name: firebaseUser.name,
        photo_url: firebaseUser.picture,
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
        display_name: firebaseUser.name,
        email: firebaseUser.email,
        image_url: firebaseUser.picture,
        providers: [firebaseUser.provider],
        last_seen_at: nowIso,
        status: "active",
      },
      { onConflict: "id" }
    );

  return NextResponse.json({ ok: true, user });
}
