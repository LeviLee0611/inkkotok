import { getSupabaseAdmin } from "@/lib/supabase-admin";

type NotificationType = "comment" | "reply" | "reaction" | "hot_post";

function isMissingNotificationsTableError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const maybe = error as { message?: unknown; details?: unknown };
  const msg = `${typeof maybe.message === "string" ? maybe.message : ""} ${
    typeof maybe.details === "string" ? maybe.details : ""
  }`.toLowerCase();
  return msg.includes("notifications") && msg.includes("does not exist");
}

function isMissingModerationNotesTableError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const maybe = error as { message?: unknown; details?: unknown };
  const msg = `${typeof maybe.message === "string" ? maybe.message : ""} ${
    typeof maybe.details === "string" ? maybe.details : ""
  }`.toLowerCase();
  return msg.includes("moderation_notes") && msg.includes("does not exist");
}

export async function createNotification(input: {
  userId: string;
  actorUserId?: string | null;
  type: NotificationType;
  postId?: string | null;
  commentId?: string | null;
}) {
  if (!input.userId) return;
  if (input.actorUserId && input.userId === input.actorUserId) return;

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("notifications").insert({
    user_id: input.userId,
    type: input.type,
    post_id: input.postId ?? null,
    comment_id: input.commentId ?? null,
    is_read: false,
  });

  if (error && !isMissingNotificationsTableError(error)) {
    throw error;
  }
}

export async function createModerationNote(input: {
  userId: string;
  actorUserId: string;
  postId?: string | null;
  message: string;
}) {
  if (!input.userId || !input.actorUserId) return;
  if (input.userId === input.actorUserId) return;
  if (!input.message.trim()) return;

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("moderation_notes").insert({
    user_id: input.userId,
    actor_user_id: input.actorUserId,
    post_id: input.postId ?? null,
    message: input.message.trim(),
    is_read: false,
  });

  if (error && !isMissingModerationNotesTableError(error)) {
    throw error;
  }
}
