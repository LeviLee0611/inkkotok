import { NextRequest } from "next/server";

import { getUserFromRequest, isAdminEmail } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "edge";

type RouteContext = {
  params: Promise<{ id: string }>;
};

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

  const supabase = getSupabaseAdmin();
  const { data: existing, error: fetchError } = await supabase
    .from("comments")
    .select("id, author_id")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) {
    return Response.json({ error: "Comment fetch failed." }, { status: 500 });
  }
  if (!existing) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const isAdmin = isAdminEmail(user.email);
  if (!isAdmin && existing.author_id !== user.id) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error: updateError } = await supabase
    .from("comments")
    .update({ body: content, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (updateError) {
    if (updateError.message?.includes("updated_at")) {
      const fallback = await supabase
        .from("comments")
        .update({ body: content })
        .eq("id", id);
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

  const supabase = getSupabaseAdmin();
  const { data: existing, error: fetchError } = await supabase
    .from("comments")
    .select("id, author_id")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) {
    return Response.json({ error: "Comment fetch failed." }, { status: 500 });
  }
  if (!existing) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const isAdmin = isAdminEmail(user.email);
  if (!isAdmin && existing.author_id !== user.id) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error: deleteError } = await supabase.from("comments").delete().eq("id", id);
  if (deleteError) {
    return Response.json({ error: "Delete failed." }, { status: 500 });
  }

  return Response.json({ ok: true });
}
