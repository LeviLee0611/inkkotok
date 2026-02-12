import { getSupabaseAdmin } from "@/lib/supabase-admin";

type ProfileRecord = {
  id: string;
  display_name: string | null;
  email: string | null;
  image_url: string | null;
  providers: string[];
  created_at: string;
  last_seen_at: string;
  status: "active" | "suspended";
};

type UpsertProfileInput = {
  id: string;
  email?: string | null;
  image?: string | null;
  provider: string;
};

export async function upsertProfile(input: UpsertProfileInput) {
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();

  const { data: existing, error: fetchError } = await supabase
    .from("profiles")
    .select("id, display_name, providers, created_at")
    .eq("id", input.id)
    .maybeSingle();

  if (fetchError) {
    throw fetchError;
  }

  if (!existing) {
    const insert: ProfileRecord = {
      id: input.id,
      display_name: null,
      email: input.email ?? null,
      image_url: input.image ?? null,
      providers: [input.provider],
      created_at: now,
      last_seen_at: now,
      status: "active",
    };

    const { error: insertError } = await supabase
      .from("profiles")
      .insert(insert);

    if (insertError) throw insertError;
    return insert.display_name;
  }

  const providers = Array.from(
    new Set([...(existing.providers ?? []), input.provider])
  );

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      email: input.email ?? null,
      image_url: input.image ?? null,
      providers,
      last_seen_at: now,
    })
    .eq("id", input.id);

  if (updateError) throw updateError;
  return existing.display_name;
}

export async function getProfileDisplayName(userId: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return data?.display_name ?? null;
}
