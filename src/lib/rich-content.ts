import { parsePostBody } from "@/lib/post-body";

export type RichDoc = {
  type: "doc";
  content: Array<Record<string, unknown>>;
};

export function tryParseRichDoc(raw: string): RichDoc | null {
  if (!raw || typeof raw !== "string") return null;
  try {
    const parsed = JSON.parse(raw) as { type?: unknown; content?: unknown };
    if (parsed?.type !== "doc" || !Array.isArray(parsed.content)) return null;
    return parsed as RichDoc;
  } catch {
    return null;
  }
}

function textNode(text: string) {
  return { type: "text", text };
}

function paragraphNode(text: string) {
  return { type: "paragraph", content: [textNode(text)] };
}

export function legacyBodyToRichDoc(raw: string): RichDoc {
  const parts = parsePostBody(raw ?? "");
  const content: Array<Record<string, unknown>> = [];

  for (const part of parts) {
    if (part.type === "image") {
      content.push({
        type: "image",
        attrs: {
          src: part.url,
          alt: part.alt,
          width: `${part.widthPercent}%`,
        },
      });
      continue;
    }

    const lines = part.value.split("\n");
    for (const line of lines) {
      if (line.trim().length === 0) {
        content.push({ type: "paragraph" });
      } else {
        content.push(paragraphNode(line));
      }
    }
  }

  if (!content.length) {
    content.push({ type: "paragraph" });
  }

  return { type: "doc", content };
}

export function hasRichContent(doc: RichDoc) {
  const hasImage = doc.content.some((node) => node.type === "image");
  const hasText = JSON.stringify(doc).replace(/[\s\n\r\t]/g, "").length > 30;
  return hasImage || hasText;
}
