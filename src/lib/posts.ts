import { getSupabaseAdmin } from "@/lib/supabase-admin";

export type PostRecord = {
  id: string;
  author_id: string;
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
  body: string;
  created_at: string;
};

export async function listPosts(limit = 20) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("posts")
    .select("id, title, lounge, body, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

export async function getPostById(id: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("posts")
    .select("id, title, lounge, body, author_id, created_at")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function listComments(postId: string, limit = 50) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("comments")
    .select("id, post_id, author_id, body, created_at")
    .eq("post_id", postId)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
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
  const { data, error } = await supabase
    .from("comments")
    .insert({
      post_id: input.postId,
      author_id: input.authorId,
      body: input.body,
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id as string;
}
