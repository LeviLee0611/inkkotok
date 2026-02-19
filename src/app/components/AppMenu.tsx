"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { authFetch } from "@/lib/auth-fetch";

export default function AppMenu() {
  const [email, setEmail] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<
    Array<{
      id: string;
      type: "comment" | "reply" | "reaction" | "hot_post" | "moderation_note";
      post_id: string | null;
      comment_id: string | null;
      is_read: boolean;
      created_at: string;
      note_message?: string | null;
      source?: "notifications" | "moderation_notes";
    }>
  >([]);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const containerRef = useRef<HTMLDivElement | null>(null);

  const unreadCount = useMemo(
    () => notifications.filter((item) => item.is_read === false).length,
    [notifications]
  );

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
      if (!data.user) {
        setNotifications([]);
      }
      const metadata = data.user?.user_metadata as
        | { avatar_url?: string; picture?: string }
        | undefined;
      setAvatar(metadata?.avatar_url ?? metadata?.picture ?? null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
      if (!session?.user) {
        setDisplayName(null);
        setNotifications([]);
      }
      const metadata = session?.user?.user_metadata as
        | { avatar_url?: string; picture?: string }
        | undefined;
      setAvatar(metadata?.avatar_url ?? metadata?.picture ?? null);
    });
    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 60000);
    return () => {
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (!email) return;

    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    const loadNotifications = async () => {
      try {
        const res = await authFetch("/api/notifications", { cache: "no-store" });
        if (!res.ok) return;
        const json = (await res.json()) as {
          notifications?: Array<{
            id: string;
            type: "comment" | "reply" | "reaction" | "hot_post" | "moderation_note";
            post_id: string | null;
            comment_id: string | null;
            is_read: boolean;
            created_at: string;
            note_message?: string | null;
            source?: "notifications" | "moderation_notes";
          }>;
        };
        if (!cancelled) {
          setNotifications(json.notifications ?? []);
        }
      } catch {
        if (!cancelled) setNotifications([]);
      }
    };

    void loadNotifications();
    timer = setInterval(() => {
      void loadNotifications();
    }, 30000);

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [email]);

  useEffect(() => {
    if (!email) return;

    let cancelled = false;
    const loadProfile = async () => {
      try {
        const res = await authFetch("/api/profile", { cache: "no-store" });
        if (!res.ok) return;
        const json = (await res.json()) as {
          profile?: { display_name?: string | null; image_url?: string | null } | null;
        };
        if (!cancelled) {
          setDisplayName(json.profile?.display_name?.trim() || null);
          if (json.profile?.image_url) {
            setAvatar(json.profile.image_url);
          }
        }
      } catch {
        if (!cancelled) setDisplayName(null);
      }
    };

    void loadProfile();
    return () => {
      cancelled = true;
    };
  }, [email]);

  useEffect(() => {
    const onAvatarUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<{ imageUrl?: string | null }>;
      setAvatar(customEvent.detail?.imageUrl ?? null);
    };
    window.addEventListener("profile-avatar-updated", onAvatarUpdated);
    return () => {
      window.removeEventListener("profile-avatar-updated", onAvatarUpdated);
    };
  }, []);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
        setNotifOpen(false);
      }
    };
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("click", onClick);
    };
  }, []);

  const profileLabel = useMemo(() => {
    if (displayName) return displayName;
    if (!email) return "";
    return email.split("@")[0] || "프로필";
  }, [displayName, email]);

  const onSignOut = async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    window.location.assign("/");
  };

  const labelForType = (
    type: "comment" | "reply" | "reaction" | "hot_post" | "moderation_note"
  ) => {
    if (type === "comment") return "내 글에 댓글이 달렸어요";
    if (type === "reply") return "내 댓글에 답글이 달렸어요";
    if (type === "reaction") return "내 글에 공감/투표가 늘었어요";
    if (type === "moderation_note") return "운영 안내 메모가 도착했어요";
    return "내 글이 인기 글이 됐어요";
  };

  const iconForType = (
    type: "comment" | "reply" | "reaction" | "hot_post" | "moderation_note"
  ) => {
    if (type === "comment") return "💬";
    if (type === "reply") return "↪️";
    if (type === "reaction") return "❤️";
    if (type === "moderation_note") return "📝";
    return "🔥";
  };

  const relativeTime = (iso: string) => {
    const diff = nowMs - new Date(iso).getTime();
    if (Number.isNaN(diff) || diff < 0) return "방금 전";
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "방금 전";
    if (minutes < 60) return `${minutes}분 전`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}시간 전`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}일 전`;
    return new Date(iso).toLocaleDateString("ko-KR");
  };

  const markOneRead = async (id: string, source?: "notifications" | "moderation_notes") => {
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, is_read: true } : item))
    );
    try {
      await authFetch("/api/notifications", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, source }),
      });
    } catch {}
  };

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })));
    try {
      await authFetch("/api/notifications", { method: "PATCH" });
    } catch {}
  };

  return (
    <div ref={containerRef} className="fixed right-6 top-6 z-50 flex items-center gap-2">
      <Link
        className="rounded-full border border-[var(--border-soft)] bg-white/90 px-4 py-2 text-xs font-semibold text-[var(--cocoa)] shadow-sm transition hover:-translate-y-0.5 hover:bg-white"
        href="/"
      >
        홈
      </Link>
      <Link
        className="rounded-full border border-[var(--border-soft)] bg-gradient-to-b from-white to-[var(--paper)] px-4 py-2 text-xs font-semibold text-[var(--cocoa)] shadow-[0_12px_24px_-18px_rgba(54,41,31,0.75)] transition hover:-translate-y-0.5 hover:from-white hover:to-white"
        href="/write"
      >
        글쓰기
      </Link>
      {email ? (
        <>
          <button
            className="relative inline-flex h-10 items-center justify-center rounded-full border border-[var(--border-soft)] bg-white/90 px-3 text-xs font-semibold text-[var(--cocoa)] shadow-sm transition hover:-translate-y-0.5 hover:bg-white"
            type="button"
            onClick={() => {
              setNotifOpen((prev) => !prev);
              setOpen(false);
            }}
            aria-label="알림 열기"
          >
            알림
            {unreadCount > 0 ? (
              <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            ) : null}
          </button>
          <button
            className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-[var(--border-soft)] bg-white/90 text-xs font-semibold text-[var(--cocoa)] shadow-sm transition hover:-translate-y-0.5 hover:bg-white"
            type="button"
            onClick={() => {
              setOpen((prev) => !prev);
              setNotifOpen(false);
            }}
            aria-label="프로필 메뉴 열기"
          >
            {avatar ? (
              <img
                src={avatar}
                alt="프로필 이미지"
                className="h-full w-full object-cover"
              />
            ) : (
              <span>{profileLabel.slice(0, 1).toUpperCase()}</span>
            )}
          </button>
          <Link
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/75 text-[24px] leading-none text-[var(--cocoa)] ring-1 ring-[var(--border-soft)]/70 transition hover:-translate-y-0.5 hover:bg-white"
            href="/settings"
            aria-label="설정"
            title="설정"
          >
            <span className="inline-flex items-center justify-center leading-none">⚙️</span>
          </Link>
          {open ? (
            <div className="absolute right-14 top-11 w-48 rounded-2xl border border-[var(--border-soft)] bg-white/95 p-2 text-xs shadow-lg">
              <p className="truncate px-3 py-2 text-[11px] text-zinc-500">{email}</p>
              <Link
                className="block rounded-xl px-3 py-2 font-semibold text-[var(--ink)] hover:bg-[var(--paper)]"
                href="/profile"
                onClick={() => setOpen(false)}
              >
                프로필 보기
              </Link>
              <Link
                className="block rounded-xl px-3 py-2 font-semibold text-[var(--ink)] hover:bg-[var(--paper)]"
                href="/settings"
                onClick={() => setOpen(false)}
              >
                설정
              </Link>
              <button
                className="mt-1 w-full rounded-xl px-3 py-2 text-left font-semibold text-[var(--cocoa)] hover:bg-[var(--paper)]"
                type="button"
                onClick={() => {
                  setOpen(false);
                  void onSignOut();
                }}
              >
                로그아웃
              </button>
            </div>
          ) : null}
          {notifOpen ? (
            <div className="absolute right-14 top-11 w-[320px] max-w-[85vw] rounded-2xl border border-[var(--border-soft)] bg-white/95 p-2 text-xs shadow-lg">
              <div className="flex items-center justify-between px-2 py-1">
                <p className="text-[11px] font-semibold text-zinc-600">알림</p>
                <button
                  type="button"
                  className="rounded-full border border-[var(--border-soft)] px-2 py-1 text-[10px] font-semibold text-zinc-500"
                  onClick={() => {
                    void markAllRead();
                  }}
                >
                  전체 읽음
                </button>
              </div>
              <div className="mt-1 grid max-h-80 gap-1 overflow-y-auto">
                {notifications.length ? (
                  notifications.map((item) => {
                    const href = item.post_id ? `/post/${item.post_id}` : "/feed";
                    return (
                      <Link
                        key={item.id}
                        href={href}
                        className={`block rounded-xl px-3 py-2 transition ${
                          item.is_read
                            ? "bg-white text-zinc-600"
                            : "border border-rose-100 bg-rose-50 text-zinc-700"
                        } hover:bg-[var(--paper)]`}
                        onClick={() => {
                          setNotifOpen(false);
                          void markOneRead(item.id, item.source);
                        }}
                      >
                        <p className="text-[11px] font-semibold">
                          <span className="mr-1">{iconForType(item.type)}</span>
                          {labelForType(item.type)}
                        </p>
                        {item.type === "moderation_note" && item.note_message ? (
                          <p className="mt-1 text-[10px] leading-4 text-zinc-500">
                            {item.note_message}
                          </p>
                        ) : null}
                        <p className="mt-0.5 text-[10px] text-zinc-400">{relativeTime(item.created_at)}</p>
                      </Link>
                    );
                  })
                ) : (
                  <p className="px-3 py-4 text-[11px] text-zinc-500">새 알림이 없습니다.</p>
                )}
              </div>
            </div>
          ) : null}
        </>
      ) : (
        <>
          <Link
            className="rounded-full border border-[var(--border-soft)] bg-white/90 px-4 py-2 text-xs font-semibold text-[var(--cocoa)] shadow-sm transition hover:-translate-y-0.5 hover:bg-white"
            href="/auth"
          >
            로그인
          </Link>
          <Link
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/75 text-[24px] leading-none text-[var(--cocoa)] ring-1 ring-[var(--border-soft)]/70 transition hover:-translate-y-0.5 hover:bg-white"
            href="/settings"
            aria-label="설정"
            title="설정"
          >
            <span className="inline-flex items-center justify-center leading-none">⚙️</span>
          </Link>
        </>
      )}
    </div>
  );
}
