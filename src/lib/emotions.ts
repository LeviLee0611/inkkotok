export const EMOTION_CATEGORIES = [
  { id: 1, slug: "workout", label: "운동 · 건강" },
  { id: 2, slug: "parenting", label: "육아 · 가족" },
  { id: 3, slug: "finance", label: "경제 · 재테크" },
  { id: 4, slug: "vote", label: "투표 · 의견모음" },
  { id: 5, slug: "story", label: "일상 · 개인이야기" },
] as const;

export const MOODS = [
  { value: "sad", label: "속상함" },
  { value: "angry", label: "화남" },
  { value: "anxious", label: "불안함" },
  { value: "mixed", label: "복잡함" },
  { value: "hopeful", label: "기대됨" },
  { value: "happy", label: "따뜻함" },
] as const;

export type MoodValue = (typeof MOODS)[number]["value"];
