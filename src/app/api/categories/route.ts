import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "edge";

const FALLBACK_CATEGORIES = [
  { id: 1, slug: "conflict", name_ko: "Conflict & 고민", sort_order: 1 },
  { id: 2, slug: "venting", name_ko: "Venting & Stories", sort_order: 2 },
  { id: 3, slug: "advice", name_ko: "Advice Request", sort_order: 3 },
  { id: 4, slug: "poll", name_ko: "Poll & Decision", sort_order: 4 },
  { id: 5, slug: "love", name_ko: "Love & Positive Stories", sort_order: 5 },
];

export async function GET() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("categories")
    .select("id, slug, name_ko, sort_order")
    .order("sort_order", { ascending: true });

  if (error) {
    return Response.json(FALLBACK_CATEGORIES);
  }
  return Response.json((data ?? FALLBACK_CATEGORIES) as typeof FALLBACK_CATEGORIES);
}
