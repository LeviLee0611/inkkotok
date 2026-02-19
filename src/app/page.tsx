import Link from "next/link";
import { EMOTION_CATEGORIES } from "@/lib/emotions";
import { listPosts } from "@/lib/posts";

type HomePageProps = {
  searchParams: Promise<{ loggedOut?: string }>;
};

export const runtime = "edge";
export const dynamic = "force-dynamic";

function toExcerpt(text: string, limit = 92) {
  if (text.length <= limit) return text;
  return `${text.slice(0, limit)}...`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export default async function Home({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const loggedOut = params.loggedOut === "1";
  const latestPosts = await listPosts(4, { sort: "latest" }).catch((error) => {
    console.error("home listPosts failed", error);
    return [];
  });

  return (
    <div className="min-h-screen px-6 pb-24 pt-28 md:px-12">
      <main className="mx-auto w-full max-w-6xl">
        {loggedOut ? (
          <div className="mb-6 rounded-2xl border border-[var(--border-soft)] bg-white/80 px-4 py-3 text-sm font-semibold text-[var(--cocoa)] shadow-[0_10px_24px_-20px_rgba(54,41,31,0.7)] backdrop-blur">
            로그아웃되었습니다.
          </div>
        ) : null}
        <section className="relative overflow-hidden rounded-[40px] border border-[var(--border-soft)] bg-gradient-to-br from-white/95 to-[var(--paper)]/90 p-7 shadow-[0_32px_80px_-48px_rgba(54,41,31,0.5)] backdrop-blur md:p-10">
          <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-[var(--sun)]/40 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-10 h-36 w-36 rounded-full bg-[var(--accent)]/15 blur-2xl" />
          <div className="pointer-events-none absolute left-7 top-7 h-1.5 w-16 rounded-full bg-[var(--accent)]/80" />
          <p className="font-hero relative text-[clamp(1.95rem,5vw,3.8rem)] font-extrabold leading-[1.08] tracking-[-0.02em] text-[var(--ink)]">
            잉꼬톡에 오신 걸 환영해요
          </p>
          <p className="relative mb-5 mt-4 max-w-3xl text-base leading-7 text-zinc-600 md:text-lg">
            젊은 부부가 꿀팁도 나누고, 공감도 주고받고, 생활 정보도 편하게 이야기하는
            공간이에요.
          </p>
          <div className="mb-2 flex flex-wrap gap-2">
            {["카테고리 중심 탐색", "최신글 빠른 확인"].map((label) => (
              <span
                key={label}
                className="rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-3 py-1 text-xs font-semibold text-[var(--accent)]"
              >
                {label}
              </span>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-3">
            <Link
              className="rounded-full border border-[var(--border-soft)] bg-white/90 px-6 py-3 text-sm font-semibold text-[var(--ink)] shadow-[0_14px_30px_-24px_rgba(54,41,31,0.7)] transition hover:-translate-y-0.5 hover:bg-white"
              href="/feed"
            >
              전체 글 보기
            </Link>
            <Link
              className="rounded-full border border-[var(--accent)]/40 bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_34px_-22px_rgba(229,106,77,0.75)] transition hover:-translate-y-0.5 hover:bg-[#d85f43]"
              href="/write"
            >
              글쓰기
            </Link>
          </div>
        </section>

        <section className="mt-10 grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
          <div className="rounded-[36px] border border-[var(--border-soft)] bg-gradient-to-b from-white/95 to-white/80 p-6 shadow-[0_24px_56px_-40px_rgba(54,41,31,0.55)] backdrop-blur md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-[var(--cocoa)]">카테고리 바로가기</p>
                <h2 className="mt-2 font-display text-3xl font-semibold text-[var(--ink)]">
                  원하는 주제로 바로 이동
                </h2>
              </div>
              <a
                className="rounded-full border border-[var(--accent)]/30 bg-white px-4 py-2 text-sm font-semibold text-[var(--accent)]"
                href="/feed"
              >
                최신 글 보기
              </a>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                {
                  id: 1,
                  title: "운동 · 건강",
                  desc: "루틴, 식단, 회복 기록",
                  icon: "💪",
                },
                {
                  id: 2,
                  title: "육아 · 가족",
                  desc: "육아 팁, 생활 노하우, 가족 대화",
                  icon: "👨‍👩‍👧",
                },
                {
                  id: 3,
                  title: "경제 · 재테크",
                  desc: "가계 관리, 소비 습관, 투자 공부",
                  icon: "📈",
                },
                {
                  id: 5,
                  title: "일상 · 개인이야기",
                  desc: "경험 공유, 고민, 생각 정리",
                  icon: "📝",
                },
                {
                  id: 4,
                  title: "투표 · 의견모음",
                  desc: "선택이 필요할 때 빠르게 물어보기",
                  icon: "🗳️",
                },
                {
                  id: 0,
                  title: "전체 아카이브",
                  desc: "카테고리 없이 전체 흐름 보기",
                  icon: "🗂️",
                },
              ].map((item) => (
                <a
                  key={item.title}
                  className="rounded-3xl border border-[var(--border-soft)] bg-white/90 px-5 py-4 shadow-[0_18px_30px_-28px_rgba(54,41,31,0.85)] transition hover:-translate-y-0.5 hover:border-[var(--accent)]/35 hover:shadow-[0_24px_40px_-30px_rgba(54,41,31,0.75)]"
                  href={item.id === 0 ? "/feed?sort=latest" : `/feed?sort=latest&categoryId=${item.id}`}
                >
                  <p className="text-sm font-semibold text-[var(--ink)]">
                    <span className="mr-1.5">{item.icon}</span>
                    {item.title}
                  </p>
                  <p className="mt-2 text-xs text-zinc-600">{item.desc}</p>
                </a>
              ))}
            </div>
          </div>

          <div className="rounded-[36px] border border-[var(--border-soft)] bg-gradient-to-b from-white/95 to-white/80 p-6 shadow-[0_24px_56px_-40px_rgba(54,41,31,0.55)] backdrop-blur md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[var(--cocoa)]">최신글</p>
                <h3 className="mt-1 font-display text-2xl font-semibold text-[var(--ink)]">
                  방금 올라온 이야기
                </h3>
              </div>
              <Link
                className="rounded-full border border-[var(--accent)]/30 bg-white px-4 py-2 text-sm font-semibold text-[var(--accent)] transition hover:bg-[var(--accent)]/10"
                href="/feed?sort=latest"
              >
                전체 최신글 보기
              </Link>
            </div>
            {latestPosts.length ? (
              <div className="mt-5 grid gap-3">
                {latestPosts.map((post) => {
                  const category = EMOTION_CATEGORIES.find((item) => item.id === post.category_id);
                  return (
                    <a
                      key={post.id}
                      className="rounded-3xl border border-[var(--border-soft)] bg-white/90 px-5 py-4 shadow-[0_18px_30px_-28px_rgba(54,41,31,0.85)] transition hover:-translate-y-0.5 hover:border-[var(--accent)]/35 hover:shadow-[0_24px_40px_-30px_rgba(54,41,31,0.75)]"
                      href={`/post/${post.id}`}
                    >
                      <div className="mb-2 h-1.5 w-12 rounded-full bg-[var(--accent)]/70" />
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        {category ? (
                          <span className="rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-2 py-0.5 font-semibold text-[var(--accent)]">
                            {category.label}
                          </span>
                        ) : null}
                        <span className="text-zinc-500">{formatDate(post.created_at)}</span>
                      </div>
                      <p className="mt-2 line-clamp-1 text-sm font-semibold text-[var(--ink)]">
                        {post.title}
                      </p>
                      <p className="mt-2 text-xs leading-5 text-zinc-600">{toExcerpt(post.body)}</p>
                    </a>
                  );
                })}
              </div>
            ) : (
              <p className="mt-5 rounded-2xl border border-[var(--border-soft)] bg-gradient-to-br from-white to-[var(--paper)] px-4 py-3 text-sm text-zinc-600">
                아직 최신글이 없습니다. 첫 글을 남겨보세요.
              </p>
            )}
          </div>
        </section>

        <section className="mt-10 rounded-[32px] border border-[var(--border-soft)] bg-gradient-to-b from-white/95 to-white/80 p-6 shadow-[0_24px_56px_-40px_rgba(54,41,31,0.55)] backdrop-blur">
          <p className="text-sm font-semibold text-[var(--cocoa)]">잉꼬톡 이용 규칙</p>
          <ul className="mt-4 grid gap-2 text-sm text-zinc-600">
            <li>실명, 연락처, 개인정보 노출 금지</li>
            <li>비난보다 경험과 근거 중심으로 작성</li>
            <li>의견이 달라도 존중하는 표현 사용</li>
          </ul>
          <p className="mt-4 text-sm text-zinc-500">
            서로에게 도움이 되는 정보와 따뜻한 대화를 함께 만들어가요.
          </p>
        </section>
      </main>
    </div>
  );
}
