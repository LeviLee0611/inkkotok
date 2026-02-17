"use client";

import { useEffect, useState } from "react";

import { authFetch } from "@/lib/auth-fetch";

type Viewer = {
  userId: string | null;
  isAdmin: boolean;
};

let viewerPromise: Promise<Viewer> | null = null;

async function loadViewer(): Promise<Viewer> {
  if (!viewerPromise) {
    viewerPromise = authFetch("/api/profile")
      .then(async (res) => {
        if (!res.ok) return { userId: null, isAdmin: false };
        const data = (await res.json()) as {
          profile?: { id?: string };
          isAdmin?: boolean;
        };
        return {
          userId: data.profile?.id ?? null,
          isAdmin: data.isAdmin === true,
        };
      })
      .catch(() => ({ userId: null, isAdmin: false }));
  }
  return viewerPromise;
}

function useCanManage(authorId: string) {
  const [canManage, setCanManage] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadViewer().then((viewer) => {
      if (cancelled) return;
      setCanManage(viewer.isAdmin || viewer.userId === authorId);
    });
    return () => {
      cancelled = true;
    };
  }, [authorId]);

  return canManage;
}

export function PostManageActions({
  postId,
  authorId,
}: {
  postId: string;
  authorId: string;
}) {
  const canManage = useCanManage(authorId);
  const [working, setWorking] = useState(false);
  if (!canManage) return null;

  const onDelete = async () => {
    const ok = window.confirm("이 게시글과 댓글을 모두 삭제할까요?");
    if (!ok) return;

    setWorking(true);
    try {
      const res = await authFetch(`/api/posts/${postId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        window.alert(data?.error ?? "삭제에 실패했습니다.");
        return;
      }
      window.location.assign("/feed");
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <button
        type="button"
        className="rounded-full border border-[var(--border-soft)] bg-white px-3 py-1 text-xs font-semibold text-[var(--cocoa)]"
        onClick={() => {
          window.location.assign(`/post/${postId}/edit`);
        }}
        disabled={working}
      >
        글 수정
      </button>
      <button
        type="button"
        className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700"
        onClick={onDelete}
        disabled={working}
      >
        글 삭제
      </button>
    </div>
  );
}

export function CommentManageActions({
  commentId,
  authorId,
  body,
}: {
  commentId: string;
  authorId: string;
  body: string;
}) {
  const canManage = useCanManage(authorId);
  const [working, setWorking] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(body);
  if (!canManage) return null;

  const onEdit = async () => {
    const nextBody = draft.trim();
    if (!nextBody) {
      window.alert("댓글 내용을 입력해주세요.");
      return;
    }

    setWorking(true);
    try {
      const res = await authFetch(`/api/comments/${commentId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content: nextBody }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        window.alert(data?.error ?? "수정에 실패했습니다.");
        return;
      }
      setEditing(false);
      window.location.reload();
    } finally {
      setWorking(false);
    }
  };

  const onDelete = async () => {
    const ok = window.confirm("댓글을 삭제할까요?");
    if (!ok) return;

    setWorking(true);
    try {
      const res = await authFetch(`/api/comments/${commentId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        window.alert(data?.error ?? "삭제에 실패했습니다.");
        return;
      }
      window.location.reload();
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="mt-2">
      {editing ? (
        <div className="grid gap-2">
          <textarea
            className="min-h-[86px] w-full rounded-xl border border-[var(--border-soft)] bg-white px-3 py-2 text-xs text-[var(--ink)]"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            disabled={working}
          />
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-full border border-[var(--border-soft)] bg-white px-3 py-1 text-[11px] font-semibold text-[var(--cocoa)]"
              onClick={() => {
                setDraft(body);
                setEditing(false);
              }}
              disabled={working}
            >
              취소
            </button>
            <button
              type="button"
              className="rounded-full border border-[var(--border-soft)] bg-white px-3 py-1 text-[11px] font-semibold text-[var(--cocoa)]"
              onClick={() => {
                void onEdit();
              }}
              disabled={working}
            >
              저장
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-full border border-[var(--border-soft)] bg-white px-3 py-1 text-[11px] font-semibold text-[var(--cocoa)]"
            onClick={() => setEditing(true)}
            disabled={working}
          >
            댓글 수정
          </button>
          <button
            type="button"
            className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-[11px] font-semibold text-red-700"
            onClick={onDelete}
            disabled={working}
          >
            댓글 삭제
          </button>
        </div>
      )}
    </div>
  );
}
