export const EMOTION_CATEGORIES = [
  { id: 1, slug: "conflict", label: "Conflict & 고민" },
  { id: 2, slug: "venting", label: "Venting & Stories" },
  { id: 3, slug: "advice", label: "Advice Request" },
  { id: 4, slug: "poll", label: "Poll & Decision" },
  { id: 5, slug: "love", label: "Love & Positive Stories" },
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
