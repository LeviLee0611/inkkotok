"use client";

import { useRouter } from "next/navigation";
import { EMOTION_CATEGORIES } from "@/lib/emotions";

type FeedFiltersProps = {
  sort: "latest" | "hot";
  categoryId?: number;
};

export default function FeedFilters({ sort, categoryId }: FeedFiltersProps) {
  const router = useRouter();

  const updateQuery = (nextSort: "latest" | "hot", nextCategoryId?: number) => {
    const params = new URLSearchParams();
    params.set("sort", nextSort);
    if (typeof nextCategoryId === "number") {
      params.set("categoryId", String(nextCategoryId));
    }
    router.push(`/feed?${params.toString()}`);
  };

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <label className="grid gap-1.5 text-xs font-semibold text-[var(--cocoa)]">
        정렬
        <select
          className="rounded-xl border border-[var(--border-soft)] bg-white px-3 py-2 text-sm font-medium text-[var(--ink)] outline-none focus:border-[var(--accent)]"
          value={sort}
          onChange={(event) => {
            const nextSort = event.target.value === "hot" ? "hot" : "latest";
            updateQuery(nextSort, categoryId);
          }}
        >
          <option value="latest">최신순</option>
          <option value="hot">인기순 (Hot)</option>
        </select>
      </label>

      <label className="grid gap-1.5 text-xs font-semibold text-[var(--cocoa)]">
        카테고리
        <select
          className="rounded-xl border border-[var(--border-soft)] bg-white px-3 py-2 text-sm font-medium text-[var(--ink)] outline-none focus:border-[var(--accent)]"
          value={typeof categoryId === "number" ? String(categoryId) : ""}
          onChange={(event) => {
            const nextCategoryId =
              event.target.value && Number.isInteger(Number(event.target.value))
                ? Number(event.target.value)
                : undefined;
            updateQuery(sort, nextCategoryId);
          }}
        >
          <option value="">전체 카테고리</option>
          {EMOTION_CATEGORIES.map((category) => (
            <option key={category.id} value={category.id}>
              {category.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
