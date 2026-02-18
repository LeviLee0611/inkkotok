import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { MAX_COMMENT_DEPTH } from "@/lib/comment-thread";

export type PostRecord = {
  id: string;
  author_id: string;
  author?: { display_name: string | null; image_url: string | null }[] | null;
  title: string;
  body: string;
  lounge: string;
  category_id?: number;
  mood?: "sad" | "angry" | "anxious" | "mixed" | "hopeful" | "happy";
  comments_count?: number;
  reactions_count?: number;
  votes_count?: number;
  hot_score?: number;
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

export type PollOptionRecord = {
  id: string;
  label: string;
  vote_count: number;
  sort_order: number;
};

export type PollRecord = {
  post_id: string;
  closes_at: string | null;
  options: PollOptionRecord[];
  total_votes: number;
  viewer_option_id: string | null;
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

function isMissingPostReactionsTypeError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const maybe = error as { message?: unknown; details?: unknown };
  const msg = `${typeof maybe.message === "string" ? maybe.message : ""} ${
    typeof maybe.details === "string" ? maybe.details : ""
  }`.toLowerCase();
  return msg.includes("reaction_type") && msg.includes("does not exist");
}

function isMissingPollsTableError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const maybe = error as { message?: unknown; details?: unknown };
  const msg = `${typeof maybe.message === "string" ? maybe.message : ""} ${
    typeof maybe.details === "string" ? maybe.details : ""
  }`.toLowerCase();
  return (
    msg.includes("polls") ||
    msg.includes("poll_options") ||
    msg.includes("poll_votes")
  ) && msg.includes("does not exist");
}

function normalizePollOptions(options: string[]) {
  const unique = Array.from(
    new Set(
      options
        .map((item) => item.trim())
        .filter((item) => item.length > 0)
        .slice(0, 6)
    )
  );
  if (unique.length < 2) {
    throw new Error("투표 항목은 최소 2개가 필요합니다.");
  }
  return unique;
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

export async function listPosts(
  limit = 20,
  options?: { categoryId?: number; sort?: "latest" | "hot" }
) {
  const supabase = getSupabaseAdmin();
  let query = supabase
    .from("posts")
    .select(
      "id, author_id, title, lounge, body, category_id, mood, comments_count, reactions_count, votes_count, hot_score, created_at"
    )
    .limit(limit);

  if (typeof options?.categoryId === "number") {
    query = query.eq("category_id", options.categoryId);
  }

  if (options?.sort === "hot") {
    query = query.order("hot_score", { ascending: false }).order("created_at", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data, error } = await query;

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
    .select(
      "id, title, lounge, body, author_id, category_id, mood, comments_count, reactions_count, votes_count, hot_score, created_at"
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    ({ data, error } = await supabase
      .from("posts")
      .select(
        "id, title, lounge, body, author_id, category_id, mood, comments_count, reactions_count, votes_count, hot_score, created_at"
      )
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
  categoryId?: number;
  mood?: "sad" | "angry" | "anxious" | "mixed" | "hopeful" | "happy";
}) {
  const supabase = getSupabaseAdmin();
  const payload: Record<string, string | number> = {
    author_id: input.authorId,
    title: input.title,
    body: input.body,
    lounge: input.lounge,
  };
  if (typeof input.categoryId === "number") {
    payload.category_id = input.categoryId;
  }
  if (input.mood) {
    payload.mood = input.mood;
  }
  const { data, error } = await supabase
    .from("posts")
    .insert(payload)
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

  let existing = await supabase
    .from("post_reactions")
    .select("post_id, user_id")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .eq("reaction_type", "hug")
    .maybeSingle();

  if (existing.error && isMissingPostReactionsTypeError(existing.error)) {
    existing = await supabase
      .from("post_reactions")
      .select("post_id, user_id")
      .eq("post_id", postId)
      .eq("user_id", userId)
      .maybeSingle();
  }

  if (existing.error) {
    if (isMissingPostReactionsTableError(existing.error)) {
      throw new Error("post_reactions table is missing. Run docs/sql/post-reactions.sql");
    }
    throw existing.error;
  }

  let created = false;
  if (!existing.data) {
    let add = await supabase
      .from("post_reactions")
      .insert({ post_id: postId, user_id: userId, reaction_type: "hug" });
    if (add.error && isMissingPostReactionsTypeError(add.error)) {
      add = await supabase.from("post_reactions").insert({ post_id: postId, user_id: userId });
    }
    if (add.error) {
      if (isMissingPostReactionsTableError(add.error)) {
        throw new Error("post_reactions table is missing. Run docs/sql/post-reactions.sql");
      }
      if ((add.error as { code?: string }).code !== "23505") {
        throw add.error;
      }
    }
    created = true;
  }

  const likeCount = await getPostLikeCount(postId, true);
  return { liked: true, likeCount, created };
}

export async function createPollForPost(input: {
  postId: string;
  options: string[];
  closesAt?: string | null;
}) {
  const options = normalizePollOptions(input.options);
  const supabase = getSupabaseAdmin();

  const pollInsert = await supabase.from("polls").insert({
    post_id: input.postId,
    closes_at: input.closesAt ?? null,
  });
  if (pollInsert.error) {
    if (isMissingPollsTableError(pollInsert.error)) {
      throw new Error("poll tables are missing. Run docs/sql/emotion-community-mvp.sql");
    }
    throw pollInsert.error;
  }

  const optionRows = options.map((label, index) => ({
    poll_post_id: input.postId,
    label,
    sort_order: index + 1,
  }));
  const optionInsert = await supabase.from("poll_options").insert(optionRows);
  if (optionInsert.error) throw optionInsert.error;
}

export async function getPollByPostId(postId: string, viewerUserId?: string | null) {
  const supabase = getSupabaseAdmin();
  const poll = await supabase
    .from("polls")
    .select("post_id, closes_at")
    .eq("post_id", postId)
    .maybeSingle();

  if (poll.error) {
    if (isMissingPollsTableError(poll.error)) return null;
    throw poll.error;
  }
  if (!poll.data) return null;

  const optionsResult = await supabase
    .from("poll_options")
    .select("id, label, vote_count, sort_order")
    .eq("poll_post_id", postId)
    .order("sort_order", { ascending: true });
  if (optionsResult.error) throw optionsResult.error;

  let viewerOptionId: string | null = null;
  if (viewerUserId) {
    const voteResult = await supabase
      .from("poll_votes")
      .select("option_id")
      .eq("poll_post_id", postId)
      .eq("user_id", viewerUserId)
      .maybeSingle();
    if (!voteResult.error && voteResult.data) {
      viewerOptionId = (voteResult.data as { option_id: string }).option_id;
    }
  }

  const options = ((optionsResult.data ?? []) as PollOptionRecord[]).map((item) => ({
    ...item,
    vote_count: item.vote_count ?? 0,
  }));
  const totalVotes = options.reduce((sum, item) => sum + (item.vote_count ?? 0), 0);

  return {
    post_id: (poll.data as { post_id: string }).post_id,
    closes_at: ((poll.data as { closes_at?: string | null }).closes_at ?? null) as string | null,
    options,
    total_votes: totalVotes,
    viewer_option_id: viewerOptionId,
  } as PollRecord;
}

async function refreshPollOptionVoteCounts(postId: string) {
  const supabase = getSupabaseAdmin();
  const optionsResult = await supabase
    .from("poll_options")
    .select("id")
    .eq("poll_post_id", postId);
  if (optionsResult.error) throw optionsResult.error;

  const votesResult = await supabase
    .from("poll_votes")
    .select("option_id")
    .eq("poll_post_id", postId);
  if (votesResult.error) throw votesResult.error;

  const counts = new Map<string, number>();
  (votesResult.data ?? []).forEach((row) => {
    const optionId = (row as { option_id: string }).option_id;
    counts.set(optionId, (counts.get(optionId) ?? 0) + 1);
  });

  for (const row of optionsResult.data ?? []) {
    const optionId = (row as { id: string }).id;
    const count = counts.get(optionId) ?? 0;
    const update = await supabase
      .from("poll_options")
      .update({ vote_count: count })
      .eq("id", optionId);
    if (update.error) throw update.error;
  }
}

export async function votePoll(input: { postId: string; optionId: string; userId: string }) {
  const supabase = getSupabaseAdmin();
  const poll = await supabase
    .from("polls")
    .select("post_id, closes_at")
    .eq("post_id", input.postId)
    .maybeSingle();
  if (poll.error) {
    if (isMissingPollsTableError(poll.error)) {
      throw new Error("poll tables are missing. Run docs/sql/emotion-community-mvp.sql");
    }
    throw poll.error;
  }
  if (!poll.data) return null;

  const closesAt = ((poll.data as { closes_at?: string | null }).closes_at ?? null) as
    | string
    | null;
  if (closesAt && new Date(closesAt).getTime() < Date.now()) {
    throw new Error("투표가 종료되었습니다.");
  }

  const option = await supabase
    .from("poll_options")
    .select("id")
    .eq("poll_post_id", input.postId)
    .eq("id", input.optionId)
    .maybeSingle();
  if (option.error) throw option.error;
  if (!option.data) {
    throw new Error("유효하지 않은 투표 항목입니다.");
  }

  const upsert = await supabase.from("poll_votes").upsert(
    {
      poll_post_id: input.postId,
      option_id: input.optionId,
      user_id: input.userId,
    },
    { onConflict: "poll_post_id,user_id" }
  );
  if (upsert.error) throw upsert.error;

  await refreshPollOptionVoteCounts(input.postId);
  return getPollByPostId(input.postId, input.userId);
}
