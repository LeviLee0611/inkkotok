import { SupabaseMediaAdapter } from "@/lib/media/supabase-adapter";
import type { MediaStorageAdapter } from "@/lib/media/types";

function resolveImageExt(name: string, type: string) {
  const byName = name.includes(".") ? name.split(".").pop()?.toLowerCase() : "";
  if (byName) return byName;
  if (type === "image/png") return "png";
  if (type === "image/jpeg") return "jpg";
  if (type === "image/webp") return "webp";
  if (type === "image/gif") return "gif";
  return "bin";
}

function getMediaAdapter(): MediaStorageAdapter {
  // Future-ready provider switch point.
  // ex) cloudflare-images, imagekit, etc.
  const provider = (process.env.MEDIA_STORAGE_PROVIDER ?? "supabase").toLowerCase();
  if (provider !== "supabase") {
    throw new Error(`Unsupported MEDIA_STORAGE_PROVIDER: ${provider}`);
  }
  return new SupabaseMediaAdapter();
}

export async function uploadPublicImageFile(input: {
  bucket: string;
  file: File;
  ownerId: string;
  filePrefix: string;
  maxBytes: number;
}) {
  if (!input.file.type.startsWith("image/")) {
    throw new Error("Only image files are supported.");
  }
  if (input.file.size > input.maxBytes) {
    throw new Error(`Image exceeds max size (${input.maxBytes} bytes).`);
  }

  const ext = resolveImageExt(input.file.name, input.file.type);
  const suffix = crypto.randomUUID().slice(0, 8);
  const path = `${input.ownerId}/${input.filePrefix}-${Date.now()}-${suffix}.${ext}`;
  const bytes = new Uint8Array(await input.file.arrayBuffer());

  const adapter = getMediaAdapter();
  await adapter.ensurePublicBucket(input.bucket);
  return adapter.uploadPublicObject({
    bucket: input.bucket,
    path,
    bytes,
    contentType: input.file.type,
    upsert: true,
  });
}
