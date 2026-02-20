import { getPostById, getPollByPostId, listComments } from "@/lib/posts";
import { getUserFromRequest } from "@/lib/auth";
import { EMOTION_CATEGORIES } from "@/lib/emotions";
import { headers } from "next/headers";
import CommentsSection from "./CommentsSection";
import { PostManageActions } from "./ManageActions";
import PostLikeButton from "./PostLikeButton";
import PollCard from "./PollCard";

export const runtime = "edge";

type PostDetailProps = {
  params: Promise<{ id: string }>;
};

type BodyPart =
  | { type: "text"; value: string }
  | { type: "image"; alt: string; url: string };

function infoWeightLabel(weight?: number) {
  const value = typeof weight === "number" ? Math.min(100, Math.max(0, weight)) : 50;
  if (value >= 70) return `정보기반 ${value}%`;
  if (value <= 30) return `자유주제 ${100 - value}%`;
  return `균형형 ${value}%`;
}

function parseBodyParts(body: string): BodyPart[] {
  const parts: BodyPart[] = [];
  const pattern = /!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g;
  let cursor = 0;

  for (const match of body.matchAll(pattern)) {
    const matchedText = match[0];
    const alt = match[1] || "첨부 이미지";
    const url = match[2];
    const start = match.index ?? 0;

    if (start > cursor) {
      const text = body.slice(cursor, start);
      if (text.trim()) {
        parts.push({ type: "text", value: text });
      }
    }
    parts.push({ type: "image", alt, url });
    cursor = start + matchedText.length;
  }

  if (cursor < body.length) {
    const text = body.slice(cursor);
    if (text.trim()) {
      parts.push({ type: "text", value: text });
    }
  }

  return parts.length ? parts : [{ type: "text", value: body }];
}

export default async function PostDetailPage({ params }: PostDetailProps) {
  const { id } = await params;
  const requestHeaders = await headers();
  const user = await getUserFromRequest({ headers: requestHeaders }).catch(() => null);
  const post = await getPostById(id).catch((error) => {
    console.error("post getPostById failed", error);
    return null;
  });
  const poll =
    post?.category_id === 4
      ? await getPollByPostId(id, user?.id ?? null).catch((error) => {
          console.error("post getPollByPostId failed", error);
          return null;
        })
      : null;
  const comments = post
    ? await listComments(id, 100).catch((error) => {
        console.error("post listComments failed", error);
        return [];
      })
    : [];
  const bodyParts = post ? parseBodyParts(post.body) : [];
  const showLegacyMedia = Boolean(post?.media_url && !post.body.includes(post.media_url));

  if (!post) {
    return (
      <div className="min-h-screen px-6 pb-20 pt-10 md:px-12">
        <div className="mx-auto w-full max-w-5xl rounded-[28px] border border-[var(--border-soft)] bg-white/90 p-6 shadow-sm">
          <p className="text-sm text-zinc-600">글을 찾을 수 없습니다.</p>
          <a
            className="mt-4 inline-flex rounded-full border border-[var(--border-soft)] bg-white px-4 py-2 text-sm font-semibold text-[var(--cocoa)]"
            href="/feed"
          >
            피드로 돌아가기
          </a>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen px-6 pb-20 pt-10 md:px-12">
      <div className="mx-auto mb-3 w-full max-w-5xl md:-mb-10">
        <a
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-soft)] bg-white/90 text-[var(--cocoa)] shadow-sm transition hover:-translate-y-0.5 hover:bg-white md:-translate-x-14"
          href="/feed"
          aria-label="뒤로가기"
          title="뒤로가기"
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M12.5 4.5L7 10L12.5 15.5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </a>
      </div>
      <header className="mx-auto flex w-full max-w-5xl flex-col gap-4 rounded-[28px] border border-[var(--border-soft)] bg-gradient-to-b from-white to-[var(--paper)] p-6 shadow-[var(--shadow)]">
        <div className="flex items-center gap-2">
          <p className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-[var(--cocoa)]">
            {post.lounge}
          </p>
          <span className="inline-flex rounded-full border border-[var(--accent)]/25 bg-[var(--accent)]/10 px-3 py-1 text-xs font-semibold text-[var(--accent)]">
            {infoWeightLabel(post.info_weight)}
          </span>
          {typeof post.category_id === "number" ? (
            <span className="inline-flex rounded-full border border-[var(--border-soft)] bg-white px-3 py-1 text-xs text-zinc-600">
              {EMOTION_CATEGORIES.find((item) => item.id === post.category_id)?.label ?? "카테고리"}
            </span>
          ) : null}
          <span className="text-[11px] text-zinc-500">읽는 시간 약 2분</span>
        </div>
        <h1 className="font-display text-3xl font-semibold text-[var(--ink)]">
          {post.title}
        </h1>
        <div className="inline-flex items-center gap-2 text-sm text-zinc-600">
          <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border border-[var(--border-soft)] bg-white">
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
          작성자 · {post.author?.[0]?.display_name ?? post.author_id.slice(0, 6)}
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-zinc-500">
          <PostLikeButton postId={id} initialLikeCount={post.reactions_count ?? post.like_count ?? 0} />
          <span>댓글 {post.comments_count ?? comments.length}</span>
          <span>참여 {post.votes_count ?? 0}</span>
          <span>HOT {Math.round(post.hot_score ?? 0)}</span>
          <span>방금 전</span>
        </div>
        <PostManageActions
          postId={id}
          authorId={post.author_id}
        />
      </header>

      <main className="mx-auto mt-6 w-full max-w-5xl overflow-hidden rounded-[30px] border border-amber-100/80 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.98)_0%,rgba(254,252,245,0.97)_42%,rgba(248,244,235,0.95)_100%)] shadow-[0_18px_45px_rgba(120,53,15,0.08)]">
        <div className="flex items-center justify-between border-b border-amber-100/80 bg-[linear-gradient(90deg,rgba(255,255,255,0.85),rgba(255,251,235,0.8))] px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
            <span className="ml-2 text-[11px] font-medium text-zinc-500">Shared Story</span>
          </div>
          <span className="rounded-full border border-amber-100 bg-white/90 px-2.5 py-1 text-[11px] text-zinc-500">
            {post.body.trim().length}자
          </span>
        </div>
        <div className="p-4 sm:p-5">
          <div className="rounded-2xl border border-amber-100/90 bg-white/92 px-4 py-5 sm:px-5">
            {showLegacyMedia ? (
              <div className="mb-4 overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--paper)]">
                <img
                  src={post.media_url}
                  alt="게시글 첨부 GIF"
                  className="max-h-[460px] w-full object-contain"
                />
              </div>
            ) : null}
            <div className="grid gap-4">
              {bodyParts.map((part, index) =>
                part.type === "image" ? (
                  <div
                    key={`${part.url}-${index}`}
                    className="overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--paper)]"
                  >
                    <img
                      src={part.url}
                      alt={part.alt}
                      className="max-h-[460px] w-full object-contain"
                    />
                  </div>
                ) : (
                  <p key={`text-${index}`} className="whitespace-pre-wrap text-[15px] leading-8 text-zinc-700">
                    {part.value}
                  </p>
                )
              )}
            </div>
          </div>
        </div>
      </main>

      {poll ? <PollCard postId={id} initialPoll={poll} /> : null}

      <CommentsSection postId={id} comments={comments} />

      <footer className="mx-auto mt-6 flex w-full max-w-5xl flex-wrap gap-3">
        <a
          className="rounded-full border border-[var(--border-soft)] bg-white px-4 py-2 text-sm font-semibold text-[var(--cocoa)]"
          href="/feed"
        >
          목록으로
        </a>
        <a
          className="rounded-full bg-[var(--ink)] px-4 py-2 text-sm font-semibold text-white"
          href="/write"
        >
          관련 글 작성하기
        </a>
      </footer>
    </div>
  );
}
