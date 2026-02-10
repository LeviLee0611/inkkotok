import { createComment, listComments } from "@/lib/posts";

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
  const body = await request.json().catch(() => null);
  if (!body) {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { authorId, content } = body as {
    authorId?: string;
    content?: string;
  };

  if (!authorId || !content) {
    return Response.json(
      { error: "authorId and content are required." },
      { status: 400 }
    );
  }

  const commentId = await createComment({
    postId: id,
    authorId,
    body: content,
  });

  return Response.json({ id: commentId }, { status: 201 });
}
