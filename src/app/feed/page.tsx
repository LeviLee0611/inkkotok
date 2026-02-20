import { listPosts } from "@/lib/posts";
import { EMOTION_CATEGORIES } from "@/lib/emotions";
import Link from "next/link";
import FeedFilters from "@/app/feed/FeedFilters";

export const runtime = "edge";
export const dynamic = "force-dynamic";

function infoWeightLabel(weight?: number) {
  const value = typeof weight === "number" ? Math.min(100, Math.max(0, weight)) : 50;
  if (value >= 70) return `정보기반 ${value}%`;
  if (value <= 30) return `자유주제 ${100 - value}%`;
  return `균형형 ${value}%`;
}

type FeedPageProps = {
  searchParams: Promise<{ categoryId?: string; sort?: string; page?: string }>;
};

export default async function FeedPage({ searchParams }: FeedPageProps) {
  const query = await searchParams;
  const parsedCategoryId =
    query.categoryId && Number.isInteger(Number(query.categoryId))
      ? Number(query.categoryId)
      : undefined;
  const sort = query.sort === "hot" ? "hot" : "latest";
  const page =
    query.page && Number.isInteger(Number(query.page)) && Number(query.page) > 0
      ? Number(query.page)
      : 1;
  const PAGE_SIZE = 12;
  const offset = (page - 1) * PAGE_SIZE;

  const feedResult = await listPosts(PAGE_SIZE + 1, {
    categoryId: parsedCategoryId,
    sort,
    offset,
  }).catch((error) => {
    console.error("feed listPosts failed", error);
    return [];
  });
  const hasNextPage = feedResult.length > PAGE_SIZE;
  const feed = hasNextPage ? feedResult.slice(0, PAGE_SIZE) : feedResult;

  const buildPageHref = (nextPage: number) => {
    const params = new URLSearchParams();
    params.set("sort", sort);
    if (parsedCategoryId) params.set("categoryId", String(parsedCategoryId));
    if (nextPage > 1) params.set("page", String(nextPage));
    return `/feed?${params.toString()}`;
  };
  return (
    <div className="min-h-screen px-6 pb-20 pt-10 md:px-12">
      <header className="relative mx-auto flex w-full max-w-6xl flex-col gap-4 overflow-hidden rounded-[28px] border border-[var(--border-soft)] bg-white/90 p-6 shadow-[var(--shadow)]">
        <div className="pointer-events-none absolute left-6 top-5 h-1.5 w-14 rounded-full bg-[var(--accent)]/80" />
        <p className="pt-3 text-sm font-semibold text-[var(--cocoa)]">
          잉꼬톡 피드
        </p>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-display text-3xl font-semibold text-[var(--ink)]">
              오늘의 이야기와 생활 정보를 한 번에
            </h1>
            <p className="mt-2 text-sm text-zinc-600">
              잉꼬부부의 경험과 팁이 모이는 공간이에요. 읽기는 누구나 가능하고,
              로그인하면 글과 댓글로 바로 참여할 수 있어요.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              className="rounded-full border border-[var(--border-soft)] bg-white px-4 py-2 text-sm font-semibold text-[var(--cocoa)]"
              href="/"
            >
              홈으로
            </Link>
            <a
              className="rounded-full border border-[var(--border-soft)] bg-gradient-to-b from-white to-[var(--paper)] px-4 py-2 text-sm font-semibold text-[var(--cocoa)] shadow-[0_12px_24px_-18px_rgba(54,41,31,0.75)] transition hover:-translate-y-0.5 hover:from-white hover:to-white"
              href="/write"
            >
              글쓰기
            </a>
          </div>
        </div>
      </header>
      <section className="mx-auto mt-4 w-full max-w-6xl rounded-3xl border border-[var(--border-soft)] bg-white/90 p-4 shadow-sm">
        <p className="mb-3 text-xs font-semibold text-[var(--cocoa)]">필터</p>
        <FeedFilters sort={sort} categoryId={parsedCategoryId} />
      </section>
      <section className="mx-auto mt-8 w-full max-w-6xl">
        <div className="grid gap-3">
          {feed.map((post) => (
            <article
              key={post.id}
              className="rounded-2xl border border-[var(--border-soft)] bg-white/90 px-3.5 py-3 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[11px] font-semibold text-[var(--cocoa)]">{post.lounge}</p>
                  <span className="rounded-full border border-[var(--accent)]/25 bg-[var(--accent)]/10 px-2 py-0.5 text-[10px] font-semibold text-[var(--accent)]">
                    {infoWeightLabel(post.info_weight)}
                  </span>
                  {typeof post.category_id === "number" ? (
                    <span className="rounded-full border border-[var(--border-soft)] bg-white px-2 py-0.5 text-zinc-500">
                      {EMOTION_CATEGORIES.find((item) => item.id === post.category_id)?.label ??
                        "카테고리"}
                    </span>
                  ) : null}
                </div>
                <span className="inline-flex items-center gap-1.5 text-[11px] text-zinc-500">
                  <span className="flex h-5 w-5 items-center justify-center overflow-hidden rounded-full border border-[var(--border-soft)] bg-white">
                    {post.author?.[0]?.image_url ? (
                      <img
                        src={post.author[0].image_url}
                        alt="작성자 프로필"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-[10px] font-semibold text-[var(--cocoa)]">
                        {(post.author?.[0]?.display_name ?? "익").slice(0, 1)}
                      </span>
                    )}
                  </span>
                  작성자 · {post.author?.[0]?.display_name ?? post.id.slice(0, 6)}
                </span>
              </div>
              <div className="mt-1.5 flex items-start justify-between gap-3">
                <Link href={`/post/${post.id}`} className="min-w-0 flex-1">
                  <div className="flex min-w-0 items-center gap-2">
                    {post.media_url ? (
                      <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                        GIF
                      </span>
                    ) : null}
                    <h2 className="line-clamp-1 text-base font-semibold text-[var(--ink)] hover:text-[var(--accent)]">
                      {post.title}
                    </h2>
                  </div>
                </Link>
                <div className="mt-0.5 flex shrink-0 gap-2.5 text-[11px] text-zinc-500">
                  <span>공감 {post.reactions_count ?? post.like_count ?? 0}</span>
                  <span>댓글 {post.comments_count ?? 0}</span>
                </div>
              </div>
            </article>
          ))}
          <div className="mt-2 flex items-center justify-between">
            {page > 1 ? (
              <Link
                className="rounded-full border border-[var(--border-soft)] bg-white px-4 py-2 text-xs font-semibold text-[var(--cocoa)] transition hover:-translate-y-0.5 hover:bg-[var(--paper)]"
                href={buildPageHref(page - 1)}
              >
                이전 페이지
              </Link>
            ) : (
              <span />
            )}
            <span className="text-xs font-semibold text-zinc-500">페이지 {page}</span>
            {hasNextPage ? (
              <Link
                className="rounded-full border border-[var(--border-soft)] bg-white px-4 py-2 text-xs font-semibold text-[var(--cocoa)] transition hover:-translate-y-0.5 hover:bg-[var(--paper)]"
                href={buildPageHref(page + 1)}
              >
                다음 페이지
              </Link>
            ) : (
              <span />
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
