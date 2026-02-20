import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

const TENOR_SEARCH_URL = "https://tenor.googleapis.com/v2/search";
const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 24;

function resolveLimit(raw: string | null) {
  const value = raw ? Number(raw) : DEFAULT_LIMIT;
  if (!Number.isFinite(value)) return DEFAULT_LIMIT;
  return Math.max(1, Math.min(MAX_LIMIT, Math.floor(value)));
}

export async function GET(request: NextRequest) {
  const apiKey = process.env.TENOR_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "TENOR_API_KEY is not configured." },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  const limit = resolveLimit(searchParams.get("limit"));

  if (!q) {
    return NextResponse.json({ results: [] });
  }
  if (q.length > 80) {
    return NextResponse.json({ error: "Query too long." }, { status: 400 });
  }

  const params = new URLSearchParams({
    key: apiKey,
    q,
    limit: String(limit),
    media_filter: "gif,tinygif",
    contentfilter: "medium",
  });

  const clientKey = process.env.TENOR_CLIENT_KEY?.trim();
  if (clientKey) {
    params.set("client_key", clientKey);
  }

  try {
    const response = await fetch(`${TENOR_SEARCH_URL}?${params.toString()}`, {
      method: "GET",
      headers: { accept: "application/json" },
      cache: "no-store",
    });

    const payload = (await response.json().catch(() => null)) as
      | {
          results?: Array<{
            id?: string;
            content_description?: string;
            media_formats?: {
              gif?: { url?: string };
              tinygif?: { url?: string };
            };
          }>;
        }
      | null;

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch GIF results." },
        { status: 502 }
      );
    }

    const results = (payload?.results ?? [])
      .map((item) => {
        const gifUrl = item.media_formats?.gif?.url ?? item.media_formats?.tinygif?.url;
        if (!gifUrl) return null;
        return {
          id: item.id ?? crypto.randomUUID(),
          url: gifUrl,
          alt: item.content_description ?? "GIF",
        };
      })
      .filter((item): item is { id: string; url: string; alt: string } => Boolean(item));

    return NextResponse.json({ results });
  } catch (error) {
    console.error("tenor search failed", error);
    return NextResponse.json(
      { error: "GIF 검색 중 오류가 발생했어요." },
      { status: 500 }
    );
  }
}
