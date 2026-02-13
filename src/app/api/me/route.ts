import { NextRequest, NextResponse } from "next/server";

import { verifyFirebaseBearer } from "@/lib/firebase-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const firebaseUser = await verifyFirebaseBearer(request.headers);
  if (!firebaseUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const { data: user, error: userError } = await supabase
    .from("users")
    .select(
      "id, firebase_uid, provider, email, display_name, photo_url, role, status, created_at, last_login_at, deleted_at"
    )
    .eq("firebase_uid", firebaseUser.uid)
    .maybeSingle();

  if (userError) {
    return NextResponse.json({ error: "Load failed." }, { status: 500 });
  }

  if (!user || user.deleted_at) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("bio, preferences, updated_at")
    .eq("user_id", user.id)
    .maybeSingle();

  return NextResponse.json({ user, profile: profile ?? null });
}
