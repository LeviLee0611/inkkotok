export type PostBodyPart =
  | { type: "text"; value: string }
  | {
      type: "image";
      alt: string;
      url: string;
      widthPercent: number;
      raw?: string;
      start?: number;
      end?: number;
    };

export function isRenderableImageUrl(url: string) {
  return (
    /\.(png|jpe?g|gif|webp|avif)(\?|#|$)/i.test(url) ||
    url.includes("/storage/v1/object/public/post-media/")
  );
}

export function parsePostBody(body: string): PostBodyPart[] {
  const parts: PostBodyPart[] = [];
  const markdownPattern = /!?\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g;
  let cursor = 0;

  const parseAltMeta = (altText: string) => {
    const match = altText.match(/^(.*)\|w=(\d{1,3})$/);
    if (!match) {
      return { alt: altText || "첨부 이미지", widthPercent: 100 };
    }
    const parsed = Number(match[2]);
    const widthPercent = Number.isFinite(parsed) ? Math.min(100, Math.max(20, parsed)) : 100;
    return { alt: (match[1] || "첨부 이미지").trim() || "첨부 이미지", widthPercent };
  };

  for (const match of body.matchAll(markdownPattern)) {
    const matchedText = match[0];
    const alt = match[1] || "첨부 이미지";
    const url = match[2];
    const start = match.index ?? 0;

    if (start > cursor) {
      const text = body.slice(cursor, start);
      if (text.length > 0) {
        parts.push({ type: "text", value: text });
      }
    }

    if (isRenderableImageUrl(url)) {
      const meta = parseAltMeta(alt);
      parts.push({
        type: "image",
        alt: meta.alt,
        url,
        widthPercent: meta.widthPercent,
        raw: matchedText,
        start,
        end: start + matchedText.length,
      });
    } else {
      parts.push({ type: "text", value: matchedText });
    }

    cursor = start + matchedText.length;
  }

  if (cursor < body.length) {
    parts.push({ type: "text", value: body.slice(cursor) });
  }

  const normalized: PostBodyPart[] = [];
  for (const part of parts) {
    if (part.type !== "text") {
      normalized.push(part);
      continue;
    }

    const lines = part.value.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && /^https?:\/\//i.test(trimmed) && isRenderableImageUrl(trimmed)) {
        normalized.push({
          type: "image",
          alt: "첨부 이미지",
          url: trimmed,
          widthPercent: 100,
        });
      } else {
        normalized.push({ type: "text", value: line });
      }
    }
  }

  return normalized.length ? normalized : [{ type: "text", value: body }];
}
