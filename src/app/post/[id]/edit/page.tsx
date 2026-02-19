import WriteForm from "@/app/write/WriteForm";
import { getPostById } from "@/lib/posts";

export const runtime = "edge";

type EditPostPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditPostPage({ params }: EditPostPageProps) {
  const { id } = await params;
  const post = await getPostById(id).catch((error) => {
    console.error("edit getPostById failed", error);
    return null;
  });

  if (!post) {
    return (
      <div className="min-h-screen px-6 pb-20 pt-10 md:px-12">
        <div className="mx-auto w-full max-w-4xl rounded-[28px] border border-[var(--border-soft)] bg-white/90 p-6 shadow-sm">
          <p className="text-sm text-zinc-600">수정할 글을 찾을 수 없습니다.</p>
          <a
            className="mt-3 inline-flex rounded-full border border-[var(--border-soft)] bg-white px-4 py-2 text-sm font-semibold text-[var(--cocoa)]"
            href="/feed"
          >
            피드로 돌아가기
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 pb-20 pt-10 md:px-12">
      <header className="mx-auto flex w-full max-w-4xl flex-col gap-4 rounded-[28px] border border-[var(--border-soft)] bg-white/90 p-6 shadow-[var(--shadow)]">
        <p className="text-sm font-semibold text-[var(--cocoa)]">글 수정</p>
        <h1 className="font-display text-3xl font-semibold text-[var(--ink)]">
          기존 글 수정하기
        </h1>
        <p className="text-sm text-zinc-600">
          필요한 항목만 바꾼 뒤 저장하세요.
        </p>
      </header>
      <WriteForm
        mode="edit"
        postId={id}
        initialTitle={post.title}
        initialLounge={post.lounge}
        initialContent={post.body}
        initialCategoryId={post.category_id ?? 2}
      />
    </div>
  );
}
