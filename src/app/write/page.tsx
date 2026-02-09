export default function WritePage() {
  return (
    <div className="min-h-screen px-6 pb-20 pt-10 md:px-12">
      <header className="mx-auto flex w-full max-w-4xl flex-col gap-4 rounded-[28px] border border-[var(--border-soft)] bg-white/90 p-6 shadow-[var(--shadow)]">
        <p className="text-sm font-semibold text-[var(--cocoa)]">
          글 작성 (로그인 필요)
        </p>
        <h1 className="font-display text-3xl font-semibold text-[var(--ink)]">
          익명으로 고민을 나눠보세요
        </h1>
        <p className="text-sm text-zinc-600">
          Google 또는 Microsoft로 로그인한 뒤 글을 작성할 수 있어요.
        </p>
        <div className="flex flex-wrap gap-2">
          <a
            className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
            href="/auth"
          >
            로그인하고 계속하기
          </a>
          <a
            className="rounded-full border border-[var(--border-soft)] bg-white px-4 py-2 text-sm font-semibold text-[var(--cocoa)]"
            href="/feed"
          >
            피드 둘러보기
          </a>
        </div>
      </header>

      <main className="mx-auto mt-8 w-full max-w-4xl rounded-[28px] border border-[var(--border-soft)] bg-white/90 p-6 shadow-sm">
        <div className="grid gap-4">
          <label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
            제목
            <input
              className="rounded-2xl border border-[var(--border-soft)] bg-[var(--paper)] px-4 py-3 text-sm text-zinc-700"
              placeholder="고민을 짧게 요약해요"
              disabled
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
            라운지 선택
            <div className="grid gap-2 text-xs text-zinc-600 sm:grid-cols-2">
              {[
                "신혼 1-3년",
                "30-40대 부부",
                "50+ 동행",
                "관계 회복",
                "육아 루틴",
                "재정/자산",
              ].map((label) => (
                <div
                  key={label}
                  className="rounded-2xl border border-[var(--border-soft)] bg-[var(--paper)] px-3 py-2"
                >
                  {label}
                </div>
              ))}
            </div>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
            내용
            <textarea
              className="min-h-[180px] rounded-2xl border border-[var(--border-soft)] bg-[var(--paper)] px-4 py-3 text-sm text-zinc-700"
              placeholder="상황과 감정을 자유롭게 적어주세요"
              disabled
            />
          </label>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            className="rounded-full bg-[var(--ink)] px-5 py-3 text-sm font-semibold text-white/70"
            disabled
          >
            작성 완료
          </button>
          <p className="text-xs text-zinc-500">
            로그인 후에만 작성할 수 있습니다.
          </p>
        </div>
      </main>
    </div>
  );
}
