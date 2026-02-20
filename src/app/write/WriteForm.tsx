"use client";

import { useMemo, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import { authFetch } from "@/lib/auth-fetch";
import { EMOTION_CATEGORIES } from "@/lib/emotions";
import FancySelect from "@/app/components/FancySelect";
import { richEditorExtensions } from "@/lib/rich-editor-extensions";
import { legacyBodyToRichDoc, tryParseRichDoc } from "@/lib/rich-content";

const LOUNGES = ["신혼부부", "잉꼬부부", "관계 회복", "육아 루틴", "재정/자산"];

const LOUNGE_EMOJI: Record<string, string> = {
  신혼부부: "💍",
  잉꼬부부: "🐦",
  "관계 회복": "🤝",
  "육아 루틴": "🍼",
  "재정/자산": "💰",
};

const CATEGORY_META: Record<number, { emoji: string; hint: string }> = {
  1: { emoji: "💪", hint: "루틴·건강관리" },
  2: { emoji: "👨‍👩‍👧", hint: "육아·가족 이야기" },
  3: { emoji: "📈", hint: "경제·생활 정보" },
  4: { emoji: "🗳️", hint: "의견·투표" },
  5: { emoji: "📝", hint: "일상·경험 공유" },
};

type WriteFormProps = {
  mode?: "create" | "edit";
  postId?: string;
  initialTitle?: string;
  initialLounge?: string;
  initialContent?: string;
  initialMediaUrl?: string;
  initialCategoryId?: number;
  initialInfoWeight?: number;
};

function hasRichNodes(input: unknown): boolean {
  if (!input || typeof input !== "object") return false;
  const node = input as { type?: unknown; text?: unknown; content?: unknown };
  if (node.type === "image") return true;
  if (typeof node.text === "string" && node.text.trim().length > 0) return true;
  if (Array.isArray(node.content)) return node.content.some((child) => hasRichNodes(child));
  return false;
}

function ToolbarButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
        active
          ? "border-[var(--accent)]/40 bg-[var(--accent)]/12 text-[var(--accent)]"
          : "border-[var(--border-soft)] bg-white text-[var(--cocoa)] hover:-translate-y-0.5"
      }`}
    >
      {label}
    </button>
  );
}

export default function WriteForm({
  mode = "create",
  postId,
  initialTitle = "",
  initialLounge = LOUNGES[0],
  initialContent = "",
  initialMediaUrl = "",
  initialCategoryId = 2,
  initialInfoWeight = 50,
}: WriteFormProps) {
  const seedContent =
    initialMediaUrl && !initialContent.includes(initialMediaUrl)
      ? `${initialContent}${initialContent ? "\n\n" : ""}![첨부 이미지](${initialMediaUrl})`
      : initialContent;

  const initialDoc = useMemo(() => {
    const rich = tryParseRichDoc(seedContent);
    return rich ?? legacyBodyToRichDoc(seedContent);
  }, [seedContent]);

  const [title, setTitle] = useState(initialTitle);
  const [lounge, setLounge] = useState(initialLounge);
  const [categoryId, setCategoryId] = useState(initialCategoryId);
  const [infoWeight, setInfoWeight] = useState(initialInfoWeight);
  const [gifQuery, setGifQuery] = useState("");
  const [gifSearching, setGifSearching] = useState(false);
  const [showGifPanel, setShowGifPanel] = useState(false);
  const [gifResults, setGifResults] = useState<Array<{ id: string; url: string; alt: string }>>([]);
  const [mediaUploading, setMediaUploading] = useState(false);
  const [pollOption1, setPollOption1] = useState("");
  const [pollOption2, setPollOption2] = useState("");
  const [pollOption3, setPollOption3] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const gifInputRef = useRef<HTMLInputElement | null>(null);
  const isEditMode = mode === "edit";

  const editor = useEditor({
    extensions: richEditorExtensions,
    content: initialDoc,
    editorProps: {
      attributes: {
        class:
          "ProseMirror min-h-[320px] rounded-2xl border border-amber-100/90 bg-white/92 px-4 py-4 text-[15px] leading-7 text-zinc-700 outline-none focus:border-amber-300",
      },
    },
    immediatelyRender: false,
  });

  const uploadAndInsertImage = async (file: File) => {
    setMessage(null);
    setMediaUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await authFetch("/api/media/image", { method: "POST", body: formData });
      const data = (await res.json().catch(() => null)) as { url?: string; error?: string } | null;

      if (res.status === 401) {
        setMessage("로그인 후 이미지/GIF 첨부가 가능해요. 다시 로그인해 주세요.");
        return;
      }
      if (!res.ok || !data?.url) {
        setMessage(data?.error ?? "이미지 업로드에 실패했어요.");
        return;
      }

      editor?.chain().focus().setImage({ src: data.url, alt: file.type === "image/gif" ? "GIF" : "이미지" }).run();
      setMessage("이미지를 본문에 넣었어요.");
    } catch {
      setMessage("이미지 업로드 중 오류가 발생했어요.");
    } finally {
      setMediaUploading(false);
    }
  };

  const onSearchGif = async () => {
    const keyword = gifQuery.trim();
    if (!keyword) {
      setGifResults([]);
      return;
    }
    setGifSearching(true);
    try {
      const response = await fetch(`/api/media/gif/search?q=${encodeURIComponent(keyword)}&limit=12`, {
        method: "GET",
        cache: "no-store",
      });
      const data = (await response.json().catch(() => null)) as
        | { results?: Array<{ id: string; url: string; alt: string }>; error?: string }
        | null;
      if (!response.ok) {
        setMessage(data?.error ?? "GIF 검색에 실패했어요.");
        return;
      }
      setGifResults(data?.results ?? []);
    } catch {
      setMessage("GIF 검색 중 오류가 발생했어요.");
    } finally {
      setGifSearching(false);
    }
  };

  const onSubmit = async () => {
    setMessage(null);
    if (mediaUploading) {
      setMessage("이미지 업로드가 끝난 뒤 저장해 주세요.");
      return;
    }
    if (!title.trim()) {
      setMessage("제목을 입력해주세요.");
      return;
    }
    if (!editor) {
      setMessage("에디터가 아직 준비되지 않았어요. 잠시 후 다시 시도해 주세요.");
      return;
    }
    const doc = editor.getJSON();
    if (!hasRichNodes(doc)) {
      setMessage("내용을 입력해주세요.");
      return;
    }
    if (categoryId === 4) {
      const pollOptions = [pollOption1, pollOption2, pollOption3]
        .map((item) => item.trim())
        .filter(Boolean);
      if (pollOptions.length < 2) {
        setMessage("투표 글은 항목을 최소 2개 입력해주세요.");
        return;
      }
    }

    setSaving(true);
    try {
      const res = await authFetch(isEditMode && postId ? `/api/posts/${postId}` : "/api/posts", {
        method: isEditMode ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          lounge,
          categoryId,
          infoWeight,
          content: JSON.stringify(doc),
          pollOptions:
            categoryId === 4
              ? [pollOption1, pollOption2, pollOption3].map((item) => item.trim()).filter(Boolean)
              : undefined,
        }),
      });

      const data = (await res.json()) as { id?: string; error?: string };
      if (!res.ok) {
        if (res.status === 401) {
          setMessage(`로그인 후 글을 ${isEditMode ? "수정" : "작성"}할 수 있어요.`);
          return;
        }
        if (res.status === 403) {
          setMessage("작성자 또는 관리자만 수정할 수 있어요.");
          return;
        }
        setMessage(data.error ?? `글 ${isEditMode ? "수정" : "저장"}에 실패했어요.`);
        return;
      }

      if (isEditMode && postId) {
        window.location.assign(`/post/${postId}`);
        return;
      }
      if (!isEditMode && data.id) {
        window.location.assign(`/post/${data.id}`);
      } else {
        setMessage(`${isEditMode ? "수정" : "작성"}은 완료됐지만 이동에 실패했어요.`);
      }
    } catch {
      setMessage(`글 ${isEditMode ? "수정" : "저장"} 중 오류가 발생했어요.`);
    } finally {
      setSaving(false);
    }
  };

  const selectedImageWidth = (() => {
    const width = editor?.getAttributes("image")?.width;
    if (typeof width === "string" && width.endsWith("%")) return Number(width.replace("%", ""));
    return 100;
  })();

  return (
    <main className="mx-auto mt-8 w-full max-w-5xl rounded-[28px] border border-[var(--border-soft)] bg-white/90 p-6 shadow-sm">
      <div className="grid gap-4">
        <label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
          글 카테고리
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {EMOTION_CATEGORIES.map((item) => {
              const active = categoryId === item.id;
              const meta = CATEGORY_META[item.id] ?? { emoji: "🗂️", hint: "카테고리" };
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`rounded-2xl border px-3 py-3 text-left transition ${
                    active
                      ? "border-[var(--accent)]/45 bg-[var(--accent)]/12 text-[var(--ink)]"
                      : "border-[var(--border-soft)] bg-white text-[var(--cocoa)] hover:bg-[var(--paper)]"
                  }`}
                  onClick={() => setCategoryId(item.id)}
                >
                  <p className="text-sm font-semibold">
                    <span className="mr-1.5">{meta.emoji}</span>
                    {item.label}
                  </p>
                  <p className="mt-1 text-[11px] font-medium text-zinc-500">{meta.hint}</p>
                </button>
              );
            })}
          </div>
        </label>

        {categoryId === 4 ? (
          <label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
            투표 항목
            <input
              className="rounded-2xl border border-[var(--border-soft)] bg-[var(--paper)] px-4 py-3 text-sm text-zinc-700"
              placeholder="항목 1"
              value={pollOption1}
              onChange={(event) => setPollOption1(event.target.value)}
            />
            <input
              className="rounded-2xl border border-[var(--border-soft)] bg-[var(--paper)] px-4 py-3 text-sm text-zinc-700"
              placeholder="항목 2"
              value={pollOption2}
              onChange={(event) => setPollOption2(event.target.value)}
            />
            <input
              className="rounded-2xl border border-[var(--border-soft)] bg-[var(--paper)] px-4 py-3 text-sm text-zinc-700"
              placeholder="항목 3 (선택)"
              value={pollOption3}
              onChange={(event) => setPollOption3(event.target.value)}
            />
          </label>
        ) : null}

        <label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
          라운지 선택
          <FancySelect
            value={lounge}
            options={LOUNGES.map((item) => ({
              value: item,
              label: item,
              emoji: LOUNGE_EMOJI[item],
            }))}
            onChange={setLounge}
            placeholder="라운지를 선택해 주세요"
          />
        </label>

        <label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
          글 성격 게이지
          <div className="rounded-2xl border border-[var(--border-soft)] bg-white px-4 py-3">
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={infoWeight}
              onChange={(event) => setInfoWeight(Number(event.target.value))}
              className="w-full accent-[var(--accent)]"
              aria-label="글 성격 게이지"
            />
          </div>
        </label>

        <label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
          제목
          <input
            className="rounded-2xl border border-[var(--border-soft)] bg-[var(--paper)] px-4 py-3 text-sm text-zinc-700"
            placeholder="제목을 짧고 명확하게 적어보세요"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>

        <div className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
          <p>내용</p>
          <div className="overflow-hidden rounded-3xl border border-amber-100/80 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.98)_0%,rgba(254,252,245,0.97)_42%,rgba(248,244,235,0.95)_100%)] shadow-[0_18px_45px_rgba(120,53,15,0.09)]">
            <div className="border-b border-amber-100/80 bg-white/85 px-3 py-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <ToolbarButton label="B" active={editor?.isActive("bold")} onClick={() => editor?.chain().focus().toggleBold().run()} />
                <ToolbarButton label="I" active={editor?.isActive("italic")} onClick={() => editor?.chain().focus().toggleItalic().run()} />
                <ToolbarButton label="U" active={editor?.isActive("underline")} onClick={() => editor?.chain().focus().toggleUnderline().run()} />
                <ToolbarButton label="H2" active={editor?.isActive("heading", { level: 2 })} onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} />
                <ToolbarButton label="목록" active={editor?.isActive("bulletList")} onClick={() => editor?.chain().focus().toggleBulletList().run()} />
                <ToolbarButton label="정렬" active={editor?.isActive({ textAlign: "center" })} onClick={() => editor?.chain().focus().setTextAlign("center").run()} />
                <ToolbarButton
                  label="링크"
                  active={editor?.isActive("link")}
                  onClick={() => {
                    const url = window.prompt("링크를 입력해 주세요", "https://");
                    if (!url) return;
                    editor?.chain().focus().setLink({ href: url }).run();
                  }}
                />
                <label className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-soft)] bg-white px-2 py-1 text-[11px]">
                  색상
                  <input
                    type="color"
                    defaultValue="#404040"
                    onChange={(event) => editor?.chain().focus().setColor(event.target.value).run()}
                    className="h-5 w-5 cursor-pointer border-0 bg-transparent p-0"
                  />
                </label>
                <button
                  type="button"
                  className="rounded-lg border border-[var(--border-soft)] bg-white px-2 py-1 text-xs font-semibold text-[var(--cocoa)]"
                  onClick={() => gifInputRef.current?.click()}
                  disabled={mediaUploading}
                >
                  GIF 업로드
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-[var(--border-soft)] bg-white px-2 py-1 text-xs font-semibold text-[var(--cocoa)]"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={mediaUploading}
                >
                  사진 업로드
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-[var(--border-soft)] bg-white px-2 py-1 text-xs font-semibold text-[var(--cocoa)]"
                  onClick={() => setShowGifPanel((prev) => !prev)}
                >
                  GIF 검색
                </button>
              </div>
              <input
                ref={gifInputRef}
                type="file"
                accept="image/gif"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void uploadAndInsertImage(file);
                  event.currentTarget.value = "";
                }}
              />
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void uploadAndInsertImage(file);
                  event.currentTarget.value = "";
                }}
              />
            </div>

            {showGifPanel ? (
              <div className="border-b border-amber-100/80 bg-white/80 px-4 py-3">
                <div className="flex items-center gap-2">
                  <input
                    className="w-full rounded-xl border border-[var(--border-soft)] bg-white px-3 py-2 text-xs text-zinc-700"
                    placeholder="GIF 검색 (예: 축하, happy, 사랑)"
                    value={gifQuery}
                    onChange={(event) => setGifQuery(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void onSearchGif();
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="shrink-0 rounded-xl border border-[var(--border-soft)] bg-white px-3 py-2 text-xs font-semibold text-[var(--cocoa)]"
                    onClick={() => void onSearchGif()}
                    disabled={gifSearching}
                  >
                    {gifSearching ? "검색 중..." : "검색"}
                  </button>
                </div>
                {gifResults.length > 0 ? (
                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {gifResults.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-white transition hover:-translate-y-0.5"
                        onClick={() => {
                          editor?.chain().focus().setImage({ src: item.url, alt: "GIF" }).run();
                          setShowGifPanel(false);
                        }}
                        title="이 GIF 본문에 넣기"
                      >
                        <img src={item.url} alt={item.alt} className="h-20 w-full object-cover" />
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="p-3 sm:p-4">
              <EditorContent editor={editor} />
              <div className="mt-3 flex items-center gap-3 rounded-xl border border-[var(--border-soft)] bg-white/80 px-3 py-2 text-xs text-zinc-600">
                <span>선택된 이미지 크기</span>
                <input
                  type="range"
                  min={30}
                  max={100}
                  step={5}
                  value={selectedImageWidth}
                  onChange={(event) =>
                    editor?.chain().focus().updateAttributes("image", { width: `${event.target.value}%` }).run()
                  }
                  disabled={!editor?.isActive("image")}
                  className="w-44 accent-[var(--accent)] disabled:opacity-40"
                />
                <span>{selectedImageWidth}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          className="rounded-full bg-[var(--ink)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
          type="button"
          disabled={saving}
          onClick={onSubmit}
        >
          {saving ? `${isEditMode ? "수정" : "작성"} 중...` : isEditMode ? "수정 완료" : "작성 완료"}
        </button>
        {message ? (
          <p className="text-xs text-zinc-500">{message}</p>
        ) : (
          <p className="text-xs text-zinc-500">
            {isEditMode ? "수정한 내용은 즉시 반영됩니다." : "작성한 글은 바로 피드에 반영됩니다."}
          </p>
        )}
      </div>
    </main>
  );
}
