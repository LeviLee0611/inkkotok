import { createComment, listComments } from "@/lib/posts";

type RouteContext = {
  params: { id: string };
};

export async function GET(_request: Request, context: RouteContext) {
  const comments = await listComments(context.params.id, 50);
  return Response.json(comments);
}

export async function POST(request: Request, context: RouteContext) {
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

  const id = await createComment({
    postId: context.params.id,
    authorId,
    body: content,
  });

  return Response.json({ id }, { status: 201 });
}
