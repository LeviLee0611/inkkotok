import { listPosts } from "@/lib/posts";
import Link from "next/link";

export const runtime = "edge";
export const dynamic = "force-dynamic";

function toExcerpt(text: string, limit = 120) {
  if (text.length <= limit) return text;
  return `${text.slice(0, limit)}...`;
}

export default async function FeedPage() {
  const feed = await listPosts(30).catch((error) => {
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
              로그인 없이 읽을 수 있어요. 로그인 기능은 Supabase 연동 뒤
              제공될 예정입니다.
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
          {feed.map((post) => (
            <article
              key={post.id}
              className="rounded-3xl border border-[var(--border-soft)] bg-white/90 p-5 shadow-sm"
            >
              <p className="text-xs font-semibold text-[var(--cocoa)]">
                {post.lounge}
              </p>
              <a href={`/post/${post.id}`}>
                <h2 className="mt-3 text-xl font-semibold text-[var(--ink)]">
                  {post.title}
                </h2>
              </a>
              <p className="mt-2 text-sm leading-6 text-zinc-600">
                {toExcerpt(post.body)}
              </p>
              <div className="mt-4 flex items-center gap-4 text-xs text-zinc-500">
                <span>
                  작성자 · {post.author?.[0]?.display_name ?? post.id.slice(0, 6)}
                </span>
                <span>공감 32</span>
                <span>댓글 12</span>
              </div>
            </article>
          ))}
        </div>
        <aside className="grid gap-4">
          <div className="rounded-3xl border border-[var(--border-soft)] bg-white/90 p-5 shadow-sm">
            <p className="text-xs font-semibold text-[var(--cocoa)]">
              필터/라운지
            </p>
            <div className="mt-3 grid gap-2 text-sm text-zinc-600">
              {[
                "신혼 1-3년",
                "30-40대 부부",
                "50+ 동행",
                "관계 회복",
                "재정/자산",
                "육아 루틴",
              ].map((label) => (
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
              <li>글/댓글 로그인 기능은 Supabase 연동 예정</li>
              <li>실명, 연락처 공유 금지</li>
              <li>민감한 정보는 자동 블라인드</li>
            </ul>
          </div>
        </aside>
      </section>
    </div>
  );
}
