import { createComment, listComments } from "@/lib/posts";
import { getUserIdFromRequest } from "@/lib/auth";

export const runtime = "edge";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const comments = await listComments(id, 50);
  return Response.json(comments);
}

export async function POST(request: Request, context: RouteContext) {
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

  if (!content) {
    return Response.json(
      { error: "content is required." },
      { status: 400 }
    );
  }

  const commentId = await createComment({
    postId: id,
    authorId: userId,
    body: content,
  });

  return Response.json({ id: commentId }, { status: 201 });
}
