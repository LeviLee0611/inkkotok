export default function Home() {
  return (
    <div className="min-h-screen">
      <header className="px-6 pt-8 md:px-12">
        <nav className="mx-auto flex w-full max-w-6xl items-center justify-between rounded-3xl border border-[var(--border-soft)] bg-white/80 px-5 py-4 shadow-[var(--shadow)] backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl bg-[var(--sun)]">
              <img
                src="/logo.png"
                alt="잉꼬톡 로고"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-[var(--cocoa)]">잉꼬톡</p>
              <p className="text-xs text-zinc-500">부부 커뮤니티</p>
            </div>
          </div>
          <div className="hidden items-center gap-4 text-sm font-medium text-zinc-600 md:flex">
            <a
              className="rounded-full px-4 py-2 transition hover:bg-[var(--lavender)]"
              href="/feed"
            >
              오늘의 라운지
            </a>
            <a
              className="rounded-full px-4 py-2 transition hover:bg-[var(--lavender)]"
              href="#guide"
            >
              잉꼬 규칙
            </a>
            <a
              className="rounded-full px-4 py-2 transition hover:bg-[var(--lavender)]"
              href="/auth"
            >
              시작하기
            </a>
          </div>
          <div className="flex items-center gap-2">
            <a
              className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:translate-y-[-1px] hover:shadow-lg"
              href="/write"
            >
              고민 나누기
            </a>
          </div>
        </nav>
      </header>

      <main className="px-6 pb-24 pt-12 md:px-12">
        <section className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="flex flex-col gap-6 rounded-[36px] border border-[var(--border-soft)] bg-white/90 p-6 shadow-[var(--shadow)] md:p-8">
            <div className="flex flex-wrap gap-2 text-xs font-semibold text-[var(--cocoa)]">
              {["육아 꿀팁", "일상", "조언", "정보공유"].map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-[var(--paper)] px-3 py-1"
                >
                  {tag}
                </span>
              ))}
            </div>
            <h1 className="font-display text-4xl font-semibold leading-tight text-[var(--ink)] md:text-5xl">
              한눈에 보는
              <br />
              부부 커뮤니티
            </h1>
            <p className="max-w-xl text-base leading-7 text-zinc-600">
              읽기는 언제나 자유롭게, 글/댓글은 로그인 후 가능. 세대별·주제별
              라운지에서 바로 이야기를 시작하세요.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <a
                className="rounded-full bg-[var(--ink)] px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:translate-y-[-1px] hover:bg-zinc-800"
                href="/auth"
              >
                바로 시작하기
              </a>
              <a
                className="rounded-full border border-[var(--border-soft)] bg-white px-6 py-3 text-sm font-semibold text-[var(--cocoa)] transition hover:bg-[var(--lavender)]"
                href="/feed"
              >
                피드 둘러보기
              </a>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: "오늘의 고민", value: "214" },
                { label: "공감 댓글", value: "1.3k" },
                { label: "인기 꿀팁", value: "68" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-[var(--border-soft)] bg-[var(--paper)] px-4 py-3"
                >
                  <p className="text-xs text-zinc-500">{item.label}</p>
                  <p className="text-lg font-semibold text-[var(--ink)]">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[32px] border border-[var(--border-soft)] bg-white/90 p-6 shadow-sm">
              <p className="text-xs font-semibold text-[var(--cocoa)]">
                오늘의 인기 고민
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-[var(--ink)]">
                “서로의 휴식 시간을 어떻게 지켜줄까요?”
              </h2>
              <p className="mt-3 text-sm leading-6 text-zinc-600">
                바쁜 일상 속에서도 서로를 배려하는 방법이 모여 있어요.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-[var(--cocoa)]">
                {["공감 78", "댓글 24", "저장 19"].map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-[var(--mint)] px-3 py-1"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-[28px] border border-[var(--border-soft)] bg-white/90 p-5 shadow-sm">
              <p className="text-xs font-semibold text-[var(--cocoa)]">
                안전 장치
              </p>
              <div className="mt-3 grid gap-2 text-xs text-zinc-600">
                <div className="rounded-2xl bg-[var(--paper)] px-3 py-2">
                  닉네임 자동 생성, 프로필 기록 없음
                </div>
                <div className="rounded-2xl bg-[var(--paper)] px-3 py-2">
                  게시물 위치 정보 미수집
                </div>
                <div className="rounded-2xl bg-[var(--paper)] px-3 py-2">
                  민감한 키워드 자동 블라인드
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto mt-10 w-full max-w-6xl rounded-[36px] border border-[var(--border-soft)] bg-white/90 p-6 shadow-[var(--shadow)] md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="max-w-xl">
              <p className="text-sm font-semibold text-[var(--cocoa)]">
                라운지 한눈에 보기
              </p>
              <h3 className="mt-2 font-display text-3xl font-semibold text-[var(--ink)]">
                어디에 무엇이 있는지 바로 찾기
              </h3>
              <p className="mt-3 text-sm text-zinc-600">
                세대별 라운지와 주제별 라운지를 한 화면에서 선택하세요.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a
                className="rounded-full border border-[var(--border-soft)] bg-white px-4 py-2 text-sm font-semibold text-[var(--cocoa)]"
                href="/feed"
              >
                전체 피드 보기
              </a>
              <a
                className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
                href="/write"
              >
                글쓰기
              </a>
            </div>
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_1.3fr]">
            <div className="grid gap-3">
              {[
                {
                  title: "신혼 1-3년",
                  desc: "관계 다지기, 첫 공동 자산",
                  color: "bg-[var(--sun)]",
                },
                {
                  title: "30-40대 부부",
                  desc: "육아, 맞벌이, 부모님 돌봄",
                  color: "bg-[var(--mint)]",
                },
                {
                  title: "50+ 동행",
                  desc: "건강, 은퇴 준비, 제2의 커리어",
                  color: "bg-[var(--lavender)]",
                },
              ].map((item) => (
                <a
                  key={item.title}
                  className="flex items-center gap-4 rounded-3xl border border-[var(--border-soft)] bg-[var(--paper)] px-4 py-4 text-left"
                  href="/feed"
                >
                  <div className={`h-10 w-10 rounded-2xl ${item.color}`} />
                  <div>
                    <p className="text-sm font-semibold text-[var(--ink)]">
                      {item.title}
                    </p>
                    <p className="text-xs text-zinc-600">{item.desc}</p>
                  </div>
                </a>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                "관계 회복",
                "육아 루틴",
                "재정/자산",
                "집/살림",
                "성장/자기돌봄",
                "가족/친척",
                "데이트/여행",
                "행복 습관",
              ].map((topic) => (
                <a
                  key={topic}
                  className="rounded-2xl border border-[var(--border-soft)] bg-white px-4 py-4 text-left text-sm font-semibold text-[var(--ink)] shadow-sm transition hover:translate-y-[-1px] hover:bg-[var(--paper)]"
                  href="/feed"
                >
                  {topic}
                  <p className="mt-2 text-xs font-normal text-zinc-500">
                    자유롭게 이야기하기
                  </p>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section
          id="guide"
          className="mx-auto mt-10 grid w-full max-w-6xl gap-4 lg:grid-cols-[1.1fr_0.9fr]"
        >
          <div className="rounded-[32px] border border-[var(--border-soft)] bg-white/90 p-6 shadow-sm">
            <p className="text-sm font-semibold text-[var(--cocoa)]">
              커뮤니티 가이드
            </p>
            <h3 className="mt-2 font-display text-2xl font-semibold text-[var(--ink)]">
              서로를 보호하는 약속
            </h3>
            <p className="mt-3 text-sm leading-6 text-zinc-600">
              서로를 존중하는 룰을 함께 지켜요.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                "실명, 연락처 공유 금지",
                "타인 비난/혐오 금지",
                "맞지 않는 조언은 부드럽게",
              ].map((rule) => (
                <span
                  key={rule}
                  className="rounded-full bg-[var(--paper)] px-3 py-1 text-xs font-semibold text-[var(--cocoa)]"
                >
                  {rule}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-[32px] border border-[var(--border-soft)] bg-[var(--ink)] p-6 text-white shadow-sm">
            <h3 className="font-display text-2xl font-semibold">
              바로 시작할까요?
            </h3>
            <p className="mt-2 text-sm text-white/80">
              읽기는 누구나, 글/댓글은 로그인 후 가능합니다.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <a
                className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-[var(--ink)]"
                href="/auth"
              >
                로그인하고 시작
              </a>
              <a
                className="rounded-full border border-white/30 px-5 py-3 text-sm font-semibold text-white/90"
                href="/feed"
              >
                피드 보기
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
