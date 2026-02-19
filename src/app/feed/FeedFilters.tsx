"use client";

import { useRouter } from "next/navigation";
import { EMOTION_CATEGORIES } from "@/lib/emotions";
import FancySelect from "@/app/components/FancySelect";

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
      <div className="grid gap-1.5 text-xs font-semibold text-[var(--cocoa)]">
        <p>정렬</p>
        <FancySelect
          value={sort}
          options={[
            { value: "latest", label: "최신순", emoji: "🕒" },
            { value: "hot", label: "인기순 (Hot)", emoji: "🔥" },
          ]}
          onChange={(nextValue) => {
            const nextSort = nextValue === "hot" ? "hot" : "latest";
            updateQuery(nextSort, categoryId);
          }}
        />
      </div>

      <div className="grid gap-1.5 text-xs font-semibold text-[var(--cocoa)]">
        <p>카테고리</p>
        <FancySelect
          value={typeof categoryId === "number" ? String(categoryId) : ""}
          options={[
            { value: "", label: "전체 카테고리", emoji: "🗂️" },
            ...EMOTION_CATEGORIES.map((category) => ({
              value: String(category.id),
              label: category.label,
              emoji:
                category.id === 1
                  ? "💪"
                  : category.id === 2
                    ? "👨‍👩‍👧"
                    : category.id === 3
                      ? "📈"
                      : category.id === 4
                        ? "🗳️"
                        : "📝",
            })),
          ]}
          onChange={(nextValue) => {
            const nextCategoryId =
              nextValue && Number.isInteger(Number(nextValue)) ? Number(nextValue) : undefined;
            updateQuery(sort, nextCategoryId);
          }}
        />
      </div>
    </div>
  );
}
