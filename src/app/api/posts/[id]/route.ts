import { getPostById } from "@/lib/posts";

type RouteContext = {
  params: { id: string };
};

export async function GET(_request: Request, context: RouteContext) {
  const post = await getPostById(context.params.id);
  if (!post) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  return Response.json(post);
}
