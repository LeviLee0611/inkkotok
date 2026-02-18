import { listPosts } from "@/lib/posts";
import { EMOTION_CATEGORIES, MOODS } from "@/lib/emotions";
import Link from "next/link";

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
          커뮤니티 피드
        </p>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-display text-3xl font-semibold text-[var(--ink)]">
              지금 사람들이 나누는 이야기
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
              className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
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
            <div className="flex flex-wrap gap-2">
              <Link
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                  sort === "hot"
                    ? "border-rose-200 bg-rose-50 text-rose-700"
                    : "border-[var(--border-soft)] bg-white text-zinc-600"
                }`}
                href={`/feed?sort=hot${parsedCategoryId ? `&categoryId=${parsedCategoryId}` : ""}`}
              >
                🔥 Hot
              </Link>
              <Link
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                  sort === "latest"
                    ? "border-amber-200 bg-amber-50 text-amber-800"
                    : "border-[var(--border-soft)] bg-white text-zinc-600"
                }`}
                href={`/feed?sort=latest${parsedCategoryId ? `&categoryId=${parsedCategoryId}` : ""}`}
              >
                최신순
              </Link>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                  !parsedCategoryId
                    ? "border-[var(--ink)] bg-[var(--ink)] text-white"
                    : "border-[var(--border-soft)] bg-white text-zinc-600"
                }`}
                href={`/feed?sort=${sort}`}
              >
                전체
              </Link>
              {EMOTION_CATEGORIES.map((category) => (
                <Link
                  key={category.id}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                    parsedCategoryId === category.id
                      ? "border-[var(--ink)] bg-[var(--ink)] text-white"
                      : "border-[var(--border-soft)] bg-white text-zinc-600"
                  }`}
                  href={`/feed?sort=${sort}&categoryId=${category.id}`}
                >
                  {category.label}
                </Link>
              ))}
            </div>
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
                {post.mood ? (
                  <span className="rounded-full border border-rose-100 bg-rose-50 px-2 py-0.5 text-rose-700">
                    {MOODS.find((item) => item.value === post.mood)?.label ?? post.mood}
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
              {["Money Conflicts", "Parenting-related conflicts", "In-law issues"].map((label) => (
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
