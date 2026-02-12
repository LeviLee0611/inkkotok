import { NextRequest, NextResponse } from "next/server";

import { getUserIdFromRequest } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, email, image_url")
    .eq("id", userId)
    .maybeSingle();

  const { count: postCount } = await supabase
    .from("posts")
    .select("id", { count: "exact", head: true })
    .eq("author_id", userId);

  const { count: commentCount } = await supabase
    .from("comments")
    .select("id", { count: "exact", head: true })
    .eq("author_id", userId);

  const { data: recentPosts } = await supabase
    .from("posts")
    .select("id, title, lounge, created_at")
    .eq("author_id", userId)
    .order("created_at", { ascending: false })
    .limit(5);

  return NextResponse.json({
    profile,
    stats: {
      posts: postCount ?? 0,
      comments: commentCount ?? 0,
      recentPosts: recentPosts ?? [],
    },
  });
}
