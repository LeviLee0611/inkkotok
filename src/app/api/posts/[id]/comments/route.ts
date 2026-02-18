import { createComment, listComments } from "@/lib/posts";
import { getUserIdFromRequest } from "@/lib/auth";
import { readApiErrorMessage } from "@/lib/api-error";
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
    parentId?: string;
  };
  const parentId =
    typeof (body as { parentId?: string }).parentId === "string"
      ? (body as { parentId?: string }).parentId!.trim()
      : "";
  const resolvedContent = content?.trim() ?? "";

  if (!resolvedContent) {
    return Response.json(
      { error: "content is required." },
      { status: 400 }
    );
  }
  if (parentId && parentId.length < 8) {
    return Response.json({ error: "invalid parentId." }, { status: 400 });
  }

  try {
    const commentId = await createComment({
      postId: id,
      authorId: userId,
      body: resolvedContent,
      parentId: parentId || null,
    });

    return Response.json({ id: commentId }, { status: 201 });
  } catch (error) {
    console.error("createComment failed", error);
    const message = readApiErrorMessage(error, "Comment create failed.");
    const lower = message.toLowerCase();
    const badRequest =
      lower.includes("depth") ||
      lower.includes("parent") ||
      lower.includes("same post") ||
      lower.includes("invalid");
    return Response.json({ error: message }, { status: badRequest ? 400 : 500 });
  }
}
