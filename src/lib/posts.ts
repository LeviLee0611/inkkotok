import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { MAX_COMMENT_DEPTH } from "@/lib/comment-thread";

export type PostRecord = {
  id: string;
  author_id: string;
  author?: { display_name: string | null; image_url: string | null }[] | null;
  title: string;
  body: string;
  lounge: string;
  like_count: number;
  created_at: string;
  updated_at: string;
};

export type CommentRecord = {
  id: string;
  post_id: string;
  author_id: string;
  author?: { display_name: string | null; image_url: string | null }[] | null;
  body: string;
  parent_id?: string | null;
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

function isMissingCommentsParentIdError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const maybe = error as { message?: unknown; details?: unknown };
  const msg = `${typeof maybe.message === "string" ? maybe.message : ""} ${
    typeof maybe.details === "string" ? maybe.details : ""
  }`.toLowerCase();
  return msg.includes("parent_id");
}

function isMissingPostReactionsTableError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const maybe = error as { message?: unknown; details?: unknown };
  const msg = `${typeof maybe.message === "string" ? maybe.message : ""} ${
    typeof maybe.details === "string" ? maybe.details : ""
  }`.toLowerCase();
  return msg.includes("post_reactions") && msg.includes("does not exist");
}

type AuthorProfile = {
  display_name: string | null;
  image_url: string | null;
};

type CommentLink = {
  id: string;
  post_id: string;
  parent_id: string | null;
};

async function getCommentLinkById(
  commentId: string,
  supabase = getSupabaseAdmin()
): Promise<CommentLink | null> {
  const primary = await supabase
    .from("comments")
    .select("id, post_id, parent_id")
    .eq("id", commentId)
    .maybeSingle();

  if (!primary.error) {
    if (!primary.data) return null;
    return {
      id: (primary.data as { id: string }).id,
      post_id: (primary.data as { post_id: string }).post_id,
      parent_id: ((primary.data as { parent_id?: string | null }).parent_id ?? null) as
        | string
        | null,
    };
  }

  if (!isMissingCommentsIdError(primary.error)) {
    throw primary.error;
  }

  const fallback = await supabase
    .from("comments")
    .select("comment_id, post_id, parent_id")
    .eq("comment_id", commentId)
    .maybeSingle();
  if (fallback.error) throw fallback.error;
  if (!fallback.data) return null;
  return {
    id: (fallback.data as { comment_id: string }).comment_id,
    post_id: (fallback.data as { post_id: string }).post_id,
    parent_id: ((fallback.data as { parent_id?: string | null }).parent_id ?? null) as
      | string
      | null,
  };
}

async function assertReplyDepth(postId: string, parentId: string) {
  const supabase = getSupabaseAdmin();
  let currentId: string | null = parentId;
  let parentDepth = 0;
  let guard = 0;

  while (currentId) {
    guard += 1;
    if (guard > MAX_COMMENT_DEPTH + 20) {
      throw new Error("Invalid comment tree.");
    }
    const node = await getCommentLinkById(currentId, supabase);
    if (!node) {
      throw new Error("Parent comment not found.");
    }
    if (node.post_id !== postId) {
      throw new Error("Reply parent must be in the same post.");
    }
    parentDepth += 1;
    if (parentDepth >= MAX_COMMENT_DEPTH) {
      throw new Error(`Reply depth exceeds max depth ${MAX_COMMENT_DEPTH}.`);
    }
    currentId = node.parent_id;
  }
}

async function getAuthorProfileMap(userIds: string[]) {
  if (!userIds.length) {
    return new Map<string, AuthorProfile>();
  }

  const supabase = getSupabaseAdmin();
  const { data: profileRows, error: profileError } = await supabase
    .from("profiles")
    .select("id, display_name, image_url")
    .in("id", userIds);

  if (profileError) throw profileError;

  const map = new Map<string, AuthorProfile>();
  (profileRows ?? []).forEach((profile) => {
    map.set(profile.id as string, {
      display_name: (profile.display_name as string | null) ?? null,
      image_url: (profile.image_url as string | null) ?? null,
    });
  });
  return map;
}

async function getPostLikeCounts(postIds: string[]) {
  const map = new Map<string, number>();
  if (!postIds.length) return map;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("post_reactions")
    .select("post_id")
    .in("post_id", postIds);

  if (error) {
    if (isMissingPostReactionsTableError(error)) {
      return map;
    }
    throw error;
  }

  (data ?? []).forEach((row) => {
    const postId = (row as { post_id: string }).post_id;
    map.set(postId, (map.get(postId) ?? 0) + 1);
  });

  return map;
}

async function getPostLikeCount(postId: string, strict = false) {
  const supabase = getSupabaseAdmin();
  const { count, error } = await supabase
    .from("post_reactions")
    .select("post_id", { count: "exact", head: true })
    .eq("post_id", postId);

  if (error) {
    if (!strict && isMissingPostReactionsTableError(error)) {
      return 0;
    }
    throw error;
  }

  return count ?? 0;
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
  const profileMap = await getAuthorProfileMap(authorIds);
  const likeMap = await getPostLikeCounts(posts.map((post) => post.id));

  return posts.map((post) => ({
    ...post,
    like_count: likeMap.get(post.id) ?? 0,
    author: [
      {
        display_name: profileMap.get(post.author_id)?.display_name ?? null,
        image_url: profileMap.get(post.author_id)?.image_url ?? null,
      },
    ],
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

  const authorProfile = (await getAuthorProfileMap([data.author_id])).get(data.author_id);
  const likeCount = await getPostLikeCount(id);

  return {
    ...data,
    like_count: likeCount,
    author: [
      {
        display_name: authorProfile?.display_name ?? null,
        image_url: authorProfile?.image_url ?? null,
      },
    ],
  };
}

export async function listComments(postId: string, limit = 50) {
  const supabase = getSupabaseAdmin();
  let { data, error } = await supabase
    .from("comments")
    .select("id, post_id, author_id, body, parent_id, created_at")
    .eq("post_id", postId)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error && isMissingCommentsParentIdError(error)) {
    const retry = await supabase
      .from("comments")
      .select("id, post_id, author_id, body, created_at")
      .eq("post_id", postId)
      .order("created_at", { ascending: true })
      .limit(limit);
    if (retry.error) throw retry.error;
    data = (retry.data ?? []).map((row) => ({ ...row, parent_id: null }));
    error = null;
  }

  if (error && isMissingCommentsIdError(error)) {
    const fallback = await supabase
      .from("comments")
      .select("comment_id, post_id, author_id, body, parent_id, created_at")
      .eq("post_id", postId)
      .order("created_at", { ascending: true })
      .limit(limit);
    if (fallback.error && isMissingCommentsParentIdError(fallback.error)) {
      const retry = await supabase
        .from("comments")
        .select("comment_id, post_id, author_id, body, created_at")
        .eq("post_id", postId)
        .order("created_at", { ascending: true })
        .limit(limit);
      if (retry.error) throw retry.error;
      data = (retry.data ?? []).map((row) => ({
        ...row,
        id: (row as { comment_id?: string }).comment_id,
        parent_id: null,
      }));
      error = null;
    } else if (fallback.error) {
      throw fallback.error;
    } else {
      data = (fallback.data ?? []).map((row) => ({
        ...row,
        id: (row as { comment_id?: string }).comment_id,
      }));
      error = null;
    }
  }

  if (error) throw error;

  const comments = (data ?? []) as Array<Omit<CommentRecord, "author">>;
  const authorIds = Array.from(new Set(comments.map((comment) => comment.author_id)));
  const profileMap = await getAuthorProfileMap(authorIds);

  return comments.map((comment) => ({
    ...comment,
    author: [
      {
        display_name: profileMap.get(comment.author_id)?.display_name ?? null,
        image_url: profileMap.get(comment.author_id)?.image_url ?? null,
      },
    ],
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
  parentId?: string | null;
}) {
  if (input.parentId) {
    await assertReplyDepth(input.postId, input.parentId);
  }

  const supabase = getSupabaseAdmin();
  const commentId = crypto.randomUUID();
  const payload: Record<string, string | null> = {
    id: commentId,
    post_id: input.postId,
    author_id: input.authorId,
    body: input.body,
  };
  if (input.parentId) {
    payload.parent_id = input.parentId;
  }

  const primary = await supabase
    .from("comments")
    .insert(payload)
    .select("id")
    .single();

  if (primary.error && isMissingCommentsParentIdError(primary.error)) {
    if (input.parentId) {
      throw new Error("comments.parent_id column is required for replies.");
    }
    const noParentPayload = { ...payload };
    delete noParentPayload.parent_id;
    const retry = await supabase.from("comments").insert(noParentPayload).select("id").single();
    if (retry.error) throw retry.error;
    return (retry.data as { id: string }).id;
  }

  if (primary.error && isMissingCommentsIdError(primary.error)) {
    const fallbackPayload: Record<string, string | null> = {
      comment_id: commentId,
      post_id: input.postId,
      author_id: input.authorId,
      body: input.body,
    };
    if (input.parentId) {
      fallbackPayload.parent_id = input.parentId;
    }
    const fallback = await supabase
      .from("comments")
      .insert(fallbackPayload)
      .select("comment_id")
      .single();
    if (fallback.error && isMissingCommentsParentIdError(fallback.error)) {
      if (input.parentId) {
        throw new Error("comments.parent_id column is required for replies.");
      }
      const noParentPayload = { ...fallbackPayload };
      delete noParentPayload.parent_id;
      const retry = await supabase
        .from("comments")
        .insert(noParentPayload)
        .select("comment_id")
        .single();
      if (retry.error) throw retry.error;
      return (retry.data as { comment_id: string }).comment_id;
    }
    if (fallback.error) throw fallback.error;
    return (fallback.data as { comment_id: string }).comment_id;
  }

  if (primary.error) throw primary.error;
  return (primary.data as { id: string }).id;
}

export async function togglePostLike(postId: string, userId: string) {
  const supabase = getSupabaseAdmin();

  const { data: post, error: postError } = await supabase
    .from("posts")
    .select("id")
    .eq("id", postId)
    .maybeSingle();

  if (postError) throw postError;
  if (!post) return null;

  const existing = await supabase
    .from("post_reactions")
    .select("post_id, user_id")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing.error) {
    if (isMissingPostReactionsTableError(existing.error)) {
      throw new Error("post_reactions table is missing. Run docs/sql/post-reactions.sql");
    }
    throw existing.error;
  }

  if (!existing.data) {
    const add = await supabase
      .from("post_reactions")
      .insert({ post_id: postId, user_id: userId });
    if (add.error) {
      if (isMissingPostReactionsTableError(add.error)) {
        throw new Error("post_reactions table is missing. Run docs/sql/post-reactions.sql");
      }
      if ((add.error as { code?: string }).code !== "23505") {
        throw add.error;
      }
    }
  }

  const likeCount = await getPostLikeCount(postId, true);
  return { liked: true, likeCount };
}
