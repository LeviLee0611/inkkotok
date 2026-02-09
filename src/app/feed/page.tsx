const feed = [
  {
    id: "sample-1",
    title: "말 없이 싸운 뒤의 화해 루틴",
    lounge: "30-40대 · 관계 회복",
    excerpt:
      "서로 말을 안 하고 하루를 보내면 더 마음이 멀어지는 것 같아요. 우리는 짧은 산책과 메모로 시작해요.",
  },
  {
    id: "sample-2",
    title: "맞벌이 육아 분담표 공유해요",
    lounge: "신혼 · 육아 루틴",
    excerpt:
      "주간 캘린더로 집안일과 육아를 나눴더니 덜 미안해졌어요. 템플릿 공유합니다.",
  },
  {
    id: "sample-3",
    title: "부부 통장, 어디까지 공개하나요?",
    lounge: "50+ · 재정/자산",
    excerpt:
      "통장 통합이 늘 좋은 건 아니더라고요. 서로의 안전망을 지키는 방법을 고민 중.",
  },
];

export default function FeedPage() {
  return (
    <div className="min-h-screen px-6 pb-20 pt-10 md:px-12">
      <header className="mx-auto flex w-full max-w-6xl flex-col gap-4 rounded-[28px] border border-[var(--border-soft)] bg-white/90 p-6 shadow-[var(--shadow)]">
        <p className="text-sm font-semibold text-[var(--cocoa)]">
          익명 커뮤니티 피드
        </p>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-display text-3xl font-semibold text-[var(--ink)]">
              지금 사람들이 나누는 이야기
            </h1>
            <p className="mt-2 text-sm text-zinc-600">
              로그인 없이 읽을 수 있어요. 글 작성과 댓글은 로그인 후
              가능합니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              className="rounded-full border border-[var(--border-soft)] bg-white px-4 py-2 text-sm font-semibold text-[var(--cocoa)]"
              href="/"
            >
              홈으로
            </a>
            <a
              className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
              href="/write"
            >
              글쓰기 (로그인 필요)
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
                {post.excerpt}
              </p>
              <div className="mt-4 flex items-center gap-4 text-xs text-zinc-500">
                <span>공감 32</span>
                <span>댓글 12</span>
                <span>방금 전</span>
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
              익명 이용 안내
            </p>
            <ul className="mt-3 grid gap-2 text-xs text-zinc-600">
              <li>읽기는 누구나, 글/댓글은 로그인 필요</li>
              <li>실명, 연락처 공유 금지</li>
              <li>민감한 정보는 자동 블라인드</li>
            </ul>
          </div>
        </aside>
      </section>
    </div>
  );
}
