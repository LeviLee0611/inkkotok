import { listPosts, createPost } from "@/lib/posts";

export const runtime = "edge";

export async function GET() {
  const posts = await listPosts(30);
  return Response.json(posts);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { authorId, title, lounge, content } = body as {
    authorId?: string;
    title?: string;
    lounge?: string;
    content?: string;
  };

  if (!authorId || !title || !lounge || !content) {
    return Response.json(
      { error: "authorId, title, lounge, content are required." },
      { status: 400 }
    );
  }

  const id = await createPost({
    authorId,
    title,
    lounge,
    body: content,
  });

  return Response.json({ id }, { status: 201 });
}
