export default function AuthPage() {
  return (
    <div className="min-h-screen px-6 pb-20 pt-10 md:px-12">
      <header className="mx-auto flex w-full max-w-3xl flex-col gap-4 rounded-[28px] border border-[var(--border-soft)] bg-white/90 p-6 shadow-[var(--shadow)]">
        <p className="text-sm font-semibold text-[var(--cocoa)]">
          로그인 / 익명 프로필 시작
        </p>
        <h1 className="font-display text-3xl font-semibold text-[var(--ink)]">
          안전하게 시작하기
        </h1>
        <p className="text-sm text-zinc-600">
          읽기는 언제나 가능하고, 글/댓글 작성은 로그인 후 가능합니다.
        </p>
      </header>

      <main className="mx-auto mt-8 grid w-full max-w-3xl gap-4">
        <a
          className="rounded-3xl border border-[var(--border-soft)] bg-white/90 px-6 py-4 text-left text-sm font-semibold text-[var(--ink)] shadow-sm"
          href="/api/auth/signin/google"
        >
          Google로 로그인
          <p className="mt-1 text-xs text-zinc-500">
            가장 빠른 시작 방법이에요
          </p>
        </a>
        <div className="rounded-3xl border border-[var(--border-soft)] bg-[var(--paper)] px-6 py-4 text-xs text-zinc-600">
          로그인하면 익명 닉네임이 자동 생성되고, 활동 기록만 저장돼요. 이메일
          주소나 실명은 커뮤니티에 공개되지 않습니다.
        </div>
        <a
          className="rounded-full border border-[var(--border-soft)] bg-white px-4 py-2 text-center text-sm font-semibold text-[var(--cocoa)]"
          href="/feed"
        >
          로그인 없이 둘러보기
        </a>
      </main>
    </div>
  );
}
