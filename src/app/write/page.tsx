import WriteForm from "./WriteForm";

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
          로그인한 뒤 글을 작성할 수 있어요.
        </p>
      </header>
      <WriteForm />
    </div>
  );
}
