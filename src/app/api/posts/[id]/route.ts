import { getPostById } from "@/lib/posts";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getUserFromRequest, isAdminUser } from "@/lib/auth";
import { createModerationNote } from "@/lib/notifications";
import { NextRequest } from "next/server";

export const runtime = "edge";
const VALID_MOODS = new Set(["sad", "angry", "anxious", "mixed", "hopeful", "happy"]);

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const post = await getPostById(id);
  if (!post) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  return Response.json(post);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const user = await getUserFromRequest(request);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const { data: existing, error: existingError } = await supabase
    .from("posts")
    .select("id, author_id")
    .eq("id", id)
    .maybeSingle();

  if (existingError) {
    return Response.json({ error: "Post fetch failed." }, { status: 500 });
  }
  if (!existing) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const isAdmin = await isAdminUser(user);
  if (!isAdmin && existing.author_id !== user.id) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as
    | { title?: string; lounge?: string; content?: string; categoryId?: number; mood?: string }
    | null;
  if (!body) {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const updates: Record<string, string | number> = {};
  if (typeof body.title === "string" && body.title.trim()) {
    updates.title = body.title.trim();
  }
  if (typeof body.lounge === "string" && body.lounge.trim()) {
    updates.lounge = body.lounge.trim();
  }
  if (typeof body.content === "string" && body.content.trim()) {
    updates.body = body.content.trim();
  }
  if (body.categoryId !== undefined) {
    if (!Number.isInteger(body.categoryId) || body.categoryId < 1 || body.categoryId > 5) {
      return Response.json({ error: "categoryId must be 1..5." }, { status: 400 });
    }
    updates.category_id = body.categoryId;
  }
  if (body.mood !== undefined) {
    if (!VALID_MOODS.has(body.mood)) {
      return Response.json({ error: "Invalid mood." }, { status: 400 });
    }
    updates.mood = body.mood;
  }

  if (Object.keys(updates).length === 0) {
    return Response.json(
      { error: "title, lounge, content 중 최소 1개가 필요합니다." },
      { status: 400 }
    );
  }

  const updatePayloads: Array<Record<string, string | number>> = [
    { ...updates, updated_at: new Date().toISOString() },
    updates,
  ];

  let updateError: { message?: string } | null = null;
  for (const payload of updatePayloads) {
    const result = await supabase.from("posts").update(payload).eq("id", id);
    if (!result.error) {
      updateError = null;
      break;
    }
    updateError = result.error;
  }

  if (updateError) {
    return Response.json(
      { error: updateError.message ?? "Update failed." },
      { status: 500 }
    );
  }

  return Response.json({ ok: true });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const user = await getUserFromRequest(request);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const { data: existing, error: existingError } = await supabase
    .from("posts")
    .select("id, author_id, title")
    .eq("id", id)
    .maybeSingle();

  if (existingError) {
    return Response.json({ error: "Post fetch failed." }, { status: 500 });
  }
  if (!existing) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const isAdmin = await isAdminUser(user);
  if (!isAdmin && existing.author_id !== user.id) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const deleteBody = (await request.json().catch(() => null)) as
    | { moderationNote?: string }
    | null;
  const trimmedNote = deleteBody?.moderationNote?.trim() ?? "";
  const isModerationDelete = isAdmin && existing.author_id !== user.id;

  const { error: commentsDeleteError } = await supabase
    .from("comments")
    .delete()
    .eq("post_id", id);
  if (commentsDeleteError) {
    return Response.json({ error: "Comment delete failed." }, { status: 500 });
  }

  const { error: postDeleteError } = await supabase.from("posts").delete().eq("id", id);
  if (postDeleteError) {
    return Response.json({ error: "Post delete failed." }, { status: 500 });
  }

  if (isModerationDelete) {
    const fallbackMessage = "커뮤니티 운영 정책에 따라 게시글이 삭제되었습니다.";
    const note = trimmedNote || `${fallbackMessage} (${existing.title ?? "게시글"})`;
    await createModerationNote({
      userId: existing.author_id,
      actorUserId: user.id,
      postId: id,
      message: note,
    }).catch((error) => {
      console.error("createModerationNote failed", error);
    });
  }

  return Response.json({ ok: true });
}
