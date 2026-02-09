export const runtime = 'edge';

type PostDetailProps = {
  params: { id: string };
};

export default function PostDetailPage({ params }: PostDetailProps) {
  return (
    <div className="min-h-screen px-6 pb-20 pt-10 md:px-12">
      <header className="mx-auto flex w-full max-w-5xl flex-col gap-4 rounded-[28px] border border-[var(--border-soft)] bg-white/90 p-6 shadow-[var(--shadow)]">
        <p className="text-xs font-semibold text-[var(--cocoa)]">
          30-40대 · 관계 회복
        </p>
        <h1 className="font-display text-3xl font-semibold text-[var(--ink)]">
          말 없이 싸운 뒤의 화해 루틴
        </h1>
        <p className="text-sm text-zinc-600">
          익명 사용자 · {params.id}
        </p>
        <div className="flex flex-wrap gap-2 text-xs text-zinc-500">
          <span>공감 32</span>
          <span>댓글 12</span>
          <span>방금 전</span>
        </div>
      </header>

      <main className="mx-auto mt-6 w-full max-w-5xl rounded-[28px] border border-[var(--border-soft)] bg-white/90 p-6 shadow-sm">
        <p className="text-sm leading-7 text-zinc-700">
          오늘 하루 종일 말을 안 하게 되면 마음이 더 멀어지는 느낌이 들어요.
          그래서 우리는 감정이 가라앉을 때까지 시간을 두고, 짧은 산책과 메모로
          마음을 정리합니다. 서로의 휴식 시간을 존중하는 것이 핵심이었어요.
        </p>
      </main>

      <section className="mx-auto mt-6 w-full max-w-5xl rounded-[28px] border border-[var(--border-soft)] bg-white/90 p-6 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <h2 className="text-lg font-semibold text-[var(--ink)]">댓글</h2>
          <a
            className="rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white"
            href="/auth"
          >
            댓글 작성 (로그인 필요)
          </a>
        </div>
        <div className="mt-4 grid gap-3">
          {[
            "우리는 10분씩 혼자 있다가 다시 얘기해요.",
            "메모로 감정을 먼저 정리하는 방법 좋네요.",
            "타이머를 맞추고 대화 시간을 정하는 것도 도움돼요.",
          ].map((comment) => (
            <div
              key={comment}
              className="rounded-2xl border border-[var(--border-soft)] bg-[var(--paper)] px-4 py-3 text-xs text-zinc-600"
            >
              {comment}
            </div>
          ))}
        </div>
      </section>

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
          비슷한 고민 글쓰기
        </a>
      </footer>
    </div>
  );
}
