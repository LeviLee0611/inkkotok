import { getPostById } from "@/lib/posts";

export const runtime = "edge";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const post = await getPostById(id);
  if (!post) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  return Response.json(post);
}
