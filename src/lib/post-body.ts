export type PostBodyPart =
  | { type: "text"; value: string }
  | { type: "image"; alt: string; url: string };

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
      parts.push({ type: "image", alt, url });
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
        normalized.push({ type: "image", alt: "첨부 이미지", url: trimmed });
      } else {
        normalized.push({ type: "text", value: line });
      }
    }
  }

  return normalized.length ? normalized : [{ type: "text", value: body }];
}
