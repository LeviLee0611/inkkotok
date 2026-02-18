"use client";

import { type ReactNode, useMemo, useState } from "react";

import { MAX_COMMENT_DEPTH } from "@/lib/comment-thread";

import CommentComposer from "./CommentComposer";
import { CommentManageActions } from "./ManageActions";

type CommentItem = {
  id: string;
  post_id: string;
  author_id: string;
  body: string;
  parent_id?: string | null;
  created_at: string;
  author?: { display_name: string | null; image_url: string | null }[] | null;
};

function AuthorAvatar({
  displayName,
  imageUrl,
  alt,
  size = "h-5 w-5",
}: {
  displayName: string;
  imageUrl: string | null;
  alt: string;
  size?: string;
}) {
  return (
    <span
      className={`flex items-center justify-center overflow-hidden rounded-full border border-[var(--border-soft)] bg-white ${size}`}
    >
      {imageUrl ? (
        <img src={imageUrl} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <span>{displayName.slice(0, 1)}</span>
      )}
    </span>
  );
}

function CommentCard({
  comment,
  children,
}: {
  comment: CommentItem;
  children?: ReactNode;
}) {
  const authorName = comment.author?.[0]?.display_name ?? comment.author_id.slice(0, 6);
  const authorImage = comment.author?.[0]?.image_url ?? null;

  return (
    <div className="rounded-2xl border border-[var(--border-soft)] bg-gradient-to-b from-white to-[var(--paper)] px-4 py-3 text-xs text-zinc-600">
      <div className="inline-flex items-center gap-2 text-[11px] font-semibold text-[var(--cocoa)]">
        <AuthorAvatar displayName={authorName} imageUrl={authorImage} alt="댓글 작성자 프로필" />
        {authorName}
      </div>
      <p className="mt-1 whitespace-pre-wrap">{comment.body}</p>
      {children}
    </div>
  );
}

export default function CommentsSection({
  postId,
  comments,
}: {
  postId: string;
  comments: CommentItem[];
}) {
  const [replyOpenId, setReplyOpenId] = useState<string | null>(null);
  const [likedCommentIds, setLikedCommentIds] = useState<Record<string, boolean>>({});

  const { roots, childrenByParent } = useMemo(() => {
    const map = new Map<string, CommentItem[]>();
    const topLevel: CommentItem[] = [];

    comments.forEach((comment) => {
      if (!comment.parent_id) {
        topLevel.push(comment);
        return;
      }
      const list = map.get(comment.parent_id) ?? [];
      list.push(comment);
      map.set(comment.parent_id, list);
    });

    return { roots: topLevel, childrenByParent: map };
  }, [comments]);

  const renderNode = (comment: CommentItem, depth: number) => {
    const children = childrenByParent.get(comment.id) ?? [];
    const replyOpened = replyOpenId === comment.id;
    const canReply = depth < MAX_COMMENT_DEPTH;
    const liked = likedCommentIds[comment.id] === true;

    return (
      <div key={comment.id} className="grid gap-2">
        <CommentCard comment={comment}>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-[11px]">
              <button
                type="button"
                aria-label="좋아요"
                className={`inline-flex h-7 items-center gap-1 rounded-full border px-2.5 transition ${
                  liked
                    ? "border-rose-200 bg-rose-50 text-rose-600"
                    : "border-[var(--border-soft)] bg-white text-zinc-500"
                }`}
                onClick={() =>
                  setLikedCommentIds((prev) => ({
                    ...prev,
                    [comment.id]: !prev[comment.id],
                  }))
                }
              >
                <span className="text-[13px] leading-none">{liked ? "❤️" : "🤍"}</span>
              </button>
              {canReply ? (
                <button
                  type="button"
                  aria-label={replyOpened ? "답글 입력 닫기" : "답글 입력 열기"}
                  className="inline-flex h-7 items-center gap-1 rounded-full border border-[var(--border-soft)] bg-white px-2.5 text-zinc-500 transition hover:text-[var(--cocoa)]"
                  onClick={() => setReplyOpenId(replyOpened ? null : comment.id)}
                >
                  <span className="text-[13px] leading-none">📄</span>
                </button>
              ) : null}
              <span className="text-[10px] text-zinc-400">깊이 {depth}/{MAX_COMMENT_DEPTH}</span>
              {!canReply ? (
                <span className="rounded-full border border-[var(--border-soft)] bg-white px-2 py-1 text-[10px] font-semibold text-zinc-500">
                  최대 깊이
                </span>
              ) : null}
            </div>
            <div className="flex items-center">
              <CommentManageActions
                commentId={comment.id}
                authorId={comment.author_id}
                body={comment.body}
                layout="inline"
              />
            </div>
          </div>
        </CommentCard>

        {replyOpened && canReply ? (
          <div className="ml-4 border-l border-[var(--border-soft)] pl-3">
            <CommentComposer
              postId={postId}
              parentId={comment.id}
              compact
              placeholder="답글을 입력해주세요"
              submitLabel="답글 등록"
              onCancel={() => setReplyOpenId(null)}
              onSuccess={() => window.location.reload()}
            />
          </div>
        ) : null}

        {children.length ? (
          <div className="ml-4 grid gap-2 border-l border-[var(--border-soft)] pl-3">
            {children.map((child) => renderNode(child, depth + 1))}
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <section className="mx-auto mt-6 w-full max-w-5xl rounded-[28px] border border-[var(--border-soft)] bg-white/90 p-6 shadow-sm">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <h2 className="text-lg font-semibold text-[var(--ink)]">댓글</h2>
        <CommentComposer postId={postId} />
      </div>
      <div className="mt-4 grid gap-3">{roots.map((comment) => renderNode(comment, 1))}</div>
    </section>
  );
}
