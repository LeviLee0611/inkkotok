export default function Home() {
  return (
    <div className="min-h-screen">
      <header className="px-6 pt-8 md:px-12">
        <nav className="mx-auto flex w-full max-w-6xl items-center justify-between rounded-3xl border border-[var(--border-soft)] bg-white/80 px-5 py-4 shadow-[var(--shadow)] backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--sun)] text-lg font-bold text-[var(--cocoa)]">
              잉
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-[var(--cocoa)]">잉크톡</p>
              <p className="text-xs text-zinc-500">부부 익명 커뮤니티</p>
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
              익명 규칙
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
              className="rounded-full border border-[var(--border-soft)] px-4 py-2 text-sm font-semibold text-[var(--cocoa)] transition hover:bg-white"
              href="/feed"
            >
              둘러보기
            </a>
            <a
              className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:translate-y-[-1px] hover:shadow-lg"
              href="/write"
            >
              익명 글쓰기
            </a>
          </div>
        </nav>
      </header>

      <main className="px-6 pb-24 pt-12 md:px-12">
        <section className="mx-auto grid w-full max-w-6xl gap-10 md:grid-cols-[1.05fr_0.95fr]">
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap gap-2 text-xs font-semibold text-[var(--cocoa)]">
              <span className="rounded-full bg-white px-3 py-1 shadow-sm">
                익명 보장
              </span>
              <span className="rounded-full bg-white px-3 py-1 shadow-sm">
                서로 존중
              </span>
              <span className="rounded-full bg-white px-3 py-1 shadow-sm">
                실전 꿀팁
              </span>
            </div>
            <h1 className="font-display text-4xl font-semibold leading-tight text-[var(--ink)] md:text-5xl">
              서로 다른 세대의 부부가
              <br />
              편하게 이야기하는
              <br />
              익명 커뮤니티
            </h1>
            <p className="max-w-xl text-base leading-7 text-zinc-600 md:text-lg">
              갈등, 육아, 재정, 관계의 균형까지. 나와 비슷한 고민을 가진
              사람들과 가볍게 이야기하고, 실전에서 검증된 팁을 가져가세요.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <a
                className="rounded-full bg-[var(--ink)] px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:translate-y-[-1px] hover:bg-zinc-800"
                href="/auth"
              >
                익명으로 시작하기
              </a>
              <a
                className="rounded-full border border-[var(--border-soft)] bg-white px-6 py-3 text-sm font-semibold text-[var(--cocoa)] transition hover:bg-[var(--lavender)]"
                href="/feed"
              >
                라운지 미리보기
              </a>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {[
                { label: "오늘의 고민", value: "214" },
                { label: "공감 댓글", value: "1.3k" },
                { label: "인기 꿀팁", value: "68" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-[var(--border-soft)] bg-white/80 px-4 py-3 shadow-sm"
                >
                  <p className="text-xs text-zinc-500">{item.label}</p>
                  <p className="text-lg font-semibold text-[var(--ink)]">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex h-full flex-col justify-between gap-6">
            <div className="rounded-[32px] border border-[var(--border-soft)] bg-white/90 p-6 shadow-[var(--shadow)]">
              <p className="text-xs font-semibold text-[var(--cocoa)]">
                오늘의 인기 고민
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-[var(--ink)]">
                “서로의 휴식 시간을 어떻게 지켜줄까요?”
              </h2>
              <p className="mt-3 text-sm leading-6 text-zinc-600">
                업무와 육아가 겹치면서 지친 마음. 함께 쉬는 법, 혼자 쉬는
                법을 잘 지키는 부부들의 방법이 모이고 있어요.
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
            <div className="grid gap-3 rounded-[28px] border border-[var(--border-soft)] bg-white/90 p-6 shadow-sm">
              <p className="text-xs font-semibold text-[var(--cocoa)]">
                익명 안전 장치
              </p>
              {[
                "닉네임 자동 생성, 프로필 기록 없음",
                "게시물 위치 정보 미수집",
                "고민 카테고리별 블라인드 관리",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-[var(--border-soft)] bg-[var(--paper)] px-4 py-3 text-sm text-zinc-600"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto mt-16 w-full max-w-6xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold text-[var(--cocoa)]">
                세대별 라운지
              </p>
              <h3 className="font-display text-3xl font-semibold text-[var(--ink)]">
                삶의 단계별로 나누는 안전한 대화
              </h3>
            </div>
            <a
              className="self-start rounded-full border border-[var(--border-soft)] bg-white px-4 py-2 text-sm font-semibold text-[var(--cocoa)]"
              href="/feed"
            >
              라운지 전체 보기
            </a>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              {
                title: "신혼 1-3년",
                desc: "관계 다지기, 첫 공동 자산, 작은 갈등 해결",
                color: "bg-[var(--sun)]",
              },
              {
                title: "30-40대 부부",
                desc: "육아, 맞벌이, 부모님 돌봄 균형",
                color: "bg-[var(--mint)]",
              },
              {
                title: "50+ 동행",
                desc: "건강, 은퇴 준비, 제2의 커리어",
                color: "bg-[var(--lavender)]",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="flex flex-col gap-3 rounded-3xl border border-[var(--border-soft)] bg-white/90 p-5 shadow-sm"
              >
                <div
                  className={`h-12 w-12 rounded-2xl ${item.color}`}
                ></div>
                <h4 className="text-lg font-semibold text-[var(--ink)]">
                  {item.title}
                </h4>
                <p className="text-sm text-zinc-600">{item.desc}</p>
                <a
                  className="mt-auto text-left text-sm font-semibold text-[var(--cocoa)]"
                  href="/feed"
                >
                  입장하기 →
                </a>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto mt-16 w-full max-w-6xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold text-[var(--cocoa)]">
                주제별 라운지
              </p>
              <h3 className="font-display text-3xl font-semibold text-[var(--ink)]">
                지금 가장 많이 나누는 대화
              </h3>
            </div>
            <a
              className="self-start rounded-full border border-[var(--border-soft)] bg-white px-4 py-2 text-sm font-semibold text-[var(--cocoa)]"
              href="/feed"
            >
              인기 토픽 보기
            </a>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-4">
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
                className="rounded-2xl border border-[var(--border-soft)] bg-white/90 px-4 py-4 text-left text-sm font-semibold text-[var(--ink)] shadow-sm transition hover:translate-y-[-1px] hover:bg-[var(--paper)]"
                href="/feed"
              >
                {topic}
                <p className="mt-2 text-xs font-normal text-zinc-500">
                  익명으로 이야기하기
                </p>
              </a>
            ))}
          </div>
        </section>

        <section className="mx-auto mt-16 w-full max-w-6xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold text-[var(--cocoa)]">
                커뮤니티 피드
              </p>
              <h3 className="font-display text-3xl font-semibold text-[var(--ink)]">
                방금 올라온 이야기들
              </h3>
            </div>
            <a
              className="self-start rounded-full border border-[var(--border-soft)] bg-white px-4 py-2 text-sm font-semibold text-[var(--cocoa)]"
              href="/feed"
            >
              전체 피드 보기
            </a>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              {
                title: "말 없이 싸운 뒤의 화해 루틴",
                meta: "30-40대 · 관계 회복",
                excerpt:
                  "서로 말을 안 하고 하루를 보내면 더 마음이 멀어지는 것 같아요. 우리는 짧은 산책과 메모로 시작해요.",
              },
              {
                title: "맞벌이 육아 분담표 공유해요",
                meta: "신혼 · 육아 루틴",
                excerpt:
                  "주간 캘린더로 집안일과 육아를 나눴더니 덜 미안해졌어요. 템플릿 공유합니다.",
              },
              {
                title: "부부 통장, 어디까지 공개하나요?",
                meta: "50+ · 재정/자산",
                excerpt:
                  "통장 통합이 늘 좋은 건 아니더라고요. 서로의 안전망을 지키는 방법을 고민 중.",
              },
            ].map((post) => (
              <article
                key={post.title}
                className="flex h-full flex-col justify-between rounded-3xl border border-[var(--border-soft)] bg-white/90 p-5 shadow-sm"
              >
                <div>
                  <p className="text-xs font-semibold text-[var(--cocoa)]">
                    {post.meta}
                  </p>
                  <a href="/post/sample">
                    <h4 className="mt-3 text-lg font-semibold text-[var(--ink)]">
                      {post.title}
                    </h4>
                  </a>
                  <p className="mt-3 text-sm leading-6 text-zinc-600">
                    {post.excerpt}
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-zinc-500">
                  <span>공감 32</span>
                  <span>댓글 12</span>
                  <span>방금 전</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="guide" className="mx-auto mt-16 w-full max-w-6xl">
          <div className="grid gap-6 rounded-[36px] border border-[var(--border-soft)] bg-white/90 p-8 shadow-[var(--shadow)] md:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="text-sm font-semibold text-[var(--cocoa)]">
                커뮤니티 가이드
              </p>
              <h3 className="mt-2 font-display text-3xl font-semibold text-[var(--ink)]">
                서로를 보호하는 약속
              </h3>
              <p className="mt-4 text-sm leading-6 text-zinc-600">
                잉크톡은 부부들이 안심하고 이야기하도록 설계되어 있어요.
                익명성을 존중하면서도, 서로에게 상처가 되는 말을 방지하기 위해
                최소한의 룰을 함께 지켜요.
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
            <div className="grid gap-3">
              {[
                {
                  title: "익명 프로필",
                  desc: "닉네임은 자동 생성되고, 활동 기록만 남겨요.",
                },
                {
                  title: "안심 신고",
                  desc: "불편한 콘텐츠는 즉시 신고 가능.",
                },
                {
                  title: "맞춤 큐레이션",
                  desc: "세대와 주제 기반으로 피드를 정리.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-3xl border border-[var(--border-soft)] bg-[var(--paper)] px-4 py-4"
                >
                  <h4 className="text-sm font-semibold text-[var(--ink)]">
                    {item.title}
                  </h4>
                  <p className="mt-2 text-xs text-zinc-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto mt-16 w-full max-w-6xl">
          <div className="flex flex-col items-start justify-between gap-6 rounded-[36px] border border-[var(--border-soft)] bg-[var(--ink)] px-8 py-10 text-white shadow-[var(--shadow)] md:flex-row md:items-center">
            <div>
              <h3 className="font-display text-3xl font-semibold">
                익명으로 마음을 나눌 준비가 되셨나요?
              </h3>
              <p className="mt-2 text-sm text-white/80">
                지금 시작하면 나와 비슷한 고민을 가진 부부들의 이야기를 바로
                볼 수 있어요.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <a
                className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-[var(--ink)]"
                href="/write"
              >
                첫 글 작성하기
              </a>
              <a
                className="rounded-full border border-white/30 px-5 py-3 text-sm font-semibold text-white/90"
                href="#guide"
              >
                가이드라인 보기
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
