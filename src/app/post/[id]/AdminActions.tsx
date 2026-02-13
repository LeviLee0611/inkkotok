"use client";

import { useEffect, useState } from "react";
import { authFetch } from "@/lib/auth-fetch";

type ProfileResponse = {
  isAdmin?: boolean;
};

let adminStatusPromise: Promise<boolean> | null = null;

function loadAdminStatus() {
  if (!adminStatusPromise) {
    adminStatusPromise = authFetch("/api/profile")
      .then(async (res) => {
        if (!res.ok) return false;
        const data = (await res.json()) as ProfileResponse;
        return data.isAdmin === true;
      })
      .catch(() => false);
  }
  return adminStatusPromise;
}

function useAdminStatus() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadAdminStatus().then((value) => {
      if (!cancelled) setIsAdmin(value);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return isAdmin;
}

export function PostAdminActions({
  postId,
  title,
  lounge,
  body,
}: {
  postId: string;
  title: string;
  lounge: string;
  body: string;
}) {
  const isAdmin = useAdminStatus();
  const [working, setWorking] = useState(false);
  if (!isAdmin) return null;

  const onEdit = async () => {
    const nextTitle = window.prompt("수정할 제목", title);
    if (nextTitle === null) return;
    const nextLounge = window.prompt("수정할 라운지", lounge);
    if (nextLounge === null) return;
    const nextBody = window.prompt("수정할 내용", body);
    if (nextBody === null) return;

    setWorking(true);
    try {
      const res = await authFetch(`/api/posts/${postId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: nextTitle,
          lounge: nextLounge,
          content: nextBody,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        window.alert(data?.error ?? "수정에 실패했습니다.");
        return;
      }
      window.location.reload();
    } finally {
      setWorking(false);
    }
  };

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
    <div className="mt-4 flex flex-wrap gap-2">
      <button
        type="button"
        className="rounded-full border border-[var(--border-soft)] bg-white px-3 py-1 text-xs font-semibold text-[var(--cocoa)]"
        onClick={onEdit}
        disabled={working}
      >
        게시글 수정(관리자)
      </button>
      <button
        type="button"
        className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700"
        onClick={onDelete}
        disabled={working}
      >
        게시글 삭제(관리자)
      </button>
    </div>
  );
}

export function CommentAdminActions({
  commentId,
  body,
}: {
  commentId: string;
  body: string;
}) {
  const isAdmin = useAdminStatus();
  const [working, setWorking] = useState(false);
  if (!isAdmin) return null;

  const onEdit = async () => {
    const nextBody = window.prompt("댓글 수정", body);
    if (nextBody === null) return;

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
    <div className="mt-2 flex gap-2">
      <button
        type="button"
        className="rounded-full border border-[var(--border-soft)] bg-white px-3 py-1 text-[11px] font-semibold text-[var(--cocoa)]"
        onClick={onEdit}
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
  );
}
