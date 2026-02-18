import { getUserIdFromRequest } from "@/lib/auth";
import { togglePostLike } from "@/lib/posts";
import { readApiErrorMessage } from "@/lib/api-error";
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

  try {
    const result = await togglePostLike(id, userId);
    if (!result) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }
    return Response.json(result);
  } catch (error) {
    console.error("togglePostLike failed", error);
    const message = readApiErrorMessage(error, "Toggle like failed.");
    return Response.json({ error: message }, { status: 500 });
  }
}
