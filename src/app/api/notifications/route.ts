import { getUserIdFromRequest } from "@/lib/auth";
import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "edge";

type NotificationRow = {
  id: string;
  type: "comment" | "reply" | "reaction" | "hot_post" | "moderation_note";
  post_id: string | null;
  comment_id: string | null;
  is_read: boolean;
  created_at: string;
  note_message?: string | null;
  source?: "notifications" | "moderation_notes";
};

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
      const { data: notes, error: notesError } = await supabase
        .from("moderation_notes")
        .select("id, post_id, message, is_read, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (notesError) {
        const noteMsg = `${notesError.message ?? ""}`.toLowerCase();
        if (noteMsg.includes("moderation_notes") && noteMsg.includes("does not exist")) {
          return Response.json({ notifications: [] });
        }
        return Response.json({ error: "Notification fetch failed." }, { status: 500 });
      }
      const mapped = (notes ?? []).map((item) => ({
        id: item.id as string,
        type: "moderation_note" as const,
        post_id: (item.post_id as string | null) ?? null,
        comment_id: null,
        is_read: Boolean(item.is_read),
        created_at: item.created_at as string,
        note_message: (item.message as string | null) ?? null,
        source: "moderation_notes" as const,
      }));
      return Response.json({ notifications: mapped });
    }
    return Response.json({ error: "Notification fetch failed." }, { status: 500 });
  }

  const { data: notes, error: notesError } = await supabase
    .from("moderation_notes")
    .select("id, post_id, message, is_read, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (notesError) {
    const noteMsg = `${notesError.message ?? ""}`.toLowerCase();
    if (!(noteMsg.includes("moderation_notes") && noteMsg.includes("does not exist"))) {
      return Response.json({ error: "Notification fetch failed." }, { status: 500 });
    }
  }

  const combined: NotificationRow[] = [
    ...((data ?? []).map((item) => ({
      ...(item as Omit<NotificationRow, "source" | "note_message">),
      source: "notifications" as const,
    })) as NotificationRow[]),
    ...((notes ?? []).map((item) => ({
      id: item.id as string,
      type: "moderation_note" as const,
      post_id: (item.post_id as string | null) ?? null,
      comment_id: null,
      is_read: Boolean(item.is_read),
      created_at: item.created_at as string,
      note_message: (item.message as string | null) ?? null,
      source: "moderation_notes" as const,
    })) as NotificationRow[]),
  ]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 50);

  return Response.json({ notifications: combined });
}

export async function PATCH(request: NextRequest) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | { id?: string; source?: "notifications" | "moderation_notes" }
    | null;
  const id = body?.id?.trim();
  const source = body?.source === "moderation_notes" ? "moderation_notes" : "notifications";

  const supabase = getSupabaseAdmin();
  if (id) {
    const table = source;
    const { error } = await supabase
      .from(table)
      .update({ is_read: true })
      .eq("id", id)
      .eq("user_id", userId);
    if (error) {
      const msg = `${error.message ?? ""}`.toLowerCase();
      if (msg.includes(table) && msg.includes("does not exist")) {
        return Response.json({ ok: true });
      }
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
    const msg = `${error.message ?? ""}`.toLowerCase();
    if (!(msg.includes("notifications") && msg.includes("does not exist"))) {
      return Response.json({ error: "Notification update failed." }, { status: 500 });
    }
  }

  const { error: notesError } = await supabase
    .from("moderation_notes")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false);
  if (notesError) {
    const msg = `${notesError.message ?? ""}`.toLowerCase();
    if (!(msg.includes("moderation_notes") && msg.includes("does not exist"))) {
      return Response.json({ error: "Notification update failed." }, { status: 500 });
    }
  }

  if (error && notesError) {
    return Response.json({ error: "Notification update failed." }, { status: 500 });
  }

  return Response.json({ ok: true });
}
