import { getUserIdFromRequest } from "@/lib/auth";
import { readApiErrorMessage } from "@/lib/api-error";
import { createNotification } from "@/lib/notifications";
import { votePoll } from "@/lib/posts";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { NextRequest } from "next/server";

export const runtime = "edge";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as { optionId?: string } | null;
  if (!body?.optionId) {
    return Response.json({ error: "optionId is required." }, { status: 400 });
  }

  try {
    const poll = await votePoll({ postId: id, optionId: body.optionId, userId });
    if (!poll) {
      return Response.json({ error: "Poll not found." }, { status: 404 });
    }

    try {
      const post = await getSupabaseAdmin()
        .from("posts")
        .select("author_id")
        .eq("id", id)
        .maybeSingle();
      const authorId = post.data ? (post.data as { author_id: string }).author_id : null;
      if (authorId) {
        await createNotification({
          userId: authorId,
          actorUserId: userId,
          type: "reaction",
          postId: id,
        });
      }
    } catch (notifyError) {
      console.error("createNotification(vote) failed", notifyError);
    }

    return Response.json({ poll });
  } catch (error) {
    const message = readApiErrorMessage(error, "Vote failed.");
    return Response.json({ error: message }, { status: 500 });
  }
}
