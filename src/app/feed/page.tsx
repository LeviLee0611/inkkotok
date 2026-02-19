import { listPosts } from "@/lib/posts";
import { EMOTION_CATEGORIES } from "@/lib/emotions";
import Link from "next/link";
import FeedFilters from "@/app/feed/FeedFilters";

export const runtime = "edge";
export const dynamic = "force-dynamic";

function toExcerpt(text: string, limit = 120) {
  if (text.length <= limit) return text;
  return `${text.slice(0, limit)}...`;
}

type FeedPageProps = {
  searchParams: Promise<{ categoryId?: string; sort?: string }>;
};

export default async function FeedPage({ searchParams }: FeedPageProps) {
  const query = await searchParams;
  const parsedCategoryId =
    query.categoryId && Number.isInteger(Number(query.categoryId))
      ? Number(query.categoryId)
      : undefined;
  const sort = query.sort === "hot" ? "hot" : "latest";

  const feed = await listPosts(30, { categoryId: parsedCategoryId, sort }).catch((error) => {
    console.error("feed listPosts failed", error);
    return [];
  });
  return (
    <div className="min-h-screen px-6 pb-20 pt-10 md:px-12">
      <header className="mx-auto flex w-full max-w-6xl flex-col gap-4 rounded-[28px] border border-[var(--border-soft)] bg-white/90 p-6 shadow-[var(--shadow)]">
        <p className="text-sm font-semibold text-[var(--cocoa)]">
          정보 · 커뮤니티 피드
        </p>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-display text-3xl font-semibold text-[var(--ink)]">
              최신 정보와 이야기를 한 번에
            </h1>
            <p className="mt-2 text-sm text-zinc-600">
              로그인 없이 읽을 수 있어요. 로그인하면 글과 댓글을 바로 남길 수
              있습니다.
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
      <section className="mx-auto mt-8 grid w-full max-w-6xl gap-4 md:grid-cols-[1.2fr_0.8fr]">
        <div className="grid gap-4">
          <div className="rounded-3xl border border-[var(--border-soft)] bg-white/90 p-4 shadow-sm">
            <p className="mb-3 text-xs font-semibold text-[var(--cocoa)]">필터</p>
            <FeedFilters sort={sort} categoryId={parsedCategoryId} />
          </div>
          {feed.map((post) => (
            <article
              key={post.id}
              className="rounded-3xl border border-[var(--border-soft)] bg-white/90 p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <p className="font-semibold text-[var(--cocoa)]">{post.lounge}</p>
                {typeof post.category_id === "number" ? (
                  <span className="rounded-full border border-[var(--border-soft)] bg-white px-2 py-0.5 text-zinc-500">
                    {EMOTION_CATEGORIES.find((item) => item.id === post.category_id)?.label ??
                      "카테고리"}
                  </span>
                ) : null}
              </div>
              <a href={`/post/${post.id}`}>
                <h2 className="mt-3 text-xl font-semibold text-[var(--ink)]">
                  {post.title}
                </h2>
              </a>
              <p className="mt-2 text-sm leading-6 text-zinc-600">
                {toExcerpt(post.body)}
              </p>
              <div className="mt-4 flex items-center gap-4 text-xs text-zinc-500">
                <span className="inline-flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full border border-[var(--border-soft)] bg-white">
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
                <span>공감 {post.reactions_count ?? post.like_count ?? 0}</span>
                <span>댓글 {post.comments_count ?? 0}</span>
              </div>
            </article>
          ))}
        </div>
        <aside className="grid gap-4">
          <div className="rounded-3xl border border-[var(--border-soft)] bg-white/90 p-5 shadow-sm">
            <p className="text-xs font-semibold text-[var(--cocoa)]">
              필터/태그
            </p>
            <div className="mt-3 grid gap-2 text-sm text-zinc-600">
              {["운동 루틴", "육아 기록", "경제 공부", "개인 경험담"].map((label) => (
                <button
                  key={label}
                  className="rounded-2xl border border-[var(--border-soft)] bg-[var(--paper)] px-3 py-2 text-left text-xs font-semibold text-[var(--cocoa)]"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-[var(--border-soft)] bg-white/90 p-5 shadow-sm">
            <p className="text-xs font-semibold text-[var(--cocoa)]">
              이용 안내
            </p>
            <ul className="mt-3 grid gap-2 text-xs text-zinc-600">
              <li>읽기는 누구나 가능</li>
              <li>로그인 후 글/댓글 작성 가능</li>
              <li>실명, 연락처 공유 금지</li>
              <li>민감한 정보는 자동 블라인드</li>
            </ul>
          </div>
        </aside>
      </section>
    </div>
  );
}
