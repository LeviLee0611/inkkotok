import { NextRequest } from "next/server";

import { getUserFromRequest, isAdminUser } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "edge";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type CommentRecord = {
  id: string;
  author_id: string;
};

type CommentLookup =
  | { ok: true; key: "id" | "comment_id"; row: CommentRecord | null }
  | { ok: false; error: unknown };

function isMissingCommentsIdError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const maybe = error as { message?: unknown; details?: unknown };
  const msg = `${typeof maybe.message === "string" ? maybe.message : ""} ${
    typeof maybe.details === "string" ? maybe.details : ""
  }`.toLowerCase();
  return msg.includes("comments.id") || msg.includes("column id does not exist");
}

async function findCommentByRouteId(id: string): Promise<CommentLookup> {
  const supabase = getSupabaseAdmin();
  const primary = await supabase
    .from("comments")
    .select("id, author_id")
    .eq("id", id)
    .maybeSingle();

  if (!primary.error) {
    return {
      ok: true,
      key: "id",
      row: (primary.data as CommentRecord | null) ?? null,
    };
  }

  if (!isMissingCommentsIdError(primary.error)) {
    return { ok: false, error: primary.error };
  }

  const fallback = await supabase
    .from("comments")
    .select("comment_id, author_id")
    .eq("comment_id", id)
    .maybeSingle();

  if (fallback.error) {
    return { ok: false, error: fallback.error };
  }

  return {
    ok: true,
    key: "comment_id",
    row: fallback.data
      ? {
          id: (fallback.data as { comment_id: string }).comment_id,
          author_id: (fallback.data as { author_id: string }).author_id,
        }
      : null,
  };
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const user = await getUserFromRequest(request);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | { content?: string }
    | null;
  const content = body?.content?.trim() ?? "";
  if (!content) {
    return Response.json({ error: "content is required." }, { status: 400 });
  }

  const lookup = await findCommentByRouteId(id);
  if (!lookup.ok) {
    return Response.json({ error: "Comment fetch failed." }, { status: 500 });
  }
  const { row: existing, key } = lookup;
  if (!existing) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const isAdmin = await isAdminUser(user);
  if (!isAdmin && existing.author_id !== user.id) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = getSupabaseAdmin();
  const { error: updateError } = await supabase
    .from("comments")
    .update({ body: content, updated_at: new Date().toISOString() })
    .eq(key, id);

  if (updateError) {
    if (updateError.message?.includes("updated_at")) {
      const fallback = await supabase
        .from("comments")
        .update({ body: content })
        .eq(key, id);
      if (fallback.error) {
        return Response.json({ error: "Update failed." }, { status: 500 });
      }
      return Response.json({ ok: true });
    }
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

  const lookup = await findCommentByRouteId(id);
  if (!lookup.ok) {
    return Response.json({ error: "Comment fetch failed." }, { status: 500 });
  }
  const { row: existing, key } = lookup;
  if (!existing) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const isAdmin = await isAdminUser(user);
  if (!isAdmin && existing.author_id !== user.id) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = getSupabaseAdmin();
  const { error: deleteError } = await supabase.from("comments").delete().eq(key, id);
  if (deleteError) {
    return Response.json({ error: "Delete failed." }, { status: 500 });
  }

  return Response.json({ ok: true });
}
