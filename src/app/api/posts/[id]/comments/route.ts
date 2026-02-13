import { createComment, listComments } from "@/lib/posts";
import { getUserIdFromRequest } from "@/lib/auth";
import { NextRequest } from "next/server";

export const runtime = "edge";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const comments = await listComments(id, 50);
  return Response.json(comments);
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { content } = body as {
    content?: string;
  };
  const resolvedContent = content?.trim() ?? "";

  if (!resolvedContent) {
    return Response.json(
      { error: "content is required." },
      { status: 400 }
    );
  }

  try {
    const commentId = await createComment({
      postId: id,
      authorId: userId,
      body: resolvedContent,
    });

    return Response.json({ id: commentId }, { status: 201 });
  } catch (error) {
    console.error("createComment failed", error);
    const message =
      error instanceof Error ? error.message : "Comment create failed.";
    return Response.json({ error: message }, { status: 500 });
  }
}
