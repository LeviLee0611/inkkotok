import { getPostById } from "@/lib/posts";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getUserFromRequest, isAdminUser } from "@/lib/auth";
import { NextRequest } from "next/server";

export const runtime = "edge";

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
    | { title?: string; lounge?: string; content?: string }
    | null;
  if (!body) {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const updates: Record<string, string> = {};
  if (typeof body.title === "string" && body.title.trim()) {
    updates.title = body.title.trim();
  }
  if (typeof body.lounge === "string" && body.lounge.trim()) {
    updates.lounge = body.lounge.trim();
  }
  if (typeof body.content === "string" && body.content.trim()) {
    updates.body = body.content.trim();
  }

  if (Object.keys(updates).length === 0) {
    return Response.json(
      { error: "title, lounge, content 중 최소 1개가 필요합니다." },
      { status: 400 }
    );
  }

  updates.updated_at = new Date().toISOString();

  const { error: updateError } = await supabase
    .from("posts")
    .update(updates)
    .eq("id", id);

  if (updateError) {
    return Response.json({ error: "Update failed." }, { status: 500 });
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

  return Response.json({ ok: true });
}
