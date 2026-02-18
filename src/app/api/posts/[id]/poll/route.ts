import { getUserIdFromRequest } from "@/lib/auth";
import { getPollByPostId } from "@/lib/posts";
import { readApiErrorMessage } from "@/lib/api-error";
import { NextRequest } from "next/server";

export const runtime = "edge";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const userId = await getUserIdFromRequest(request);

  try {
    const poll = await getPollByPostId(id, userId);
    if (!poll) return Response.json({ poll: null });
    return Response.json({ poll });
  } catch (error) {
    const message = readApiErrorMessage(error, "Get poll failed.");
    return Response.json({ error: message }, { status: 500 });
  }
}
