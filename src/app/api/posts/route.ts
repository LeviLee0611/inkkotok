import { listPosts, createPost } from "@/lib/posts";
import { getUserIdFromRequest } from "@/lib/auth";
import { readApiErrorMessage } from "@/lib/api-error";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET() {
  const posts = await listPosts(30);
  return Response.json(posts);
}

export async function POST(request: NextRequest) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { title, lounge, content } = body as {
    title?: string;
    lounge?: string;
    content?: string;
  };

  if (!title || !lounge || !content) {
    return Response.json(
      { error: "title, lounge, content are required." },
      { status: 400 }
    );
  }

  try {
    const id = await createPost({
      authorId: userId,
      title,
      lounge,
      body: content,
    });

    return Response.json({ id }, { status: 201 });
  } catch (error) {
    console.error("createPost failed", error);
    const message = readApiErrorMessage(error, "Create post failed.");
    return Response.json({ error: message }, { status: 500 });
  }
}
