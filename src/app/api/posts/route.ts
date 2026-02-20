import { listPosts, createPollForPost, createPost } from "@/lib/posts";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getUserIdFromRequest } from "@/lib/auth";
import { readApiErrorMessage } from "@/lib/api-error";
import { sendAdminNewPostEmail } from "@/lib/admin-alert";
import { NextRequest } from "next/server";

export const runtime = "edge";

const VALID_MOODS = new Set(["sad", "angry", "anxious", "mixed", "hopeful", "happy"]);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const categoryRaw = searchParams.get("categoryId");
  const sortRaw = searchParams.get("sort");

  const categoryId =
    categoryRaw && Number.isInteger(Number(categoryRaw)) ? Number(categoryRaw) : undefined;
  const sort = sortRaw === "hot" ? "hot" : "latest";

  const posts = await listPosts(30, { categoryId, sort });
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

  const { title, lounge, content, categoryId, infoWeight, mood, gifUrl, pollOptions, pollClosesAt } = body as {
    title?: string;
    lounge?: string;
    content?: string;
    categoryId?: number;
    infoWeight?: number;
    mood?: string;
    gifUrl?: string | null;
    pollOptions?: string[];
    pollClosesAt?: string;
  };

  if (!title || !lounge || !content) {
    return Response.json(
      { error: "title, lounge, content are required." },
      { status: 400 }
    );
  }

  if (categoryId !== undefined && (!Number.isInteger(categoryId) || categoryId < 1 || categoryId > 5)) {
    return Response.json({ error: "categoryId must be 1..5." }, { status: 400 });
  }
  if (
    infoWeight !== undefined &&
    (!Number.isFinite(infoWeight) || infoWeight < 0 || infoWeight > 100)
  ) {
    return Response.json({ error: "infoWeight must be 0..100." }, { status: 400 });
  }
  if (mood !== undefined && !VALID_MOODS.has(mood)) {
    return Response.json({ error: "Invalid mood." }, { status: 400 });
  }
  if (gifUrl !== undefined && gifUrl !== null && typeof gifUrl !== "string") {
    return Response.json({ error: "gifUrl must be a string." }, { status: 400 });
  }
  if (typeof gifUrl === "string" && gifUrl.trim().length > 0) {
    const trimmedGifUrl = gifUrl.trim();
    if (!/^https?:\/\//i.test(trimmedGifUrl)) {
      return Response.json({ error: "gifUrl must be http(s) url." }, { status: 400 });
    }
  }
  if (categoryId === 4) {
    if (!Array.isArray(pollOptions)) {
      return Response.json({ error: "pollOptions are required for poll category." }, { status: 400 });
    }
    const normalized = pollOptions.map((item) => item.trim()).filter(Boolean);
    if (normalized.length < 2) {
      return Response.json({ error: "pollOptions must have at least 2 items." }, { status: 400 });
    }
  }

  try {
    const id = await createPost({
      authorId: userId,
      title,
      lounge,
      body: content,
      categoryId,
      infoWeight,
      mediaUrl: typeof gifUrl === "string" && gifUrl.trim() ? gifUrl.trim() : undefined,
      mood: mood as "sad" | "angry" | "anxious" | "mixed" | "hopeful" | "happy" | undefined,
    });

    if (categoryId === 4 && Array.isArray(pollOptions)) {
      try {
        await createPollForPost({
          postId: id,
          options: pollOptions,
          closesAt: pollClosesAt ?? null,
        });
      } catch (pollError) {
        await getSupabaseAdmin().from("posts").delete().eq("id", id);
        throw pollError;
      }
    }

    await sendAdminNewPostEmail({
      postId: id,
      title,
      lounge,
      body: content,
      authorId: userId,
    });

    return Response.json({ id }, { status: 201 });
  } catch (error) {
    console.error("createPost failed", error);
    const message = readApiErrorMessage(error, "Create post failed.");
    return Response.json({ error: message }, { status: 500 });
  }
}
