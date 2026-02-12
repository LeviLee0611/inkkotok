const RESERVED_WORDS = [
  "admin",
  "administrator",
  "moderator",
  "support",
  "staff",
  "system",
  "root",
  "운영자",
  "관리자",
  "시스템",
  "매니저",
];

const BANNED_WORDS = [
  "fuck",
  "shit",
  "bitch",
  "asshole",
  "sex",
  "porn",
  "nazi",
  "rape",
  "시발",
  "씨발",
  "ㅅㅂ",
  "병신",
  "ㅂㅅ",
  "좆",
  "좇",
  "개새끼",
  "새끼",
  "지랄",
  "야동",
  "자살",
  "혐오",
  "강간",
  "음란",
];

const USERNAME_REGEX = /^[A-Za-z0-9가-힣_]{2,16}$/;

export function normalizeForFilter(value: string) {
  return value
    .toLowerCase()
    .replace(/[\s._-]+/g, "")
    .trim();
}

export function validateUsername(raw: string) {
  const value = raw.trim();
  if (value.length < 2 || value.length > 16) {
    return {
      ok: false,
      reason: "닉네임은 2~16자여야 합니다.",
    };
  }

  if (!USERNAME_REGEX.test(value)) {
    return {
      ok: false,
      reason: "닉네임은 한글/영문/숫자/밑줄(_)만 사용할 수 있어요.",
    };
  }

  const normalized = normalizeForFilter(value);
  const blocked = [...RESERVED_WORDS, ...BANNED_WORDS].find((word) =>
    normalized.includes(normalizeForFilter(word))
  );

  if (blocked) {
    return {
      ok: false,
      reason: "사용할 수 없는 단어가 포함돼 있어요.",
    };
  }

  return { ok: true, reason: "" };
}
