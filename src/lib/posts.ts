import { getSupabaseAdmin } from "@/lib/supabase-admin";

export type PostRecord = {
  id: string;
  author_id: string;
  author?: { display_name: string | null }[] | null;
  title: string;
  body: string;
  lounge: string;
  created_at: string;
  updated_at: string;
};

export type CommentRecord = {
  id: string;
  post_id: string;
  author_id: string;
  author?: { display_name: string | null }[] | null;
  body: string;
  created_at: string;
};

function isMissingCommentsIdError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const maybe = error as { message?: unknown; details?: unknown };
  const msg = `${typeof maybe.message === "string" ? maybe.message : ""} ${
    typeof maybe.details === "string" ? maybe.details : ""
  }`.toLowerCase();
  return msg.includes("comments.id") || msg.includes("column id does not exist");
}

async function getDisplayNameMap(userIds: string[]) {
  if (!userIds.length) {
    return new Map<string, string | null>();
  }

  const supabase = getSupabaseAdmin();
  const { data: profileRows, error: profileError } = await supabase
    .from("profiles")
    .select("id, display_name")
    .in("id", userIds);

  if (profileError) throw profileError;

  const map = new Map<string, string | null>();
  (profileRows ?? []).forEach((profile) => {
    map.set(profile.id as string, (profile.display_name as string | null) ?? null);
  });
  return map;
}

export async function listPosts(limit = 20) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("posts")
    .select("id, author_id, title, lounge, body, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  const posts = (data ?? []) as Array<Omit<PostRecord, "author">>;
  const authorIds = Array.from(new Set(posts.map((post) => post.author_id)));
  const displayNameMap = await getDisplayNameMap(authorIds);

  return posts.map((post) => ({
    ...post,
    author: [{ display_name: displayNameMap.get(post.author_id) ?? null }],
  }));
}

export async function getPostById(id: string) {
  const supabase = getSupabaseAdmin();
  let { data, error } = await supabase
    .from("posts")
    .select("id, title, lounge, body, author_id, created_at")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    ({ data, error } = await supabase
      .from("posts")
      .select("id, title, lounge, body, author_id, created_at")
      .eq("id", id)
      .maybeSingle());
  }

  if (error) throw error;
  if (!data) return data;

  const displayName = (await getDisplayNameMap([data.author_id])).get(
    data.author_id
  ) ?? null;

  return {
    ...data,
    author: [{ display_name: displayName }],
  };
}

export async function listComments(postId: string, limit = 50) {
  const supabase = getSupabaseAdmin();
  let { data, error } = await supabase
    .from("comments")
    .select("id, post_id, author_id, body, created_at")
    .eq("post_id", postId)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error && isMissingCommentsIdError(error)) {
    const fallback = await supabase
      .from("comments")
      .select("comment_id, post_id, author_id, body, created_at")
      .eq("post_id", postId)
      .order("created_at", { ascending: true })
      .limit(limit);
    if (fallback.error) throw fallback.error;
    data = (fallback.data ?? []).map((row) => ({
      ...row,
      id: (row as { comment_id?: string }).comment_id,
    }));
    error = null;
  }

  if (error) throw error;

  const comments = (data ?? []) as Array<Omit<CommentRecord, "author">>;
  const authorIds = Array.from(new Set(comments.map((comment) => comment.author_id)));
  const displayNameMap = await getDisplayNameMap(authorIds);

  return comments.map((comment) => ({
    ...comment,
    author: [{ display_name: displayNameMap.get(comment.author_id) ?? null }],
  }));
}

export async function createPost(input: {
  authorId: string;
  title: string;
  body: string;
  lounge: string;
}) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("posts")
    .insert({
      author_id: input.authorId,
      title: input.title,
      body: input.body,
      lounge: input.lounge,
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id as string;
}

export async function createComment(input: {
  postId: string;
  authorId: string;
  body: string;
}) {
  const supabase = getSupabaseAdmin();
  const primary = await supabase
    .from("comments")
    .insert({
      post_id: input.postId,
      author_id: input.authorId,
      body: input.body,
    })
    .select("id")
    .single();

  if (primary.error && isMissingCommentsIdError(primary.error)) {
    const fallback = await supabase
      .from("comments")
      .insert({
        post_id: input.postId,
        author_id: input.authorId,
        body: input.body,
      })
      .select("comment_id")
      .single();
    if (fallback.error) throw fallback.error;
    return (fallback.data as { comment_id: string }).comment_id;
  }

  if (primary.error) throw primary.error;
  return (primary.data as { id: string }).id;
}
