import { getUserIdFromRequest } from "@/lib/auth";
import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("notifications")
    .select("id, type, post_id, comment_id, is_read, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    const msg = `${error.message ?? ""}`.toLowerCase();
    if (msg.includes("notifications") && msg.includes("does not exist")) {
      return Response.json({ notifications: [] });
    }
    return Response.json({ error: "Notification fetch failed." }, { status: 500 });
  }

  return Response.json({ notifications: data ?? [] });
}

export async function PATCH(request: NextRequest) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { id?: string } | null;
  const id = body?.id?.trim();

  const supabase = getSupabaseAdmin();
  if (id) {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id)
      .eq("user_id", userId);
    if (error) {
      return Response.json({ error: "Notification update failed." }, { status: 500 });
    }
    return Response.json({ ok: true });
  }

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false);
  if (error) {
    return Response.json({ error: "Notification update failed." }, { status: 500 });
  }

  return Response.json({ ok: true });
}
